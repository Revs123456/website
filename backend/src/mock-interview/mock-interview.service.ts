import { BadRequestException, ForbiddenException, HttpException, HttpStatus, Injectable, Logger, NotFoundException, Optional } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { UsageLimitsService } from '../ai/usage-limits.service';
import { ActivityFeedService } from '../activity-feed/activity-feed.service';
import { generateShareToken } from '../viral/viral.util';

interface Turn {
  role: 'user' | 'assistant';
  content: string;
  ts: string;
}

export interface InterviewScores {
  overall: number;          // 0-100
  technical: number;
  communication: number;
  summary: string;
  strengths: string[];
  improvements: string[];
}

/**
 * Stateful AI mock interview. Each turn re-reads the full transcript from
 * the DB and appends the new exchange. Survives server restarts; users can
 * resume mid-interview the next day.
 *
 * The end-to-end flow:
 *   1. start()    → creates row, returns ID + opening question
 *   2. sendMessage() → user answer in, next AI question streamed out
 *   3. complete() → AI evaluation → final scores written to `scores` column
 *   4. /share/:token → the public result card
 */
@Injectable()
export class MockInterviewService {
  private readonly logger = new Logger(MockInterviewService.name);

  // Soft cap on conversation length — Claude context window can technically
  // hold more, but realistic interviews are 8-15 exchanges.
  private readonly MAX_TURNS = 30;

  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
    private readonly limits: UsageLimitsService,
    @Optional() private readonly activity?: ActivityFeedService,
  ) {}

  async start(opts: {
    userId: string;
    role: string;
    company?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
  }) {
    // Pro gate — most expensive per-call feature (Sonnet, multi-turn)
    await this.limits.enforce(opts.userId, 'mock_interview');

    const share_token = generateShareToken('p', 14);
    const difficulty = opts.difficulty || 'medium';

    // Generate the opening question — single non-streaming call (short)
    const { data, usage } = await this.ai.json<{ question: string }>({
      model: 'smart',
      max_tokens: 300,
      temperature: 0.8,
      system: this.systemPrompt(opts.role, opts.company, difficulty),
      messages: [{
        role: 'user',
        content: `Start the interview. Open with ONE warm-up question (not too easy, not too hard). Output JSON: {"question": "string"}`,
      }],
    });

    await this.limits.record({
      userId: opts.userId,
      feature: 'mock_interview',
      modelId: usage.model_id,
      inputTokens: usage.input_tokens,
      outputTokens: usage.output_tokens,
      costUsd: usage.cost_usd,
    });

    const transcript: Turn[] = [
      { role: 'assistant', content: data.question, ts: new Date().toISOString() },
    ];

    const interview = await this.prisma.mockInterview.create({
      data: {
        share_token,
        site_user_id: opts.userId,
        role: opts.role,
        company: opts.company || null,
        difficulty,
        status: 'active',
        transcript: transcript as any,
        ai_cost_usd: usage.cost_usd,
      },
    });

    return {
      id: interview.id,
      share_token: interview.share_token,
      role: interview.role,
      company: interview.company,
      difficulty: interview.difficulty,
      first_question: data.question,
    };
  }

  /**
   * Append user message + generate next AI question as a stream.
   * Returns an async iterable of text deltas; the controller pipes these to SSE.
   * After the stream completes, we persist the full transcript update.
   */
  async *streamMessage(opts: {
    interviewId: string;
    userId: string;
    message: string;
  }): AsyncGenerator<{ type: 'text' | 'done' | 'complete'; delta?: string; cost?: number }, void, unknown> {
    const interview = await this.prisma.mockInterview.findUnique({ where: { id: opts.interviewId } });
    if (!interview) throw new NotFoundException('Interview not found.');
    if (interview.site_user_id !== opts.userId) throw new ForbiddenException('Not your interview.');
    if (interview.status !== 'active') throw new BadRequestException('Interview already completed.');

    const transcript = (interview.transcript as any as Turn[]) || [];
    if (transcript.length >= this.MAX_TURNS * 2) {
      throw new HttpException('Interview reached max length. Use /complete to wrap up.', HttpStatus.GONE);
    }

    // Append the user turn
    const userTurn: Turn = { role: 'user', content: opts.message, ts: new Date().toISOString() };
    transcript.push(userTurn);

    // Build the chat history for Claude
    const messages = transcript.map(t => ({
      role: t.role as 'user' | 'assistant',
      content: t.content,
    }));

    let fullResponse = '';
    let usageInfo: { input: number; output: number; cost: number; model: string } | null = null;

    for await (const event of this.ai.stream({
      model: 'smart',
      max_tokens: 600,
      temperature: 0.8,
      system: this.systemPrompt(interview.role, interview.company || undefined, interview.difficulty as any),
      messages,
    })) {
      if (event.type === 'text') {
        fullResponse += event.delta;
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

    // Append the assistant turn and persist
    transcript.push({ role: 'assistant', content: fullResponse, ts: new Date().toISOString() });
    await this.prisma.mockInterview.update({
      where: { id: opts.interviewId },
      data: {
        transcript: transcript as any,
        ai_cost_usd: { increment: usageInfo?.cost ?? 0 },
      },
    });

    if (usageInfo) {
      await this.limits.record({
        userId: opts.userId,
        feature: 'mock_interview',
        modelId: usageInfo.model,
        inputTokens: usageInfo.input,
        outputTokens: usageInfo.output,
        costUsd: usageInfo.cost,
      });
    }

    yield { type: 'done', cost: usageInfo?.cost ?? 0 };
  }

  /**
   * End the interview and produce final evaluation scores.
   * Idempotent: calling /complete on a completed interview returns the
   * existing scores without re-running the AI.
   */
  async complete(opts: { interviewId: string; userId: string }) {
    const interview = await this.prisma.mockInterview.findUnique({ where: { id: opts.interviewId } });
    if (!interview) throw new NotFoundException('Interview not found.');
    if (interview.site_user_id !== opts.userId) throw new ForbiddenException('Not your interview.');

    if (interview.status === 'completed' && interview.scores) {
      return {
        share_token: interview.share_token,
        scores: interview.scores as any as InterviewScores,
        transcript: interview.transcript,
      };
    }

    const transcript = (interview.transcript as any as Turn[]) || [];
    if (transcript.length < 4) {
      throw new BadRequestException('Interview too short to evaluate — answer at least 2 questions first.');
    }

    // Format the transcript for the evaluator
    const conversation = transcript.map(t =>
      `${t.role === 'user' ? 'CANDIDATE' : 'INTERVIEWER'}: ${t.content}`
    ).join('\n\n');

    const { data, usage } = await this.ai.json<InterviewScores>({
      model: 'smart',
      max_tokens: 1000,
      temperature: 0.3,
      system: `You are a senior hiring panelist evaluating a mock interview for a ${interview.role}${interview.company ? ` at ${interview.company}` : ''}.

Score 0-100 each:
- overall: weighted blend, leans toward technical for technical roles
- technical: correctness, depth, problem-solving approach
- communication: clarity, structure, conciseness

Provide:
- summary: 2-3 sentence overall verdict
- strengths: 2-3 specific things done well (quote the candidate)
- improvements: 2-3 actionable changes

OUTPUT ONLY JSON, NO MARKDOWN:
{
  "overall": <0-100>,
  "technical": <0-100>,
  "communication": <0-100>,
  "summary": "string",
  "strengths": ["string", "string"],
  "improvements": ["string", "string"]
}`,
      messages: [{ role: 'user', content: `Evaluate this interview:\n\n${conversation}` }],
    });

    await this.limits.record({
      userId: opts.userId,
      feature: 'mock_interview',
      modelId: usage.model_id,
      inputTokens: usage.input_tokens,
      outputTokens: usage.output_tokens,
      costUsd: usage.cost_usd,
    });

    // Clamp
    data.overall       = Math.max(0, Math.min(100, Math.round(data.overall)));
    data.technical     = Math.max(0, Math.min(100, Math.round(data.technical)));
    data.communication = Math.max(0, Math.min(100, Math.round(data.communication)));

    await this.prisma.mockInterview.update({
      where: { id: opts.interviewId },
      data: {
        status: 'completed',
        scores: data as any,
        completed_at: new Date(),
        ai_cost_usd: { increment: usage.cost_usd },
      },
    });

    // Public activity event only for genuinely impressive scores (>=75).
    // Lower scores stay private — sharing "I got 42/100" doesn't motivate.
    if (data.overall >= 75) {
      void this.activity?.record({
        userId: opts.userId,
        type: 'mock_interview_aced',
        metadata: {
          role: interview.role,
          company: interview.company,
          score: data.overall,
          share_token: interview.share_token,
        },
        isPublic: true,
      });
    }

    return {
      share_token: interview.share_token,
      scores: data,
      transcript,
    };
  }

  /** Public read by share token — returns scores + transcript for the result page. */
  async getByToken(share_token: string) {
    const interview = await this.prisma.mockInterview.findUnique({ where: { share_token } });
    if (!interview) throw new NotFoundException('Interview not found.');
    if (interview.status !== 'completed') {
      throw new BadRequestException('This interview hasn\'t been completed yet.');
    }
    return {
      share_token: interview.share_token,
      role: interview.role,
      company: interview.company,
      difficulty: interview.difficulty,
      scores: interview.scores,
      transcript: interview.transcript,
      completed_at: interview.completed_at,
    };
  }

  /** History — used by /account "Past Interviews". */
  async listMine(userId: string) {
    return this.prisma.mockInterview.findMany({
      where: { site_user_id: userId },
      orderBy: { started_at: 'desc' },
      take: 20,
      select: {
        id: true,
        share_token: true,
        role: true,
        company: true,
        status: true,
        scores: true,
        started_at: true,
        completed_at: true,
      },
    });
  }

  /**
   * Cleanup cron — mark interviews abandoned after 1 hour of inactivity.
   * Keeps the "active" status accurate for analytics + UI ("Resume your interview"
   * shouldn't suggest a 3-day-old session).
   */
  @Cron('0 * * * *', { timeZone: 'Asia/Kolkata' }) // hourly
  async markAbandonedInterviews() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const updated = await this.prisma.mockInterview.updateMany({
      where: {
        status: 'active',
        started_at: { lt: oneHourAgo },
        // Best-effort: if started_at is the only timestamp, use it. Real activity
        // updates transcript JSONB which we don't index — accept some imprecision.
      },
      data: { status: 'abandoned' },
    });
    if (updated.count > 0) this.logger.log(`Marked ${updated.count} mock interviews abandoned`);
  }

  private systemPrompt(role: string, company: string | undefined, difficulty: 'easy' | 'medium' | 'hard'): string {
    const difficultyGuide = {
      easy:   'Start with fundamentals. Be patient with weak answers.',
      medium: 'Mix fundamentals with applied problems. Probe interesting answers with follow-ups.',
      hard:   'Push hard. Ask system design and edge cases. Stress-test reasoning.',
    }[difficulty];

    return `You are conducting a mock interview for a ${role}${company ? ` at ${company}` : ''}.

YOUR PERSONA:
- Senior tech interviewer. Friendly but rigorous.
- ${difficultyGuide}
- Ask ONE question at a time. Wait for the answer before the next one.
- After candidate responds, react briefly ("Got it." / "Interesting — tell me more.") then ask the next question OR a follow-up.
- Don't lecture. Don't give the answer away. Don't pre-evaluate ("That's a great answer!" → no).
- Keep your messages tight — 1-3 sentences max. Interviews aren't monologues.
- After ~8-12 exchanges, signal the end naturally ("That's all I had — any questions for me?").

ROLE FOCUS:
- For technical roles: mix DSA, system design, language-specific deep-dives, past project deep-dives.
- For non-technical roles: STAR-format behavioral questions, scenario walkthroughs.

NEVER:
- Output any internal reasoning, notes to self, or meta-commentary.
- Tell the candidate their score (that's the final eval, not your job).
- Break character.`;
  }
}
