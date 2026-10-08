import { AppLanguage } from '../models/settings.model';
import { MangaStudySavedItem } from '../models/manga-study-saved.model';
import { MangaExerciseType, MangaReviewEvent, MangaReviewMode, MangaReviewQuestion } from '../models/manga-review.model';
import { VocabularyEntry } from '../models/vocabulary.model';
import { VOCABULARY_N5 } from '../../data/vocabulary-n5.generated';
import { matchMangaVocabulary } from './manga-study-integration.service';

const normalize = (text: string) => text.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
const normalizeReading = (text: string) => normalize(text).replace(/[ァ-ヶ]/g, character => String.fromCharCode(character.charCodeAt(0) - 0x60));
function random(seed: number): () => number {
  let state = seed >>> 0;
  return () => { state += 0x6d2b79f5; let t = Math.imul(state ^ state >>> 15, 1 | state); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
function shuffle<T>(values: readonly T[], rng: () => number): T[] {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
}
export function mangaContext(item: MangaStudySavedItem): MangaReviewQuestion['context'] {
  const text = item.context, surface = item.surface;
  if (!text || !surface || !surface.trim() || surface !== surface.trim()) return undefined;
  const at = text.indexOf(surface);
  if (at < 0 || text.indexOf(surface, at + surface.length) >= 0) return undefined;
  // A captured inflection must share written evidence with the dictionary form.
  // This checks saved evidence; it neither conjugates nor replaces the surface.
  const form = item.baseForm || item.expression;
  const formPoints = [...form], surfacePoints = [...surface];
  let shared = 0;
  while (shared < formPoints.length && formPoints[shared] === surfacePoints[shared]) shared++;
  const common = formPoints.slice(0, shared).join('');
  if (surface !== form && !(shared >= 2 && /\p{Script=Han}/u.test(common))) return undefined;
  const end = at + surface.length;
  if (/^[\uDC00-\uDFFF]/u.test(surface) || /[\uD800-\uDBFF]$/u.test(surface)) return undefined;
  const beforePoint = [...text.slice(0, at)].at(-1) ?? '', afterPoint = [...text.slice(end)][0] ?? '';
  // Do not highlight a fragment of a different compound or Latin word.
  if (/\p{Script=Han}/u.test(beforePoint) && /^\p{Script=Han}/u.test(surface)
    || /\p{Script=Han}/u.test(afterPoint) && /\p{Script=Han}$/u.test(surface)
    || /[A-Za-z0-9]/.test(beforePoint) && /^[A-Za-z0-9]/.test(surface)
    || /[A-Za-z0-9]/.test(afterPoint) && /[A-Za-z0-9]$/.test(surface)) return undefined;
  return {before: text.slice(0, at), surface, after: text.slice(end)};
}
function catalogEntry(item: MangaStudySavedItem, catalog: readonly VocabularyEntry[]): VocabularyEntry | undefined {
  const term = {id: item.id, dictionaryId: 'saved', expression: item.expression, reading: item.reading ?? '', glossaries: [], definitionTags: '', rules: '', score: 0, sequence: 0, termTags: ''};
  const matched = matchMangaVocabulary({installed: true, query: item.expression, reading: item.reading, baseForm: item.baseForm, terms: [term], principal: term}, catalog);
  if (item.reading && matched && ![matched.primaryReading, ...matched.readings].some(reading => normalize(reading) === normalize(item.reading!))) return undefined;
  return item.vocabularyId && matched?.id !== item.vocabularyId ? undefined : matched;
}
function meanings(entry: VocabularyEntry, language: AppLanguage): Set<string> {
  return new Set([entry.quizMeaning[language], ...entry.meanings[language]].flatMap(text => text.split(/[,;/]|\s(?:or|o|ou)\s/)).map(normalize).filter(Boolean));
}
/** Same validated evidence for scheduled recall; no invented external answers. */
export function mangaRecallEvidence(item: MangaStudySavedItem, language: AppLanguage) {
  const entry = catalogEntry(item, VOCABULARY_N5);
  return {meaning: entry?.quizMeaning[language]?.trim() || item.meaning?.trim() || '',
    reading: item.reading?.trim() || entry?.primaryReading || ''};
}
/** Distractors come only from saved, unambiguously matched catalog entries.
 * External definitions have no synonym/alternative-reading contract, so use
 * self-assessment rather than declaring another documented answer incorrect. */
export function generateMangaReview(input: {
  items: readonly MangaStudySavedItem[]; language: AppLanguage; mode: MangaReviewMode;
  count: 5 | 10 | 'all'; history: readonly MangaReviewEvent[]; seed: number;
}, catalog: readonly VocabularyEntry[] = VOCABULARY_N5): MangaReviewQuestion[] {
  const rng = random(input.seed);
  const items = [...new Map(input.items.map(item => [item.id, item])).values()].sort((a, b) => a.id.localeCompare(b.id));
  const evidence = items.map(item => {
    const entry = catalogEntry(item, catalog);
    return {item, entry, meaning: entry?.quizMeaning[input.language]?.trim() || item.meaning?.trim() || '', reading: item.reading?.trim() || entry?.primaryReading || ''};
  }).filter(row => row.meaning || row.reading);
  const stats = evidence.map(row => {
    const events = input.history.filter(e => !e.reviewKind && e.savedItemId === row.item.id).sort((a, b) => a.reviewedAt.localeCompare(b.reviewedAt) || a.id.localeCompare(b.id));
    const recent = events.slice(-6), failure = recent.filter(e => !e.correct).length / Math.max(1, recent.length);
    return {...row, last: events.at(-1)?.reviewedAt ?? '', failure, tie: rng()};
  });
  // Alternate difficulty with unseen/oldest slots: difficult words cannot occupy
  // the entire selection forever. Recent successful repetitions lower difficulty.
  const selected: typeof stats = [];
  const count = input.count === 'all' ? stats.length : Math.min(input.count, stats.length);
  while (selected.length < count) {
    const remaining = stats.filter(row => !selected.includes(row));
    remaining.sort((a, b) => (selected.length % 2 === 0 ? b.failure - a.failure : 0) || a.last.localeCompare(b.last) || a.tie - b.tie);
    selected.push(remaining[0]);
  }
  return selected.map(row => {
    const context = mangaContext(row.item);
    const types: MangaExerciseType[] = row.meaning ? ['meaning', 'expression'] : [];
    if (row.reading) types.push('reading');
    if (context && row.meaning) types.push('context');
    const type = input.mode === 'contextual' && context && row.meaning ? 'context' : types[Math.floor(rng() * types.length)];
    const answer = type === 'reading' ? row.reading : type === 'expression' ? row.item.expression : row.meaning;
    const alternatives: string[] = [];
    if (row.entry) {
      const acceptedMeanings = meanings(row.entry, input.language);
      const readings = new Set([row.reading, row.entry.primaryReading, ...row.entry.readings].map(normalizeReading));
      const forms = new Set([row.item.expression, row.entry.primaryWrittenForm, ...row.entry.writtenForms].map(normalize));
      for (const other of shuffle(evidence, rng)) {
        if (!other.entry || other.entry.id === row.entry.id) continue;
        if ([...meanings(other.entry, input.language)].some(meaning => acceptedMeanings.has(meaning))) continue;
        if ([other.item.expression, ...other.entry.writtenForms].some(form => forms.has(normalize(form)))) continue;
        if ([other.reading, ...other.entry.readings].some(reading => readings.has(normalizeReading(reading)))) continue;
        const candidate = type === 'reading' ? other.reading : type === 'expression' ? other.item.expression : other.meaning;
        if (candidate && normalize(candidate) !== normalize(answer) && !alternatives.some(value => normalize(value) === normalize(candidate))) alternatives.push(candidate);
        if (alternatives.length === 3) break;
      }
    }
    return {item: structuredClone(row.item), type, answer, prompt: type === 'expression' ? row.meaning : row.item.expression, options: alternatives.length ? shuffle([answer, ...alternatives], rng) : [],
      originalMeaning: !row.entry?.quizMeaning[input.language], context: type === 'context' ? context : undefined};
  });
}
