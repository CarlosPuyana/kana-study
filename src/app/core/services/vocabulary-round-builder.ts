import { VocabularyStudyUnit } from '../models/vocabulary.model';
import { VocabularyStudyProgress } from '../models/vocabulary-study.model';
import { RandomSource, shuffledWithoutAdjacentContent } from './random-order';

export function buildVocabularyRound(options: {
  units: readonly VocabularyStudyUnit[];
  progress: Readonly<Record<string, VocabularyStudyProgress>>;
  now: Date;
  limit: number;
  random?: RandomSource;
}): readonly VocabularyStudyUnit[] {
  const time = options.now.getTime();
  const due = options.units
    .filter(unit => options.progress[unit.key]
      && new Date(options.progress[unit.key].fsrs.due).getTime() <= time)
    .sort((a, b) => options.progress[a.key].fsrs.due.localeCompare(options.progress[b.key].fsrs.due));
  const fresh = shuffledWithoutAdjacentContent(
    options.units.filter(unit => !options.progress[unit.key]),
    unit => unit.entryId,
    options.random,
  );
  const selected: VocabularyStudyUnit[] = [];
  const deferred: VocabularyStudyUnit[] = [];
  const ids = new Set<string>();
  for (const unit of [...due, ...fresh]) {
    if (ids.has(unit.entryId)) deferred.push(unit);
    else {
      selected.push(unit);
      ids.add(unit.entryId);
    }
    if (selected.length === options.limit) return selected;
  }
  for (const unit of deferred) {
    if (selected.length === options.limit) break;
    selected.push(unit);
  }
  return selected;
}
