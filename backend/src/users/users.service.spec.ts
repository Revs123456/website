import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { OtpService } from '../otp/otp.service';
import { MailService } from '../mail/mail.service';
import { XpService } from '../engagement/xp.service';
import { BadgesService } from '../engagement/badges.service';
import { ReferralsService } from '../viral/referrals/referrals.service';
import { createMockPrismaService, MockPrismaService } from '../../test/helpers/mock-prisma';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: MockPrismaService;
  let otp: { send: jest.Mock; verify: jest.Mock };
  let xp: { awardFirstLogin: jest.Mock; awardUsernameClaimed: jest.Mock; awardProfileComplete: jest.Mock };
  let badges: { evaluate: jest.Mock };
  let referrals: { findUserByCode: jest.Mock; awardReferralXp: jest.Mock };

  beforeEach(async () => {
    prisma = createMockPrismaService();
    otp = { send: jest.fn(), verify: jest.fn() };
    xp = { awardFirstLogin: jest.fn().mockResolvedValue(undefined), awardUsernameClaimed: jest.fn().mockResolvedValue(undefined), awardProfileComplete: jest.fn().mockResolvedValue(undefined) };
    badges = { evaluate: jest.fn().mockResolvedValue(undefined) };
    referrals = { findUserByCode: jest.fn(), awardReferralXp: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        PrismaService,
        { provide: OtpService, useValue: otp },
        { provide: MailService, useValue: {} },
        { provide: XpService, useValue: xp },
        { provide: BadgesService, useValue: badges },
        { provide: ReferralsService, useValue: referrals },
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('startAuth', () => {
    it('normalizes the email and delegates to OtpService', async () => {
      otp.send.mockResolvedValue(undefined);
      const result = await service.startAuth('  Jane@Test.com  ');
      expect(otp.send).toHaveBeenCalledWith('jane@test.com');
      expect(result).toEqual({ message: 'OTP sent' });
    });
  });

  describe('verifyOtp', () => {
    it('creates a new user, awards first-login XP, and issues tokens', async () => {
      otp.verify.mockResolvedValue(undefined);
      prisma.siteUser.findUnique
        .mockResolvedValueOnce(null) // lookup by email — not found
        .mockResolvedValueOnce({ id: 'user-1', email: 'jane@test.com', xp: 25, level: 1 }); // re-fetch after awards
      prisma.siteUser.create.mockResolvedValue({ id: 'user-1', email: 'jane@test.com' });
      prisma.setting.findUnique.mockResolvedValue(null);
      prisma.userRefreshToken.create.mockResolvedValue({});

      const result = await service.verifyOtp('jane@test.com', '123456', 'Jane');

      expect(prisma.siteUser.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ email: 'jane@test.com', name: 'Jane', referred_by_id: null }),
      });
      expect(xp.awardFirstLogin).toHaveBeenCalledWith('user-1');
      expect(referrals.awardReferralXp).not.toHaveBeenCalled();
      expect(result.isNewUser).toBe(true);
      expect(result.token).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('awards referral Xp to both sides when a valid referral code is used', async () => {
      otp.verify.mockResolvedValue(undefined);
      referrals.findUserByCode.mockResolvedValue({ id: 'referrer-1' });
      prisma.siteUser.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'user-2', email: 'new@test.com' });
      prisma.siteUser.create.mockResolvedValue({ id: 'user-2', email: 'new@test.com' });
      prisma.setting.findUnique.mockResolvedValue(null);
      prisma.userRefreshToken.create.mockResolvedValue({});

      await service.verifyOtp('new@test.com', '123456', 'New', 'REF123');

      expect(prisma.siteUser.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ referred_by_id: 'referrer-1' }),
      });
      expect(referrals.awardReferralXp).toHaveBeenCalledWith({ newUserId: 'user-2', referrerId: 'referrer-1' });
    });

    it('does not overwrite an existing name and skips referral logic for a returning user', async () => {
      otp.verify.mockResolvedValue(undefined);
      prisma.siteUser.findUnique.mockResolvedValue({ id: 'user-3', email: 'existing@test.com', name: 'Existing Name' });
      prisma.siteUser.update.mockResolvedValue({});
      prisma.setting.findUnique.mockResolvedValue(null);
      prisma.userRefreshToken.create.mockResolvedValue({});

      const result = await service.verifyOtp('existing@test.com', '123456', 'Ignored New Name');

      expect(prisma.siteUser.update).toHaveBeenCalledWith({
        where: { id: 'user-3' },
        data: expect.objectContaining({ last_login_at: expect.any(Date) }),
      });
      expect(prisma.siteUser.update.mock.calls[0][0].data).not.toHaveProperty('name');
      expect(prisma.siteUser.create).not.toHaveBeenCalled();
      expect(result.isNewUser).toBe(false);
    });

    it('propagates an invalid OTP as a rejection without creating a user', async () => {
      otp.verify.mockRejectedValue(new BadRequestException('Invalid or expired code'));
      await expect(service.verifyOtp('jane@test.com', 'wrong')).rejects.toThrow(BadRequestException);
      expect(prisma.siteUser.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('rotates a valid refresh token', async () => {
      prisma.userRefreshToken.findUnique.mockResolvedValue({ id: 'rt-1', site_user_id: 'user-1', expires_at: new Date(Date.now() + 60_000) });
      prisma.siteUser.findUnique.mockResolvedValue({ id: 'user-1', email: 'jane@test.com' });
      prisma.userRefreshToken.delete.mockResolvedValue({});
      prisma.setting.findUnique.mockResolvedValue(null);
      prisma.userRefreshToken.create.mockResolvedValue({});

      const result = await service.refresh('raw-token');

      expect(result.token).toBeDefined();
      expect(prisma.userRefreshToken.delete).toHaveBeenCalledWith({ where: { id: 'rt-1' } });
    });

    it('rejects an expired refresh token', async () => {
      prisma.userRefreshToken.findUnique.mockResolvedValue({ id: 'rt-1', site_user_id: 'user-1', expires_at: new Date(Date.now() - 1000) });
      prisma.userRefreshToken.delete.mockResolvedValue({});
      await expect(service.refresh('raw-token')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('no-ops without a token', async () => {
      await service.logout(undefined);
      expect(prisma.userRefreshToken.deleteMany).not.toHaveBeenCalled();
    });

    it('deletes the matching token', async () => {
      prisma.userRefreshToken.deleteMany.mockResolvedValue({ count: 1 });
      await service.logout('raw-token');
      expect(prisma.userRefreshToken.deleteMany).toHaveBeenCalled();
    });
  });

  describe('getMe', () => {
    it('returns the public shape of the user', async () => {
      prisma.siteUser.findUnique.mockResolvedValue({ id: 'user-1', email: 'jane@test.com', passwordHash: 'should-not-leak' } as any);
      const result = await service.getMe('user-1');
      expect(result).not.toHaveProperty('passwordHash');
      expect(result.id).toBe('user-1');
    });

    it('throws NotFoundException when the user is gone', async () => {
      prisma.siteUser.findUnique.mockResolvedValue(null);
      await expect(service.getMe('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProfile', () => {
    it('rejects a reserved username', async () => {
      await expect(service.updateProfile('user-1', { username: 'admin' } as any)).rejects.toThrow(BadRequestException);
      expect(prisma.siteUser.update).not.toHaveBeenCalled();
    });

    it('rejects a username already taken by someone else', async () => {
      prisma.siteUser.findUnique.mockResolvedValueOnce({ id: 'other-user', username: 'janedoe' });
      await expect(service.updateProfile('user-1', { username: 'JaneDoe' } as any)).rejects.toThrow(ConflictException);
    });

    it('allows re-saving your own already-set username', async () => {
      prisma.siteUser.findUnique
        .mockResolvedValueOnce({ id: 'user-1', username: 'janedoe' }) // username lookup — same user
        .mockResolvedValueOnce({ id: 'user-1', username: 'janedoe', name: 'Jane' }) // before-snapshot
        .mockResolvedValueOnce({ id: 'user-1', username: 'janedoe', name: 'Jane' }); // final re-fetch
      prisma.siteUser.update.mockResolvedValue({ id: 'user-1', username: 'janedoe', name: 'Jane' });

      await service.updateProfile('user-1', { username: 'janedoe' } as any);
      expect(prisma.siteUser.update).toHaveBeenCalled();
    });

    it('throws NotFoundException when the user no longer exists', async () => {
      prisma.siteUser.findUnique.mockResolvedValueOnce(null); // before-snapshot
      await expect(service.updateProfile('missing', { bio: 'hi' } as any)).rejects.toThrow(NotFoundException);
    });

    it('translates a unique-constraint race into ConflictException', async () => {
      prisma.siteUser.findUnique.mockResolvedValueOnce({ id: 'user-1', username: null });
      prisma.siteUser.update.mockRejectedValue({ code: 'P2002' });
      await expect(service.updateProfile('user-1', { bio: 'hi' } as any)).rejects.toThrow(ConflictException);
    });

    it('awards username-claimed XP only the first time a username is set', async () => {
      prisma.siteUser.findUnique
        .mockResolvedValueOnce(null) // username-existing lookup — nobody else has it
        .mockResolvedValueOnce({ id: 'user-1', username: null }) // before-snapshot
        .mockResolvedValueOnce({ id: 'user-1', username: 'janedoe', name: null }); // final re-fetch
      prisma.siteUser.update.mockResolvedValue({ id: 'user-1', username: 'janedoe' });

      await service.updateProfile('user-1', { username: 'janedoe' } as any);

      expect(xp.awardUsernameClaimed).toHaveBeenCalledWith('user-1');
    });

    it('awards profile-complete XP once all key fields are populated', async () => {
      prisma.siteUser.findUnique
        .mockResolvedValueOnce({ id: 'user-1', username: 'janedoe' }) // before
        .mockResolvedValueOnce({ id: 'user-1', name: 'Jane', phone: '123', experience: '2y', target_role: 'SWE', bio: 'hi' }); // final
      prisma.siteUser.update.mockResolvedValue({
        id: 'user-1', name: 'Jane', phone: '123', experience: '2y', target_role: 'SWE', bio: 'hi',
      });

      await service.updateProfile('user-1', { bio: 'hi' } as any);

      expect(xp.awardProfileComplete).toHaveBeenCalledWith('user-1');
      expect(badges.evaluate).toHaveBeenCalledWith('user-1', 'profile_updated');
    });
  });

  describe('deleteAccount', () => {
    it('deletes the site user by id', async () => {
      prisma.siteUser.delete.mockResolvedValue({});
      await service.deleteAccount('user-1');
      expect(prisma.siteUser.delete).toHaveBeenCalledWith({ where: { id: 'user-1' } });
    });
  });

  describe('cleanupExpiredUserTokens', () => {
    it('deletes expired user refresh tokens', async () => {
      prisma.userRefreshToken.deleteMany.mockResolvedValue({ count: 2 });
      await service.cleanupExpiredUserTokens();
      expect(prisma.userRefreshToken.deleteMany).toHaveBeenCalledWith({
        where: { expires_at: { lt: expect.any(Date) } },
      });
    });
  });
});
