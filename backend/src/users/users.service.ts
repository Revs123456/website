import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { OtpService } from '../otp/otp.service';
import { MailService } from '../mail/mail.service';
import { XpService } from '../engagement/xp.service';
import { BadgesService } from '../engagement/badges.service';
import { ReferralsService } from '../viral/referrals/referrals.service';
import type { UpdateProfileDto } from './dto/update-profile.dto';

const RESERVED_USERNAMES = new Set([
  'admin', 'administrator', 'root', 'api', 'app', 'auth', 'account', 'login',
  'logout', 'register', 'signup', 'me', 'user', 'users', 'profile', 'settings',
  'help', 'support', 'about', 'contact', 'terms', 'privacy', 'jobs', 'courses',
  'blogs', 'services', 'community', 'roadmaps', 'mock-interview',
  'salary-insights', 'success-stories', 'daily-tips', 'templates', 'order',
  'book', 'interview-questions', 'techchamps', 'techchampsbyrev',
]);

function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function parseExpiryToMs(expiry: string): number {
  const m = expiry.match(/^(\d+)([smhd])$/);
  if (!m) return 15 * 60 * 1000;
  const n = parseInt(m[1], 10);
  switch (m[2]) {
    case 's': return n * 1000;
    case 'm': return n * 60 * 1000;
    case 'h': return n * 60 * 60 * 1000;
    case 'd': return n * 24 * 60 * 60 * 1000;
    default:  return 15 * 60 * 1000;
  }
}

/** Strip internal/sensitive fields before returning a user to clients. */
function publicUser(u: any) {
  if (!u) return u;
  return {
    id: u.id,
    email: u.email,
    username: u.username,
    name: u.name,
    phone: u.phone,
    experience: u.experience,
    target_role: u.target_role,
    current_role: u.current_role,
    bio: u.bio,
    avatar_url: u.avatar_url,
    github_url: u.github_url,
    linkedin_url: u.linkedin_url,
    xp: u.xp,
    level: u.level,
    is_pro: u.is_pro,
    pro_expires_at: u.pro_expires_at,
    email_opt_in: u.email_opt_in,
    // Phase 3 — privacy + referral
    profile_public: u.profile_public ?? false,
    referral_code: u.referral_code ?? null,
    created_at: u.created_at,
  };
}

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly otp: OtpService,
    private readonly mail: MailService,
    private readonly xp: XpService,
    private readonly badges: BadgesService,
    private readonly referrals: ReferralsService,
  ) {}

  // ── Auth flow ──────────────────────────────────────────────────────────────

  /**
   * Step 1: send OTP. Idempotent w.r.t. the user record — we DO NOT create the
   * SiteUser here (would leak email existence + create ghost rows on abandoned
   * signups). The user is created on first successful verify.
   *
   * We accept `name` so the signup form can pass it through; we keep it
   * client-side in localStorage until verify, but also forward it to verify
   * for resilience against page reloads.
   */
  async startAuth(email: string): Promise<{ message: string }> {
    const normalized = email.trim().toLowerCase();
    await this.otp.send(normalized);
    return { message: 'OTP sent' };
  }

  /**
   * Step 0 (optional, pre-OTP): does an account already exist for this email?
   * Lets the sign-in modal route new users into the name-collection/signup
   * step instead of straight to OTP. Deliberately reveals existence — see
   * CheckEmailDto for the trade-off this accepts vs. start-auth.
   */
  async emailExists(email: string): Promise<boolean> {
    const normalized = email.trim().toLowerCase();
    const user = await this.prisma.siteUser.findUnique({
      where: { email: normalized },
      select: { id: true },
    });
    return !!user;
  }

  private getJwtSecret(): string {
    return process.env.JWT_SECRET || (() => { throw new Error('JWT_SECRET env var not set'); })();
  }

  private async getAccessExpiry(): Promise<{ expiry: string; expiryMs: number }> {
    // Reuse the same expiry setting as admins — operators get one knob, not two.
    const s = await this.prisma.setting.findUnique({ where: { key: 'jwt_access_expiry' } });
    const expiry = s?.value || '15m';
    return { expiry, expiryMs: parseExpiryToMs(expiry) };
  }

  private async getRefreshTtlMs(): Promise<number> {
    const s = await this.prisma.setting.findUnique({ where: { key: 'refresh_token_ttl_days' } });
    const days = s ? (parseInt(s.value, 10) || 30) : 30;
    return days * 24 * 60 * 60 * 1000;
  }

  private async createRefreshToken(userId: string): Promise<{ raw: string; expiryMs: number }> {
    const raw = crypto.randomBytes(40).toString('hex');
    const expiryMs = await this.getRefreshTtlMs();
    await this.prisma.userRefreshToken.create({
      data: {
        token_hash: hashToken(raw),
        site_user_id: userId,
        expires_at: new Date(Date.now() + expiryMs),
      },
    });
    return { raw, expiryMs };
  }

  /**
   * Step 2: verify OTP, create-or-find the user, issue tokens.
   *
   * Returns whether this was a brand-new signup so the controller can fire
   * the welcome email (avoids re-sending it on every login).
   */
  async verifyOtp(email: string, code: string, name?: string, refCode?: string): Promise<{
    user: any;
    token: string;
    refreshToken: string;
    accessExpiryMs: number;
    refreshExpiryMs: number;
    isNewUser: boolean;
  }> {
    const normalized = email.trim().toLowerCase();
    // Throws BadRequestException on invalid/expired code
    await this.otp.verify(normalized, code);

    // Resolve referrer BEFORE creating the user — fail fast on a bad code,
    // and we want the referred_by_id set in the same insert (not a follow-up).
    // An invalid code is non-fatal: we silently ignore it so a typo doesn't
    // block signup. (Frontend validates upfront via /referrals/lookup.)
    let referrerId: string | null = null;
    if (refCode) {
      const owner = await this.referrals.findUserByCode(refCode);
      if (owner) referrerId = owner.id;
    }

    let user = await this.prisma.siteUser.findUnique({ where: { email: normalized } });
    let isNewUser = false;
    if (!user) {
      user = await this.prisma.siteUser.create({
        data: {
          email: normalized,
          name: name?.trim() || null,
          last_login_at: new Date(),
          // Self-referral is impossible here (user doesn't exist yet) but kept
          // explicit for clarity.
          referred_by_id: referrerId,
        },
      });
      isNewUser = true;
      // Welcome XP — idempotency-keyed inside the service, safe to call again
      await this.xp.awardFirstLogin(user.id);

      // Referral bonus: both sides get XP on signup
      if (referrerId) {
        await this.referrals.awardReferralXp({
          newUserId: user.id,
          referrerId,
        });
      }

      // First award qualifies the user for the "first_steps" badge (xp >= 25)
      await this.badges.evaluate(user.id, 'xp_awarded');
      // Re-fetch so the response reflects the awarded XP & level
      user = await this.prisma.siteUser.findUnique({ where: { id: user.id } }) ?? user;
    } else {
      await this.prisma.siteUser.update({
        where: { id: user.id },
        data: {
          last_login_at: new Date(),
          // Fill in name if it was missing — but never overwrite an existing one.
          ...(user.name ? {} : (name?.trim() ? { name: name.trim() } : {})),
        },
      });
      // Returning users cannot retroactively attach a referrer — too easy
      // to abuse. The ref param is silently ignored for existing accounts.
    }

    const { expiry, expiryMs: accessExpiryMs } = await this.getAccessExpiry();
    const token = jwt.sign(
      { sub: user.id, email: user.email, role: 'user' },
      this.getJwtSecret(),
      { expiresIn: expiry as any },
    );
    const { raw: refreshToken, expiryMs: refreshExpiryMs } = await this.createRefreshToken(user.id);

    return {
      user: publicUser(user),
      token,
      refreshToken,
      accessExpiryMs,
      refreshExpiryMs,
      isNewUser,
    };
  }

  async refresh(rawRefreshToken: string) {
    const stored = await this.prisma.userRefreshToken.findUnique({
      where: { token_hash: hashToken(rawRefreshToken) },
    });
    if (!stored || stored.expires_at < new Date()) {
      if (stored) await this.prisma.userRefreshToken.delete({ where: { id: stored.id } });
      throw new UnauthorizedException('Refresh token expired or invalid');
    }
    const user = await this.prisma.siteUser.findUnique({ where: { id: stored.site_user_id } });
    if (!user) throw new UnauthorizedException();

    // Rotate the refresh token (delete old, issue new) — same pattern as admin auth.
    await this.prisma.userRefreshToken.delete({ where: { id: stored.id } });
    const { expiry, expiryMs: accessExpiryMs } = await this.getAccessExpiry();
    const token = jwt.sign(
      { sub: user.id, email: user.email, role: 'user' },
      this.getJwtSecret(),
      { expiresIn: expiry as any },
    );
    const { raw: refreshToken, expiryMs: refreshExpiryMs } = await this.createRefreshToken(user.id);
    return { token, refreshToken, accessExpiryMs, refreshExpiryMs };
  }

  async logout(rawRefreshToken?: string): Promise<void> {
    if (!rawRefreshToken) return;
    await this.prisma.userRefreshToken.deleteMany({
      where: { token_hash: hashToken(rawRefreshToken) },
    });
  }

  // ── Profile ────────────────────────────────────────────────────────────────

  async getMe(userId: string) {
    const user = await this.prisma.siteUser.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return publicUser(user);
  }

  /**
   * Same as getMe but enriched with engagement state so the navbar can render
   * streak/level/badge data in a single round-trip on page load.
   * Phase 2 frontend uses this in UserContext.
   */
  async getMeWithEngagement(userId: string) {
    const user = await this.prisma.siteUser.findUnique({
      where: { id: userId },
      include: {
        streak: true,
        badges: { include: { badge: true }, orderBy: { earned_at: 'desc' }, take: 5 },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return {
      ...publicUser(user),
      streak: user.streak ? {
        current_streak: user.streak.current_streak,
        longest_streak: user.streak.longest_streak,
        last_activity_date: user.streak.last_activity_date,
        shields_remaining: user.streak.shields_remaining,
      } : { current_streak: 0, longest_streak: 0, last_activity_date: null, shields_remaining: 0 },
      recent_badges: user.badges.map(b => ({
        id: b.badge.id,
        code: b.badge.code,
        name: b.badge.name,
        icon: b.badge.icon,
        tier: b.badge.tier,
        earned_at: b.earned_at,
      })),
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    if (dto.username) {
      const normalized = dto.username.toLowerCase();
      if (RESERVED_USERNAMES.has(normalized)) {
        throw new BadRequestException('That username is reserved');
      }
      const existing = await this.prisma.siteUser.findUnique({ where: { username: normalized } });
      if (existing && existing.id !== userId) {
        throw new ConflictException('Username already taken');
      }
      dto.username = normalized;
    }

    // Snapshot before to decide what milestone awards to fire
    const before = await this.prisma.siteUser.findUnique({ where: { id: userId } });
    if (!before) throw new NotFoundException('User not found');

    let updated;
    try {
      updated = await this.prisma.siteUser.update({
        where: { id: userId },
        data: { ...dto },
      });
    } catch (e: any) {
      // Race condition on unique-username if two writes land at once
      if (e?.code === 'P2002') throw new ConflictException('Username already taken');
      throw e;
    }

    // One-time XP rewards — both award helpers are idempotency-keyed, so even
    // if the same field is "set" again later (via another PATCH), no double-award.
    if (!before.username && updated.username) {
      await this.xp.awardUsernameClaimed(userId);
    }

    // "Profile complete" requires all key fields populated. We check on every
    // update so the trigger fires the first time the user completes the form,
    // regardless of which save crossed the threshold.
    const isComplete = !!(
      updated.name && updated.phone && updated.experience &&
      updated.target_role && updated.bio
    );
    if (isComplete) {
      await this.xp.awardProfileComplete(userId);
    }

    // Evaluate profile-trigger badges (profile_complete, username_set) +
    // xp-trigger badges in case the awards above unlocked a tier.
    await this.badges.evaluate(userId, 'profile_updated');
    await this.badges.evaluate(userId, 'xp_awarded');

    // Re-fetch so xp/level reflect the awards in the returned user
    const finalUser = await this.prisma.siteUser.findUnique({ where: { id: userId } });
    return publicUser(finalUser ?? updated);
  }

  async deleteAccount(userId: string): Promise<void> {
    // FK cascade deletes refresh tokens automatically; rows in OtpCode persist
    // (keyed by email, not user_id) and expire via natural TTL.
    await this.prisma.siteUser.delete({ where: { id: userId } });
  }

  // ── Maintenance ────────────────────────────────────────────────────────────

  /** Mirrors the admin token cleanup cron — removes abandoned expired sessions. */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupExpiredUserTokens(): Promise<void> {
    await this.prisma.userRefreshToken.deleteMany({
      where: { expires_at: { lt: new Date() } },
    });
  }
}
