import { DictionaryTerm } from '../models/dictionary.model';
import { MangaAnalysisIssue, MangaLexeme, MangaWordOccurrence, MangaPosEvidence } from '../models/manga-vocabulary-index.model';
import { deinflect, matchesInflectionRules } from './japanese-deinflection.service';
import { classifyMangaPos } from './manga-vocabulary-presentation';
import { mangaDictionaryPosEvidence } from './manga-dictionary-pos-evidence';

export const MANGA_ANALYZER_VERSION = 'm1.6-segmenter-pos-ambiguity-3';
const word = /^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}ー々]+$/u;
const japanese = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u;
export type MangaTermFinder = (value: string) => Promise<DictionaryTerm[]>;
/** Dictionary-local IDs deliberately do not claim JMdict provenance. */
export function mangaLexemeKey(t: DictionaryTerm): string {
  return JSON.stringify([t.dictionaryId, t.sequence > 0 ? t.sequence : t.id,
    t.expression.normalize('NFC'), t.reading.normalize('NFC')]);
}

/** Non-overlapping browser word boundaries, extended only by POS-validated inflection.
 * No caret ranking: all candidates must agree on the lexical identity. */
export async function analyzeMangaLine(context: string, location: Pick<MangaWordOccurrence,
  'pageIndex' | 'blockIndex' | 'lineIndex'>, find: MangaTermFinder,
  evidence: (term: DictionaryTerm) => Promise<MangaPosEvidence> = mangaDictionaryPosEvidence): Promise<{entries: MangaLexeme[]; issues: MangaAnalysisIssue[]}> {
  const entries: MangaLexeme[] = [], issues: MangaAnalysisIssue[] = [];
  const issue = (reason: MangaAnalysisIssue['reason'], start = 0, end = context.length) =>
    issues.push({...location, reason, context, start, end});
  if (context.length > 4000) { issue('limit'); return {entries, issues}; }
  if (typeof Intl.Segmenter !== 'function') {
    if (japanese.test(context)) issue('segmenter');
    return {entries, issues};
  }
  const parts = [...new Intl.Segmenter('ja', {granularity: 'word'}).segment(context)];
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!japanese.test(part.segment)) continue;
    if (!word.test(part.segment)) { issue('unresolved', part.index, part.index + part.segment.length); continue; }
    let surface = part.segment, last = i;
    let terms = (await find(surface)).filter(t => word.test(t.expression) && !!t.reading);
    // ICU often separates 食べ / なかっ / た. Only merge with dictionary + POS evidence.
    for (let j = Math.min(parts.length - 1, i + 4); j >= i; j--) {
      const joined = parts.slice(i, j + 1).map(p => p.segment).join('');
      if (joined.length > 32 || !word.test(joined)) continue;
      const inflections: DictionaryTerm[] = [];
      for (const candidate of deinflect(joined)) {
        for (const term of await find(candidate.base)) {
          if (word.test(term.expression) && term.reading && matchesInflectionRules(term.rules, candidate)) inflections.push(term);
        }
      }
      if (inflections.length && (j > i || !terms.length)) { terms = inflections; surface = joined; last = j; break; }
    }
    const keys = new Set(terms.map(mangaLexemeKey));
    if (keys.size !== 1 || terms.length >= 32) {
      issue(keys.size > 1 || terms.length >= 32 ? 'ambiguous' : 'unresolved', part.index, part.index + surface.length);
    } else {
      const term = terms[0];
      entries.push({key: mangaLexemeKey(term), dictionaryId: term.dictionaryId, sequence: term.sequence,
        lemma: term.expression, reading: term.reading, glosses: [...new Set(terms.flatMap(t => t.glossaries))],
        ...classifyMangaPos(await Promise.all(terms.map(evidence))),
        occurrences: [{...location, start: part.index, end: part.index + surface.length, surface, context}]});
    }
    i = last;
  }
  return {entries, issues};
}

export function mergeMangaLexemes(target: Map<string, MangaLexeme>, entries: MangaLexeme[]): void {
  for (const entry of entries) {
    const prior = target.get(entry.key);
    if (prior) {
      prior.occurrences.push(...entry.occurrences);
      Object.assign(prior, classifyMangaPos([...(prior.categoryEvidence ?? []), ...(entry.categoryEvidence ?? [])]));
    }
    else target.set(entry.key, entry);
  }
}
