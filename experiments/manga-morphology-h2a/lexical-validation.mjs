import { createHash } from 'node:crypto';
import { hiragana } from './engines.mjs';
import { lexicalIdentity } from './h1-identity.mjs';

export const POLICY = 'entry-reading-single-source-sense-v1';
const kana = text => /^[\p{Script=Hiragana}\p{Script=Katakana}ー]+$/u.test(text);
const sha = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

export function pairAllowed(entry, spelling, reading) {
  const written = entry.spellings.some(s => s.text === spelling);
  if (written) return !reading.noKanji && (!reading.restrictedTo.length || reading.restrictedTo.includes(spelling));
  // Kana usage is evidence only of the exact recorded reb, not an arbitrary phonetic alias.
  return kana(spelling) && spelling === reading.text;
}

export function senseAllowed(sense, spelling, reading) {
  return (!sense.allowedSpellings.length || sense.allowedSpellings.includes(spelling)) &&
    (!sense.allowedReadings.length || sense.allowedReadings.includes(reading));
}

export function posAllowed(pos, tags) {
  if (pos === '動詞') return tags.some(t => /^v(?:1|5|s|k)/u.test(t));
  if (pos === '形容詞') return tags.some(t => t === 'adj-i' || t === 'adj-ix');
  if (pos === '名詞') return tags.some(t => ['n', 'n-t', 'pn', 'adj-na'].includes(t));
  if (pos === '副詞') return tags.some(t => ['adv', 'adv-to'].includes(t));
  if (pos === '感動詞') return tags.includes('int');
  if (pos === '連体詞') return tags.includes('adj-pn') || tags.includes('exp');
  return false;
}

/** Explicit morphology evidence, never an edit-distance or arbitrary suffix guess. */
export function readingProof(token, reading, tags, following) {
  if (!token.reading || !token.lemma) return null;
  const proposed = hiragana(token.reading), baseReading = hiragana(reading);
  if (token.surface === token.lemma) return proposed === baseReading ? 'exact-recorded-form' : null;
  const lemma = token.lemma;
  if (tags.includes('vk') && lemma.endsWith('来る') && baseReading.endsWith('くる') && token.surface === lemma.slice(0, -1)) {
    const prefix = baseReading.slice(0, -2);
    if (following?.lemma === 'ます' && proposed === prefix + 'き') return 'vk-polite-stem';
    if (following?.lemma === 'ない' && proposed === prefix + 'こ') return 'vk-negative-stem';
    return null;
  }
  const ending = lemma.at(-1), prefix = lemma.slice(0, -1);
  if (!token.surface.startsWith(prefix) || !baseReading.endsWith(ending)) return null;
  const suffix = token.surface.slice(prefix.length), stem = baseReading.slice(0, -1);
  if (tags.some(t => t === 'v1' || t === 'v1-s') && ending === 'る' && suffix === '' && proposed === stem) return 'ichidan-stem';
  if (tags.some(t => t === 'adj-i' || t === 'adj-ix') && ending === 'い' &&
      ['く', 'かっ', 'けれ', 'かろ', ''].includes(suffix) && proposed === stem + suffix) return 'i-adjective-stem';
  const godan = {
    う: ['わ', 'い', 'え', 'お', 'っ'], く: ['か', 'き', 'け', 'こ', 'い'],
    ぐ: ['が', 'ぎ', 'げ', 'ご', 'い'], す: ['さ', 'し', 'せ', 'そ'],
    つ: ['た', 'ち', 'て', 'と', 'っ'], ぬ: ['な', 'に', 'ね', 'の', 'ん'],
    ぶ: ['ば', 'び', 'べ', 'ぼ', 'ん'], む: ['ま', 'み', 'め', 'も', 'ん'],
    る: ['ら', 'り', 'れ', 'ろ', 'っ']
  };
  const allowed = tags.includes('v5k-s') ? [...godan.く, 'っ'] : godan[ending];
  if (tags.some(t => /^v5/u.test(t)) && allowed?.includes(suffix) && proposed === stem + suffix) return 'godan-stem';
  return null;
}

/** Conservative experimental validator. No reference IDs, labels or gold readings enter here. */
export class LexicalValidationService {
  constructor(lexicon) { this.lexicon = lexicon; }

  async validate({ token, normalized, tokens, candidates, sourceRange, original, context = { integrity: 'unassessed' } }) {
    const alternatives = [], reasons = [];
    const result = classification => ({ classification, reasons, alternatives, identity: null,
      candidateEntries: candidates.map(e => ({ entryId: e.entSeq, readings: e.readings.map(r => r.text) })),
      token, original, sourceRange, policy: POLICY });
    if (normalized.slice(token.start, token.end) !== token.surface || original.normalize('NFC') !== token.surface) {
      reasons.push('source-offset-mismatch'); return result('ambiguous');
    }
    if (['助詞', '助動詞', '記号'].includes(token.pos) || token.subpos === '固有名詞') {
      reasons.push('function-symbol-or-explicit-proper-name'); return result('excluded');
    }
    if (token.unknown === true) { reasons.push('analyzer-unknown'); return result('unknown'); }
    if (candidates.some(e => !this.lexicon.owns(e))) {
      reasons.push('untrusted-entry-provenance'); return result('ambiguous');
    }
    const at = tokens.indexOf(token), following = tokens[at + 1];
    // Context checks apply before selecting an entry; never auto-repair OCR or join lines.
    if (/[\uFFFD□\u0000]/u.test(normalized) || /\r|\n/u.test(normalized)) reasons.push('corrupt-or-unlinked-fragment');
    if (['corrupt', 'truncated'].includes(context.integrity)) reasons.push('explicit-fragment-integrity-failure');
    if (/([ぁ-ゖァ-ヺー])\1{2,}/u.test(normalized)) reasons.push('expressive-repetition-unresolved');
    if (tokens.some(t => t.unknown === true && t.surface.trim() && !/^\p{Extended_Pictographic}+$/u.test(t.surface))) reasons.push('unknown-neighbor-segmentation');
    if (following?.pos === '名詞' && following.subpos === '接尾') reasons.push('possible-name-or-nominal-suffix');
    if (tokens.at(-1)?.pos === '助詞' && tokens.at(-1)?.subpos === '終助詞') reasons.push('unanchored-terminal-fragment');
    if (tokens.some(t => ['られる', 'れる'].includes(t.lemma) &&
        (t.pos === '助動詞' || t.pos === '動詞' && t.subpos === '接尾'))) reasons.push('potential-passive-unresolved');
    if (tokens.some((t, i) => t.pos === '名詞' && tokens[i + 1]?.pos === '名詞' && t.end === tokens[i + 1].start)) reasons.push('unresolved-adjacent-nominal-expression');
    if (Array.from(normalized.trim()).length === 1) reasons.push('isolated-character-without-context');
    if (token.start !== 0 || token.end !== normalized.length) {
      const whole = this.lexicon.findAll(normalized);
      if (whole.some(e => e.senses.some(s => s.effectivePOS.includes('exp')))) reasons.push('partial-match-within-recorded-expression');
    }
    if (reasons.length) return result('ambiguous');
    if (!candidates.length) { reasons.push('no-authentic-lexicon-candidate'); return result('unknown'); }
    if (!token.lemma || !token.reading || !token.pos) { reasons.push('missing-morphological-evidence'); return result('ambiguous'); }

    const eligible = [];
    for (const entry of candidates) {
      for (const reading of entry.readings) {
        if (!pairAllowed(entry, token.lemma, reading)) continue;
        const senses = entry.senses.filter(s => senseAllowed(s, token.lemma, reading.text));
        const matching = senses.filter(s => posAllowed(token.pos, s.effectivePOS));
        const english = matching.filter(s => s.glosses.some(g => g.language === 'eng'));
        const proofs = [...new Set(matching.map(s => readingProof(token, reading.text, s.effectivePOS, following)).filter(Boolean))];
        alternatives.push({ entryId: entry.entSeq, reading: reading.text,
          senseReferences: senses.map(s => s.sourceSenseReference),
          sourceSenseCount: senses.length, englishSenseCount: english.length, morphologyProofs: proofs,
          entryDigest: entry.canonicalEntryDigest });
        // Neither a unique exported row nor a unique reading proves sense identity.
        const proof = english.length === 1 ? readingProof(token, reading.text, english[0].effectivePOS, following) : null;
        if (senses.length === 1 && english.length === 1 && proof &&
            !english[0].misc.some(t => ['arch', 'obs', 'rare', 'obsc', 'person', 'surname', 'given'].includes(t))) {
          eligible.push({ entry, reading, sense: english[0], proof });
        }
      }
    }
    // Multiple viable source readings/entries remain unresolved even when IPADIC prefers one.
    const viable = alternatives.filter(a => a.englishSenseCount > 0);
    if (eligible.length !== 1 || viable.length !== 1) {
      reasons.push('entry-reading-sense-identity-not-unique'); return result('ambiguous');
    }
    const { entry, reading, sense, proof } = eligible[0];
    const spellings = entry.spellings.filter(s => pairAllowed(entry, s.text, reading) && senseAllowed(sense, s.text, reading.text)).map(s => s.text);
    if (senseAllowed(sense, reading.text, reading.text)) spellings.push(reading.text);
    if (!spellings.includes(token.lemma)) {
      reasons.push('spelling-not-proven-in-identity-group'); return result('ambiguous');
    }
    const identity = await lexicalIdentity({ authority: 'jmdict', entryId: entry.entSeq,
      canonicalReading: hiragana(reading.text).normalize('NFC'), homographGroup: POLICY },
    [...new Set(spellings)].sort(), 'h2a1:' + entry.sourceDigest);
    reasons.push('authentic-entry', 'reading-and-sense-restrictions-satisfied', proof, 'single-source-sense-policy');
    return { ...result('verified'), identity, lemma: token.lemma,
      lemmaReading: hiragana(reading.text), evidence: {
        sourceDigest: entry.sourceDigest, entryDigest: entry.canonicalEntryDigest,
        sourceSenseReference: sense.sourceSenseReference, senseReferenceStable: false,
        restrictionProofDigest: sha({ entry: entry.canonicalEntryDigest, spelling: token.lemma, reading: reading.text, policy: POLICY }),
        glossLanguages: [...new Set(sense.glosses.map(g => g.language))], cardCreationAllowed: false
      } };
  }
}
