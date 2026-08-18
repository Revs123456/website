import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { UsageLimitsService } from '../ai/usage-limits.service';
import { LEVEL_NAMES } from '../engagement/engagement.constants';

/**
 * RevBot — a platform-aware career coach. NOT a generic ChatGPT clone.
 *
 * The system prompt is fed:
 *   - A summary of what the platform offers (so it can route users to the
 *     right tool, not invent fake features)
 *   - The user's profile snapshot (level, streak, target_role) so its
 *     advice is contextualized to where they are in their journey
 *
 * Phase 4 v1 doesn't do true RAG over jobs/blogs — that's Phase 7 with pgvector.
 * For now, the platform knowledge is hardcoded; refresh it when major features ship.
 */
@Injectable()
export class RevBotService {
  private readonly logger = new Logger(RevBotService.name);

  // Cap how much chat history we send to Claude — protects budget on long sessions.
  // Last 12 turns is enough context for coherent multi-turn coaching.
  private readonly MAX_HISTORY = 12;

  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
    private readonly limits: UsageLimitsService,
  ) {}

  async *streamReply(opts: {
    userId: string;
    history: { role: 'user' | 'assistant'; content: string }[];
  }): AsyncGenerator<{ type: 'text' | 'done'; delta?: string; cost?: number }, void, unknown> {
    if (!opts.history.length || opts.history[opts.history.length - 1].role !== 'user') {
      throw new BadRequestException('Last message must be from the user.');
    }

    // Enforce per-day cap based on user-initiated messages count
    await this.limits.enforce(opts.userId, 'revbot');

    // Build user context snapshot
    const user = await this.prisma.siteUser.findUnique({
      where: { id: opts.userId },
      select: {
        name: true, target_role: true, current_role: true, experience: true,
        level: true, xp: true, is_pro: true,
        streak: { select: { current_streak: true } },
      },
    });
    const profileContext = user ? this.buildProfileContext(user) : '';

    // Trim history to the last N turns to bound prompt cost
    const trimmed = opts.history.slice(-this.MAX_HISTORY);

    let usageInfo: { input: number; output: number; cost: number; model: string } | null = null;

    for await (const event of this.ai.stream({
      model: 'fast',     // Haiku is plenty for chat. Sonnet would 5x cost for marginal quality.
      max_tokens: 800,
      temperature: 0.7,
      system: this.systemPrompt(profileContext),
      messages: trimmed,
    })) {
      if (event.type === 'text') {
        yield { type: 'text', delta: event.delta };
      } else if (event.type === 'done') {
        usageInfo = {
          input: event.usage.input_tokens,
          output: event.usage.output_tokens,
          cost: event.usage.cost_usd,
          model: event.usage.model_id,
        };
      }
    }

    if (usageInfo) {
      await this.limits.record({
        userId: opts.userId,
        feature: 'revbot',
        modelId: usageInfo.model,
        inputTokens: usageInfo.input,
        outputTokens: usageInfo.output,
        costUsd: usageInfo.cost,
      });
    }

    yield { type: 'done', cost: usageInfo?.cost ?? 0 };
  }

  private buildProfileContext(user: any): string {
    const levelName = LEVEL_NAMES[Math.max(0, Math.min(user.level - 1, LEVEL_NAMES.length - 1))];
    const lines: string[] = [];
    lines.push(`User name: ${user.name || 'not set'}`);
    if (user.current_role) lines.push(`Current role: ${user.current_role}`);
    if (user.target_role)  lines.push(`Target role: ${user.target_role}`);
    if (user.experience)   lines.push(`Experience: ${user.experience}`);
    lines.push(`Level: ${levelName} (Lv ${user.level}, ${user.xp} XP)`);
    if (user.streak?.current_streak) lines.push(`Daily challenge streak: ${user.streak.current_streak} days`);
    lines.push(`Pro: ${user.is_pro ? 'yes' : 'no — free tier'}`);
    return lines.join('\n');
  }

  private systemPrompt(profile: string): string {
    return `You are RevBot, the career coach for TechChampsByRev — an AI-powered career platform for software developers in India.

WHAT YOU CAN DO:
- Answer career questions specific to tech (interview prep, salary negotiation, resume help, learning paths, role transitions)
- Point users to the right TechChampsByRev tool when relevant (see PLATFORM FEATURES below)
- Give Indian-context advice (₹ salaries, Indian companies like Razorpay/Zomato/Cred, IST timezone, etc.)
- Be encouraging without being saccharine. Acknowledge real career anxiety.

PLATFORM FEATURES YOU CAN REFER USERS TO:
- /tools/resume-roast — Free AI roast of any resume
- /tools/resume-optimizer — AI tailors a resume to a specific JD (Pro: unlimited, Free: 1/day)
- /tools/career-quiz — 10-question quiz that picks a developer archetype
- /tools/mock-interview — AI mock interview with scored feedback (Pro: unlimited, Free: 1/month)
- /tools/placement-story — Submit your placement story, AI polishes it, gets featured on the site
- /interview-questions — Question bank by company + role with AI evaluation
- /challenges — Daily challenge for XP + streak
- /jobs — Curated job board (with personalized match scores when logged in)
- /roadmaps — Learning roadmaps for Frontend, Backend, DevOps, AI/ML, etc.
- /ats-checker — Free ATS resume score
- /salary-insights — Salary data by role and city

NEVER:
- Invent features that don't exist
- Promise things outside your control (e.g., "I can get you an interview at Google")
- Pretend to know real-time job market data — be honest about cutoffs
- Give legal/medical/visa advice
- Output more than 3 short paragraphs per reply unless explicitly asked

USER PROFILE (use this to tailor advice):
${profile || '(no profile data — user just signed up)'}

TONE:
- Direct, warm, specific. No corporate-speak.
- When recommending a tool, say "try /tools/resume-roast" — frontend renders those as clickable links.
- If a question is outside scope (e.g. "How do I cook biryani?"), gently redirect to career topics.`;
  }
}
