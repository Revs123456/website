import {
  BadRequestException, ConflictException, ForbiddenException,
  Injectable, InternalServerErrorException, Logger, NotFoundException, Optional,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as crypto from 'crypto';
import Razorpay from 'razorpay';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { XpService } from '../engagement/xp.service';
import { ActivityFeedService } from '../activity-feed/activity-feed.service';
import { CacheService } from '../cache/cache.service';

/**
 * Razorpay Subscription statuses we map into our domain.
 * Reference: https://razorpay.com/docs/payments/subscriptions/states/
 */
const PRO_ACTIVE_STATUSES = new Set([
  'authenticated',  // first payment + mandate done
  'active',         // recurring charges working
  'pending',        // charge failed, retrying (grace period)
]);

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);
  private razorpay: Razorpay;

  constructor(
    private readonly prisma: PrismaService,
    private readonly xp: XpService,
    @Optional() private readonly activity?: ActivityFeedService,
    @Optional() private readonly cache?: CacheService,
  ) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set');
    }
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }

  // ── Reads ──────────────────────────────────────────────────────────────────

  async listActivePlans() {
    // Plans are slow-changing reference data; 5 min cache is generous.
    // Cache-invalidated implicitly when TTL expires (admin updates are rare).
    const fetch = () => this.prisma.plan.findMany({
      where: { active: true },
      orderBy: { sort_order: 'asc' },
    });
    return this.cache ? this.cache.wrap('subscriptions:plans', 300, fetch) : fetch();
  }

  async myCurrentSubscription(userId: string) {
    // Return the most-recent non-expired/cancelled subscription
    return this.prisma.subscription.findFirst({
      where: {
        site_user_id: userId,
        status: { in: ['authenticated', 'active', 'pending', 'cancelled'] },
      },
      include: { plan: true },
      orderBy: { created_at: 'desc' },
    });
  }

  async myPaymentHistory(userId: string, limit = 20) {
    const subs = await this.prisma.subscription.findMany({
      where: { site_user_id: userId },
      select: { id: true },
    });
    if (subs.length === 0) return [];

    return this.prisma.paymentEvent.findMany({
      where: {
        subscription_id: { in: subs.map(s => s.id) },
        // Only show actual money-movement events to users
        event_type: { in: ['subscription.charged', 'payment.captured', 'payment.failed'] },
      },
      orderBy: { created_at: 'desc' },
      take: Math.min(limit, 100),
    });
  }

  // ── Plan management ────────────────────────────────────────────────────────

  /**
   * Get-or-create a plan in Razorpay. Lazy creation means a fresh deployment
   * doesn't need a Razorpay dashboard step — the first subscriber creates it.
   * Stores the returned plan_id on our Plan row so subsequent calls are no-op.
   */
  private async ensureRazorpayPlanId(planId: string): Promise<string> {
    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException('Plan not found');
    if (plan.razorpay_plan_id) return plan.razorpay_plan_id;

    try {
      const rzpPlan = await (this.razorpay.plans as any).create({
        period: plan.period,
        interval: plan.interval,
        item: {
          name: plan.name,
          description: plan.description ?? plan.name,
          amount: plan.price_inr,   // already in paise
          currency: 'INR',
        },
        notes: { plan_code: plan.code },
      });

      await this.prisma.plan.update({
        where: { id: planId },
        data: { razorpay_plan_id: rzpPlan.id },
      });
      this.logger.log(`Created Razorpay plan ${rzpPlan.id} for ${plan.code}`);
      return rzpPlan.id;
    } catch (e: any) {
      const msg = e?.error?.description || e?.message || 'Razorpay plan creation failed';
      this.logger.error(`Razorpay plan create failed for ${plan.code}: ${msg}`, e);
      throw new InternalServerErrorException(msg);
    }
  }

  // ── Checkout flow ──────────────────────────────────────────────────────────

  /**
   * Step 1 of checkout: create a Razorpay Subscription object + persist our
   * Subscription row in `created` state. Returns the IDs the frontend needs
   * to open Razorpay Checkout.
   */
  async startCheckout(userId: string, planId: string) {
    // Reject duplicate active subscriptions — let user cancel first
    const existing = await this.prisma.subscription.findFirst({
      where: {
        site_user_id: userId,
        status: { in: ['authenticated', 'active', 'pending'] },
      },
    });
    if (existing) {
      throw new ConflictException('You already have an active subscription. Cancel it before subscribing to a new plan.');
    }

    const razorpayPlanId = await this.ensureRazorpayPlanId(planId);

    // total_count: how many billing cycles before the subscription auto-completes.
    // We set this high (5 years worth) — users cancel by intent, not by cycle limit.
    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException('Plan not found');
    const totalCount = plan.period === 'monthly' ? 60 : 5;

    let rzpSub: any;
    try {
      rzpSub = await (this.razorpay.subscriptions as any).create({
        plan_id: razorpayPlanId,
        total_count: totalCount,
        customer_notify: 1,
        notes: { site_user_id: userId, plan_code: plan.code },
      });
    } catch (e: any) {
      const msg = e?.error?.description || e?.message || 'Razorpay subscription creation failed';
      this.logger.error(`Razorpay subscription create failed: ${msg}`, e);
      throw new InternalServerErrorException(msg);
    }

    await this.prisma.subscription.create({
      data: {
        site_user_id: userId,
        plan_id: planId,
        razorpay_subscription_id: rzpSub.id,
        status: rzpSub.status || 'created',
      },
    });

    return {
      razorpay_subscription_id: rzpSub.id,
      razorpay_key_id: process.env.RAZORPAY_KEY_ID!,
      plan: {
        name: plan.name,
        price_inr: plan.price_inr,
        period: plan.period,
      },
    };
  }

  /**
   * Step 2 of checkout: verify the HMAC signature Razorpay returned via the
   * checkout handler. On success, flip user to Pro IMMEDIATELY — webhooks
   * follow asynchronously to confirm + handle renewals.
   */
  async verifyCheckout(userId: string, body: {
    razorpay_payment_id: string;
    razorpay_subscription_id: string;
    razorpay_signature: string;
  }) {
    // For subscriptions, signature = HMAC_SHA256(payment_id|subscription_id, key_secret)
    const secret = process.env.RAZORPAY_KEY_SECRET!;
    const expected = crypto
      .createHmac('sha256', secret)
      .update(`${body.razorpay_payment_id}|${body.razorpay_subscription_id}`)
      .digest('hex');

    const a = Buffer.from(expected);
    const b = Buffer.from(body.razorpay_signature);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      throw new BadRequestException('Invalid signature');
    }

    const sub = await this.prisma.subscription.findUnique({
      where: { razorpay_subscription_id: body.razorpay_subscription_id },
      include: { plan: true },
    });
    if (!sub) throw new NotFoundException('Subscription not found');
    if (sub.site_user_id !== userId) {
      throw new ForbiddenException('This subscription does not belong to you');
    }

    // Fetch Razorpay's view of the subscription for authoritative period data
    let rzpSub: any;
    try {
      rzpSub = await (this.razorpay.subscriptions as any).fetch(body.razorpay_subscription_id);
    } catch (e) {
      this.logger.error('Failed to fetch subscription from Razorpay', e as Error);
      throw new InternalServerErrorException('Could not verify subscription with Razorpay');
    }

    await this.applyActivation(sub.id, userId, rzpSub);

    return { success: true, message: 'Subscription activated' };
  }

  /**
   * Activation = update Subscription row + flip user.is_pro + grant shield +
   * award referral bonus. All in one transaction so partial failures roll back.
   * Idempotent: re-running on an already-active sub re-syncs state.
   */
  private async applyActivation(subId: string, userId: string, rzpSub: any) {
    const wasAlreadyActive = await this.prisma.subscription.findUnique({
      where: { id: subId },
      select: { activated_at: true, status: true },
    });
    const isFirstActivation = !wasAlreadyActive?.activated_at;

    await this.prisma.$transaction(async (tx) => {
      await tx.subscription.update({
        where: { id: subId },
        data: {
          status: rzpSub.status,
          current_period_start: rzpSub.current_start ? new Date(rzpSub.current_start * 1000) : null,
          current_period_end:   rzpSub.current_end   ? new Date(rzpSub.current_end   * 1000) : null,
          activated_at:         isFirstActivation ? new Date() : undefined,
          raw_payload:          rzpSub as Prisma.InputJsonValue,
        },
      });

      // Flip the denormalized Pro flags on the user
      const proExpiresAt = rzpSub.current_end ? new Date(rzpSub.current_end * 1000) : null;
      await tx.siteUser.update({
        where: { id: userId },
        data: {
          is_pro: PRO_ACTIVE_STATUSES.has(rzpSub.status),
          pro_expires_at: proExpiresAt,
        },
      });

      // First-time-only bonuses
      if (isFirstActivation) {
        // Grant streak shield (Pro perk — Phase 2 column already exists)
        await tx.userStreak.upsert({
          where: { site_user_id: userId },
          create: {
            site_user_id: userId,
            current_streak: 0,
            longest_streak: 0,
            shields_remaining: 1,
          },
          update: { shields_remaining: { set: 1 } },
        });
      }
    });

    // Referral conversion bonus — outside the tx because XpService opens its own.
    // Idempotent via xpService's idempotency key, so duplicate webhook = no-op.
    if (isFirstActivation) {
      const user = await this.prisma.siteUser.findUnique({
        where: { id: userId },
        select: { referred_by_id: true },
      });
      if (user?.referred_by_id) {
        await this.xp.award(user.referred_by_id, 1000, 'referral_converted', {
          metadata: { converted_user_id: userId, subscription_id: subId },
          idempotencyKey: `referral_converted:${userId}`,
        });
      }

      // Public activity feed event — "Yaswanth went Pro" feels social-proof-y
      // and inspires upgrades. Fire-and-forget.
      const sub = await this.prisma.subscription.findUnique({
        where: { id: subId },
        include: { plan: { select: { name: true } } },
      });
      if (sub) {
        void this.activity?.record({
          userId,
          type: 'pro_subscribed',
          metadata: { plan_name: sub.plan.name },
          isPublic: true,
        });
      }
    }
  }

  // ── Cancellation ───────────────────────────────────────────────────────────

  /**
   * User-initiated cancel. `cancel_at_cycle_end: true` means Razorpay stops
   * future renewals but the current period stays paid through.
   * User remains Pro until pro_expires_at (set at activation).
   */
  async cancelMine(userId: string) {
    const sub = await this.prisma.subscription.findFirst({
      where: {
        site_user_id: userId,
        status: { in: ['authenticated', 'active', 'pending'] },
      },
    });
    if (!sub) throw new NotFoundException('No active subscription to cancel');

    try {
      await (this.razorpay.subscriptions as any).cancel(sub.razorpay_subscription_id, true);
    } catch (e: any) {
      const msg = e?.error?.description || e?.message || 'Razorpay cancel failed';
      this.logger.error(`Cancel failed for ${sub.razorpay_subscription_id}: ${msg}`, e);
      throw new InternalServerErrorException(msg);
    }

    await this.prisma.subscription.update({
      where: { id: sub.id },
      data: {
        cancel_at_period_end: true,
        cancelled_at: new Date(),
      },
    });

    return {
      success: true,
      message: 'Subscription will end at the end of the current billing period.',
    };
  }

  // ── Webhook handler ────────────────────────────────────────────────────────

  /**
   * Process a Razorpay webhook event. Called from the controller AFTER
   * signature verification. Idempotent via PaymentEvent unique constraint.
   */
  async processWebhookEvent(event: {
    id: string;
    event: string;
    payload: any;
  }): Promise<void> {
    // Idempotency check first — Razorpay retries failed webhooks for 24h
    const existing = await this.prisma.paymentEvent.findUnique({
      where: { razorpay_event_id: event.id },
    });
    if (existing) {
      this.logger.log(`Duplicate webhook event ${event.id} (${event.event}) — skipping`);
      return;
    }

    const sub = await this.findSubscriptionFromEvent(event.payload);

    // Persist the event ALWAYS (even if we don't act on it) for audit trail
    const amountPaid = event.payload?.payment?.entity?.amount ?? null;
    const paymentId = event.payload?.payment?.entity?.id ?? null;

    await this.prisma.paymentEvent.create({
      data: {
        subscription_id: sub?.id ?? null,
        razorpay_event_id: event.id,
        razorpay_payment_id: paymentId,
        event_type: event.event,
        amount_paid_paise: amountPaid,
        raw_payload: event.payload as Prisma.InputJsonValue,
      },
    });

    // Dispatch based on event type
    switch (event.event) {
      case 'subscription.activated':
      case 'subscription.charged':
        await this.handleSubscriptionActiveOrCharged(sub, event.payload);
        break;
      case 'subscription.pending':
      case 'subscription.halted':
      case 'subscription.cancelled':
      case 'subscription.completed':
      case 'subscription.expired':
      case 'subscription.paused':
        await this.handleSubscriptionStateChange(sub, event.payload, event.event);
        break;
      default:
        // payment.captured / payment.failed / unknown — already persisted, no action
        break;
    }
  }

  private async findSubscriptionFromEvent(payload: any) {
    const rzpSubId = payload?.subscription?.entity?.id;
    if (!rzpSubId) return null;
    return this.prisma.subscription.findUnique({
      where: { razorpay_subscription_id: rzpSubId },
    });
  }

  private async handleSubscriptionActiveOrCharged(sub: any, payload: any) {
    if (!sub) return;
    const rzpSub = payload?.subscription?.entity;
    if (!rzpSub) return;

    const newPeriodEnd = rzpSub.current_end ? new Date(rzpSub.current_end * 1000) : null;
    const paymentAmount = payload?.payment?.entity?.amount ?? 0;

    await this.prisma.$transaction(async (tx) => {
      await tx.subscription.update({
        where: { id: sub.id },
        data: {
          status: rzpSub.status,
          current_period_start: rzpSub.current_start ? new Date(rzpSub.current_start * 1000) : null,
          current_period_end:   newPeriodEnd,
          activated_at:         sub.activated_at ?? new Date(),
          charges_count:        { increment: 1 },
          total_paid_paise:     { increment: paymentAmount },
          raw_payload:          payload as Prisma.InputJsonValue,
        },
      });

      await tx.siteUser.update({
        where: { id: sub.site_user_id },
        data: {
          is_pro: PRO_ACTIVE_STATUSES.has(rzpSub.status),
          pro_expires_at: newPeriodEnd,
        },
      });
    });

    // First-charge bonuses (idempotent — XpService dedups)
    if (!sub.activated_at) {
      const user = await this.prisma.siteUser.findUnique({
        where: { id: sub.site_user_id },
        select: { referred_by_id: true },
      });
      if (user?.referred_by_id) {
        await this.xp.award(user.referred_by_id, 1000, 'referral_converted', {
          metadata: { converted_user_id: sub.site_user_id, subscription_id: sub.id },
          idempotencyKey: `referral_converted:${sub.site_user_id}`,
        });
      }
    }
  }

  private async handleSubscriptionStateChange(sub: any, payload: any, eventType: string) {
    if (!sub) return;
    const rzpSub = payload?.subscription?.entity;
    if (!rzpSub) return;

    const isProActive = PRO_ACTIVE_STATUSES.has(rzpSub.status);
    const periodEnd = rzpSub.current_end ? new Date(rzpSub.current_end * 1000) : null;

    await this.prisma.$transaction(async (tx) => {
      await tx.subscription.update({
        where: { id: sub.id },
        data: {
          status: rzpSub.status,
          current_period_end: periodEnd,
          cancel_at_period_end: !!rzpSub.cancel_at_cycle_end,
          cancelled_at: eventType === 'subscription.cancelled' && !sub.cancelled_at
            ? new Date()
            : undefined,
          raw_payload: payload as Prisma.InputJsonValue,
        },
      });

      // For cancellation, keep is_pro=true until pro_expires_at passes —
      // the daily expiry sweep handles the actual flip.
      // For halted/completed/expired, flip immediately.
      const shouldRevokeNow = ['halted', 'completed', 'expired'].includes(rzpSub.status);
      if (shouldRevokeNow) {
        await tx.siteUser.update({
          where: { id: sub.site_user_id },
          data: { is_pro: false, pro_expires_at: null },
        });
      } else {
        await tx.siteUser.update({
          where: { id: sub.site_user_id },
          data: {
            is_pro: isProActive,
            pro_expires_at: periodEnd,
          },
        });
      }
    });
  }

  // ── Maintenance crons ──────────────────────────────────────────────────────

  /**
   * Daily IST 02:00 — sweep expired subs.
   * Catches the edge case where a user's pro_expires_at passes but no webhook
   * arrived (e.g. Razorpay missed sending one, or our webhook URL was down).
   */
  @Cron('0 2 * * *', { timeZone: 'Asia/Kolkata' })
  async sweepExpiredPro(): Promise<void> {
    const expired = await this.prisma.siteUser.updateMany({
      where: {
        is_pro: true,
        pro_expires_at: { lt: new Date() },
      },
      data: { is_pro: false },
    });
    if (expired.count > 0) {
      this.logger.log(`Pro expired for ${expired.count} users (sweep)`);
    }
  }

  /**
   * Monthly 1st 00:01 IST — grant 1 streak shield to active Pro users.
   * Reset to 1 (don't accumulate) so the perk is "always have one available"
   * not "stockpile shields".
   */
  @Cron('1 0 1 * *', { timeZone: 'Asia/Kolkata' })
  async grantMonthlyShields(): Promise<void> {
    const activePros = await this.prisma.siteUser.findMany({
      where: { is_pro: true },
      select: { id: true },
    });
    if (activePros.length === 0) return;

    await this.prisma.userStreak.updateMany({
      where: { site_user_id: { in: activePros.map(u => u.id) } },
      data: { shields_remaining: 1 },
    });
    this.logger.log(`Granted monthly shield to ${activePros.length} Pro users`);
  }
}
