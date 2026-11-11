import { LexicalKnowledgeSnapshot } from '../models/lexical-knowledge.model';
import { MangaCardConfirmation } from '../models/manga-deck-confirmation.model';
import { MangaProjectedWord, MangaVocabularyIndex, MangaWordKnowledge } from '../models/manga-vocabulary-index.model';

/** Only a confirmation of this exact OCR occurrence proves a link to a curated
 * identity. Dictionary sequence numbers alone do not prove JMdict provenance. */
export function projectMangaVocabulary(index: MangaVocabularyIndex, snapshot: LexicalKnowledgeSnapshot,
  confirmations: readonly MangaCardConfirmation[]): MangaProjectedWord[] {
  return index.entries.map(entry => {
    const keys = new Set(confirmations.filter(c => c.source.volumeId === index.volumeId &&
      c.entity.word === entry.lemma && c.entity.reading === entry.reading &&
      entry.occurrences.some(o => c.source.pageNumber === o.pageIndex + 1 &&
        c.source.blockIndex === o.blockIndex && c.source.lineIndex === o.lineIndex &&
        c.source.fragment === o.context && c.source.surface === o.surface &&
        c.source.range[0] === o.start && c.source.range[1] === o.end))
      .map(c => c.entity.identity.key));
    const units = snapshot.units.filter(u => u.identities.some(i => keys.has(i.identity.key)));
    const groups = new Set(units.map(u => u.groupKey ?? u.identityKey));
    let state: MangaWordKnowledge = 'unlinked';
    if (keys.size && groups.size === 1 && units.length) {
      if (units.some(u => u.state === 'known')) state = 'known';
      else if (units.some(u => u.state === 'learning')) state = 'learning';
      else if (units.every(u => u.state === 'unknown')) state = 'unknown';
    }
    return {entry, state};
  });
}

export function mangaVocabularyMetrics(words: readonly MangaProjectedWord[]) {
  const states: MangaWordKnowledge[] = ['known', 'learning', 'unknown', 'unlinked'];
  const breakdown = states.map(state => ({state, unique: words.filter(w => w.state === state).length,
    occurrences: words.filter(w => w.state === state).reduce((n, w) => n + w.entry.occurrences.length, 0)}));
  const occurrences = words.reduce((n, w) => n + w.entry.occurrences.length, 0);
  const known = breakdown[0];
  return {breakdown, occurrences, unique: words.length,
    readingCoverage: occurrences ? 100 * known.occurrences / occurrences : null,
    uniqueCoverage: words.length ? 100 * known.unique / words.length : null};
}
