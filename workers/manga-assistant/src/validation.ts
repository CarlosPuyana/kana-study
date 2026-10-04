import { MAX_BODY_BYTES, MAX_OUTPUT_BYTES, REQUEST_LIMITS } from './contract.ts';
import type { AssistEnvelope, MangaContextMode, MangaStudyExplanation, MangaTranslationResult } from './contract.ts';

function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}
function keys(value: Record<string, unknown>, allowed: string[]): boolean {
  return Object.keys(value).every(key => allowed.includes(key));
}
// OCR can contain dialogue that sounds like instructions: retain it as DATA.
// Reject markup, links, control characters and non-Japanese-only payloads, not dialogue by keyword.
function plain(value: unknown, max: number): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= max
    && !/[<>\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(value)
    && !/(?:[a-z][a-z0-9+.-]*:\/\/|\bwww\.|\b(?:data|javascript|mailto):)/iu.test(value);
}
function ocr(value: unknown, max: number): value is string {
  return plain(value, max) && /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u.test(value);
}
export function validRequest(value: unknown): value is AssistEnvelope {
  if (!record(value) || !keys(value, ['schemaVersion', 'mode', 'request']) || value.schemaVersion !== 1
    || (value.mode !== 'translate' && value.mode !== 'study') || !record(value.request)) return false;
  const request = value.request;
  if (!keys(request, [...Object.keys(REQUEST_LIMITS), 'targetLanguage'])
    || typeof request.targetLanguage !== 'string' || !['es', 'en', 'ca'].includes(request.targetLanguage)
    || !ocr(request.selectedText, REQUEST_LIMITS.selectedText)) return false;
  for (const [key, max] of Object.entries(REQUEST_LIMITS)) {
    if (key === 'selectedText') continue;
    if (request[key] !== undefined && !plain(request[key], max)) return false;
  }
  return true;
}
export async function readBody(request: Request): Promise<unknown> {
  const length = request.headers.get('Content-Length');
  if (length !== null && (!/^\d+$/u.test(length) || Number(length) > MAX_BODY_BYTES)) throw new Error('body');
  if (!request.body) throw new Error('body');
  const reader = request.body.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let size = 0, raw = '';
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > MAX_BODY_BYTES) { await reader.cancel(); throw new Error('body'); }
      raw += decoder.decode(chunk.value, { stream: true });
    }
    raw += decoder.decode();
    return JSON.parse(raw) as unknown;
  } finally { reader.releaseLock(); }
}
function optionalText(value: unknown): boolean { return value === undefined || outputText(value, 6000); }
// Outputs are rendered as text. Comparison symbols alone are not HTML tags.
function outputText(value: unknown, max: number): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= max
    && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(value)
    && !/<\/?[a-z][a-z0-9:-]*(?:\s+[^<>]*)?\/?>|<!--|<!doctype\b/iu.test(value)
    && !/(?:[a-z][a-z0-9+.-]*:\/\/|\bwww\.|\b(?:data|javascript|mailto):)/iu.test(value);
}
export function validResult(value: unknown, mode: MangaContextMode, selectedText?: string): value is MangaTranslationResult | MangaStudyExplanation {
  if (!record(value) || !outputText(value.natural, 6000)) return false;
  if (mode === 'translate') return keys(value, ['natural', 'literal', 'notes']) && optionalText(value.literal)
    && (value.notes === undefined || (Array.isArray(value.notes) && value.notes.length <= 20 && value.notes.every(item => outputText(item, 6000))));
  return keys(value, ['natural', 'vocabulary', 'grammar', 'notes'])
    && (value.notes === undefined || (Array.isArray(value.notes) && value.notes.length <= 5 && value.notes.every(note => outputText(note, 500))))
    && Array.isArray(value.vocabulary) && value.vocabulary.length <= 40
    && value.vocabulary.every(row => record(row) && keys(row, ['expression', 'reading', 'baseForm', 'meaning'])
      && outputText(row.expression, 6000) && outputText(row.meaning, 6000) && optionalText(row.baseForm)
      && (row.reading === undefined || (outputText(row.reading, 6000) && /^[\p{Script=Hiragana}\p{Script=Katakana}ー・\s]+$/u.test(row.reading))))
    && Array.isArray(value.grammar) && value.grammar.length <= 20
    && value.grammar.every(row => record(row) && keys(row, ['expression', 'explanation']) && outputText(row.expression, 6000) && outputText(row.explanation, 6000))
    && typeof selectedText === 'string'
    && [value.vocabulary, value.grammar].every(rows => {
      const expressions = rows.map(row => row.expression as string);
      return expressions.every(expression => selectedText.includes(expression))
        && new Set(expressions).size === expressions.length;
    });
}
// Known binding envelopes only: Llama response (including structured JSON Mode),
// or GLM/Gemma chat completion choices[0].message.content (text, not reasoning).
export function extractAssistantContent(output: unknown): string | Record<string, unknown> {
  if (!record(output)) throw new Error('output');
  if ('response' in output && !('choices' in output)) {
    if (typeof output.response === 'string' && output.response.trim()) return output.response;
    if (record(output.response)) return output.response;
  } else if (!('response' in output) && Array.isArray(output.choices) && output.choices.length === 1) {
    const choice = output.choices[0];
    if (record(choice) && record(choice.message)
      && (choice.message.role === undefined || choice.message.role === 'assistant')
      && typeof choice.message.content === 'string' && choice.message.content.trim()) return choice.message.content;
  }
  throw new Error('output');
}
export function parseAiOutput(output: unknown): unknown {
  const content = extractAssistantContent(output);
  const serialized = typeof content === 'string' ? content : JSON.stringify(content);
  if (typeof serialized !== 'string' || new TextEncoder().encode(serialized).byteLength > MAX_OUTPUT_BYTES) throw new Error('output');
  // No Markdown stripping, eval, JSON repair or second inference.
  return typeof content === 'string' ? JSON.parse(serialized) as unknown : content;
}
