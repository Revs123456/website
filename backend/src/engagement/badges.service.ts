import { Injectable, Logger, Optional } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityFeedService } from '../activity-feed/activity-feed.service';
import { NotificationsService } from '../notifications/notifications.service';

/**
 * Badge criteria is a Json blob with a `type` discriminator and threshold/values.
 * Extend this union as new badge types are seeded. Keeping evaluation here
 * (instead of TS constants per badge) means non-engineers can add badges via
 * the CMS later by inserting Badge rows with the right criteria JSON.
 */
type BadgeCriteria =
  | { type: 'streak'; threshold: number }       // current_streak >= threshold
  | { type: 'level'; threshold: number }        // user level >= threshold
  | { type: 'xp'; threshold: number }           // total xp >= threshold
  | { type: 'challenges'; threshold: number }   // count of submissions >= threshold
  | { type: 'profile_complete' }                // all key profile fields filled
  | { type: 'username_set' };                   // username is non-null

/** Triggers that warrant re-evaluating badges. Reduces wasted work vs checking everything. */
export type BadgeTrigger =
  | 'streak_changed'
  | 'xp_awarded'
  | 'level_up'
  | 'challenge_submitted'
  | 'profile_updated';

@Injectable()
export class BadgesService {
  private readonly logger = new Logger(BadgesService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly activity?: ActivityFeedService,
    @Optional() private readonly notifications?: NotificationsService,
  ) {}

  /**
   * Evaluate all relevant badges for the given trigger and award any newly
   * earned ones. Idempotent — UserBadge has a unique (user, badge) constraint.
   * Returns the badges newly earned in this call (for celebration UI).
   */
  async evaluate(userId: string, trigger: BadgeTrigger, tx?: Prisma.TransactionClient) {
    const db = tx ?? this.prisma;

    const relevantTypes = this.typesForTrigger(trigger);
    if (relevantTypes.length === 0) return [];

    // Fetch only badges of relevant types AND not yet earned by this user.
    // We can't filter by JSON `type` in Prisma where, so fetch published+not-earned
    // and filter in memory — badge catalog is small (<100), this is cheap.
    const allBadges = await db.badge.findMany({
      where: { published: true },
    });
    const candidateBadges = allBadges.filter(b => {
      const crit = b.criteria as BadgeCriteria;
      return relevantTypes.includes(crit.type);
    });
    if (candidateBadges.length === 0) return [];

    const alreadyEarned = await db.userBadge.findMany({
      where: { site_user_id: userId, badge_id: { in: candidateBadges.map(b => b.id) } },
      select: { badge_id: true },
    });
    const earnedSet = new Set(alreadyEarned.map(b => b.badge_id));

    const toEvaluate = candidateBadges.filter(b => !earnedSet.has(b.id));
    if (toEvaluate.length === 0) return [];

    // Load user state once for all evaluators
    const user = await db.siteUser.findUnique({
      where: { id: userId },
      select: {
        id: true, username: true, name: true, phone: true, experience: true,
        target_role: true, current_role: true, bio: true,
        xp: true, level: true,
      },
    });
    if (!user) return [];

    const streak = await db.userStreak.findUnique({
      where: { site_user_id: userId },
      select: { current_streak: true },
    });

    const submissionCount = relevantTypes.includes('challenges')
      ? await db.challengeSubmission.count({ where: { site_user_id: userId } })
      : 0;

    const newlyEarned: typeof toEvaluate = [];

    for (const badge of toEvaluate) {
      const crit = badge.criteria as BadgeCriteria;
      let qualifies = false;

      switch (crit.type) {
        case 'streak':
          qualifies = (streak?.current_streak ?? 0) >= crit.threshold;
          break;
        case 'level':
          qualifies = user.level >= crit.threshold;
          break;
        case 'xp':
          qualifies = user.xp >= crit.threshold;
          break;
        case 'challenges':
          qualifies = submissionCount >= crit.threshold;
          break;
        case 'profile_complete':
          qualifies = !!(user.name && user.phone && user.experience && user.target_role && user.bio);
          break;
        case 'username_set':
          qualifies = !!user.username;
          break;
      }

      if (qualifies) {
        try {
          await db.userBadge.create({
            data: { site_user_id: userId, badge_id: badge.id },
          });
          newlyEarned.push(badge);
        } catch (e: any) {
          // P2002 = race condition (badge earned via concurrent flow) — safe to ignore
          if (e?.code !== 'P2002') throw e;
        }
      }
    }

    if (newlyEarned.length > 0) {
      this.logger.log(`User ${userId} earned ${newlyEarned.length} badges via ${trigger}: ${newlyEarned.map(b => b.code).join(', ')}`);

      // Cross-cuts: activity feed + in-app notifications for each new badge.
      // Public on the feed for gold/platinum only (bronze noise dilutes the feed);
      // notifications go on every tier so the user always sees what they earned.
      for (const badge of newlyEarned) {
        const isHighTier = badge.tier === 'gold' || badge.tier === 'platinum';
        void this.activity?.record({
          userId,
          type: 'badge_earned',
          metadata: { badge_code: badge.code, badge_name: badge.name, icon: badge.icon, tier: badge.tier },
          isPublic: isHighTier,
        });
        void this.notifications?.create({
          userId,
          type: 'badge_earned',
          title: `Badge unlocked: ${badge.name}`,
          body: badge.description,
          linkUrl: '/account',
          icon: badge.icon,
        });
      }
    }

    return newlyEarned;
  }

  /** Which criteria types are worth re-checking for this trigger. */
  private typesForTrigger(trigger: BadgeTrigger): BadgeCriteria['type'][] {
    switch (trigger) {
      case 'streak_changed':       return ['streak'];
      case 'xp_awarded':           return ['xp'];
      case 'level_up':             return ['level', 'xp'];
      case 'challenge_submitted':  return ['challenges'];
      case 'profile_updated':      return ['profile_complete', 'username_set'];
    }
  }

  // ── Reads ──────────────────────────────────────────────────────────────────

  async listAll(includeHidden = false) {
    return this.prisma.badge.findMany({
      where: includeHidden ? { published: true } : { published: true, hidden: false },
      orderBy: [{ tier: 'asc' }, { created_at: 'asc' }],
    });
  }

  async listEarnedBy(userId: string) {
    return this.prisma.userBadge.findMany({
      where: { site_user_id: userId },
      include: { badge: true },
      orderBy: { earned_at: 'desc' },
    });
  }
}
