// Type-only reuse: the frontend remains the source of truth; no Angular runtime import.
import type { MangaContextMode, MangaTranslationRequest, MangaTranslationResult, MangaStudyExplanation } from '../../../src/app/core/models/manga-context.model.ts';

export type { MangaContextMode, MangaTranslationResult, MangaStudyExplanation };
export interface AssistEnvelope {
  schemaVersion: 1;
  mode: MangaContextMode;
  request: Omit<MangaTranslationRequest, 'pageTexts'>;
}
export const DEFAULT_MODEL = '@cf/google/gemma-4-26b-a4b-it';
export const REQUEST_LIMITS = { selectedText: 1200, contextText: 1200, selectedExpression: 100, previousText: 300, nextText: 300 } as const;
// Covers maximum UTF-8 text plus escaped JSON; streaming limit applies even without Content-Length.
export const MAX_BODY_BYTES = 24_000;
export const MAX_OUTPUT_BYTES = 90_000;
export type ErrorCode = 'invalid_request' | 'rate_limited' | 'ai_unavailable' | 'invalid_ai_response' | 'method_not_allowed' | 'origin_not_allowed' | 'not_found';
export interface AiInput {
  messages: { role: 'system' | 'user'; content: string }[];
  max_tokens?: number;
  max_completion_tokens?: number;
  temperature: number;
  stream: false;
  response_format?: { type: 'json_schema'; json_schema: object };
  chat_template_kwargs?: { enable_thinking: false };
}
// Minimal structural binding contracts; no Cloudflare SDK/runtime dependency required.
export interface Env {
  AI: { run(model: string, input: AiInput): Promise<unknown> };
  ASSIST_RATE_LIMITER: { limit(input: { key: string }): Promise<{ success: boolean }> };
  MANGA_AI_MODEL?: string;
  AI_JSON_MODE?: string;
  ALLOWED_ORIGINS: string;
}
