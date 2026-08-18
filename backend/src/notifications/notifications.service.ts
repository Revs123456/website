import { Injectable, Logger, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PushService } from '../push/push.service';

/**
 * Canonical notification types. Add new types here AND in the frontend
 * icon-mapping table. Stored as plain strings in the DB so renaming is safe
 * as long as old rows are migrated.
 */
export type NotificationType =
  | 'new_job_match'
  | 'streak_at_risk'
  | 'answer_received'        // someone answered your question
  | 'answer_accepted'        // your answer was marked accepted
  | 'pro_renewing'           // 7 days before next charge
  | 'pro_payment_failed'
  | 'badge_earned'
  | 'level_up'
  | 'follow_up_due';         // job application follow-up reminder

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  // `@Optional()` so unit tests that only need in-app notifications can omit Push.
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly push?: PushService,
  ) {}

  /**
   * Cross-cut entry point. Called by other services after notable events.
   * NEVER throws — losing a notification is far worse than losing the
   * triggering action's response, but we don't want one to break the other.
   */
  async create(opts: {
    userId: string;
    type: NotificationType;
    title: string;
    body?: string;
    linkUrl?: string;
    icon?: string;
  }): Promise<void> {
    try {
      await this.prisma.notification.create({
        data: {
          site_user_id: opts.userId,
          type: opts.type,
          title: opts.title,
          body: opts.body,
          link_url: opts.linkUrl,
          icon: opts.icon,
        },
      });
    } catch (e) {
      this.logger.warn(`Failed to create notification for ${opts.userId}: ${(e as Error).message}`);
    }

    // Phase 7 — fire web push in parallel. Fire-and-forget; failures swallowed
    // inside PushService. If push isn't enabled (no VAPID keys) this is a no-op.
    if (this.push) {
      void this.push.sendToUser(opts.userId, {
        title: opts.title,
        body: opts.body,
        url: opts.linkUrl,
      });
    }
  }

  // ── Reads ──────────────────────────────────────────────────────────────────

  /**
   * List my notifications. Unread first by creation desc, then read by creation desc.
   * Single index hit thanks to (site_user_id, read, created_at) compound index.
   */
  async listMine(userId: string, limit = 50) {
    return this.prisma.notification.findMany({
      where: { site_user_id: userId },
      orderBy: [{ read: 'asc' }, { created_at: 'desc' }],
      take: Math.min(limit, 100),
    });
  }

  /** Unread count for the navbar bell. Cheap aggregate, polled every 30s. */
  async unreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { site_user_id: userId, read: false },
    });
  }

  async markRead(userId: string, notificationId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, site_user_id: userId, read: false },
      data: { read: true, read_at: new Date() },
    });
  }

  async markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { site_user_id: userId, read: false },
      data: { read: true, read_at: new Date() },
    });
  }
}
