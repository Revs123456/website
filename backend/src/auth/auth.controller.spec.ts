import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

function mockResponse() {
  return {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  } as any;
}

describe('AuthController', () => {
  let controller: AuthController;
  let authService: { login: jest.Mock; refresh: jest.Mock; logout: jest.Mock; listAdmins: jest.Mock; createAdmin: jest.Mock; deleteAdmin: jest.Mock };

  beforeEach(async () => {
    authService = {
      login: jest.fn(),
      refresh: jest.fn(),
      logout: jest.fn(),
      listAdmins: jest.fn(),
      createAdmin: jest.fn(),
      deleteAdmin: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('login', () => {
    it('sets auth cookies and strips tokens from the response body', async () => {
      authService.login.mockResolvedValue({
        role: 'admin',
        email: 'admin@test.com',
        token: 'access-token',
        refreshToken: 'refresh-token',
        accessExpiryMs: 900000,
        refreshExpiryMs: 2592000000,
      });
      const res = mockResponse();

      const result = await controller.login({ email: 'admin@test.com', password: 'x' } as any, res);

      expect(res.cookie).toHaveBeenCalledWith('tch_token', 'access-token', expect.objectContaining({ maxAge: 900000 }));
      expect(res.cookie).toHaveBeenCalledWith('tch_refresh', 'refresh-token', expect.objectContaining({ maxAge: 2592000000 }));
      expect(res.cookie).toHaveBeenCalledWith('csrf_token', expect.any(String), expect.anything());
      expect(result).not.toHaveProperty('token');
      expect(result).not.toHaveProperty('refreshToken');
      expect(result.csrfToken).toEqual(expect.any(String));
    });

    it('propagates a failed login without setting cookies', async () => {
      authService.login.mockRejectedValue(new UnauthorizedException('Invalid credentials'));
      const res = mockResponse();

      await expect(controller.login({ email: 'x', password: 'y' } as any, res)).rejects.toThrow(UnauthorizedException);
      expect(res.cookie).not.toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('throws when there is no refresh cookie', async () => {
      const req = { cookies: {} } as any;
      const res = mockResponse();
      await expect(controller.refresh(req, res)).rejects.toThrow(UnauthorizedException);
      expect(authService.refresh).not.toHaveBeenCalled();
    });

    it('rotates cookies on a valid refresh token', async () => {
      authService.refresh.mockResolvedValue({
        token: 'new-access',
        refreshToken: 'new-refresh',
        accessExpiryMs: 900000,
        refreshExpiryMs: 2592000000,
      });
      const req = { cookies: { tch_refresh: 'old-refresh' } } as any;
      const res = mockResponse();

      const result = await controller.refresh(req, res);

      expect(authService.refresh).toHaveBeenCalledWith('old-refresh');
      expect(res.cookie).toHaveBeenCalledWith('tch_token', 'new-access', expect.anything());
      expect(result.success).toBe(true);
    });
  });

  describe('logout', () => {
    it('rejects a mismatched CSRF token when a session cookie is present', async () => {
      const req = {
        cookies: { tch_token: 'access', csrf_token: 'abc' },
        headers: { 'x-csrf-token': 'different' },
      } as any;
      const res = mockResponse();

      await expect(controller.logout(req, res)).rejects.toThrow(ForbiddenException);
      expect(authService.logout).not.toHaveBeenCalled();
    });

    it('clears cookies and logs out when CSRF matches', async () => {
      const req = {
        cookies: { tch_token: 'access', csrf_token: 'abc', tch_refresh: 'rt' },
        headers: { 'x-csrf-token': 'abc' },
      } as any;
      const res = mockResponse();
      authService.logout.mockResolvedValue(undefined);

      const result = await controller.logout(req, res);

      expect(authService.logout).toHaveBeenCalledWith('rt');
      expect(res.clearCookie).toHaveBeenCalledWith('tch_token', expect.anything());
      expect(result).toEqual({ success: true });
    });

    it('skips the CSRF check entirely when there is no session cookie', async () => {
      const req = { cookies: {}, headers: {} } as any;
      const res = mockResponse();
      authService.logout.mockResolvedValue(undefined);

      const result = await controller.logout(req, res);

      expect(result).toEqual({ success: true });
    });
  });

  describe('deleteAdmin', () => {
    it('delegates to the service with the requesting admin id from the JWT payload', () => {
      const req = { user: { sub: 'admin-1' } } as any;
      controller.deleteAdmin('admin-2', req);
      expect(authService.deleteAdmin).toHaveBeenCalledWith('admin-2', 'admin-1');
    });
  });
});
