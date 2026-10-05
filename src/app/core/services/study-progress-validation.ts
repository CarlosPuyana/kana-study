import { FsrsProgress } from '../models/progress.model';

type RecordValue = Record<string, unknown>;
const record = (value: unknown): value is RecordValue => !!value && typeof value === 'object' && !Array.isArray(value);
const date = (value: unknown): value is string => typeof value === 'string' && Number.isFinite(Date.parse(value));
const count = (value: unknown): value is number => typeof value === 'number' && Number.isInteger(value) && value >= 0;
const number = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0;

/** Validate persisted input only; never calculate or alter an FSRS interval. */
function fsrs(value: unknown): FsrsProgress | null {
  if (!record(value) || !date(value['due']) || !number(value['stability']) || !number(value['difficulty'])
    || !number(value['elapsedDays']) || !number(value['scheduledDays']) || !count(value['reps']) || !count(value['lapses'])
    || !(typeof value['state'] === 'string' && ['new', 'learning', 'review', 'relearning'].includes(value['state']))
    || !(value['lastReview'] === null || date(value['lastReview']))
    || !(value['learningSteps'] === undefined || count(value['learningSteps']))) return null;
  // Older compatible records predate the learningSteps serialization field.
  return { ...value, learningSteps: value['learningSteps'] ?? 0 } as unknown as FsrsProgress;
}

function unit(value: RecordValue, identity: string, types: readonly string[]): boolean {
  return typeof value['key'] === 'string' && !!value['key']
    && typeof value[identity] === 'string' && !!value[identity]
    && typeof value['questionType'] === 'string' && types.includes(value['questionType']);
}

/** Keep valid entries, including disabled content; leave the stored source untouched. */
export function readStudyProgress<T>(value: unknown, identity: string, types: readonly string[]): Record<string, T> {
  const safe: Record<string, T> = {};
  if (!record(value)) return safe;
  for (const [key, item] of Object.entries(value)) {
    if (!record(item) || !unit(item, identity, types) || item['key'] !== key) continue;
    const scheduling = fsrs(item['fsrs']);
    if (!scheduling || !date(item['firstSeenAt']) || !date(item['lastSeenAt'])
      || !count(item['totalAttempts']) || !count(item['totalFirstTrySuccesses']) || !count(item['totalFailures'])
      || !(item['lastRating'] === null || typeof item['lastRating'] === 'string' && ['again', 'hard', 'good'].includes(item['lastRating']))) continue;
    Object.defineProperty(safe, key, {value: {...item, fsrs: scheduling}, enumerable: true, configurable: true, writable: true});
  }
  return safe;
}

export function readReviewEvents<T>(value: unknown, identity: string, types: readonly string[]): readonly T[] {
  if (!Array.isArray(value)) return [];
  return value.filter(item => record(item) && unit(item, identity, types)
    && typeof item['id'] === 'string' && !!item['id'] && typeof item['sessionId'] === 'string' && !!item['sessionId']
    && typeof item['rating'] === 'string' && ['again', 'hard', 'good'].includes(item['rating']) && date(item['reviewedAt'])
    && (item['fsrsBefore'] === null || !!fsrs(item['fsrsBefore'])) && !!fsrs(item['fsrsAfter']))
    .map(item => ({...item, fsrsBefore: item.fsrsBefore === null ? null : fsrs(item.fsrsBefore), fsrsAfter: fsrs(item.fsrsAfter)}) as T);
}
