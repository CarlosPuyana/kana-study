import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { readCorpus } from '../evaluation.mjs';
import { loadEngine, normalizeWithOffsets } from '../engines.mjs';
import { EnrichedLexicon } from '../enriched-lexicon.mjs';
import { LayeredLexicalValidation, reportableLayer, demonstratedKnownCardMatch } from '../layered-validation.mjs';

let lexicon, engine, validator, corpus;
before(async () => {
  lexicon = await EnrichedLexicon.open(); engine = await loadEngine('lindera');
  validator = new LayeredLexicalValidation(lexicon, { engine: 'lindera-wasm', version: '6.2.0', dictionary: 'lindera-ipadic-6.2.0', resourceDigests: [] });
  corpus = await readCorpus();
});
after(() => { engine?.dispose(); lexicon?.close(); });

async function analyze(text) {
  const normalized = normalizeWithOffsets(text), tokens = engine.tokenize(normalized.text);
  return Promise.all(tokens.filter(t => t.surface.trim()).map(token => {
    const sourceRange = normalized.originalRange(token.start, token.end);
    return validator.analyze({ token, tokens, normalized: normalized.text, original: text.slice(...sourceRange),
      sourceRange, candidates: lexicon.findAll(token.lemma || token.surface) });
  }));
}
async function focus(id) {
  const c = corpus.cases.find(c => c.id === id);
  return (await analyze(c.text)).filter(r => r.morphology.normalizedRange[1] > c.span[0] && r.morphology.normalizedRange[0] < c.span[1]);
}

for (const [id, entry] of [['v01', '1358280'], ['v02', '1497980'], ['v03', '1547720']]) {
  test(id + ': the entry can be proposed without selecting a sense or certifying H1 identity', async () => {
    const [r] = await focus(id);
    assert.equal(r.lexical.state, 'identified'); assert.equal(r.lexical.provisionalReference.entryId, entry);
    assert.equal(r.lexical.identity, null); assert.equal(r.lexical.reference.kind, 'provisional');
    assert.equal(r.lexical.reference.synchronizable, false); assert.equal(r.lexical.reference.homographGroup, null);
    assert.equal(r.senseResolution.selectedSense, null); assert.equal(r.senseResolution.contextualInterpretationCertified, false);
    assert.ok(r.senseResolution.documented.length > 1);
    assert.ok(Object.values(r.cards).every(c => c.automaticAcceptance === false && c.productionApproved === false));
  });
}

test('kuru reading evidence does not silently discard the other source reading or align translations', async () => {
  const [r] = await focus('v03');
  assert.equal(r.lexical.provisionalReference.canonicalReading, 'くる');
  assert.ok(r.lexical.alternatives.some(a => a.proofs.includes('vk-polite-stem')));
  assert.ok(r.lexical.unselectedSourceReadings.some(a => a.reading === 'きたる'));
  assert.ok(r.lexical.remainingAmbiguities.includes('analyzer-reading-choice-not-independent-context-proof'));
});

test('documented variants retain shared entry evidence without forcing ambiguous kana into that entry; homophones stay separate', async () => {
  const [here] = await focus('n04'), [there] = await focus('n05');
  assert.equal(here.lexical.state, 'ambiguous'); assert.equal(here.lexical.provisionalReference, null);
  assert.ok(here.lexical.candidateEntries.includes('1288810'));
  assert.ok(here.lexical.candidateEntries.length > 1);
  assert.equal(there.lexical.provisionalReference.entryId, '1288810');
  assert.equal(here.lexical.identity, null); assert.equal(there.lexical.identity, null);
  const [bridge] = await focus('n01'), [chopsticks] = await focus('n02');
  assert.notEqual(bridge.lexical.provisionalReference.entryId, chopsticks.lexical.provisionalReference.entryId);
  assert.ok(bridge.lexical.unselectedSourceReadings.length > 0);
});

test('生 and スーパー keep meaning uncertainty even when a token reading has a unique entry proposal', async () => {
  for (const id of ['n03', 'k05']) for (const r of await focus(id)) {
    assert.equal(r.lexical.identity, null); assert.equal(r.senseResolution.contextualInterpretationCertified, false);
    assert.ok(r.senseResolution.documented.length > 1);
    assert.ok(Object.values(r.cards).every(c => c.state !== 'eligible' && !c.automaticAcceptance));
  }
});

test('そういう recovers a real candidate, not an invented Spanish gloss', async () => {
  const [r] = await focus('e01');
  assert.equal(r.lexical.provisionalReference.entryId, '1394680');
  const eng = r.senseResolution.documented.flatMap(s => s.glosses).filter(g => g.language === 'eng');
  assert.ok(eng.length); assert.ok(eng.every(g => g.provenance.startsWith('jmdict:')));
  assert.equal(r.cards.C.confirmation, null);
});

test('source records are retained with real languages; tracked projections remove gloss text', async () => {
  const [r] = await focus('v01'), projected = reportableLayer(r);
  const languages = new Set(r.senseResolution.documented.flatMap(s => s.glosses.map(g => g.language)));
  assert.ok(languages.has('eng')); assert.ok(languages.has('spa'));
  assert.equal(projected.senseResolution.documented.some(s => 'glosses' in s), false);
  assert.ok(projected.senseResolution.documented.every(s => !s.stableAcrossRevisions));
});

const unsafe = ['v17', 'c10', 'e04', 'o03', 'o05', 'o07', 'k05', 's02', 's03', 's04', 's05'];
for (const id of unsafe) test('layered unsafe regression ' + id + ': no automatic card or invented permanent identity', async () => {
  for (const r of await focus(id)) {
    assert.equal(r.lexical.identity, null);
    for (const card of Object.values(r.cards)) {
      assert.notEqual(card.state, 'eligible'); assert.equal(card.automaticAcceptance, false);
      assert.equal(card.confirmation, null); assert.ok(card.reasons.length);
    }
  }
});

test('damaged OCR requires repair before sense review; a possible name requires explicit review', async () => {
  for (const r of await focus('o05')) {
    assert.equal(r.cards.C.state, 'ineligible');
    if (r.lexical.state === 'excluded') assert.ok(r.cards.C.reasons.includes('excluded-content'));
    else {
      assert.ok(r.cards.C.reasons.includes('fragment-repair-needed-before-review'));
      assert.equal(r.lexical.occurrenceStatus, 'unconfirmed-fragment');
    }
  }
  const [name] = await focus('e04');
  assert.equal(name.cards.C.state, 'requires-review');
  assert.ok(name.hazards.includes('possible-name-or-nominal-suffix'));
});

test('a provisional reference cannot match a known deck identity and offsets retain original UTF-16', async () => {
  const [r] = await focus('v01');
  assert.equal(demonstratedKnownCardMatch(r, { key: 'a-real-card-would-need-an-actual-proof' }), false);
  const unicode = await analyze('😀か\u3099');
  for (const layer of unicode) assert.equal('😀か\u3099'.slice(...layer.sourceRange), layer.original);
});

test('the actual strict positive control may preserve its H1 identity without pretending contextual meaning is certified', async () => {
  const [r] = await analyze('アメリシウム');
  assert.equal(r.lexical.reference.kind, 'permanent');
  assert.equal(demonstratedKnownCardMatch(r, r.lexical.identity), true);
  assert.equal(r.senseResolution.contextualInterpretationCertified, false);
  assert.equal(r.cards.A.state, 'requires-review');
  assert.equal(r.cards.B.automaticAcceptance, false); assert.equal(r.cards.C.confirmation, null);
});

test('comparison reports the limits of its reference annotations and all 52 diagnoses including overlaps', async () => {
  const report = JSON.parse(await fs.readFile(new URL('../reports/layered-comparison.json', import.meta.url), 'utf8'));
  assert.equal(report.corpus.sha256, '8d34a714ce1f53ac67260e65686febefa61b3d81a8910a1218a59c79c6b4379d');
  assert.equal(report.diagnosis.cases.length, 52);
  assert.ok(report.diagnosis.overlaps['multipleSourceSenseRecords & separateLanguageRecords'] > 0);
  assert.ok(report.lexical.positiveReferenceCompatibility.trueCompatible > 0);
  assert.equal(report.lexical.entryIdAccuracy, null); assert.equal(report.senses.accuracy, null);
  assert.equal(report.review.humanConfirmed, 0); assert.equal(report.approval.automaticCards, false);
  for (const policy of Object.values(report.cards)) {
    assert.equal(policy.eligible + policy['requires-review'] + policy.ineligible, 100);
    assert.equal(policy.automaticAccepted, 0);
  }
});
