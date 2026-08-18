import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { createMockPrismaService, MockPrismaService } from '../../test/helpers/mock-prisma';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: MockPrismaService;

  beforeEach(async () => {
    prisma = createMockPrismaService();
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService, PrismaService],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => jest.restoreAllMocks());

  describe('login', () => {
    it('issues a token and refresh token for valid credentials', async () => {
      const passwordHash = await bcrypt.hash('CorrectHorse123!', 12);
      prisma.admin.findUnique.mockResolvedValue({ id: 'admin-1', email: 'admin@test.com', passwordHash });
      prisma.setting.findUnique.mockResolvedValue(null); // default expiries
      prisma.refreshToken.create.mockResolvedValue({});

      const result = await service.login({ email: 'admin@test.com', password: 'CorrectHorse123!' });

      expect(result.role).toBe('admin');
      expect(result.token).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(prisma.refreshToken.create).toHaveBeenCalledTimes(1);
    });

    it('rejects a wrong password', async () => {
      const passwordHash = await bcrypt.hash('CorrectHorse123!', 12);
      prisma.admin.findUnique.mockResolvedValue({ id: 'admin-1', email: 'admin@test.com', passwordHash });

      await expect(
        service.login({ email: 'admin@test.com', password: 'wrong-password' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects an unknown email without a different error shape than a wrong password', async () => {
      // Timing-safe path: AuthService runs bcrypt.compare against a dummy hash
      // even when no admin matches, so this rejects the same way a wrong
      // password does — never a distinct "no such user" error.
      prisma.admin.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nobody@test.com', password: 'whatever123' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('rotates a valid, unexpired refresh token', async () => {
      const stored = {
        id: 'rt-1',
        admin_id: 'admin-1',
        expires_at: new Date(Date.now() + 60_000),
      };
      prisma.refreshToken.findUnique.mockResolvedValue(stored);
      prisma.admin.findUnique.mockResolvedValue({ id: 'admin-1', email: 'admin@test.com' });
      prisma.refreshToken.delete.mockResolvedValue({});
      prisma.setting.findUnique.mockResolvedValue(null);
      prisma.refreshToken.create.mockResolvedValue({});

      const result = await service.refresh('raw-token');

      expect(prisma.refreshToken.delete).toHaveBeenCalledWith({ where: { id: 'rt-1' } });
      expect(result.token).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('rejects and cleans up an expired refresh token', async () => {
      const stored = {
        id: 'rt-1',
        admin_id: 'admin-1',
        expires_at: new Date(Date.now() - 60_000),
      };
      prisma.refreshToken.findUnique.mockResolvedValue(stored);
      prisma.refreshToken.delete.mockResolvedValue({});

      await expect(service.refresh('raw-token')).rejects.toThrow(UnauthorizedException);
      expect(prisma.refreshToken.delete).toHaveBeenCalledWith({ where: { id: 'rt-1' } });
    });

    it('rejects an unknown refresh token', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(null);
      await expect(service.refresh('raw-token')).rejects.toThrow(UnauthorizedException);
      expect(prisma.refreshToken.delete).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('deletes the matching refresh token when one is provided', async () => {
      prisma.refreshToken.deleteMany.mockResolvedValue({ count: 1 });
      await service.logout('raw-token');
      expect(prisma.refreshToken.deleteMany).toHaveBeenCalled();
    });

    it('no-ops when no refresh token is provided', async () => {
      await service.logout(undefined);
      expect(prisma.refreshToken.deleteMany).not.toHaveBeenCalled();
    });
  });

  describe('createAdmin', () => {
    it('rejects a password shorter than 12 characters', async () => {
      prisma.admin.findUnique.mockResolvedValue(null);
      await expect(service.createAdmin('new@test.com', 'Short1!')).rejects.toThrow(BadRequestException);
    });

    it('rejects a password missing an uppercase letter', async () => {
      prisma.admin.findUnique.mockResolvedValue(null);
      await expect(service.createAdmin('new@test.com', 'lowercase123!')).rejects.toThrow(BadRequestException);
    });

    it('rejects a password missing a number', async () => {
      prisma.admin.findUnique.mockResolvedValue(null);
      await expect(service.createAdmin('new@test.com', 'NoNumbersHere!')).rejects.toThrow(BadRequestException);
    });

    it('rejects a password missing a special character', async () => {
      prisma.admin.findUnique.mockResolvedValue(null);
      await expect(service.createAdmin('new@test.com', 'NoSpecialChar123')).rejects.toThrow(BadRequestException);
    });

    it('creates an admin when the password satisfies the policy', async () => {
      prisma.admin.findUnique.mockResolvedValue(null);
      prisma.admin.create.mockResolvedValue({});

      const result = await service.createAdmin('new@test.com', 'ValidPass123!');

      expect(result).toEqual({ message: 'Admin created', email: 'new@test.com' });
      expect(prisma.admin.create).toHaveBeenCalledTimes(1);
    });

    it('short-circuits without creating a duplicate admin', async () => {
      prisma.admin.findUnique.mockResolvedValue({ id: 'admin-1', email: 'new@test.com' });

      const result = await service.createAdmin('new@test.com', 'ValidPass123!');

      expect(result).toEqual({ message: 'Admin already exists', email: 'new@test.com' });
      expect(prisma.admin.create).not.toHaveBeenCalled();
    });
  });

  describe('deleteAdmin', () => {
    it('refuses to delete your own account', async () => {
      await expect(service.deleteAdmin('admin-1', 'admin-1')).rejects.toThrow(BadRequestException);
      expect(prisma.admin.delete).not.toHaveBeenCalled();
    });

    it('refuses to delete the last remaining admin', async () => {
      prisma.admin.count.mockResolvedValue(1);
      await expect(service.deleteAdmin('admin-2', 'admin-1')).rejects.toThrow(BadRequestException);
      expect(prisma.admin.delete).not.toHaveBeenCalled();
    });

    it('deletes another admin when more than one exists', async () => {
      prisma.admin.count.mockResolvedValue(2);
      prisma.admin.delete.mockResolvedValue({});

      const result = await service.deleteAdmin('admin-2', 'admin-1');

      expect(result).toEqual({ message: 'Admin removed' });
      expect(prisma.admin.delete).toHaveBeenCalledWith({ where: { id: 'admin-2' } });
    });
  });

  describe('cleanupExpiredTokens', () => {
    it('deletes refresh tokens past their expiry', async () => {
      prisma.refreshToken.deleteMany.mockResolvedValue({ count: 3 });
      await service.cleanupExpiredTokens();
      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { expires_at: { lt: expect.any(Date) } },
      });
    });
  });
});
