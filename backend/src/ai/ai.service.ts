import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ClaudeProvider } from './claude.provider';
import type { AiChatRequest, AiChatResponse, AiStreamEvent } from './ai.types';

/**
 * Single entry point for every AI call in the codebase.
 * Centralizes:
 *   - provider selection (currently Claude only)
 *   - daily USD budget enforcement (process-local — restart clears)
 *   - structured JSON parsing helper
 *   - usage logging for analytics
 *
 * Phase 4 services should call `AiService.chat()` / `AiService.json()` —
 * never instantiate or import a provider directly.
 */
@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly dailyBudgetUsd: number;
  // In-memory budget tracker. Resets at IST midnight via the cron in this service.
  // Process-local is fine for a single-instance backend; replace with Redis
  // counter if/when we scale horizontally.
  private spentTodayUsd = 0;
  private budgetDate: string = istTodayDate();

  constructor(private readonly claude: ClaudeProvider) {
    const raw = process.env.AI_DAILY_BUDGET_USD;
    this.dailyBudgetUsd = raw ? Number(raw) : 5; // ~$5/day default = ~5000 roasts/day at Haiku rates
    this.logger.log(`AI daily budget: $${this.dailyBudgetUsd}`);
  }

  /** Raw chat — caller handles the response.text however it wants. */
  async chat(req: AiChatRequest): Promise<AiChatResponse> {
    this.checkAndRolloverBudget();
    if (this.spentTodayUsd >= this.dailyBudgetUsd) {
      this.logger.warn(`AI daily budget exhausted: $${this.spentTodayUsd.toFixed(2)} / $${this.dailyBudgetUsd}`);
      throw new HttpException(
        'AI service is busy — please try again tomorrow.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    const res = await this.claude.chat(req);
    this.spentTodayUsd += res.cost_usd;
    this.logger.log(`[AI] ${req.model} | in=${res.input_tokens} out=${res.output_tokens} | $${res.cost_usd.toFixed(4)} | day total $${this.spentTodayUsd.toFixed(2)}`);
    return res;
  }

  /**
   * Stream chat responses. Yields text deltas in real-time, then a final
   * 'done' event with usage metrics. Caller is responsible for budget
   * accounting AFTER the stream completes (via the done event's `usage.cost_usd`).
   *
   * We check the budget BEFORE starting the stream (rough estimate: pessimistic
   * cost = max_tokens × output rate). Mid-stream cancellation isn't possible
   * with Anthropic's API, so we'd rather refuse than overshoot.
   */
  async *stream(req: AiChatRequest): AsyncGenerator<AiStreamEvent, void, unknown> {
    this.checkAndRolloverBudget();
    if (this.spentTodayUsd >= this.dailyBudgetUsd) {
      throw new HttpException('AI service is busy — try again tomorrow.', HttpStatus.SERVICE_UNAVAILABLE);
    }

    for await (const event of this.claude.stream(req)) {
      if (event.type === 'done') {
        this.spentTodayUsd += event.usage.cost_usd;
        this.logger.log(`[AI stream] ${req.model} | in=${event.usage.input_tokens} out=${event.usage.output_tokens} | $${event.usage.cost_usd.toFixed(4)} | day total $${this.spentTodayUsd.toFixed(2)}`);
      }
      yield event;
    }
  }

  /**
   * Structured JSON helper — wraps `chat` and parses the response as JSON.
   * Pass the model's expected shape via the type parameter; we throw if
   * parsing fails (most likely cause: prompt didn't constrain output well).
   */
  async json<T = unknown>(req: AiChatRequest): Promise<{ data: T; usage: AiChatResponse }> {
    const usage = await this.chat(req);
    const text = stripJsonFence(usage.text);
    try {
      const data = JSON.parse(text) as T;
      return { data, usage };
    } catch (e) {
      this.logger.warn(`AI returned non-JSON: ${usage.text.slice(0, 200)}`);
      throw new HttpException('AI service returned an unexpected response — try again.', HttpStatus.BAD_GATEWAY);
    }
  }

  /** Reset the in-memory counter when IST date rolls over. */
  private checkAndRolloverBudget() {
    const today = istTodayDate();
    if (today !== this.budgetDate) {
      this.logger.log(`AI budget rolled over: $${this.spentTodayUsd.toFixed(2)} spent on ${this.budgetDate}`);
      this.spentTodayUsd = 0;
      this.budgetDate = today;
    }
  }
}

/** Strips ```json ... ``` markdown fences that LLMs sometimes wrap JSON in. */
function stripJsonFence(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith('```')) {
    return trimmed
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
  }
  return trimmed;
}

/** Duplicate of engagement.constants helper — avoids cross-module import for one fn. */
function istTodayDate(): string {
  const d = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}
