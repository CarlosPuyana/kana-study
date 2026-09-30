import { KanjiStudyUnit } from '../models/kanji.model';
import { KanjiStudyProgress } from '../models/kanji-study.model';
import { RandomSource, shuffledWithoutAdjacentContent } from './random-order';

export function buildKanjiRound(options: {
  units: readonly KanjiStudyUnit[];
  progress: Readonly<Record<string, KanjiStudyProgress>>;
  now: Date;
  limit: number;
  random?: RandomSource;
}): readonly KanjiStudyUnit[] {
  const time = options.now.getTime();
  const due = options.units
    .filter(unit => options.progress[unit.key]
      && new Date(options.progress[unit.key].fsrs.due).getTime() <= time)
    .sort((a, b) => options.progress[a.key].fsrs.due.localeCompare(options.progress[b.key].fsrs.due));
  const fresh = shuffledWithoutAdjacentContent(
    options.units.filter(unit => !options.progress[unit.key]),
    unit => unit.kanjiId,
    options.random,
  );
  const selected: KanjiStudyUnit[] = [];
  const deferred: KanjiStudyUnit[] = [];
  const ids = new Set<string>();
  for (const unit of [...due, ...fresh]) {
    if (ids.has(unit.kanjiId)) deferred.push(unit);
    else {
      selected.push(unit);
      ids.add(unit.kanjiId);
    }
    if (selected.length === options.limit) return selected;
  }
  for (const unit of deferred) {
    if (selected.length === options.limit) break;
    selected.push(unit);
  }
  return selected;
}
