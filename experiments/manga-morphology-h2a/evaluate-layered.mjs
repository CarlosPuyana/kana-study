import fs from 'node:fs/promises';
import { loadEngine, normalizeWithOffsets } from './engines.mjs';
import { readCorpus, metrics, ratio, wilson } from './evaluation.mjs';
import { EnrichedLexicon } from './enriched-lexicon.mjs';
import { LayeredLexicalValidation, reportableLayer, LAYER_POLICY } from './layered-validation.mjs';

const root = new URL('./', import.meta.url), corpus = await readCorpus();
const old = JSON.parse(await fs.readFile(new URL('reports/enriched-comparison.json', root), 'utf8'));
if (corpus.sha256 !== old.corpus.sha256) throw Error('Frozen corpus changed');
const resources = JSON.parse(await fs.readFile(new URL('reports/resources.json', root), 'utf8'));
const engineEvidence = { engine: 'lindera-wasm', version: '6.2.0', dictionary: 'lindera-ipadic-6.2.0',
  resourceDigests: resources.filter(r => r.package === 'lindera-ipadic').map(r => r.sha256) };
const lexicon = await EnrichedLexicon.open(), engine = await loadEngine('lindera');
const validator = new LayeredLexicalValidation(lexicon, engineEvidence);
const outputs = [], byToken = new WeakMap(), cases = [], full = [];
const start = performance.now();
for (const c of corpus.cases) {
  const normalized = normalizeWithOffsets(c.text), tokens = engine.tokenize(normalized.text), layers = [];
  outputs.push(tokens);
  for (const token of tokens.filter(t => t.surface.trim())) {
    const sourceRange = normalized.originalRange(token.start, token.end);
    const result = await validator.analyze({ token, tokens, normalized: normalized.text,
      original: c.text.slice(...sourceRange), sourceRange,
      candidates: lexicon.findAll(token.lemma || token.surface) });
    layers.push(result); byToken.set(token, result);
  }
  const relevant = layers.filter(r => r.morphology.normalizedRange[1] > c.span[0] && r.morphology.normalizedRange[0] < c.span[1]);
  full.push({ caseId: c.id, layers });
  cases.push({ id: c.id, referenceClassification: c.classification, category: c.category,
    layers: relevant.map(reportableLayer) });
}
const elapsedMs = performance.now() - start;
// This projection preserves H2A's denominators ONLY as a conservative whole-unit risk
// proxy. A proposed entry in an ambiguous fixture is not an automatic card acceptance.
const compatibility = metrics(corpus.cases, outputs, token => {
  const layer = byToken.get(token), state = layer.lexical.state;
  return { classification: state === 'identified' ? 'verified' : state === 'excluded' ? 'excluded' : state === 'ambiguous' ? 'ambiguous' : 'unknown',
    token, lemma: token.lemma, lemmaReading: layer.lexical.provisionalReference?.canonicalReading,
    provisionalEntry: layer.lexical.provisionalReference };
});
const diagnoses = [];
const morphologyScores = {};
for (const [referenceField, tokenField] of [['lemma', 'lemma'], ['reading', 'reading'], ['pos', 'pos']]) {
  let total = 0, TP = 0, FP = 0, FN = 0, abstentions = 0;
  for (let i = 0; i < corpus.cases.length; i++) {
    const c = corpus.cases[i]; if (!c[referenceField]) continue;
    total++;
    const token = outputs[i].find(t => t.start === c.span[0] && t.end === c.span[1]);
    const value = token?.[tokenField];
    if (value === c[referenceField]) TP++;
    else { FN++; if (value !== null && value !== undefined) FP++; else abstentions++; }
  }
  morphologyScores[referenceField] = { total, TP, FP, FN, abstentions,
    precision: ratio(TP, TP + FP), recall: ratio(TP, total),
    predictionCoverage: ratio(total - abstentions, total), nominalWilson95: wilson(TP, TP + FP),
    note: 'Exact annotated focus; missing token/value abstains, wrong non-null value is FP+FN. Does not score contextual senses.' };
}
for (const c of corpus.cases.filter(c => c.classification === 'verified')) {
  const record = cases.find(r => r.id === c.id), layers = record.layers;
  const audits = layers.flatMap(l => l.lexical.audits);
  const compatible = audits.filter(a => a.pairAllowed && a.posSenseCount > 0);
  const hazards = [...new Set(layers.flatMap(l => l.hazards))];
  const entryCount = new Set(compatible.map(a => a.entryId)).size;
  const readingCount = new Set(compatible.map(a => a.entryId + ':' + a.reading)).size;
  const causes = {
    multipleEntriesBeforeReadingEvidence: entryCount > 1,
    multipleRawReadingsBeforeEvidence: readingCount > 1,
    multipleSourceSenseRecords: compatible.some(a => a.sourceSenseCount > 1),
    separateLanguageRecords: compatible.some(a => a.languages.length > 1 && a.languageRecordGroups.length > 1),
    multipleGlossesWithinOneSense: compatible.some(a => a.multiGlossSenses > 0),
    restrictionsPruneAlternatives: audits.some(a => !a.pairAllowed || a.rejectedSenseRestrictions > 0),
    incompatiblePOSAlternatives: audits.some(a => a.rejectedPOS > 0),
    noCompatiblePOS: audits.length > 0 && compatible.length === 0,
    insufficientContext: hazards.some(h => ['isolated-character-without-context', 'possible-name-or-nominal-suffix',
      'potential-passive-unresolved', 'unresolved-adjacent-nominal-expression', 'partial-match-within-recorded-expression'].includes(h)),
    ocrOrFragmentHazard: hazards.some(h => ['corrupt-or-unlinked-fragment', 'explicit-fragment-integrity-failure',
      'unknown-neighbor-segmentation', 'expressive-repetition-unresolved', 'unanchored-terminal-fragment'].includes(h)),
    entryRecognizableButStrictSensePolicyBlocked: layers.some(l => l.lexical.state === 'identified' && !l.lexical.identity) && compatible.some(a => a.sourceSenseCount > 1),
    H1HomographGroupNotDemonstrated: layers.every(l => !l.lexical.identity),
    noExactMorphologicalFocus: !layers.some(l => l.morphology.normalizedRange[0] === c.span[0] && l.morphology.normalizedRange[1] === c.span[1]),
    unknownOrMissingReading: layers.some(l => l.morphology.status !== 'recognized')
  };
  diagnoses.push({ caseId: c.id, entryCount, readingCount, causes, hazards });
}
const diagnosisCounts = Object.fromEntries(Object.keys(diagnoses[0].causes).map(key => [key, diagnoses.filter(d => d.causes[key]).length]));
const overlaps = {};
for (const a of Object.keys(diagnosisCounts)) for (const b of Object.keys(diagnosisCounts)) {
  if (a < b) overlaps[a + ' & ' + b] = diagnoses.filter(d => d.causes[a] && d.causes[b]).length;
}
const recognized = cases.filter(c => c.layers.some(l => l.lexical.state === 'identified'));
const positive = cases.filter(c => c.referenceClassification === 'verified');
const wrongOnSupportedPositive = compatibility.details.filter(d => d.expected === 'verified').reduce((n, d) => n + d.accepted.length - Number(d.recovered), 0);
const policySummaries = {};
for (const policy of ['A', 'B', 'C']) {
  const states = cases.map(c => c.layers.some(l => l.cards[policy].state === 'eligible') ? 'eligible' :
    c.layers.some(l => l.cards[policy].state === 'requires-review') ? 'requires-review' : 'ineligible');
  policySummaries[policy] = Object.fromEntries(['eligible', 'requires-review', 'ineligible'].map(state => [state, states.filter(s => s === state).length]));
  policySummaries[policy].note = 'Mutually exclusive case states: eligible first, then requires-review, else ineligible.';
  policySummaries[policy].automaticAccepted = cases.filter(c => c.layers.some(l => l.cards[policy].automaticAcceptance)).length;
}
const report = { schema: 1, measuredAt: new Date().toISOString(), policy: LAYER_POLICY,
  corpus: { ...old.corpus, independentReviewer: null, independentSenseGoldCases: 0, independentEntryIdGoldCases: 0 },
  source: { sourceDigest: lexicon.manifest.source.xmlSha256, databaseSha256: lexicon.manifest.databaseSha256 },
  diagnosis: { denominator: 52, counts: diagnosisCounts, overlaps, cases: diagnoses,
    note: 'Token-driven audit, not gold-fed decisions. Counts overlap; pruning alternatives is not necessarily a sufficient rejection cause.' },
  morphology: { counts: Object.fromEntries(Object.entries(compatibility.counts).filter(([key]) =>
    /^(?:boundary|exactSegmentation|lemma|reading|pos|unknown|offset)/u.test(key))), metrics: compatibility.tokenizer,
    componentScores: morphologyScores,
    scope: 'Existing boundary/lemma/surface-reading/POS annotations only; not sense accuracy.' },
  historical: { H2A: { counts: old.before.counts, pipeline: old.before.pipeline },
    H2A1: { counts: old.after.counts, pipeline: old.after.pipeline } },
  lexical: { identifiedCases: recognized.length, identifiedOccurrences: cases.reduce((n, c) => n + c.layers.filter(l => l.lexical.state === 'identified').length, 0),
    ambiguousCases: cases.filter(c => c.layers.some(l => l.lexical.state === 'ambiguous')).length,
    entryIdAccuracy: null, verifiedPermanentIdentities: cases.reduce((n, c) => n + c.layers.filter(l => l.lexical.identity).length, 0),
    positiveReferenceCompatibility: { denominator: 52, trueCompatible: compatibility.counts.recoveredGold,
      incompatibleProposalsOnPositiveCases: wrongOnSupportedPositive, missed: 52 - compatibility.counts.recoveredGold,
      conditionalPrecision: ratio(compatibility.counts.recoveredGold, compatibility.counts.recoveredGold + wrongOnSupportedPositive),
      recall: ratio(compatibility.counts.recoveredGold, 52),
      nominalWilson95: wilson(compatibility.counts.recoveredGold, compatibility.counts.recoveredGold + wrongOnSupportedPositive),
      note: 'Conditional lemma/reading/span compatibility on positive references. Not independent JMdict entry-ID precision.' },
    legacyWholeUnitProxy: compatibility,
    proxyWarning: 'verified in the legacy projection means entry proposed, NOT a certified identity, sense or card. Ambiguous whole-unit labels cannot establish entry-ID false positives.' },
  senses: { goldAvailable: false, accuracy: null, certifiedContextualSenses: 0,
    sourceSingleCases: cases.filter(c => c.layers.some(l => l.senseResolution.state === 'source-single')).length,
    unresolvedCases: cases.filter(c => c.layers.some(l => l.senseResolution.state === 'unresolved')).length },
  cards: policySummaries,
  review: { caseProposals: cases.filter(c => c.layers.some(l => l.cards.C.reviewProposalAvailable)).length,
    identifiedEntryProposals: recognized.filter(c => c.layers.some(l => l.lexical.state === 'identified' && l.cards.C.reviewProposalAvailable)).length,
    proposalsWithPositiveCompatibility: positive.filter(c => compatibility.details.find(d => d.id === c.id)?.recovered && c.layers.some(l => l.cards.C.reviewProposalAvailable)).length,
    humanConfirmed: 0, note: 'Potential review workload, not reviewed usable cards or words per real volume.' },
  performance: { elapsedMs, cacheHits: lexicon.hits, cacheMisses: lexicon.misses, wasmBytes: engine.wasmMemory(), wholeProcessRss: process.memoryUsage().rss,
    browserHeap: null, physicalMobile: false },
  approval: { automaticCards: false, H2BStarted: false, independentEvaluation: false }, cases };
await fs.writeFile(new URL('resources/enriched/layered-full-local.json', root), JSON.stringify(full));
await fs.writeFile(new URL('reports/layered-comparison.json', root), JSON.stringify(report, null, 2) + '\n');
lexicon.close(); engine.dispose();
console.log(JSON.stringify({ diagnosis: diagnosisCounts, lexical: { identifiedCases: report.lexical.identifiedCases,
  positiveReferenceCompatibility: report.lexical.positiveReferenceCompatibility }, cards: report.cards, review: report.review }, null, 2));
