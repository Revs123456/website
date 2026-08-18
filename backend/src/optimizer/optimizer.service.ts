import { HttpException, HttpStatus, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { UsageLimitsService } from '../ai/usage-limits.service';
import { generateShareToken } from '../viral/viral.util';

/** Shape of the Claude response — we instruct strict adherence. */
export interface OptimizationResult {
  ats_score_before: number;        // 0-100
  ats_score_after: number;         // 0-100
  optimized_summary: string;       // Tailored 2-3 sentence professional summary
  rewrote_bullets: {
    original: string;
    optimized: string;
    keywords_added: string[];
  }[];
  missing_keywords: string[];      // Keywords in JD but not in resume
  added_keywords: string[];        // Keywords woven into the optimized version
  one_liner: string;               // Short pitch sentence for top of resume
}

@Injectable()
export class OptimizerService {
  private readonly logger = new Logger(OptimizerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
    private readonly limits: UsageLimitsService,
  ) {}

  async optimize(opts: { userId: string; resumeText: string; jdText: string }) {
    const { userId, resumeText, jdText } = opts;

    // Pro gate — throws 402 if free-tier limit hit
    await this.limits.enforce(userId, 'optimizer');

    // Trim defensively — Claude has a context limit and we pay per input token
    const resume = resumeText.trim().slice(0, 18000);
    const jd = jdText.trim().slice(0, 8000);

    const { data, usage } = await this.ai.json<OptimizationResult>({
      model: 'fast',
      max_tokens: 2500,
      temperature: 0.4,    // lower = more conservative rewrites (less hallucination)
      system: this.buildPrompt(),
      messages: [{
        role: 'user',
        content: `JOB DESCRIPTION:\n${jd}\n\n---\n\nCANDIDATE'S RESUME:\n${resume}`,
      }],
    });

    // Record usage AFTER the AI call succeeds — never bill for failures
    await this.limits.record({
      userId,
      feature: 'optimizer',
      modelId: usage.model_id,
      inputTokens: usage.input_tokens,
      outputTokens: usage.output_tokens,
      costUsd: usage.cost_usd,
    });

    // Sanity-check the response shape — bail before persisting garbage
    if (
      typeof data.ats_score_before !== 'number' ||
      typeof data.ats_score_after !== 'number' ||
      !Array.isArray(data.rewrote_bullets) ||
      typeof data.optimized_summary !== 'string'
    ) {
      this.logger.warn(`Malformed optimizer response: ${JSON.stringify(data).slice(0, 200)}`);
      throw new HttpException('AI returned an unexpected response — try again.', HttpStatus.BAD_GATEWAY);
    }

    // Clamp scores defensively
    data.ats_score_before = Math.max(0, Math.min(100, Math.round(data.ats_score_before)));
    data.ats_score_after  = Math.max(0, Math.min(100, Math.round(data.ats_score_after)));

    const share_token = generateShareToken('p');
    await this.prisma.resumeOptimization.create({
      data: {
        share_token,
        site_user_id: userId,
        original_text: resume,
        jd_text: jd,
        result: data as any,
        ai_cost_usd: usage.cost_usd,
      },
    });

    return { share_token, result: data };
  }

  async getByToken(share_token: string, viewerId: string | null) {
    const row = await this.prisma.resumeOptimization.findUnique({ where: { share_token } });
    if (!row) throw new NotFoundException('Optimization not found.');

    // Privacy: only the owner sees the original resume text + JD.
    // Public share token holders see the result only.
    const isOwner = viewerId && viewerId === row.site_user_id;
    return {
      share_token: row.share_token,
      result: row.result,
      created_at: row.created_at,
      ...(isOwner ? { original_text: row.original_text, jd_text: row.jd_text } : {}),
    };
  }

  async listMine(userId: string) {
    return this.prisma.resumeOptimization.findMany({
      where: { site_user_id: userId },
      orderBy: { created_at: 'desc' },
      take: 20,
      select: { share_token: true, result: true, created_at: true },
    });
  }

  private buildPrompt(): string {
    return `You are a senior tech recruiter who rewrites resumes to pass ATS systems and impress hiring managers.

YOUR JOB:
1. Score the original resume against the JD (ats_score_before, 0-100). Lower = bigger mismatch.
2. Rewrite the resume's most impactful bullets to better match the JD. NEVER invent experience or skills the candidate doesn't have — only emphasize what's already there using the JD's language.
3. Score the optimized version (ats_score_after). Realistic gain: typically +15 to +30 points.
4. List keywords from the JD missing from the resume — and keywords you successfully added.
5. Write a 2-3 sentence tailored professional summary.
6. Write a one-line pitch for the top of the resume.

RULES:
- Quantify wherever the original mentions impact ("optimized X by Y%"). If quantification isn't in the original, don't fabricate numbers.
- Use the JD's exact phrasing for skills (if JD says "Kubernetes" and resume says "K8s", switch to "Kubernetes").
- Rewrote bullets should be 1 sentence each. Punchy. STAR-compressed.
- Limit to 5-7 rewrote_bullets max — focus on the highest-impact ones.

OUTPUT ONLY VALID JSON, NO MARKDOWN FENCES:
{
  "ats_score_before": <0-100>,
  "ats_score_after": <0-100>,
  "optimized_summary": "string",
  "rewrote_bullets": [
    { "original": "string", "optimized": "string", "keywords_added": ["string"] }
  ],
  "missing_keywords": ["string"],
  "added_keywords": ["string"],
  "one_liner": "string"
}`;
  }
}
