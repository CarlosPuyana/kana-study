import fs from 'node:fs/promises';
import { loadEngine, normalizeWithOffsets } from './engines.mjs';
import { readCorpus } from './evaluation.mjs';
import { EnrichedLexicon } from './enriched-lexicon.mjs';
import { LexicalValidationService } from './lexical-validation.mjs';

// Separate process from the old/new comparator: never load the Spanish Yomitan rows here.
const root = new URL('./', import.meta.url), corpus = await readCorpus();
const engine = await loadEngine('lindera');
const fragments = corpus.cases.map(c => ({ ...normalizeWithOffsets(c.text), text: c.text }));
const outputs = fragments.map(f => engine.tokenize(f.text.normalize('NFC')));
const memory = () => {
  global.gc?.();
  return { ...process.memoryUsage(), peakWholeProcessRssKiB: process.resourceUsage().maxRSS };
};
const beforeLexicon = memory(), at = performance.now();
const lexicon = await EnrichedLexicon.open(), openMs = performance.now() - at;
const afterOpen = memory(), validator = new LexicalValidationService(lexicon);
const run = async () => {
  const start = performance.now(); let verified = 0;
  for (let i = 0; i < fragments.length; i++) {
    const fragment = fragments[i], tokens = outputs[i];
    for (const token of tokens.filter(t => t.surface.trim())) {
      const sourceRange = fragment.originalRange(token.start, token.end);
      const r = await validator.validate({ token, normalized: fragment.text.normalize('NFC'), tokens,
        sourceRange, original: fragment.text.slice(...sourceRange),
        candidates: lexicon.findAll(token.lemma || token.surface) });
      verified += Number(r.classification === 'verified');
    }
  }
  return { ms: performance.now() - start, verified };
};
const first = await run(), afterFirst = memory(), repeats = [];
for (let i = 0; i < 5; i++) repeats.push(await run());
const afterRepeated = memory();
const report = { measuredAt: new Date().toISOString(), node: process.version,
  note: 'One fresh Node process, forced GC at snapshots, OS cache not flushed; not browser/mobile. No old Spanish rows loaded. Tokenization excluded from lexical rounds.',
  beforeLexicon, afterOpen, afterFirst, afterRepeated, openMs, first, repeats,
  wasmBytes: engine.wasmMemory(), cache: { limit: 128, hits: lexicon.hits, misses: lexicon.misses },
  browserHeap: null, mobilePeak: null };
await fs.writeFile(new URL('reports/enriched-performance.json', root), JSON.stringify(report, null, 2) + '\n');
lexicon.close(); engine.dispose(); console.log(JSON.stringify(report, null, 2));
