import { MangaLexeme, MangaLexicalCategory, MangaPosEvidence, MangaProjectedWord, MangaWordKnowledge } from '../models/manga-vocabulary-index.model';

/** JMdict/Yomitan POS codes, not surfaces or Segmenter word-like flags.
 * Inflection rules are retained as evidence but do not establish lexical vs auxiliary use. */
const functionalPos = new Set(['prt', 'aux', 'aux-v', 'aux-adj', 'cop', 'cop-da', 'conj']);
const lexicalPos = /^(?:n(?:-adv|-pr|-pref|-suf|-t)?|pn|adj-(?:f|i|ix|kari|ku|na|nari|no|pn|shiku|t)|adv(?:-to)?|int|exp|v(?:1(?:-s)?|[245][a-z](?:-[a-z])?|[245]|k|n|r|s(?:-[a-z]+)?|-unspec))$/u;
export function classifyMangaPos(evidence: readonly MangaPosEvidence[]): Pick<MangaLexeme, 'category' | 'categoryReason' | 'categoryEvidence'> {
  const classify = (definitionTags: string, explicitSense = false) => {
    const tags = definitionTags.split(/\s+/u).filter(Boolean);
    const functional = tags.some(tag => functionalPos.has(tag));
    const lexical = tags.some(tag => lexicalPos.test(tag));
    // A dictionary row can aggregate senses: aux-v cannot erase lexical v1/vs.
    // Only explicit source sense POS can identify a verb class as auxiliary subtype.
    const competing = lexical && tags.some(tag => lexicalPos.test(tag) &&
      !(explicitSense && tag.startsWith('v') && tags.includes('aux-v')) &&
      !(explicitSense && tag.startsWith('adj-') && tags.includes('aux-adj')));
    if (functional && competing) return 'conflict';
    if (tags.includes('unc')) return 'missing';
    if (functional) return 'functional';
    if (lexical) return 'lexical';
    return tags.length ? 'unsupported' : 'missing';
  };
  const categories = evidence.flatMap(row => [classify(row.definitionTags),
    ...(row.alternatives ?? []).map(alternative => classify(alternative.definitionTags, true))]);
  const kinds = new Set(categories);
  const category = kinds.size === 1 && (kinds.has('lexical') || kinds.has('functional'))
    ? categories[0] as MangaLexicalCategory : 'unclassified';
  const categoryReason = category !== 'unclassified' ? 'dictionary-pos' :
    kinds.has('conflict') || kinds.has('lexical') && kinds.has('functional') ? 'conflicting-pos' :
    !evidence.length || kinds.has('missing') ? 'missing-pos' : 'unsupported-pos';
  return {category, categoryReason, categoryEvidence: [...new Map(evidence.map(e => [JSON.stringify(e), {...e}])).values()]};
}

/** Display comparison only. Preserve original lemma, reading and identity.
 * Fold width, canonical combining marks and the one-to-one katakana/hiragana range.
 * Do not fold long vowels, small kana, historical kana, or particle pronunciations. */
export function mangaReadingAddsInformation(form: string, reading: string): boolean {
  const comparable = (text: string) => text.normalize('NFKC').replace(/[ァ-ヶヽヾ]/gu,
    kana => String.fromCharCode(kana.charCodeAt(0) - 0x60)).normalize('NFC');
  return !!reading && comparable(form) !== comparable(reading);
}

export function mangaCategory(entry: MangaLexeme): MangaLexicalCategory { return entry.category ?? 'unclassified'; }
/** Presentation/eligibility only; never mutate M1 or its POS evidence. */
export function isSingleMangaKana(surface: string): boolean {
  const normalized=/^[\uFF66-\uFF9D][\uFF9E\uFF9F]?$/u.test(surface)?surface.normalize('NFKC'):surface.normalize('NFC');
  return /^[\p{Script=Hiragana}\p{Script=Katakana}]$/u.test(normalized) && /^\p{Letter}$/u.test(normalized);
}
export function mangaLexicalWords(words: readonly MangaProjectedWord[]): MangaProjectedWord[] {
  return words.flatMap(w=>{
    if(mangaCategory(w.entry)!=='lexical')return [w];
    const occurrences=w.entry.occurrences.filter(o=>!isSingleMangaKana(o.surface));
    return occurrences.length===w.entry.occurrences.length?[w]:occurrences.length?[{...w,entry:{...w.entry,occurrences}}]:[];
  });
}
export function filterMangaWords(words: readonly MangaProjectedWord[], category: MangaLexicalCategory,
  state: MangaWordKnowledge | 'all' = 'all', ascending = false): MangaProjectedWord[] {
  return mangaLexicalWords(words).filter(w => mangaCategory(w.entry) === category && (state === 'all' || w.state === state))
    .sort((a, b) => (a.entry.occurrences.length - b.entry.occurrences.length) * (ascending ? 1 : -1) || a.entry.key.localeCompare(b.entry.key));
}
/** M2 selection predicate only: no learning side effects or knowledge guessing. */
export function isMangaLexicalCandidate(entry: MangaLexeme): boolean {
  return mangaCategory(entry) === 'lexical' && entry.categoryReason === 'dictionary-pos' && entry.glosses.some(g => !!g.trim());
}
