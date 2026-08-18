/**
 * Cross-provider abstraction for chat completions.
 * Phase 3 ships ClaudeProvider only; Phase 4 can drop in OpenAI/Gemini by
 * implementing this interface — no consumer changes needed.
 */

export type AiModel = 'fast' | 'smart';
//                      ↓        ↓
//                   Haiku    Sonnet (Phase 4)

export interface AiChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AiChatRequest {
  model: AiModel;
  /** Hard token ceiling. We use this to estimate cost and refuse oversized prompts. */
  max_tokens: number;
  messages: AiChatMessage[];
  /** Optional system prompt (preferred over a system-role message — Claude treats this differently). */
  system?: string;
  /** 0..1 — lower = deterministic. Default 0.7. */
  temperature?: number;
}

export interface AiChatResponse {
  text: string;
  /** Token usage — used for cost tracking + budget enforcement. */
  input_tokens: number;
  output_tokens: number;
  /** Cost in USD (provider's published rate × tokens). */
  cost_usd: number;
  /** Resolved model ID (e.g. 'claude-haiku-4-5') for audit logs. */
  model_id: string;
}

/** One chunk in a streaming response — either incremental text or the final usage block. */
export type AiStreamEvent =
  | { type: 'text'; delta: string }
  | { type: 'done'; usage: AiChatResponse };

export interface AiProvider {
  name: string;
  chat(req: AiChatRequest): Promise<AiChatResponse>;
  /** Yields incremental text chunks, then a final 'done' event with usage. */
  stream(req: AiChatRequest): AsyncIterable<AiStreamEvent>;
}
