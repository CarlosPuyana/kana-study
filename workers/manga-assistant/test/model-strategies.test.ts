import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.ts';
import benchmark from '../scripts/benchmark-local.mjs';
import { DEFAULT_MODEL } from '../src/contract.ts';
import type { Env, AiInput } from '../src/contract.ts';
import { GEMMA_MODEL, LLAMA_MODEL, modelStrategy } from '../src/model-strategies.ts';
import { inferenceInput } from '../src/prompts.ts';

const body = { schemaVersion: 1 as const, mode: 'translate' as const, request: { selectedText: 'ありがとう', targetLanguage: 'es' as const } };
const request = () => new Request('http://localhost/assist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
test('Llama keeps schema mode, unchanged budget, and no thinking option', () => {
  const input = inferenceInput(body, modelStrategy(LLAMA_MODEL));
  assert.equal(input.response_format?.type, 'json_schema'); assert.equal(input.max_tokens, 512);
  assert.equal(input.max_completion_tokens, undefined); assert.equal(input.chat_template_kwargs, undefined);
  assert.equal(input.messages[0].content.endsWith('No text before or after JSON.'), false);
});
test('Gemma uses plain JSON, disables thinking and keeps exactly the same linguistic prompt', () => {
  const llama = inferenceInput(body, modelStrategy(LLAMA_MODEL));
  const gemma = inferenceInput(body, modelStrategy(GEMMA_MODEL));
  assert.equal(gemma.response_format, undefined); assert.deepEqual(gemma.chat_template_kwargs, { enable_thinking: false });
  assert.equal(gemma.max_completion_tokens, 512);
  const suffix = '\nReturn only one valid JSON object matching this structure. No Markdown. No code fences. No text before or after JSON.';
  assert.equal(gemma.messages[0].content, llama.messages[0].content + suffix);
  assert.deepEqual(gemma.messages[1], llama.messages[1]);
});
for (const [label, content, status] of [['valid', '{"natural":"Gracias"}', 200], ['invalid', '```json\n{}\n```', 502]] as const) test(`Gemma ${label} JSON through production Worker: one inference and strict validation`, async () => {
  const calls: AiInput[] = [];
  const env: Env = { MANGA_AI_MODEL: GEMMA_MODEL, ALLOWED_ORIGINS: '', AI: { async run(model, input) { assert.equal(model, GEMMA_MODEL); calls.push(input); return { choices: [{ message: { role: 'assistant', content } }] }; } }, ASSIST_RATE_LIMITER: { async limit() { return { success: true }; } } };
  const response = await worker.fetch(request(), env);
  assert.equal(response.status, status); assert.equal(calls.length, 1);
  assert.equal(calls[0].response_format, undefined); assert.deepEqual(calls[0].chat_template_kwargs, { enable_thinking: false });
  if (status === 502) assert.deepEqual(await response.json(), { error: 'invalid_ai_response' });
});
test('legacy prompt flag cannot silently degrade Llama schema strategy', async () => {
  const env: Env = { MANGA_AI_MODEL: LLAMA_MODEL, AI_JSON_MODE: 'prompt', ALLOWED_ORIGINS: '', AI: { async run(_model, input) { assert.equal(input.response_format?.type, 'json_schema'); return { response: { natural: 'Gracias' } }; } }, ASSIST_RATE_LIMITER: { async limit() { return { success: true }; } } };
  assert.equal((await worker.fetch(request(), env)).status, 200);
});
test('GLM remains experimental and cannot run through local benchmark V1', async () => {
  let calls = 0;
  const env = { MANGA_AI_MODEL: '@cf/zai-org/glm-4.7-flash', LOCAL_MODEL_BENCHMARK: '1', AI: { async run() { calls++; } } };
  assert.equal(modelStrategy(env.MANGA_AI_MODEL)?.v1Benchmark, false);
  assert.equal((await benchmark.fetch(request(), env)).status, 403); assert.equal(calls, 0);
});
test('benchmark usage is captured from official metrics without changing bare response', async () => {
  const env = { MANGA_AI_MODEL: GEMMA_MODEL, LOCAL_MODEL_BENCHMARK: '1', ALLOWED_ORIGINS: '', AI: { async run() { return { choices: [{ message: { content: '{"natural":"Gracias"}' } }], usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15, neurons: 1.25, unexpected: 'private' } }; } }, ASSIST_RATE_LIMITER: { async limit() { return { success: true }; } } };
  const response = await benchmark.fetch(request(), env);
  assert.deepEqual(await response.json(), { natural: 'Gracias' });
  assert.deepEqual(JSON.parse(response.headers.get('X-Manga-Benchmark-Usage')!), { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15, neurons: 1.25 });
});
test('local study benchmark requires explicit mode and keeps production study schema', async () => {
  let calls = 0;
  const env = { MANGA_AI_MODEL: LLAMA_MODEL, LOCAL_MODEL_BENCHMARK: '1', LOCAL_BENCHMARK_MODE: 'study', ALLOWED_ORIGINS: '', AI: { async run(_model: string, input: AiInput) { calls++; assert.equal(input.max_tokens, 1536); assert.deepEqual((input.response_format?.json_schema as { required: string[] }).required, ['natural', 'vocabulary', 'grammar']); return { response: { natural: 'Gracias', vocabulary: [], grammar: [] } }; } }, ASSIST_RATE_LIMITER: { async limit() { return { success: true }; } } };
  assert.equal((await benchmark.fetch(request(), env)).status, 400); assert.equal(calls, 0);
  const study = new Request('http://localhost/assist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, mode: 'study' }) });
  assert.equal((await benchmark.fetch(study, env)).status, 200); assert.equal(calls, 1);
});
