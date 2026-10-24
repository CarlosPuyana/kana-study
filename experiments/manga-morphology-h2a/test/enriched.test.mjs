import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { EnrichedLexicon } from '../enriched-lexicon.mjs';
import { LexicalValidationService, pairAllowed, senseAllowed, readingProof } from '../lexical-validation.mjs';
import { loadEngine, normalizeWithOffsets } from '../engines.mjs';
import { lexicalIdentity } from '../h1-identity.mjs';
import { readCorpus } from '../evaluation.mjs';

let lexicon, validator, engine;
before(async () => { lexicon = await EnrichedLexicon.open(); validator = new LexicalValidationService(lexicon); engine = await loadEngine('lindera'); });
after(() => { engine?.dispose(); lexicon?.close(); });

async function analyze(text) {
  const normalized = normalizeWithOffsets(text), tokens = engine.tokenize(normalized.text);
  return Promise.all(tokens.filter(t => t.surface.trim()).map(token => {
    const sourceRange = normalized.originalRange(token.start, token.end);
    return validator.validate({ token, normalized: normalized.text, tokens,
      candidates: lexicon.findAll(token.lemma || token.surface), sourceRange,
      original: text.slice(...sourceRange) });
  }));
}

test('source is pinned, local, immutable and candidate objects must originate in the indexed lexicon', async () => {
  const entries = lexicon.findAll('アメリシウム');
  assert.ok(entries.length); assert.equal(Object.isFrozen(entries[0]), true);
  assert.equal(lexicon.owns(entries[0]), true); assert.equal(lexicon.owns(structuredClone(entries[0])), false);
  const tokens = engine.tokenize('アメリシウム'), token = tokens[0];
  const r = await validator.validate({ token, tokens, normalized: 'アメリシウム', original: 'アメリシウム',
    candidates: entries.map(e => structuredClone(e)), sourceRange: [0, token.end] });
  assert.equal(r.identity, null); assert.ok(r.reasons.includes('untrusted-entry-provenance'));
});

test('re_restr and re_nokanji prevent invalid kanji-reading pairs; sense restrictions intersect', () => {
  // Synthetic relationship-only fixtures: no global ent_seq or final identities are invented.
  const entry = { spellings: [{ text: '甲' }, { text: '乙' }] };
  const reading = { text: 'こう', noKanji: false, restrictedTo: ['甲'] };
  assert.equal(pairAllowed(entry, '甲', reading), true);
  assert.equal(pairAllowed(entry, '乙', reading), false);
  assert.equal(pairAllowed(entry, '甲', { ...reading, noKanji: true }), false);
  assert.equal(pairAllowed(entry, 'こう', { ...reading, noKanji: true }), true);
  const sense = { allowedSpellings: ['甲'], allowedReadings: ['こう'] };
  assert.equal(senseAllowed(sense, '甲', 'こう'), true);
  assert.equal(senseAllowed(sense, '乙', 'こう'), false);
  assert.equal(senseAllowed(sense, '甲', 'おつ'), false);
});

test('irregular kuru requires explicit vk source POS and the appropriate following auxiliary', () => {
  const token = { lemma: '来る', surface: '来', reading: 'き' };
  assert.equal(readingProof(token, 'くる', ['vk'], { lemma: 'ます' }), 'vk-polite-stem');
  assert.equal(readingProof(token, 'くる', ['v1'], { lemma: 'ます' }), null);
  assert.equal(readingProof(token, 'くる', ['vk'], { lemma: 'ない' }), null);
  assert.equal(readingProof({ ...token, reading: 'こ' }, 'くる', ['vk'], { lemma: 'ない' }), 'vk-negative-stem');
});

test('a real single-source-sense control constructs the actual H1 key without creating any card', async () => {
  const result = (await analyze('アメリシウム'))[0];
  assert.equal(result.classification, 'verified'); assert.equal(result.identity.anchor.entryId, '1018910');
  assert.equal(result.evidence.cardCreationAllowed, false);
  assert.equal(result.evidence.senseReferenceStable, false);
  const recreated = await lexicalIdentity(result.identity.anchor, [...result.identity.spellings].reverse(), result.identity.evidenceVersion);
  assert.equal(recreated.key, result.identity.key);
  const again = (await analyze('アメリシウム'))[0];
  assert.deepEqual(again.identity, result.identity);
});

test('generic integrity rules have a positive counterexample rather than suppressing all vocabulary', async () => {
  assert.ok((await analyze('アメリシウム')).some(r => r.identity));
  for (const text of ['アメリシウムさん', 'アメリシウム□', 'アメリ\nシウム']) {
    assert.equal((await analyze(text)).some(r => r.identity), false);
  }
});

test('spelling, reading and POS disagreement cannot produce a verified identity', async () => {
  const tokens = engine.tokenize('アメリシウム'), token = { ...tokens[0], reading: 'ちがう' };
  const input = { token, tokens: [token], normalized: token.surface, original: token.surface,
    candidates: lexicon.findAll(token.lemma), sourceRange: [0, token.end] };
  assert.equal((await validator.validate(input)).identity, null);
  assert.equal((await validator.validate({ ...input, token: { ...token, reading: 'あめりしうむ', pos: '動詞' } })).identity, null);
  assert.equal((await validator.validate({ ...input, original: '別の表記' })).identity, null);
});

const unsafe = ['v17', 'c10', 'e04', 'o03', 'o05', 'o07', 'k05', 's02', 's03', 's04', 's05'];
for (const id of unsafe) test('H2A unsafe regression ' + id + ' abstains with explicit reasons, not a fixture-ID rule', async () => {
  const corpus = await readCorpus(), c = corpus.cases.find(c => c.id === id);
  const normalized = normalizeWithOffsets(c.text);
  const tokens = engine.tokenize(normalized.text).filter(t => t.end > c.span[0] && t.start < c.span[1]);
  const results = await analyze(c.text);
  for (const r of results.filter(r => tokens.some(t => t.start === r.token.start && t.end === r.token.end))) {
    assert.equal(r.identity, null); assert.ok(r.reasons.length);
    if (id === 'v17') assert.ok(r.reasons.includes('potential-passive-unresolved'));
  }
});

test('partial expressions and explicit truncation abstain while punctuation keeps a genuine control valid', async () => {
  assert.ok((await analyze('アメリシウム。')).some(r => r.identity));
  const text = '気をつける', results = await analyze(text);
  assert.ok(results.some(r => r.reasons.includes('partial-match-within-recorded-expression')));
  const tokens = engine.tokenize('アメリシウム'), token = tokens[0];
  const r = await validator.validate({ token, tokens, normalized: token.surface, original: token.surface,
    sourceRange: [0, token.end], candidates: lexicon.findAll(token.lemma), context: { integrity: 'truncated' } });
  assert.equal(r.identity, null); assert.ok(r.reasons.includes('explicit-fragment-integrity-failure'));
});

test('homophones are separate authentic entries and documented variants share authority without guessing sense identity', () => {
  const bridges = lexicon.findAll('橋'), chopsticks = lexicon.findAll('箸');
  assert.ok(bridges.some(e => e.entSeq === '1237410')); assert.ok(chopsticks.some(e => e.entSeq === '1476410'));
  assert.notEqual(bridges.find(e => e.entSeq === '1237410').entSeq, chopsticks[0].entSeq);
  assert.ok(lexicon.findAll('ここ').some(e => e.entSeq === '1288810'));
  assert.ok(lexicon.findAll('此処').some(e => e.entSeq === '1288810'));
});

test('original corpus remains frozen and zero coverage is explicitly not approval or 100 percent precision', async () => {
  const corpus = await readCorpus();
  assert.equal(corpus.sha256, '8d34a714ce1f53ac67260e65686febefa61b3d81a8910a1218a59c79c6b4379d');
  const report = JSON.parse(await fs.readFile(new URL('../reports/enriched-comparison.json', import.meta.url), 'utf8'));
  assert.equal(report.before.counts.acceptedTP, 28); assert.equal(report.before.counts.acceptedFP, 14);
  assert.equal(report.after.counts.unsafeFixturesAccepted, 0);
  if (report.after.counts.acceptedTP + report.after.counts.acceptedFP === 0) assert.equal(report.after.pipeline.precision, null);
  assert.equal(report.approval.allowed, false); assert.equal(report.approval.independentCorpus, false);
  assert.equal(report.after.counts.boundaryTP, report.before.counts.boundaryTP);
});

test('empty evaluation slots are never counted as independently annotated cases', async () => {
  const source = await fs.readFile(new URL('../corpus-independent/slots.jsonl', import.meta.url), 'utf8');
  const slots = source.trim().split('\n').map(line => JSON.parse(line));
  assert.equal(slots.length, 100);
  assert.equal(slots.filter(s => s.status === 'reviewed' && s.annotation && s.source.rightsStatus === 'authorized').length, 0);
  assert.ok(slots.every(s => s.text === null && s.annotation === null && s.reviewers.length === 0));
  assert.equal(new Set(slots.map(s => s.slotId)).size, 100);
});
