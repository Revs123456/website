import { Injectable, Logger } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const webpush = require('web-push');
import { PrismaService } from '../prisma/prisma.service';

/**
 * Server-side Web Push delivery. Uses the VAPID protocol — keys must be
 * generated once and set as env vars:
 *
 *   VAPID_PUBLIC_KEY=<base64url>
 *   VAPID_PRIVATE_KEY=<base64url>
 *   VAPID_SUBJECT=mailto:contact@techchampsbyrev.com
 *
 * Generate via:
 *   npx web-push generate-vapid-keys
 *
 * If VAPID keys aren't set, push is disabled gracefully (frontend won't show
 * the push prompt; in-app notifications still work). This means dev/test
 * environments don't need to configure VAPID just to run the app.
 */
@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private enabled = false;

  constructor(private readonly prisma: PrismaService) {
    const pub = process.env.VAPID_PUBLIC_KEY;
    const priv = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || 'mailto:contact@techchampsbyrev.com';

    if (pub && priv) {
      webpush.setVapidDetails(subject, pub, priv);
      this.enabled = true;
      this.logger.log('Web Push enabled (VAPID configured)');
    } else {
      this.logger.warn('Web Push disabled — VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY not set');
    }
  }

  /** Frontend service worker needs this to subscribe — exposed via controller. */
  getPublicKey(): string | null {
    return this.enabled ? (process.env.VAPID_PUBLIC_KEY ?? null) : null;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  // ── Subscription management ────────────────────────────────────────────────

  async subscribe(userId: string, sub: { endpoint: string; keys: { p256dh: string; auth: string } }, userAgent?: string) {
    // Upsert on endpoint — same device re-subscribing replaces the row.
    return this.prisma.pushSubscription.upsert({
      where: { endpoint: sub.endpoint },
      update: {
        site_user_id: userId,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
        user_agent: userAgent,
      },
      create: {
        site_user_id: userId,
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
        user_agent: userAgent,
      },
    });
  }

  async unsubscribe(userId: string, endpoint: string) {
    return this.prisma.pushSubscription.deleteMany({
      where: { site_user_id: userId, endpoint },
    });
  }

  // ── Send ───────────────────────────────────────────────────────────────────

  /**
   * Push to all of a user's devices. Fire-and-forget — failures are logged
   * but don't propagate (the in-app notification is the source of truth).
   *
   * Dead subscriptions (404/410 from the push service) are pruned automatically.
   */
  async sendToUser(userId: string, payload: { title: string; body?: string; url?: string; icon?: string }): Promise<void> {
    if (!this.enabled) return;

    const subs = await this.prisma.pushSubscription.findMany({
      where: { site_user_id: userId },
    });
    if (subs.length === 0) return;

    const json = JSON.stringify({
      title: payload.title,
      body: payload.body || '',
      url: payload.url || '/',
      icon: payload.icon || '/tc.png',
    });

    const deadEndpoints: string[] = [];

    await Promise.all(subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          json,
          { TTL: 86_400 },     // 24h server-side queue if device offline
        );
        // Mark as recently used — useful for future "active devices" reporting
        await this.prisma.pushSubscription.update({
          where: { id: s.id },
          data: { last_used_at: new Date() },
        }).catch(() => undefined);
      } catch (err: any) {
        const status = err?.statusCode;
        if (status === 404 || status === 410) {
          // Subscription expired or browser unsubscribed — clean up
          deadEndpoints.push(s.endpoint);
        } else {
          this.logger.warn(`Push delivery failed for ${s.id} (status=${status ?? '?'}): ${err?.body || err?.message || 'unknown'}`);
        }
      }
    }));

    if (deadEndpoints.length > 0) {
      await this.prisma.pushSubscription.deleteMany({
        where: { endpoint: { in: deadEndpoints } },
      });
      this.logger.log(`Pruned ${deadEndpoints.length} dead push subscriptions`);
    }
  }
}
