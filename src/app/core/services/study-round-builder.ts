import { StudyProgress, StudyUnit } from '../models/progress.model';

export type StudyProgressMap = Readonly<Record<string, StudyProgress>>;

export interface StudyRoundOptions {
  readonly units: readonly StudyUnit[];
  readonly progress: StudyProgressMap;
  readonly now: Date;
  readonly limit: number;
  readonly newUnitOrder: (unit: StudyUnit) => number;
}

export function buildStudyRound(options: StudyRoundOptions): readonly StudyUnit[] {
  const now = options.now.getTime();
  const due = options.units
    .filter(unit => {
      const stored = options.progress[unit.key];
      return stored !== undefined && new Date(stored.fsrs.due).getTime() <= now;
    })
    .sort((a, b) => options.progress[a.key].fsrs.due.localeCompare(
      options.progress[b.key].fsrs.due,
    ));
  const fresh = options.units
    .filter(unit => options.progress[unit.key] === undefined)
    .sort((a, b) => options.newUnitOrder(a) - options.newUnitOrder(b));

  return selectUniqueKana([...due, ...fresh], options.limit);
}

function selectUniqueKana(units: readonly StudyUnit[], limit: number): readonly StudyUnit[] {
  const selected: StudyUnit[] = [];
  const deferred: StudyUnit[] = [];
  const kanaIds = new Set<string>();

  for (const unit of units) {
    if (kanaIds.has(unit.kanaId)) deferred.push(unit);
    else {
      selected.push(unit);
      kanaIds.add(unit.kanaId);
    }
    if (selected.length >= limit) return selected;
  }

  for (const unit of deferred) {
    if (selected.length >= limit) break;
    selected.push(unit);
  }
  return selected;
}
