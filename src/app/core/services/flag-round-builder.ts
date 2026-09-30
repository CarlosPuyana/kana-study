import { FlagStudyUnit } from '../models/country.model';
import { FlagStudyProgress } from '../models/flag-study.model';

export interface FlagRoundOptions {
  readonly units: readonly FlagStudyUnit[];
  readonly progress: Readonly<Record<string, FlagStudyProgress>>;
  readonly now: Date;
  readonly limit: number;
}

export function buildFlagRound(options: FlagRoundOptions): readonly FlagStudyUnit[] {
  const now = options.now.getTime();
  const due = options.units
    .filter(unit => options.progress[unit.key]
      && new Date(options.progress[unit.key].fsrs.due).getTime() <= now)
    .sort((left, right) => options.progress[left.key].fsrs.due.localeCompare(
      options.progress[right.key].fsrs.due,
    ));
  const fresh = options.units
    .filter(unit => options.progress[unit.key] === undefined)
    .sort((left, right) => stableOrder(left.key) - stableOrder(right.key));
  return selectDistinctCountries([...due, ...fresh], options.limit);
}

function selectDistinctCountries(
  units: readonly FlagStudyUnit[],
  limit: number,
): readonly FlagStudyUnit[] {
  const selected: FlagStudyUnit[] = [];
  const deferred: FlagStudyUnit[] = [];
  const countryIds = new Set<string>();
  for (const unit of units) {
    if (countryIds.has(unit.countryId)) deferred.push(unit);
    else {
      selected.push(unit);
      countryIds.add(unit.countryId);
    }
    if (selected.length === limit) return selected;
  }
  for (const unit of deferred) {
    if (selected.length === limit) break;
    selected.push(unit);
  }
  return selected;
}

function stableOrder(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
