import {
  BadRequestException, Body, Controller, Get, Headers, HttpCode, Logger, Post, Req, UseGuards,
} from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import * as crypto from 'crypto';
import { Request } from 'express';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto, VerifySubscriptionDto } from './dto/create-subscription.dto';
import { UserJwtAuthGuard } from '../users/guards/user-jwt.guard';

@Controller('subscriptions')
export class SubscriptionsController {
  private readonly logger = new Logger(SubscriptionsController.name);

  constructor(private readonly svc: SubscriptionsService) {}

  // ── Public reads ───────────────────────────────────────────────────────────

  /** All active plans — drives the /pricing page (no auth required for browsing). */
  @Get('plans')
  listPlans() {
    return this.svc.listActivePlans();
  }

  // ── User-authenticated routes ──────────────────────────────────────────────

  /** Current subscription + plan details. */
  @UseGuards(UserJwtAuthGuard)
  @Get('me')
  myCurrent(@Req() req: Request) {
    return this.svc.myCurrentSubscription((req as any).user.sub);
  }

  /** Payment history for the billing panel. */
  @UseGuards(UserJwtAuthGuard)
  @Get('me/history')
  myHistory(@Req() req: Request) {
    return this.svc.myPaymentHistory((req as any).user.sub);
  }

  /** Step 1 of checkout: create Razorpay subscription, return IDs for Checkout.js. */
  @UseGuards(UserJwtAuthGuard)
  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  @Post('checkout')
  @HttpCode(200)
  startCheckout(@Body() dto: CreateSubscriptionDto, @Req() req: Request) {
    return this.svc.startCheckout((req as any).user.sub, dto.plan_id);
  }

  /** Step 2 of checkout: verify the signature returned by Razorpay Checkout. */
  @UseGuards(UserJwtAuthGuard)
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('verify')
  @HttpCode(200)
  verify(@Body() dto: VerifySubscriptionDto, @Req() req: Request) {
    return this.svc.verifyCheckout((req as any).user.sub, dto);
  }

  /** User-initiated cancel — Pro stays active until period end. */
  @UseGuards(UserJwtAuthGuard)
  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  @Post('cancel')
  @HttpCode(200)
  cancel(@Req() req: Request) {
    return this.svc.cancelMine((req as any).user.sub);
  }

  // ── Webhook ────────────────────────────────────────────────────────────────

  /**
   * Razorpay webhook receiver. Must:
   *   1. Verify HMAC signature using RAZORPAY_WEBHOOK_SECRET (separate from API key)
   *   2. Always return 2xx quickly so Razorpay doesn't retry — even on validation errors
   *      we log and return 200 to prevent infinite retry storms on bad payloads
   *   3. Dedup events via PaymentEvent.razorpay_event_id UNIQUE constraint
   *
   * Throttle is skipped here — Razorpay's webhook IPs would otherwise trip
   * the global limiter on a busy day. Signature verification is the real gate.
   */
  @SkipThrottle()
  @Post('webhook')
  @HttpCode(200)
  async webhook(
    @Headers('x-razorpay-signature') signature: string | undefined,
    @Req() req: Request,
  ) {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      this.logger.error('RAZORPAY_WEBHOOK_SECRET not set — refusing all webhooks');
      throw new BadRequestException('Webhook receiver not configured');
    }
    if (!signature) throw new BadRequestException('Missing signature header');

    // Express has already parsed the body for us — we need to re-stringify
    // for HMAC computation. This works because Razorpay signs JSON.stringify
    // output of the same shape.
    const bodyString = JSON.stringify((req as any).body);
    const expected = crypto.createHmac('sha256', secret).update(bodyString).digest('hex');

    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      this.logger.warn('Webhook signature mismatch — possible spoofing attempt');
      throw new BadRequestException('Invalid signature');
    }

    const body = (req as any).body;
    if (!body?.event || !body?.payload) {
      this.logger.warn(`Malformed webhook payload: ${JSON.stringify(body).slice(0, 200)}`);
      return { received: true };
    }

    // Use Razorpay's event ID for dedup. Some payload shapes nest it differently;
    // try several locations.
    const eventId =
      body?.event_id ||
      body?.id ||
      body?.payload?.subscription?.entity?.id + ':' + body?.created_at ||
      `${body.event}:${body.created_at}`;

    try {
      await this.svc.processWebhookEvent({
        id: eventId,
        event: body.event,
        payload: body.payload,
      });
    } catch (err) {
      // Don't let an internal error trigger Razorpay retry storms — log + 200.
      // We've already persisted the event_id (or will skip on retry via dedup).
      this.logger.error(`Webhook processing error for ${body.event}: ${(err as Error).message}`, (err as Error).stack);
    }

    return { received: true };
  }
}
