import { Controller, Get, HttpCode } from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import { PushService } from '../push/push.service';

/**
 * Health + readiness endpoints.
 *
 * /v1/healthz       — load-balancer probe. Always 200 if process is alive.
 * /v1/readyz        — readiness probe. 200 only if all critical subsystems work.
 * /v1/health/deep   — operator-facing detailed status with per-subsystem latency.
 *
 * Render's load balancer hits /healthz; outages in subsystems shouldn't pull
 * the instance out of rotation (DB hiccup ≠ instance dead). /readyz exists
 * for ops dashboards where "ready to serve real traffic" matters.
 */
@SkipThrottle()
@Controller()
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly push: PushService,
  ) {}

  /** Liveness — process is alive and responding. Cheap. */
  @Get('healthz')
  @HttpCode(200)
  healthz() {
    return {
      status: 'ok',
      uptime_seconds: Math.floor(process.uptime()),
      pid: process.pid,
    };
  }

  /** Readiness — process can serve real traffic. Checks DB connectivity. */
  @Get('readyz')
  async readyz() {
    try {
      // Cheapest possible round-trip — just confirms the connection works.
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ready' };
    } catch {
      // Service Unavailable so load balancers can drain this instance
      return { status: 'not-ready', reason: 'database unreachable' };
    }
  }

  /**
   * Deep health — for operator dashboards. Reports per-subsystem status +
   * latency. Don't expose publicly; this is rate-limited and tells callers
   * about internal architecture.
   */
  @Throttle({ default: { ttl: 60_000, limit: 6 } })
  @Get('health/deep')
  async deepHealth() {
    const [db, ai, razorpay] = await Promise.all([
      this.checkDb(),
      this.checkAnthropicKey(),
      this.checkRazorpayKey(),
    ]);

    return {
      status: db.ok && ai.ok && razorpay.ok ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime_seconds: Math.floor(process.uptime()),
      memory_mb: Math.round(process.memoryUsage().rss / 1024 / 1024),
      cache: this.cache.stats(),
      push_enabled: this.push.isEnabled(),
      checks: { db, ai, razorpay },
    };
  }

  private async checkDb(): Promise<{ ok: boolean; latency_ms?: number; error?: string }> {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { ok: true, latency_ms: Date.now() - start };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }

  /**
   * AI check is config-only — we don't actually hit the Anthropic API
   * (that would cost money on every probe). Just confirms the env var is set.
   */
  private checkAnthropicKey(): { ok: boolean; configured: boolean } {
    const configured = !!process.env.ANTHROPIC_API_KEY;
    return { ok: configured, configured };
  }

  private checkRazorpayKey(): { ok: boolean; configured: boolean } {
    const configured = !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
    return { ok: configured, configured };
  }
}
