import { BadRequestException, HttpException, HttpStatus, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from '../../ai/ai.service';
import { generateShareToken, hashIp } from '../viral.util';

/**
 * Shape returned by the LLM. We instruct Claude to emit this exact JSON.
 * If parsing fails, AiService.json() throws BAD_GATEWAY → the controller
 * surfaces a friendly retry message.
 */
export interface RoastResult {
  score: number;             // 0–100
  verdict: 'savage' | 'salty' | 'spicy' | 'mid' | 'solid' | 'elite';
  roasts: string[];          // 3 brutally honest critiques (1–2 sentences each)
  fixes: string[];           // 3 specific actionable improvements
  one_liner: string;         // ≤15 word zinger — used as share card title
}

@Injectable()
export class RoastService {
  private readonly logger = new Logger(RoastService.name);

  // Anonymous IP throttle: 3/day. Tighter than authenticated (5/day) because
  // anonymous = unaccountable. Logged-in throttle is enforced by USER id check.
  private readonly ANON_DAILY_LIMIT = 3;
  private readonly USER_DAILY_LIMIT = 5;

  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
  ) {}

  async createRoast(opts: {
    resumeText: string;
    userId: string | null;
    ip: string;
  }): Promise<{ share_token: string; score: number; result: RoastResult }> {
    const { resumeText, userId, ip } = opts;

    // ── Anti-abuse: per-IP and per-user daily limits ─────────────────────────
    const ipHash = hashIp(ip);
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    if (userId) {
      const userCount = await this.prisma.resumeRoast.count({
        where: { site_user_id: userId, created_at: { gte: since } },
      });
      if (userCount >= this.USER_DAILY_LIMIT) {
        throw new HttpException(
          `You've used ${userCount}/${this.USER_DAILY_LIMIT} roasts today. Come back tomorrow.`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    } else {
      const ipCount = await this.prisma.resumeRoast.count({
        where: { ip_hash: ipHash, created_at: { gte: since } },
      });
      if (ipCount >= this.ANON_DAILY_LIMIT) {
        throw new HttpException(
          `Anonymous limit reached (${this.ANON_DAILY_LIMIT}/day). Sign in for more.`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    // ── Pre-flight content sanity check ──────────────────────────────────────
    // Catch obviously non-resume input cheaply before paying for an AI call
    const trimmed = resumeText.trim();
    if (trimmed.length < 50) {
      throw new BadRequestException('Resume too short to roast meaningfully.');
    }
    // Reject if no email-or-phone pattern AND no role-ish word — likely garbage
    const looksLikeResume = /[\w.+-]+@[\w-]+\.[a-z]+|\+?\d{10}|engineer|developer|intern|manager|college|university|skills|experience/i.test(trimmed);
    if (!looksLikeResume) {
      throw new BadRequestException('This doesn\'t look like a resume. Paste your full resume text or upload a PDF.');
    }

    // ── Run the AI call ──────────────────────────────────────────────────────
    const { data, usage } = await this.ai.json<RoastResult>({
      model: 'fast',
      max_tokens: 800,
      temperature: 0.85,    // higher = funnier
      system: this.buildSystemPrompt(),
      messages: [
        { role: 'user', content: `Roast this resume:\n\n${trimmed.slice(0, 18000)}` },
      ],
    });

    // ── Validate the AI's response shape ─────────────────────────────────────
    if (
      typeof data.score !== 'number' ||
      !Array.isArray(data.roasts) || data.roasts.length === 0 ||
      !Array.isArray(data.fixes) || data.fixes.length === 0 ||
      typeof data.one_liner !== 'string'
    ) {
      this.logger.warn(`Malformed roast response: ${JSON.stringify(data).slice(0, 200)}`);
      throw new HttpException('AI returned an unexpected response — try again.', HttpStatus.BAD_GATEWAY);
    }

    // Clamp score defensively (LLM could go out of range)
    const score = Math.max(0, Math.min(100, Math.round(data.score)));

    // ── Persist + return the share token ─────────────────────────────────────
    const share_token = generateShareToken('r');
    await this.prisma.resumeRoast.create({
      data: {
        share_token,
        site_user_id: userId,
        resume_text: trimmed.slice(0, 20000),
        result: data as any,
        score,
        ip_hash: ipHash,
        ai_cost_usd: usage.cost_usd,
      },
    });

    return { share_token, score, result: { ...data, score } };
  }

  async getByToken(share_token: string) {
    const roast = await this.prisma.resumeRoast.findUnique({
      where: { share_token },
      select: {
        share_token: true,
        score: true,
        result: true,
        created_at: true,
        // We deliberately DO NOT return resume_text to public viewers — it's
        // the roastee's data. Only the result + score is meant to be public.
        site_user_id: true,
      },
    });
    if (!roast) throw new NotFoundException('Roast not found.');
    return roast;
  }

  private buildSystemPrompt(): string {
    // Kept inline (not externalized) — small, version-controlled with the
    // service. Move to a /prompts dir if/when prompts get long enough to
    // warrant their own files.
    return `You are a brutally honest senior tech recruiter at a top Indian startup. Your job: roast resumes with sharp, funny, but ultimately CONSTRUCTIVE feedback.

Rules:
- Be witty, not cruel. Punch up at lazy writing, never at the person.
- Roasts should be specific to what's in the resume — generic burns are weak.
- Fixes must be actionable. "Add metrics" is weak; "Quantify your impact: 'reduced API latency by 40%'" is strong.
- The one_liner is the headline. Should be screenshot-worthy and under 15 words.
- Score: 0–40 = needs major rework, 41–70 = decent but generic, 71–90 = solid, 91–100 = elite.
- Verdict mapping by score: 0-30 savage, 31-50 salty, 51-65 spicy, 66-75 mid, 76-90 solid, 91+ elite.

Output ONLY valid JSON with exactly this shape, no markdown fences:
{
  "score": <0-100 integer>,
  "verdict": "savage|salty|spicy|mid|solid|elite",
  "roasts": ["roast 1", "roast 2", "roast 3"],
  "fixes": ["fix 1", "fix 2", "fix 3"],
  "one_liner": "punchy headline under 15 words"
}`;
  }
}
