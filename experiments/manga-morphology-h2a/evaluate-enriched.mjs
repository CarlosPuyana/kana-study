import fs from 'node:fs/promises';
import os from 'node:os';
import { loadEngine, normalizeWithOffsets } from './engines.mjs';
import { readCorpus, makeLexicalScreen, metrics } from './evaluation.mjs';
import { EnrichedLexicon } from './enriched-lexicon.mjs';
import { LexicalValidationService, POLICY } from './lexical-validation.mjs';
import { h1SourceDigest } from './h1-identity.mjs';

const root = new URL('./', import.meta.url);
const corpus = await readCorpus();
const baseline = JSON.parse(await fs.readFile(new URL('reports/linguistic.json', root), 'utf8'));
if (baseline.corpus.sha256 !== corpus.sha256) throw Error('Original reference corpus changed');
const memory = () => ({ ...process.memoryUsage(), peakProcessRssKiB: process.resourceUsage().maxRSS });
const engine = await loadEngine('lindera');
const beforeLexicon = memory(), openAt = performance.now();
const lexicon = await EnrichedLexicon.open();
const openMs = performance.now() - openAt, afterLexiconOpen = memory();
const validator = new LexicalValidationService(lexicon);
const outputs = corpus.cases.map(c => engine.tokenize(normalizeWithOffsets(c.text).text));
const rows = JSON.parse(await fs.readFile(new URL('resources/spanish-rows.json', root), 'utf8'));
const old = metrics(corpus.cases, outputs, makeLexicalScreen(rows));
if (old.counts.acceptedTP !== 28 || old.counts.acceptedFP !== 14) throw Error('Old comparator differs from H2A');
const decisions = new WeakMap(), records = [], queryMs = [], validateMs = [];
const fragmentAt = performance.now();
for (let i = 0; i < corpus.cases.length; i++) {
  const c = corpus.cases[i], normalized = normalizeWithOffsets(c.text), tokens = outputs[i];
  for (const token of tokens.filter(t => t.surface.trim())) {
    const at = performance.now();
    const candidates = lexicon.findAll(token.lemma || token.surface);
    queryMs.push(performance.now() - at);
    const sourceRange = normalized.originalRange(token.start, token.end);
    const start = performance.now();
    const decision = await validator.validate({ token, normalized: normalized.text, tokens,
      candidates, sourceRange, original: c.text.slice(...sourceRange) });
    validateMs.push(performance.now() - start);
    if (decision.classification === 'verified' && !decision.identity) throw Error('Missing H1 identity');
    const measured = { ...decision, provisionalEntry: decision.identity?.anchor };
    decisions.set(token, measured);
    records.push({ caseId: c.id, classification: decision.classification,
      reasons: decision.reasons, sourceRange, original: decision.original,
      alternatives: decision.alternatives, candidateEntries: decision.candidateEntries,
      identity: decision.identity, evidence: decision.evidence });
  }
}
const fragmentMs = performance.now() - fragmentAt;
const enriched = metrics(corpus.cases, outputs, token => decisions.get(token));
const afterFirstAnalysis = memory(), warmAt = performance.now();
for (const tokens of outputs) for (const token of tokens) lexicon.findAll(token.lemma || token.surface);
const warmLookupMs = performance.now() - warmAt;
const percentiles = times => {
  const sorted = [...times].sort((a, b) => a - b);
  return { count: sorted.length, sumMs: times.reduce((a, b) => a + b, 0),
    medianMs: sorted[Math.floor(sorted.length / 2)], p95Ms: sorted[Math.floor(sorted.length * .95)], maxMs: sorted.at(-1) };
};
const classify = result => {
  const byCategory = {};
  for (let i = 0; i < corpus.cases.length; i++) {
    const c = corpus.cases[i], detail = result.details[i];
    const group = byCategory[c.category] ??= { cases: 0, accepted: 0, incorrectCandidates: 0, missedValid: 0, classificationErrors: 0 };
    group.cases++; group.accepted += detail.accepted.length;
    group.incorrectCandidates += detail.accepted.length - Number(detail.recovered);
    group.missedValid += Number(c.classification === 'verified' && !detail.recovered);
    group.classificationErrors += Number(c.classification !== detail.predicted);
  }
  const labels = result.details.map(d => d.predicted);
  return { ...result, errorsByCategory: byCategory,
    abstentionCases: labels.filter(x => x === 'ambiguous' || x === 'unknown').length,
    excludedCases: labels.filter(x => x === 'excluded').length };
};
const report = { schema: 1, measuredAt: new Date().toISOString(),
  environment: { node: process.version, platform: process.platform, cpu: os.cpus()[0].model },
  corpus: { ...baseline.corpus, role: 'development-regression', independentlyReviewed: 0 },
  source: lexicon.manifest, h1SourceDigest, policy: POLICY,
  comparisonCaveat: 'Whole pipeline comparison: old Spanish Yomitan Oct1 vs original multilingual XML Oct22. No isolated validator-only causal claim.',
  before: classify(old), after: classify(enriched), decisions: records,
  identityCounts: { verifiedOccurrences: records.filter(r => r.identity).length,
    uniqueVerified: new Set(records.filter(r => r.identity).map(r => r.identity.key)).size,
    rejectedOccurrences: records.filter(r => !r.identity).length },
  performance: { openMs, queries: percentiles(queryMs), validation: percentiles(validateMs),
    fragmentMs, warmLookupMs, cacheHits: lexicon.hits, cacheMisses: lexicon.misses,
    beforeLexicon, afterLexiconOpen, afterFirstAnalysis, wasmBytes: engine.wasmMemory(),
    browserMemory: null, physicalMobile: false, memoryNote: 'RSS is whole Node; TS identity harness, WASM, SQLite and runtime included. OS cache not flushed.' },
  approval: { allowed: false, independentCorpus: false, mobileValidated: false,
    realVolumesMeasured: false, spanishRedistributionCleared: false, cardCreationAllowed: false } };
const persistenceAt = performance.now();
const temporary = new URL('resources/enriched/analysis-local.json', root);
const data = JSON.stringify(records.map(({ alternatives, ...safe }) => safe));
await fs.writeFile(temporary, data); await fs.readFile(temporary, 'utf8');
report.performance.temporaryWriteReadMs = performance.now() - persistenceAt;
report.performance.temporaryBytes = Buffer.byteLength(data);
await fs.writeFile(new URL('reports/enriched-comparison.json', root), JSON.stringify(report, null, 2) + '\n');
lexicon.close(); engine.dispose();
console.log(JSON.stringify({ before: { counts: old.counts, pipeline: old.pipeline },
  after: { counts: enriched.counts, pipeline: enriched.pipeline }, identityCounts: report.identityCounts, performance: report.performance }, null, 2));
