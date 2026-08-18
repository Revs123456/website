import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { XpService } from '../../engagement/xp.service';
import { generateReferralCode } from '../viral.util';

/**
 * Referral mechanics:
 *   - Each user can have a referral_code (lazy-generated)
 *   - During signup, an optional ?ref=CODE param maps the new user's
 *     `referred_by_id` to the owner of that code
 *   - On successful first-OTP-verify, both referrer and referee get +200 XP
 *     (referrer ALSO gets a one-time "Connector" badge once they hit 5 refs)
 *
 * The award call lives in UsersService.verifyOtp so it fires atomically with
 * user creation. THIS service exposes the read/write surface used by the
 * frontend (my code, my stats, code-to-user lookup).
 */
@Injectable()
export class ReferralsService {
  // XP reward — both sides get this on each successful new referral.
  static readonly XP_PER_REFERRAL = 200;

  constructor(
    private readonly prisma: PrismaService,
    private readonly xp: XpService,
  ) {}

  /** Look up a user by referral code. Returns null if not found. */
  async findUserByCode(code: string) {
    if (!code || code.length < 4 || code.length > 12) return null;
    return this.prisma.siteUser.findUnique({
      where: { referral_code: code.toUpperCase() },
      select: { id: true, name: true, username: true },
    });
  }

  /**
   * Get-or-create the user's referral code. Called from /users/me/referral —
   * we lazy-init so we only spend index space on users who care.
   *
   * Retries on collision (extremely unlikely with 6 chars × 31-letter alphabet
   * = 887M combinations).
   */
  async ensureCodeFor(userId: string): Promise<string> {
    const existing = await this.prisma.siteUser.findUnique({
      where: { id: userId },
      select: { referral_code: true },
    });
    if (!existing) throw new NotFoundException('User not found.');
    if (existing.referral_code) return existing.referral_code;

    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateReferralCode();
      try {
        await this.prisma.siteUser.update({
          where: { id: userId },
          data: { referral_code: code },
        });
        return code;
      } catch (e: any) {
        if (e?.code !== 'P2002') throw e;
        // Collision — try again with a new code
      }
    }
    throw new Error('Could not generate a unique referral code after 5 attempts.');
  }

  /** Stats for the referrer: how many they've brought in + total XP earned via referrals. */
  async myStats(userId: string) {
    const [user, referredCount] = await Promise.all([
      this.prisma.siteUser.findUnique({
        where: { id: userId },
        select: { referral_code: true },
      }),
      this.prisma.siteUser.count({ where: { referred_by_id: userId } }),
    ]);

    return {
      referral_code: user?.referral_code ?? null,
      referred_count: referredCount,
      xp_per_referral: ReferralsService.XP_PER_REFERRAL,
      total_xp_earned: referredCount * ReferralsService.XP_PER_REFERRAL,
    };
  }

  /**
   * Called from UsersService.verifyOtp when a brand-new user lands AND was
   * referred. Awards XP to BOTH sides idempotently (via XpService keys).
   *
   * Runs inside the same transaction as the user create — see UsersService.
   */
  async awardReferralXp(opts: {
    newUserId: string;
    referrerId: string;
    tx?: any;
  }) {
    const { newUserId, referrerId, tx } = opts;
    // Idempotency keys ensure same referral can't be double-counted on retries
    await this.xp.award(referrerId, ReferralsService.XP_PER_REFERRAL, 'referral_made', {
      idempotencyKey: `referral_made:${referrerId}:${newUserId}`,
      metadata: { referee_id: newUserId },
      tx,
    });
    await this.xp.award(newUserId, ReferralsService.XP_PER_REFERRAL, 'referral_joined', {
      idempotencyKey: `referral_joined:${newUserId}`,
      metadata: { referrer_id: referrerId },
      tx,
    });
  }

  /** Validate a code at signup time. Throws if invalid. */
  async validateCodeOrThrow(code: string): Promise<string> {
    const owner = await this.findUserByCode(code);
    if (!owner) throw new BadRequestException('Invalid referral code.');
    return owner.id;
  }
}
