import { Injectable, Logger, Optional } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { calcLevel, LEVEL_NAMES, XP_REASONS, type XpReason } from './engagement.constants';
import { ActivityFeedService } from '../activity-feed/activity-feed.service';
import { NotificationsService } from '../notifications/notifications.service';

/**
 * Subset of PrismaClient that any transaction client also satisfies.
 * Lets `award()` work both inside and outside an interactive transaction.
 */
type PrismaLike = PrismaService | Prisma.TransactionClient;

export type AwardXpResult = {
  /** False when this was a duplicate (no-op via idempotency key). */
  awarded: boolean;
  /** Amount actually added (0 on duplicate). */
  amount: number;
  /** User's XP total AFTER the award. Equal to before on no-op. */
  total_xp: number;
  /** True when this award crossed a level threshold. UI uses this to celebrate. */
  leveled_up: boolean;
  previous_level: number;
  new_level: number;
};

@Injectable()
export class XpService {
  private readonly logger = new Logger(XpService.name);

  // `@Optional()` lets older tests / module loads work even without Phase 6
  // services in scope. Production runtime always wires both globals.
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly activity?: ActivityFeedService,
    @Optional() private readonly notifications?: NotificationsService,
  ) {}

  /**
   * Award XP to a user. Atomic: writes an XpEvent ledger row AND increments
   * site_users.xp in the same transaction (or in the caller's tx if provided).
   *
   * Idempotency: pass an `idempotency_key` for one-time awards (e.g.
   * `'first_login:<userId>'`, `'streak_milestone:7:<userId>'`). Duplicate
   * inserts violate the unique constraint and we short-circuit to a no-op
   * — safe to retry on transient failures.
   *
   * Returns `leveled_up` so the caller can trigger celebration UI / push
   * a "Level Up!" notification.
   */
  async award(
    userId: string,
    amount: number,
    reason: XpReason,
    opts?: {
      metadata?: Record<string, unknown>;
      idempotencyKey?: string;
      tx?: Prisma.TransactionClient;
    },
  ): Promise<AwardXpResult> {
    const client: PrismaLike = opts?.tx ?? this.prisma;

    const run = async (db: PrismaLike): Promise<AwardXpResult> => {
      // Read current xp/level — we need both for the leveled_up flag
      const before = await db.siteUser.findUnique({
        where: { id: userId },
        select: { xp: true, level: true },
      });
      if (!before) {
        // User deleted between caller's check and now — silently no-op
        return { awarded: false, amount: 0, total_xp: 0, leveled_up: false, previous_level: 0, new_level: 0 };
      }

      // Try to insert the ledger row. If idempotency_key collides, treat as duplicate.
      try {
        await db.xpEvent.create({
          data: {
            site_user_id: userId,
            amount,
            reason,
            metadata: opts?.metadata as Prisma.InputJsonValue | undefined,
            idempotency_key: opts?.idempotencyKey,
          },
        });
      } catch (e: any) {
        // P2002 = unique constraint violation on idempotency_key — already awarded
        if (e?.code === 'P2002') {
          return {
            awarded: false,
            amount: 0,
            total_xp: before.xp,
            leveled_up: false,
            previous_level: before.level,
            new_level: before.level,
          };
        }
        throw e;
      }

      const newTotal = before.xp + amount;
      const newLevel = calcLevel(newTotal);

      await db.siteUser.update({
        where: { id: userId },
        data: { xp: newTotal, ...(newLevel !== before.level ? { level: newLevel } : {}) },
      });

      return {
        awarded: true,
        amount,
        total_xp: newTotal,
        leveled_up: newLevel > before.level,
        previous_level: before.level,
        new_level: newLevel,
      };
    };

    // If caller supplied a tx, just run inside it. Otherwise open our own.
    const result = opts?.tx ? await run(opts.tx) : await this.prisma.$transaction(run);

    // Cross-cuts on level-up — fire after tx commits so we don't roll back
    // the XP award on a notification failure. Both helpers are no-throw.
    // Reaching levels 3+ (Junior Dev) is publicly meaningful; lower tiers
    // would noise up the global activity feed.
    if (result.leveled_up && result.new_level >= 3) {
      const levelName = LEVEL_NAMES[Math.max(0, Math.min(result.new_level - 1, LEVEL_NAMES.length - 1))];
      void this.activity?.record({
        userId,
        type: 'level_up',
        metadata: { new_level: result.new_level, level_name: levelName, xp: result.total_xp },
        isPublic: true,
      });
      void this.notifications?.create({
        userId,
        type: 'level_up',
        title: `You reached ${levelName}!`,
        body: `Level ${result.new_level} unlocked. Keep going.`,
        linkUrl: '/account',
        icon: 'Award',
      });
    }
    return result;
  }

  /**
   * Convenience helpers — one per built-in reason. Encapsulates the
   * idempotency-key convention so callers can't accidentally double-award.
   */
  awardFirstLogin(userId: string, tx?: Prisma.TransactionClient) {
    return this.award(userId, 25, XP_REASONS.FIRST_LOGIN, {
      idempotencyKey: `${XP_REASONS.FIRST_LOGIN}:${userId}`,
      tx,
    });
  }

  awardProfileComplete(userId: string, tx?: Prisma.TransactionClient) {
    return this.award(userId, 100, XP_REASONS.PROFILE_COMPLETE, {
      idempotencyKey: `${XP_REASONS.PROFILE_COMPLETE}:${userId}`,
      tx,
    });
  }

  awardUsernameClaimed(userId: string, tx?: Prisma.TransactionClient) {
    return this.award(userId, 50, XP_REASONS.USERNAME_CLAIMED, {
      idempotencyKey: `${XP_REASONS.USERNAME_CLAIMED}:${userId}`,
      tx,
    });
  }

  // ── Reads ──────────────────────────────────────────────────────────────────

  async recentEvents(userId: string, limit = 20) {
    return this.prisma.xpEvent.findMany({
      where: { site_user_id: userId },
      orderBy: { created_at: 'desc' },
      take: Math.min(limit, 100),
    });
  }

  /**
   * Weekly leaderboard (top N by XP earned in the last 7 days, IST).
   * Aggregated at query time — fast enough for the foreseeable user count.
   * Promote to a materialized view if/when this becomes a hotspot.
   */
  async weeklyLeaderboard(limit = 50) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const rows = await this.prisma.xpEvent.groupBy({
      by: ['site_user_id'],
      where: { created_at: { gte: sevenDaysAgo } },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: Math.min(limit, 100),
    });

    if (rows.length === 0) return [];

    const userIds = rows.map(r => r.site_user_id);
    const users = await this.prisma.siteUser.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, username: true, level: true },
    });
    const userMap = new Map(users.map(u => [u.id, u]));

    return rows.map((r, idx) => {
      const u = userMap.get(r.site_user_id);
      return {
        rank: idx + 1,
        user_id: r.site_user_id,
        name: u?.name ?? 'Anonymous',
        username: u?.username ?? null,
        level: u?.level ?? 1,
        weekly_xp: r._sum.amount ?? 0,
      };
    });
  }
}
