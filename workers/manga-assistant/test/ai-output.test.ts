import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.ts';
import type { Env } from '../src/contract.ts';
import { extractAssistantContent, parseAiOutput } from '../src/validation.ts';

const result = { natural: 'Gracias', literal: 'Gracias', notes: ['Agradecimiento.'] };
const content = JSON.stringify(result);
test('Llama response text is extracted and parsed', () => {
  assert.equal(extractAssistantContent({ response: content, usage: {} }), content);
  assert.deepEqual(parseAiOutput({ response: content }), result);
});
test('Llama JSON Mode structured response is passed directly to validation', () => {
  assert.equal(extractAssistantContent({ response: result }), result);
  assert.equal(parseAiOutput({ response: result }), result);
});
for (const model of ['@cf/zai-org/glm-4.7-flash', '@cf/google/gemma-4-26b-a4b-it']) test(`${model} chat completion content accepted by Worker exactly once`, async () => {
  let calls = 0;
  const output = { model, choices: [{ index: 0, message: { role: 'assistant', content, reasoning_content: 'not returned' }, finish_reason: 'stop' }], usage: { total_tokens: 100 } };
  assert.equal(extractAssistantContent(output), content);
  assert.deepEqual(parseAiOutput(output), result);
  const env: Env = { ALLOWED_ORIGINS: '', ASSIST_RATE_LIMITER: { async limit() { return { success: true }; } }, AI: { async run() { calls++; return output; } } };
  const request = new Request('https://example.test/assist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ schemaVersion: 1, mode: 'translate', request: { selectedText: 'ありがとう', targetLanguage: 'es' } }) });
  const response = await worker.fetch(request, env);
  assert.equal(response.status, 200); assert.deepEqual(await response.json(), result); assert.equal(calls, 1);
});
const invalid: [string, unknown][] = [
  ['empty choices', { choices: [] }],
  ['missing message', { choices: [{}] }],
  ['missing content', { choices: [{ message: { reasoning_content: content } }] }],
  ['empty content', { choices: [{ message: { content: '' } }] }],
  ['whitespace content', { choices: [{ message: { content: ' \n ' } }] }],
  ['unknown recursive shape', { result: { response: content } }],
  ['raw object without envelope', result],
  ['undocumented structured chat content', { choices: [{ message: { content: result } }] }],
  ['content parts array', { choices: [{ message: { content: [{ type: 'text', text: content }] } }] }],
  ['non assistant role', { choices: [{ message: { role: 'user', content } }] }],
  ['ambiguous envelopes', { response: content, choices: [{ message: { content } }] }],
  ['multiple completions', { choices: [{ message: { content } }, { message: { content } }] }],
  ['null response', { response: null }],
  ['array response', { response: [result] }],
  ['JSON invalid', { choices: [{ message: { content: '{invalid' } }] }],
  ['Markdown JSON is not repaired', { choices: [{ message: { content: '```json\n' + content + '\n```' } }] }],
  ['schema mismatch', { choices: [{ message: { content: '{"natural":42}' } }] }],
  ['schema extra field', { choices: [{ message: { content: '{"natural":"Gracias","unexpected":true}' } }] }],
  ['output size exceeded', { choices: [{ message: { content: 'x'.repeat(90_001) } }] }],
];
for (const [name, output] of invalid) test(`${name} becomes invalid_ai_response without retry`, async () => {
  let calls = 0;
  const env: Env = { ALLOWED_ORIGINS: '', ASSIST_RATE_LIMITER: { async limit() { return { success: true }; } }, AI: { async run() { calls++; return output; } } };
  const request = new Request('https://example.test/assist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ schemaVersion: 1, mode: 'translate', request: { selectedText: 'ありがとう', targetLanguage: 'es' } }) });
  const response = await worker.fetch(request, env);
  assert.equal(response.status, 502); assert.deepEqual(await response.json(), { error: 'invalid_ai_response' }); assert.equal(calls, 1);
});
