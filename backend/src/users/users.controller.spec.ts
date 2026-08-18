import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { MailService } from '../mail/mail.service';

function mockResponse() {
  return { cookie: jest.fn(), clearCookie: jest.fn() } as any;
}

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: { startAuth: jest.Mock; verifyOtp: jest.Mock; refresh: jest.Mock; logout: jest.Mock; getMeWithEngagement: jest.Mock; updateProfile: jest.Mock; deleteAccount: jest.Mock };
  let mail: { sendUserWelcome: jest.Mock };

  beforeEach(async () => {
    usersService = {
      startAuth: jest.fn(),
      verifyOtp: jest.fn(),
      refresh: jest.fn(),
      logout: jest.fn(),
      getMeWithEngagement: jest.fn(),
      updateProfile: jest.fn(),
      deleteAccount: jest.fn(),
    };
    mail = { sendUserWelcome: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: usersService },
        { provide: MailService, useValue: mail },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('startAuth always returns the same opaque message', async () => {
    usersService.startAuth.mockResolvedValue({ message: 'OTP sent' });
    const result = await controller.startAuth({ email: 'jane@test.com' } as any);
    expect(usersService.startAuth).toHaveBeenCalledWith('jane@test.com');
    expect(result).toEqual({ message: 'If the address is valid, an OTP has been sent.' });
  });

  describe('verifyOtp', () => {
    it('sets session cookies and fires the welcome email for a new opted-in user', async () => {
      usersService.verifyOtp.mockResolvedValue({
        user: { email: 'jane@test.com', name: 'Jane', email_opt_in: true },
        isNewUser: true,
        token: 'access',
        refreshToken: 'refresh',
        accessExpiryMs: 900000,
        refreshExpiryMs: 2592000000,
      });
      const res = mockResponse();

      const result = await controller.verifyOtp({ email: 'jane@test.com', code: '123456' } as any, res);

      expect(res.cookie).toHaveBeenCalledWith('tch_user_token', 'access', expect.anything());
      expect(mail.sendUserWelcome).toHaveBeenCalledWith({ email: 'jane@test.com', name: 'Jane' });
      expect(result.isNewUser).toBe(true);
      expect(result.csrfToken).toEqual(expect.any(String));
    });

    it('does not send a welcome email for a returning user', async () => {
      usersService.verifyOtp.mockResolvedValue({
        user: { email: 'jane@test.com', email_opt_in: true },
        isNewUser: false,
        token: 'access',
        refreshToken: 'refresh',
        accessExpiryMs: 900000,
        refreshExpiryMs: 2592000000,
      });
      const res = mockResponse();

      await controller.verifyOtp({ email: 'jane@test.com', code: '123456' } as any, res);

      expect(mail.sendUserWelcome).not.toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('throws without a refresh cookie', async () => {
      const req = { cookies: {} } as any;
      await expect(controller.refresh(req, mockResponse())).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('rejects a mismatched CSRF token', async () => {
      const req = {
        cookies: { tch_user_token: 'access', csrf_user_token: 'abc' },
        headers: { 'x-csrf-token': 'wrong' },
      } as any;
      await expect(controller.logout(req, mockResponse())).rejects.toThrow(ForbiddenException);
    });
  });

  it('me delegates the authenticated user id from the request', () => {
    const req = { user: { sub: 'user-1' } } as any;
    controller.me(req);
    expect(usersService.getMeWithEngagement).toHaveBeenCalledWith('user-1');
  });

  it('updateProfile delegates the user id and DTO', () => {
    const req = { user: { sub: 'user-1' } } as any;
    const dto = { bio: 'hi' } as any;
    controller.updateProfile(req, dto);
    expect(usersService.updateProfile).toHaveBeenCalledWith('user-1', dto);
  });

  it('deleteAccount clears session cookies after deleting', async () => {
    usersService.deleteAccount.mockResolvedValue(undefined);
    const req = { user: { sub: 'user-1' } } as any;
    const res = mockResponse();

    const result = await controller.deleteAccount(req, res);

    expect(usersService.deleteAccount).toHaveBeenCalledWith('user-1');
    expect(res.clearCookie).toHaveBeenCalledWith('tch_user_token', expect.anything());
    expect(result).toEqual({ success: true });
  });
});
