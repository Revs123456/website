import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Feature key identifying a paywalled AI tool. Each free user gets a fixed
 * cap per feature per time window. Pro users are unlimited.
 *
 * IMPORTANT: keep these keys stable — they're stored as plain strings in
 * the `ai_usage.feature` column. Renaming = orphaning historical usage.
 */
export type AiFeature =
  | 'optimizer'           // Resume Optimizer (Phase 4)
  | 'evaluator'           // Answer Evaluator (Phase 4)
  | 'mock_interview'      // AI Mock Interview (Phase 4)
  | 'revbot'              // RevBot career coach (Phase 4)
  | 'roast'               // Resume Roast (Phase 3 — for historical accounting)
  | 'placement_polish'    // Placement Story polish (Phase 3)
  | 'challenge_evaluator'; // Auto-eval on daily challenge submit (Phase 4)

interface FreeTierRule {
  /** How many uses allowed in the window. */
  limit: number;
  /** Window in ms — e.g. 24*60*60*1000 for daily. */
  windowMs: number;
  /** Human label shown in "limit hit" error messages. */
  windowLabel: string;
}

/**
 * The dial that controls Pro upsell pressure.
 * Tighter = more conversion pressure. Looser = better acquisition feel.
 * Tuned for ~₹500/mo Pro to feel like 5-10× the free value.
 */
const FREE_LIMITS: Record<AiFeature, FreeTierRule | null> = {
  optimizer:       { limit: 1,   windowMs: 86_400_000,           windowLabel: 'today' },
  evaluator:       { limit: 5,   windowMs: 86_400_000,           windowLabel: 'today' },
  mock_interview:  { limit: 1,   windowMs: 30 * 86_400_000,      windowLabel: 'this month' },
  revbot:          { limit: 10,  windowMs: 86_400_000,           windowLabel: 'today' },
  // Phase 3 features manage their own limits (IP-based for anonymous). Recorded
  // here for cost analytics but not gated by THIS service.
  roast:               null,
  placement_polish:    null,
  challenge_evaluator: null,  // System-initiated (not user-triggered), no gating
};

@Injectable()
export class UsageLimitsService {
  private readonly logger = new Logger(UsageLimitsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Throws HttpException 429 if the user has hit their free-tier cap.
   * No-op for Pro users. Call BEFORE the AI call.
   *
   * Returns { remaining, limit } so callers can include those in success
   * responses (the UI shows "2 of 5 evaluations remaining today").
   */
  async enforce(userId: string, feature: AiFeature): Promise<{
    is_pro: boolean;
    used: number;
    limit: number | null;
    remaining: number | null;
  }> {
    const user = await this.prisma.siteUser.findUnique({
      where: { id: userId },
      select: { is_pro: true, pro_expires_at: true },
    });
    if (!user) throw new HttpException('User not found.', HttpStatus.NOT_FOUND);

    // Pro check — also honors pro_expires_at (catches forgotten downgrades)
    const isProValid = user.is_pro && (!user.pro_expires_at || user.pro_expires_at > new Date());
    if (isProValid) {
      return { is_pro: true, used: 0, limit: null, remaining: null };
    }

    const rule = FREE_LIMITS[feature];
    if (!rule) {
      // No free-tier rule (Phase 3 features handle their own caps)
      return { is_pro: false, used: 0, limit: null, remaining: null };
    }

    const since = new Date(Date.now() - rule.windowMs);
    const used = await this.prisma.aiUsage.count({
      where: {
        site_user_id: userId,
        feature,
        created_at: { gte: since },
      },
    });

    if (used >= rule.limit) {
      throw new HttpException(
        `You've used your ${rule.limit} free ${feature.replace('_', ' ')} ${rule.windowLabel === 'today' ? 'use' : 'use'}${rule.limit === 1 ? '' : 's'} ${rule.windowLabel}. Upgrade to Pro for unlimited.`,
        HttpStatus.PAYMENT_REQUIRED,    // 402 = clear "Pro upsell" signal to UI
      );
    }

    return {
      is_pro: false,
      used,
      limit: rule.limit,
      remaining: rule.limit - used,
    };
  }

  /**
   * Record a completed AI call. Called AFTER the AI call succeeds with usage
   * metrics from AiService. Idempotent at the FK level (CASCADE delete on user).
   *
   * Failures here MUST NOT throw — losing one row of analytics is far better
   * than failing the feature call after we already spent the money.
   */
  async record(opts: {
    userId: string | null;
    feature: AiFeature;
    modelId: string;
    inputTokens: number;
    outputTokens: number;
    costUsd: number;
  }): Promise<void> {
    try {
      await this.prisma.aiUsage.create({
        data: {
          site_user_id: opts.userId,
          feature: opts.feature,
          model_id: opts.modelId,
          input_tokens: opts.inputTokens,
          output_tokens: opts.outputTokens,
          cost_usd: opts.costUsd,
        },
      });
    } catch (err) {
      this.logger.warn(`Failed to record AI usage: ${(err as Error).message}`);
    }
  }

  /** Returns each feature's used/limit/remaining for the current window. UI uses this in /account "Usage" panel. */
  async getDashboard(userId: string) {
    const user = await this.prisma.siteUser.findUnique({
      where: { id: userId },
      select: { is_pro: true, pro_expires_at: true },
    });
    if (!user) throw new HttpException('User not found.', HttpStatus.NOT_FOUND);
    const isProValid = user.is_pro && (!user.pro_expires_at || user.pro_expires_at > new Date());

    const features = (Object.keys(FREE_LIMITS) as AiFeature[]).filter(
      (k) => FREE_LIMITS[k] !== null && k !== 'challenge_evaluator',
    );

    const rows = await Promise.all(features.map(async (feature) => {
      const rule = FREE_LIMITS[feature]!;
      const since = new Date(Date.now() - rule.windowMs);
      const used = await this.prisma.aiUsage.count({
        where: { site_user_id: userId, feature, created_at: { gte: since } },
      });
      return {
        feature,
        used,
        limit: isProValid ? null : rule.limit,
        remaining: isProValid ? null : Math.max(0, rule.limit - used),
        window_label: rule.windowLabel,
      };
    }));

    return { is_pro: isProValid, features: rows };
  }
}
