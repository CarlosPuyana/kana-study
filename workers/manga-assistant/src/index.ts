import { DEFAULT_MODEL } from './contract.ts';
import { modelStrategy } from './model-strategies.ts';
import type { Env, ErrorCode } from './contract.ts';
import { inferenceInput } from './prompts.ts';
import { parseAiOutput, readBody, validRequest, validResult } from './validation.ts';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const headers = new Headers({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Vary': 'Origin', 'X-Content-Type-Options': 'nosniff' });
    const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers });
    const error = (code: ErrorCode, status: number) => json({ error: code }, status);
    const path = new URL(request.url).pathname;
    if (path !== '/assist' && path !== '/health') return error('not_found', 404);
    const origin = request.headers.get('Origin');
    const allowed = (env.ALLOWED_ORIGINS ?? '').split(',').map(value => value.trim()).filter(value => value && value !== '*');
    if (origin !== null && !allowed.includes(origin)) return error('origin_not_allowed', 403);
    if (origin !== null) headers.set('Access-Control-Allow-Origin', origin);
    if (path === '/health') return request.method === 'GET'
      ? json({ ok: true, service: 'kana-study-manga-assistant', schemaVersion: 1 })
      : error('method_not_allowed', 405);
    if (request.method === 'OPTIONS') {
      if (!origin || request.headers.get('Access-Control-Request-Method') !== 'POST'
        || (request.headers.get('Access-Control-Request-Headers') ?? '').split(',').some(value => value.trim() && value.trim().toLowerCase() !== 'content-type')) return error('invalid_request', 400);
      headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
      headers.set('Access-Control-Allow-Headers', 'Content-Type');
      headers.set('Access-Control-Max-Age', '600');
      return new Response(null, { status: 204, headers });
    }
    if (request.method !== 'POST') { headers.set('Allow', 'POST, OPTIONS'); return error('method_not_allowed', 405); }
    if (request.headers.has('Authorization') || request.headers.has('Cookie')
      || request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase() !== 'application/json') return error('invalid_request', 400);
    let body: unknown;
    try { body = await readBody(request); } catch { return error('invalid_request', 400); }
    if (!validRequest(body)) return error('invalid_request', 400);
    try {
      // Ephemeral binding key only; never logged/persisted in application storage.
      const limited = await env.ASSIST_RATE_LIMITER.limit({ key: request.headers.get('CF-Connecting-IP') ?? 'local-development' });
      if (!limited.success) { headers.set('Retry-After', '60'); return error('rate_limited', 429); }
    } catch { return error('ai_unavailable', 503); } // Fail closed if protection is unavailable.
    const model = env.MANGA_AI_MODEL || DEFAULT_MODEL;
    const strategy = modelStrategy(model);
    if (!strategy
      || (env.AI_JSON_MODE !== undefined && !['schema', 'prompt'].includes(env.AI_JSON_MODE))) return error('ai_unavailable', 503);
    // Strategy belongs to the model. Legacy AI_JSON_MODE cannot override capabilities.
    let output: unknown;
    try { output = await env.AI.run(model, inferenceInput(body, strategy)); }
    catch { return error('ai_unavailable', 503); } // No unreliable quota/capacity classification.
    try {
      const result = parseAiOutput(output);
      return validResult(result, body.mode, body.request.selectedText) ? json(result) : error('invalid_ai_response', 502);
    } catch { return error('invalid_ai_response', 502); }
  },
};
