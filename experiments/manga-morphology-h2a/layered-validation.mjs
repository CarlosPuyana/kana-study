import { createHash } from 'node:crypto';
import { hiragana } from './engines.mjs';
import { LexicalValidationService, pairAllowed, senseAllowed, posAllowed, readingProof } from './lexical-validation.mjs';

export const LAYER_POLICY = 'morph-entry-sense-card-v1';
const hardIntegrity = new Set(['source-offset-mismatch', 'untrusted-entry-provenance',
  'corrupt-or-unlinked-fragment', 'explicit-fragment-integrity-failure',
  'unknown-neighbor-segmentation', 'expressive-repetition-unresolved', 'unanchored-terminal-fragment']);
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

/** No gold labels, IDs of fixtures, ranking or remote calls are used in any decision. */
export class LayeredLexicalValidation {
  constructor(lexicon, engineEvidence) {
    this.lexicon = lexicon;
    this.strict = new LexicalValidationService(lexicon);
    this.engineEvidence = engineEvidence;
  }

  async analyze(input) {
    const { token, tokens, candidates, normalized, original, sourceRange } = input;
    const strict = await this.strict.validate(input);
    const morphology = {
      surface: token.surface, original, candidateLemma: token.lemma,
      surfaceReading: token.reading, pos: token.pos, subpos: token.subpos,
      normalizedRange: [token.start, token.end], originalRange: sourceRange,
      status: token.unknown === true ? 'unknown' : token.lemma && token.reading ? 'recognized' : 'partial',
      evidence: this.engineEvidence
    };
    const validOffsets = normalized.slice(token.start, token.end) === token.surface && original.normalize('NFC') === token.surface;
    const trusted = candidates.every(e => this.lexicon.owns(e));
    const excluded = strict.classification === 'excluded';
    const at = tokens.indexOf(token), following = tokens[at + 1];
    const audits = [], compatible = [];
    if (validOffsets && trusted && !excluded) for (const entry of candidates) {
      for (const reading of entry.readings) {
        const pair = pairAllowed(entry, token.lemma, reading);
        const applicable = pair ? entry.senses.filter(s => senseAllowed(s, token.lemma, reading.text)) : [];
        const matching = applicable.filter(s => posAllowed(token.pos, s.effectivePOS));
        const proof = [...new Set(matching.map(s => readingProof(token, reading.text, s.effectivePOS, following)).filter(Boolean))];
        audits.push({ entryId: entry.entSeq, reading: reading.text, pairAllowed: pair,
          sourceSenseCount: applicable.length, posSenseCount: matching.length,
          rejectedSenseRestrictions: pair ? entry.senses.length - applicable.length : 0,
          rejectedPOS: applicable.length - matching.length,
          englishSenseCount: matching.filter(s => s.glosses.some(g => g.language === 'eng')).length,
          languages: [...new Set(matching.flatMap(s => s.glosses.map(g => g.language)))].sort(),
          languageRecordGroups: [...new Set(matching.map(s => [...new Set(s.glosses.map(g => g.language))].sort().join('+')))],
          multiGlossSenses: matching.filter(s => s.glosses.length > 1).length,
          morphologyProofs: proof });
        if (pair && matching.length && proof.length && token.unknown !== true) {
          compatible.push({ entry, reading, senses: matching, proof });
        }
      }
    }
    // Aggregate only inside the SAME authentic entry and canonical reading. Raw variants
    // and restrictions are retained; this does not merge entries or mint a global identity.
    const groups = new Map();
    for (const c of compatible) {
      const key = c.entry.entSeq + ':' + hiragana(c.reading.text).normalize('NFC');
      const group = groups.get(key) ?? { entryId: c.entry.entSeq,
        canonicalReading: hiragana(c.reading.text).normalize('NFC'),
        compatibleSpellings: new Set(), rawReadings: [], sourceDigest: c.entry.sourceDigest,
        entryDigest: c.entry.canonicalEntryDigest, senses: new Map(), proofs: new Set() };
      group.rawReadings.push(c.reading.text);
      for (const spelling of c.entry.spellings) if (pairAllowed(c.entry, spelling.text, c.reading) &&
          c.senses.some(s => senseAllowed(s, spelling.text, c.reading.text))) group.compatibleSpellings.add(spelling.text);
      group.compatibleSpellings.add(c.reading.text);
      for (const sense of c.senses) group.senses.set(sense.sourceSenseReference, sense);
      c.proof.forEach(p => group.proofs.add(p)); groups.set(key, group);
    }
    const options = [...groups.values()].map(g => ({ ...g,
      compatibleSpellings: [...g.compatibleSpellings].sort(),
      rawReadings: [...new Set(g.rawReadings)].sort(), senses: [...g.senses.values()], proofs: [...g.proofs] }));
    const hazards = strict.reasons.filter(r => !['entry-reading-sense-identity-not-unique',
      'authentic-entry', 'reading-and-sense-restrictions-satisfied', 'single-source-sense-policy',
      'exact-recorded-form', 'ichidan-stem', 'godan-stem', 'i-adjective-stem',
      'vk-polite-stem', 'vk-negative-stem'].includes(r));
    const state = excluded ? 'excluded' : !validOffsets || !trusted ? 'unresolved' :
      options.length === 1 ? 'identified' : options.length > 1 ? 'ambiguous' : 'unresolved';
    const selected = state === 'identified' ? options[0] : null;
    // This reference is explicitly revision-bound and cannot be used as a verified sync ID.
    const provisionalReference = selected ? { authority: 'jmdict', entryId: selected.entryId,
      canonicalReading: selected.canonicalReading, sourceDigest: selected.sourceDigest,
      scope: 'source-revision-only', synchronizable: false, homographGroup: null } : null;
    const identity = strict.identity;
    const unselectedReadings = audits.filter(a => a.pairAllowed && a.posSenseCount > 0 && !a.morphologyProofs.length);
    const lexical = { state, evidenceScope: 'token-form-under-morphological-hypothesis',
      occurrenceStatus: hazards.some(h => hardIntegrity.has(h)) ? 'unconfirmed-fragment' : 'proposed',
      candidateEntries: [...new Set(options.map(o => o.entryId))],
      alternatives: options.map(({ senses, ...o }) => ({ ...o, senseReferences: senses.map(s => s.sourceSenseReference) })),
      provisionalReference, identity, identityStatus: identity ? 'demonstrated-by-strict-policy' : 'not-certified',
      reference: identity ? { kind: 'permanent', identity } : provisionalReference ? { kind: 'provisional', ...provisionalReference } : null,
      unselectedSourceReadings: unselectedReadings,
      remainingAmbiguities: [...new Set([...hazards, ...(!identity ? ['H1-homograph-group-not-demonstrated'] : []),
        ...(unselectedReadings.length ? ['analyzer-reading-choice-not-independent-context-proof'] : []),
        ...(options.length > 1 ? ['multiple-entry-or-reading-proposals'] : [])])], audits };
    const applicable = new Map();
    for (const option of options) for (const sense of option.senses) {
      const key = option.entryId + ':' + sense.sourceSenseReference;
      applicable.set(key, { entryId: option.entryId, reference: sense.sourceSenseReference,
        stableAcrossRevisions: false, restrictions: { spellings: sense.allowedSpellings, readings: sense.allowedReadings },
        pos: sense.effectivePOS, glosses: sense.glosses, contextEvidence: [] });
    }
    const senses = [...applicable.values()];
    const senseResolution = { state: selected && senses.length === 1 ? 'source-single' : senses.length ? 'unresolved' : 'unavailable',
      documented: senses, selectedSense: null, contextualInterpretationCertified: false,
      englishDocumented: senses.filter(s => s.glosses.some(g => g.language === 'eng')).length,
      unresolved: senses.length ? ['no-independent-contextual-sense-evidence', 'no-inferred-cross-language-alignment'] : ['no-applicable-sense'] };
    const integrityFailure = hazards.some(h => hardIntegrity.has(h));
    const reviewPossible = !excluded && !integrityFailure && options.length > 0;
    const automaticPreconditions = !!identity && !hazards.length && senseResolution.state === 'source-single';
    const makeCard = (policy, preconditions, extra) => ({ policy,
      state: excluded || integrityFailure || !options.length ? 'ineligible' : preconditions ? 'eligible' : 'requires-review',
      reasons: [...(excluded ? ['excluded-content'] : []), ...(integrityFailure ? ['fragment-repair-needed-before-review'] : []),
        ...(!options.length ? ['no-lexical-proposal'] : []), ...(!identity ? ['permanent-identity-not-certified'] : []), ...extra],
      automaticAcceptance: false, productionApproved: false, confirmation: null });
    const cards = {
      A: makeCard('contextual-single-meaning', automaticPreconditions && senseResolution.contextualInterpretationCertified,
        ['contextual-sense-not-certified']),
      B: makeCard('documented-multiple-senses', automaticPreconditions && senseResolution.englishDocumented > 0,
        ['pedagogical-approval-pending', 'senses-are-not-a-contextual-translation']),
      C: { ...makeCard('manual-confirmation', false, ['human-confirmation-required', 'review-receipt-required']),
        reviewProposalAvailable: reviewPossible }
    };
    return { policy: LAYER_POLICY, morphology, lexical, senseResolution, cards,
      hazards, sourceRange, original, evidenceDigest: hash({ token, sourceRange, source: options.map(o => o.entryDigest), policy: LAYER_POLICY }) };
  }
}

/** No entry/gloss corpus is redistributed in tracked reports. Full local decisions stay ignored. */
export function reportableLayer(result) {
  return { ...result, senseResolution: { ...result.senseResolution,
    documented: result.senseResolution.documented.map(({ glosses, ...sense }) => ({ ...sense,
      glossCountsByLanguage: Object.fromEntries([...new Set(glosses.map(g => g.language))].map(lang => [lang, glosses.filter(g => g.language === lang).length])) })) } };
}

/** Experimental invariant only; no Japanese 1500 mapping or study-state mutation. */
export function demonstratedKnownCardMatch(layer, knownIdentity) {
  return !!layer.lexical.identity && layer.lexical.identity.key === knownIdentity?.key;
}
