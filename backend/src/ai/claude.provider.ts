import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import type { AiChatRequest, AiChatResponse, AiProvider, AiStreamEvent } from './ai.types';

// Model IDs map our internal "fast" / "smart" tier names to actual Claude models.
// Bumping a tier here upgrades every downstream caller in one place.
const MODEL_MAP = {
  fast:  'claude-haiku-4-5',     // ~$1 / 1M input, $5 / 1M output  — cheap roasts, story polish
  smart: 'claude-sonnet-4-6',    // ~$3 / 1M input, $15 / 1M output — reserved for Phase 4
} as const;

// Published Anthropic rates (USD per 1M tokens). Update if Anthropic changes pricing.
const RATES = {
  'claude-haiku-4-5':   { input: 1.00, output: 5.00 },
  'claude-sonnet-4-6':  { input: 3.00, output: 15.00 },
} as const;

@Injectable()
export class ClaudeProvider implements AiProvider {
  readonly name = 'anthropic';
  private readonly logger = new Logger(ClaudeProvider.name);
  private client: Anthropic | null = null;

  constructor() {
    const key = process.env.ANTHROPIC_API_KEY;
    if (key) {
      this.client = new Anthropic({ apiKey: key });
    } else {
      this.logger.warn('ANTHROPIC_API_KEY not set — AI features will return 503');
    }
  }

  async chat(req: AiChatRequest): Promise<AiChatResponse> {
    if (!this.client) {
      throw new InternalServerErrorException('AI service is not configured.');
    }

    const modelId = MODEL_MAP[req.model];
    try {
      const res = await this.client.messages.create({
        model: modelId,
        max_tokens: req.max_tokens,
        temperature: req.temperature ?? 0.7,
        ...(req.system ? { system: req.system } : {}),
        messages: req.messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      });

      // Anthropic returns an array of content blocks — flatten the text ones.
      const text = res.content
        .filter((b: any) => b.type === 'text')
        .map((b: any) => b.text)
        .join('');

      const rates = RATES[modelId as keyof typeof RATES];
      const cost = (res.usage.input_tokens * rates.input + res.usage.output_tokens * rates.output) / 1_000_000;

      return {
        text,
        input_tokens: res.usage.input_tokens,
        output_tokens: res.usage.output_tokens,
        cost_usd: Number(cost.toFixed(6)),
        model_id: modelId,
      };
    } catch (err: any) {
      this.logger.error(`Claude API error: ${err?.message ?? err}`);
      // Strip provider internals from the user-facing message — these go to clients
      throw new InternalServerErrorException('AI service is temporarily unavailable.');
    }
  }

  /**
   * Stream chat responses. Yields text deltas as they arrive, then a final
   * 'done' event with full usage metrics (tokens + cost).
   *
   * Used by Mock Interview where Sonnet responses can take 3-5s; streaming
   * shows the response forming in real time.
   */
  async *stream(req: AiChatRequest): AsyncGenerator<AiStreamEvent, void, unknown> {
    if (!this.client) {
      throw new InternalServerErrorException('AI service is not configured.');
    }
    const modelId = MODEL_MAP[req.model];

    try {
      const stream = this.client.messages.stream({
        model: modelId,
        max_tokens: req.max_tokens,
        temperature: req.temperature ?? 0.7,
        ...(req.system ? { system: req.system } : {}),
        messages: req.messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      });

      let fullText = '';
      let inputTokens = 0;
      let outputTokens = 0;

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          const delta = event.delta.text;
          fullText += delta;
          yield { type: 'text', delta };
        } else if (event.type === 'message_start') {
          inputTokens = event.message.usage?.input_tokens ?? 0;
        } else if (event.type === 'message_delta') {
          outputTokens = event.usage?.output_tokens ?? outputTokens;
        }
      }

      const rates = RATES[modelId as keyof typeof RATES];
      const cost = (inputTokens * rates.input + outputTokens * rates.output) / 1_000_000;

      yield {
        type: 'done',
        usage: {
          text: fullText,
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          cost_usd: Number(cost.toFixed(6)),
          model_id: modelId,
        },
      };
    } catch (err: any) {
      this.logger.error(`Claude stream error: ${err?.message ?? err}`);
      throw new InternalServerErrorException('AI service is temporarily unavailable.');
    }
  }
}
