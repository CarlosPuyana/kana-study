import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validResult } from '../src/validation.ts';
import { inferenceInput } from '../src/prompts.ts';
const study = { natural: 'Interpretación incierta.', vocabulary: [], grammar: [] };
for (const [name, notes, valid] of [
  ['omitted', undefined, true], ['OCR warning', ['Posible error de OCR.'], true],
  ['long note', ['a'.repeat(501)], false], ['too many', Array(6).fill('Aviso'), false],
  ['script', ['<script>alert(1)</script>'], false], ['div', ['<div>texto</div>'], false],
  ['non-array', 'Aviso', false], ['empty note', [' '], false],
] as const) test(`study notes ${name}`, () => assert.equal(validResult({ ...study, notes }, 'study', 'させたかった'), valid));
for (const [explanation, valid] of [
  ['食べる > 食べた', true], ['食べた < 食べる', true], ['～たい → ～たかった', true],
  ['<script>alert(1)</script>', false], ['<div>texto</div>', false],
  ['<img src=x>', false], ['<a href=x>enlace</a>', false],
] as const) test(`output HTML detector: ${explanation}`, () => assert.equal(validResult({ ...study, grammar: [{ expression: 'たかった', explanation }] }, 'study', 'させたかった'), valid));
for (const instruction of [
  'Prefer little correct analysis over speculative analysis',
  'You receive no images', 'by default do not reconstruct OCR',
  'Describe the observed conjugated surface form',
]) test(`study instruction: ${instruction}`, () => {
  const input = inferenceInput({ schemaVersion: 1, mode: 'study', request: { selectedText: 'させたかった', targetLanguage: 'es' } });
  assert.ok(input.messages[0].content.includes(instruction));
});
for (const instruction of ['natural may remain fragmentary', 'do not complete missing subject/person', 'person or temporal interpretation remains ambiguous']) test(`translate instruction: ${instruction}`, () => {
  assert.ok(inferenceInput({ schemaVersion: 1, mode: 'translate', request: { selectedText: 'します', targetLanguage: 'es' } }).messages[0].content.includes(instruction));
});
