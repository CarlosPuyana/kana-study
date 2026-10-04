import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.ts';
import benchmark from '../scripts/benchmark-local.mjs';
import { DEFAULT_MODEL } from '../src/contract.ts';
import { inferenceInput } from '../src/prompts.ts';

const request = { selectedText: '負けぬ', targetLanguage: 'es' as const, contextText: 'ひまわりには負けぬ' };
const envelope = (mode: 'translate' | 'study') => ({ schemaVersion: 1 as const, mode, request });
const post = (mode: 'translate' | 'study') => new Request('http://localhost/assist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(envelope(mode)) });
const conservative = { natural: 'Interpretación incierta por posible error de OCR.', vocabulary: [], grammar: [] };
for (const [name, instruction] of [
  ['context stays disambiguation evidence', 'never translate them themselves'],
  ['no invented subject/person/tense', 'Do not invent an omitted subject/person'],
  ['no confident OCR reconstruction', 'Never assert what the original image surely said'],
  ['common word versus name uncertainty', 'common word or a proper name/nickname'],
  ['literal preserves pragmatic formulas', 'not absurd morpheme-by-morpheme'],
] as const) test(`translate prompt: ${name}`, () => {
  assert.ok(inferenceInput(envelope('translate')).messages[0].content.includes(instruction));
});
test('V1 default Gemma: plain JSON, thinking off, bounded budgets', () => {
  assert.equal(DEFAULT_MODEL, '@cf/google/gemma-4-26b-a4b-it');
  for (const mode of ['translate', 'study'] as const) {
    const input = inferenceInput(envelope(mode));
    assert.deepEqual(input.chat_template_kwargs, { enable_thinking: false });
    assert.equal(input.response_format, undefined);
    assert.equal(input.max_completion_tokens, mode === 'translate' ? 512 : 1536);
  }
});
for (const [name, result, status] of [
  ['empty arrays', { natural: 'No perder.', vocabulary: [], grammar: [] }, 200],
  ['conservative OCR', conservative, 200],
  ['surface with distinct base', { ...conservative, vocabulary: [{ expression: '負けぬ', reading: 'まけぬ', baseForm: '負ける', meaning: 'no perder' }] }, 200],
  ['external vocabulary', { ...conservative, vocabulary: [{ expression: 'ひまわり', meaning: 'girasol' }] }, 502],
  ['external grammar', { ...conservative, grammar: [{ expression: 'には', explanation: 'Contraste.' }] }, 502],
  ['synthetic pattern expression', { ...conservative, grammar: [{ expression: '～ぬ', explanation: 'Negativo.' }] }, 502],
  ['duplicate vocabulary', { ...conservative, vocabulary: [{ expression: '負けぬ', meaning: 'no perder' }, { expression: '負けぬ', meaning: 'no ser derrotado' }] }, 502],
  ['duplicate grammar', { ...conservative, grammar: [{ expression: 'ぬ', explanation: 'Negativo.' }, { expression: 'ぬ', explanation: 'Literario.' }] }, 502],
] as const) test(`study ${name}: expected contract status, one inference and no raw leak`, async () => {
  let calls = 0;
  const env = { ALLOWED_ORIGINS: '', AI: { async run() { calls++; return { choices: [{ message: { content: JSON.stringify(result) } }] }; } }, ASSIST_RATE_LIMITER: { async limit() { return { success: true }; } } };
  const response = await worker.fetch(post('study'), env);
  assert.equal(response.status, status); assert.equal(calls, 1);
  assert.deepEqual(await response.json(), status === 200 ? result : { error: 'invalid_ai_response' });
});
test('study prompt permits empty arrays and requires literal surface segments', () => {
  const prompt = inferenceInput(envelope('study')).messages[0].content;
  assert.ok(prompt.includes('Empty vocabulary and grammar arrays are VALID'));
  assert.ok(prompt.includes('exact literal substring of selectedText'));
});
test('local diagnostics log only assistant content on rejection; HTTP remains bare error', async () => {
  const logs: unknown[][] = []; const original = console.log;
  console.log = (...args: unknown[]) => { logs.push(args); };
  try {
    const env = { MANGA_AI_MODEL: DEFAULT_MODEL, LOCAL_MODEL_BENCHMARK: '1', LOCAL_BENCHMARK_MODE: 'mixed', LOCAL_BENCHMARK_RAW: '1', ALLOWED_ORIGINS: '', AI: { async run() { return { choices: [{ message: { content: '```json\n{}\n```', reasoning_content: 'private reasoning' } }], secret: 'private envelope', headers: { token: 'private header' } }; } }, ASSIST_RATE_LIMITER: { async limit() { return { success: true }; } } };
    const response = await benchmark.fetch(post('study'), env);
    assert.equal(response.status, 502); assert.deepEqual(await response.json(), { error: 'invalid_ai_response' });
    assert.deepEqual(logs, [['LOCAL_INVALID_ASSISTANT_CONTENT', JSON.stringify('```json\n{}\n```')]]);
  } finally { console.log = original; }
});
