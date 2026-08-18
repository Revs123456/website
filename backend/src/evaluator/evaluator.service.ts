import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { UsageLimitsService, type AiFeature } from '../ai/usage-limits.service';

export interface EvaluationResult {
  overall_score: number;        // 0-100
  structure_score: number;      // STAR framework adherence
  clarity_score: number;        // language quality
  technical_score: number;      // correctness/depth (n/a for behavioral)
  star_compliance: {
    situation: boolean;
    task: boolean;
    action: boolean;
    result: boolean;
  };
  strengths: string[];
  improvements: string[];
  improved_version: string;     // AI's rewrite of the user's answer
}

@Injectable()
export class EvaluatorService {
  private readonly logger = new Logger(EvaluatorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
    private readonly limits: UsageLimitsService,
  ) {}

  /**
   * User-initiated evaluation from the /interview-questions page.
   * Gated by free-tier 5/day cap.
   */
  async evaluateUserAnswer(opts: {
    userId: string;
    questionId: string | null;
    questionText: string;
    answer: string;
  }) {
    await this.limits.enforce(opts.userId, 'evaluator');

    const result = await this.runEvaluation({
      question: opts.questionText,
      answer: opts.answer,
      feature: 'evaluator',
      userId: opts.userId,
    });

    await this.prisma.answerEvaluation.create({
      data: {
        site_user_id: opts.userId,
        question_id: opts.questionId,
        question_text: opts.questionText.slice(0, 1000),
        answer: opts.answer.slice(0, 5000),
        result: result.data as any,
        ai_cost_usd: result.cost,
      },
    });

    return result.data;
  }

  /**
   * System-initiated evaluation triggered by ChallengesService AFTER a daily
   * challenge submission. Not user-gated (no Pro limit) — it's a freebie
   * delivered async.
   *
   * Writes scores back into the existing ChallengeSubmission.ai_score /
   * ai_feedback columns we already added in Phase 2. The user sees the
   * score on their next /account refresh.
   */
  async evaluateChallengeSubmission(opts: {
    submissionId: string;
    userId: string;
    questionText: string;
    answer: string;
  }): Promise<void> {
    try {
      const result = await this.runEvaluation({
        question: opts.questionText,
        answer: opts.answer,
        feature: 'challenge_evaluator',
        userId: opts.userId,
      });
      await this.prisma.challengeSubmission.update({
        where: { id: opts.submissionId },
        data: {
          ai_score: result.data.overall_score,
          ai_feedback: result.data.improved_version
            ? `${result.data.strengths.join(' · ')}\n\nTo improve: ${result.data.improvements.join(' · ')}`
            : null,
        },
      });
    } catch (err) {
      // Failure here is non-fatal — submission still saved, XP still awarded.
      // User just doesn't get the AI grade on this one.
      this.logger.warn(`Auto-eval failed for submission ${opts.submissionId}: ${(err as Error).message}`);
    }
  }

  private async runEvaluation(opts: {
    question: string;
    answer: string;
    feature: AiFeature;
    userId: string;
  }): Promise<{ data: EvaluationResult; cost: number }> {
    const { data, usage } = await this.ai.json<EvaluationResult>({
      model: 'fast',
      max_tokens: 1200,
      temperature: 0.3,    // low — evaluation should be consistent
      system: this.buildPrompt(),
      messages: [{
        role: 'user',
        content: `QUESTION:\n${opts.question}\n\nCANDIDATE'S ANSWER:\n${opts.answer}`,
      }],
    });

    // Record in the AI usage ledger
    await this.limits.record({
      userId: opts.userId,
      feature: opts.feature,
      modelId: usage.model_id,
      inputTokens: usage.input_tokens,
      outputTokens: usage.output_tokens,
      costUsd: usage.cost_usd,
    });

    // Validate shape
    if (
      typeof data.overall_score !== 'number' ||
      !Array.isArray(data.strengths) ||
      !Array.isArray(data.improvements) ||
      typeof data.improved_version !== 'string'
    ) {
      this.logger.warn(`Malformed evaluator response: ${JSON.stringify(data).slice(0, 200)}`);
      throw new HttpException('AI returned an unexpected response — try again.', HttpStatus.BAD_GATEWAY);
    }

    // Clamp scores
    data.overall_score   = Math.max(0, Math.min(100, Math.round(data.overall_score)));
    data.structure_score = Math.max(0, Math.min(100, Math.round(data.structure_score ?? 0)));
    data.clarity_score   = Math.max(0, Math.min(100, Math.round(data.clarity_score ?? 0)));
    data.technical_score = Math.max(0, Math.min(100, Math.round(data.technical_score ?? 0)));

    return { data, cost: usage.cost_usd };
  }

  async myRecentEvaluations(userId: string, limit = 10) {
    return this.prisma.answerEvaluation.findMany({
      where: { site_user_id: userId },
      orderBy: { created_at: 'desc' },
      take: limit,
      select: {
        id: true,
        question_text: true,
        result: true,
        created_at: true,
      },
    });
  }

  private buildPrompt(): string {
    return `You evaluate interview answers like a senior hiring manager. Be specific, fair, actionable.

SCORE BREAKDOWN (0-100 each):
- overall_score: weighted blend of below
- structure_score: STAR framework usage. 100 = textbook STAR. <40 = no structure.
- clarity_score: language, conciseness, no filler. 100 = crisp. <40 = rambling.
- technical_score: factual correctness + depth. For non-technical questions, default to 70 if behavioral content is solid.

STAR COMPLIANCE: mark each component true/false based on whether it's clearly present.

STRENGTHS: 2-3 things the answer does well. Be specific (quote phrases from the answer).
IMPROVEMENTS: 2-3 actionable changes. Not "be more specific" — say WHAT to be specific about.
IMPROVED_VERSION: rewrite the answer in 4-6 sentences, fixing the issues. Stay faithful to the candidate's actual experience — don't fabricate.

OUTPUT ONLY VALID JSON:
{
  "overall_score": <0-100>,
  "structure_score": <0-100>,
  "clarity_score": <0-100>,
  "technical_score": <0-100>,
  "star_compliance": { "situation": <bool>, "task": <bool>, "action": <bool>, "result": <bool> },
  "strengths": ["string", "string"],
  "improvements": ["string", "string"],
  "improved_version": "string"
}`;
  }
}
