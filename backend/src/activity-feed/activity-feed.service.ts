import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Activity event types. Each has its own metadata shape — frontend renderers
 * switch on `type` to format the feed item. Keep this in sync with the
 * frontend `ActivityRenderer` component.
 */
export type ActivityType =
  | 'level_up'                  // metadata: { new_level, level_name, xp }
  | 'badge_earned'              // metadata: { badge_code, badge_name, icon, tier }
  | 'streak_milestone'          // metadata: { days, xp_bonus }
  | 'mock_interview_aced'       // metadata: { role, score, share_token }
  | 'placement_reported'        // metadata: { before_role, after_role, company, salary_hike }
  | 'pro_subscribed'            // metadata: { plan_name }
  | 'answer_accepted';          // metadata: { question_id, question_title }

@Injectable()
export class ActivityFeedService {
  private readonly logger = new Logger(ActivityFeedService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cross-cut entry point. Other services call this after notable user events.
   * Failures are non-fatal — losing a feed item shouldn't break the triggering action.
   *
   * `isPublic=false` is for events that show on the user's own feed only
   * (e.g. their own AI usage), `true` is for events the whole platform sees
   * (e.g. placements, big level-ups).
   */
  async record(opts: {
    userId: string;
    type: ActivityType;
    metadata: Record<string, unknown>;
    isPublic?: boolean;
  }): Promise<void> {
    try {
      await this.prisma.activityEvent.create({
        data: {
          site_user_id: opts.userId,
          type: opts.type,
          metadata: opts.metadata as Prisma.InputJsonValue,
          is_public: opts.isPublic ?? true,
        },
      });
    } catch (e) {
      this.logger.warn(`Failed to record activity ${opts.type} for ${opts.userId}: ${(e as Error).message}`);
    }
  }

  // ── Reads ──────────────────────────────────────────────────────────────────

  /**
   * Global public feed. Returns recent events from all users.
   * Excludes events from users with private profiles where possible
   * (privacy: if you set profile_public=false, your level-ups don't show globally).
   */
  async publicFeed(limit = 30) {
    return this.prisma.activityEvent.findMany({
      where: {
        is_public: true,
        // Only show events from users who opted into public profiles
        user: { profile_public: true },
      },
      orderBy: { created_at: 'desc' },
      take: Math.min(limit, 100),
      include: {
        user: {
          select: { username: true, name: true, level: true, is_pro: true, avatar_url: true },
        },
      },
    });
  }

  /** My own feed — all my events including private ones. */
  async myFeed(userId: string, limit = 30) {
    return this.prisma.activityEvent.findMany({
      where: { site_user_id: userId },
      orderBy: { created_at: 'desc' },
      take: Math.min(limit, 100),
    });
  }
}
