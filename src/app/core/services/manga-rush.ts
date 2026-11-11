import { MangaLexeme, MangaProjectedWord, MangaVocabularyIndex, MangaWordOccurrence } from '../models/manga-vocabulary-index.model';
import { MangaRushCard, MangaRushConfiguration, MangaRushExclusion, MangaRushPool } from '../models/manga-rush.model';
import { isMangaLexicalCandidate, mangaCategory, mangaReadingAddsInformation } from './manga-vocabulary-presentation';
import { deinflect, inflectedReading, matchesInflectionRules } from './japanese-deinflection.service';

export const MANGA_RUSH_DEFAULTS: Readonly<MangaRushConfiguration> = {
  knowledge: 'all', category: 'lexical', selection: 'frequency', amount: 10,
};
const japaneseWord = /^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}ー々]+$/u;
const reading = /^[\p{Script=Hiragana}\p{Script=Katakana}ーゝゞヽヾ]+$/u;
const han = /\p{Script=Han}/u;
const cleanText = (s: unknown): s is string => typeof s === 'string' && !!s.trim() && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(s);
export function mangaRushMeanings(entry: MangaLexeme): string[] {
  return Array.isArray(entry.glosses) ? [...new Set(entry.glosses.filter(cleanText))] : [];
}
function validOccurrence(o: MangaWordOccurrence, pages: number): boolean {
  return !!o && [o.pageIndex, o.blockIndex, o.lineIndex, o.start, o.end].every(Number.isSafeInteger) &&
    o.pageIndex >= 0 && o.pageIndex < pages && o.blockIndex >= 0 && o.lineIndex >= 0 && o.start >= 0 && o.end > o.start &&
    typeof o.context === 'string' && o.end <= o.context.length && typeof o.surface === 'string' &&
    japaneseWord.test(o.surface) && o.context.slice(o.start, o.end) === o.surface;
}
/** Safety derives from M1 identity and authentic references, never a knowledge link. */
export function mangaRushExclusion(entry: MangaLexeme, pages: number): MangaRushExclusion | null {
  try {
    const key: unknown = JSON.parse(entry.key);
    if (!japaneseWord.test(entry.lemma) || !entry.dictionaryId || !Array.isArray(key) || key.length !== 4 ||
      key[0] !== entry.dictionaryId || key[2] !== entry.lemma.normalize('NFC') || key[3] !== entry.reading.normalize('NFC') ||
      (entry.sequence > 0 ? key[1] !== entry.sequence : !cleanText(key[1]))) return 'identity';
  } catch { return 'identity'; }
  if (entry.reading && !reading.test(entry.reading) || han.test(entry.lemma) && !reading.test(entry.reading)) return 'reading';
  if (!mangaRushMeanings(entry).length) return 'meaning';
  if (!Array.isArray(entry.occurrences) || !entry.occurrences.length || !entry.occurrences.every(o => validOccurrence(o, pages))) return 'source';
  const refs = entry.occurrences.map(o => JSON.stringify([o.pageIndex, o.blockIndex, o.lineIndex, o.start, o.end]));
  if (new Set(refs).size !== refs.length) return 'source';
  return null;
}
export function mangaRushPool(index: MangaVocabularyIndex, words: readonly MangaProjectedWord[], config: MangaRushConfiguration): MangaRushPool {
  const excluded: Record<MangaRushExclusion, number> = {identity: 0, reading: 0, meaning: 0, source: 0};
  const safe = words.filter(w => {const reason = mangaRushExclusion(w.entry, index.pageCount); if (reason) excluded[reason]++; return !reason;});
  const selected = safe.filter(w => {
    const category = mangaCategory(w.entry);
    const categoryFits = config.category === 'all' || category === config.category;
    const evidenced = category === 'unclassified' || (category === 'lexical' ? isMangaLexicalCandidate(w.entry) : w.entry.categoryReason === 'dictionary-pos');
    const knowledgeFits = config.knowledge === 'all' || (config.knowledge === 'familiar'
      ? w.state === 'known' || w.state === 'learning' : w.state === config.knowledge);
    return categoryFits && evidenced && knowledgeFits;
  });
  const occurrences = selected.reduce((n, w) => n + w.entry.occurrences.length, 0);
  const availableCards = config.selection === 'weighted' ? occurrences : selected.length;
  return {words: selected, distinct: selected.length, occurrences, availableCards,
    selectedCards: config.amount === 'all' ? availableCards : Math.min(config.amount, availableCards),
    excluded, filteredOut: safe.length - selected.length,
    unresolvedSpans: index.issues.filter(i => i.reason === 'ambiguous' || i.reason === 'unresolved').length};
}
function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.min(i, Math.max(0, Math.floor(random() * (i + 1))));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function mangaRushSurfaceReading(entry: MangaLexeme, o: MangaWordOccurrence): string | undefined {
  if (!reading.test(entry.reading)) return undefined;
  if (o.surface.normalize('NFC') === entry.lemma.normalize('NFC') || !mangaReadingAddsInformation(o.surface, entry.reading)) return entry.reading;
  const candidates = deinflect(o.surface).filter(c => c.base.normalize('NFC') === entry.lemma.normalize('NFC') &&
    entry.categoryEvidence?.some(e => matchesInflectionRules(e.rules, c)));
  const readings = [...new Set(candidates.map(c => inflectedReading(entry.reading, c)).filter((r): r is string => !!r && reading.test(r)))];
  return readings.length === 1 ? readings[0] : undefined;
}
export function selectMangaRushCards(volumeId: string, pool: MangaRushPool, config: MangaRushConfiguration,
  random: () => number = Math.random): MangaRushCard[] {
  const ordered = config.selection === 'frequency' ? [...pool.words].sort((a, b) =>
    b.entry.occurrences.length - a.entry.occurrences.length || a.entry.key.localeCompare(b.entry.key)) :
    config.selection === 'random' ? shuffle(pool.words, random) : pool.words;
  const occurrences = config.selection === 'weighted'
    ? shuffle(ordered.flatMap(w => w.entry.occurrences.map(o => ({entry: w.entry, o}))), random)
    : ordered.map(w => ({entry: w.entry, o: w.entry.occurrences[0]}));
  const count = config.amount === 'all' ? occurrences.length : Math.min(config.amount, occurrences.length);
  return occurrences.slice(0, count).map(({entry, o}) => ({volumeId, lexicalKey: entry.key,
    lemma: entry.lemma, lemmaReading: entry.reading, surfaceReading: mangaRushSurfaceReading(entry, o), occurrence: {...o},
    category: mangaCategory(entry), answer: {kind: 'dictionary', contextualized: false, meanings: mangaRushMeanings(entry)}}));
}
