import { DeckCardProgress, DeckReviewEvent } from '../models/deck-study.model';
import { DeckEntryIndexItem } from '../models/deck-study.model';
import { getLocalStudyDayKey } from './deck-study-time';

/** Calendar ordinals, not elapsed 24h: Madrid has 23/25-hour days. */
export function deckDayOffset(due: number, now: Date): number {
  const ordinal = (date: Date) => Date.parse(getLocalStudyDayKey(date) + 'T00:00:00Z') / 86_400_000;
  return ordinal(new Date(due)) - ordinal(now);
}
export interface DeckTimeGroup { key: string; ids: readonly string[] }
const compareId = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
export const DECK_TIME_GROUPS = ['due', 'today', 'day1', 'day2', 'day3', 'day4', 'day5', 'day6', 'day7',
  'week2', 'week3', 'month1', 'month2', 'month3', 'later', 'new', 'unknown'] as const;

/** Persisted dates only. No scheduler calls, rounding of dates or writes. */
export function deckTimeGroups(entries: readonly DeckEntryIndexItem[], progress: readonly DeckCardProgress[], deckId: string, now: Date): DeckTimeGroup[] {
  const byId = new Map(progress.filter(p => p.deckId === deckId).map(p => [p.entryId, p]));
  const groups = new Map<string, { id: string; due: number; order: number }[]>();
  for (const entry of new Map(entries.map(e => [e.id, e])).values()) {
    const p = byId.get(entry.id);
    let key: string;
    if (!p || p.card.state === 0) key = 'new';
    else if (!Number.isFinite(p.card.due)) key = 'unknown';
    else if (p.card.due <= now.getTime()) key = 'due';
    else {
      const days = deckDayOffset(p.card.due, now);
      key = days === 0 ? 'today' : days <= 7 ? `day${days}` : days <= 14 ? 'week2'
        : days <= 21 ? 'week3' : days <= 30 ? 'month1' : days <= 60 ? 'month2' : days <= 90 ? 'month3' : 'later';
    }
    const rows = groups.get(key) ?? [];
    rows.push({ id: entry.id, due: p?.card.due ?? Infinity, order: entry.order }); groups.set(key, rows);
  }
  return DECK_TIME_GROUPS.filter(key => groups.has(key)).map(key => ({ key,
    ids: groups.get(key)!.sort((a, b) => (['new', 'unknown'].includes(key) ? 0 : a.due - b.due) || a.order - b.order || compareId(a.id, b.id)).map(row => row.id) }));
}

export function latestDeckRating(events: readonly DeckReviewEvent[], progress: DeckCardProgress | null): DeckReviewEvent | null {
  if (!progress || progress.card.lastReview === null) return null;
  const card = progress.card;
  // Several answers may share a millisecond. Match the persisted result, not a random UUID's order.
  return events.filter(e => e.deckId === progress.deckId && e.entryId === progress.entryId && e.reviewedAt === card.lastReview
    && e.dueAfter === card.due && e.stateAfter === card.state && e.stabilityAfter === card.stability && e.difficultyAfter === card.difficulty)
    .sort((a, b) => compareId(b.id, a.id))[0] ?? null;
}

export function deckLearningSummary(entries: readonly DeckEntryIndexItem[], progress: readonly DeckCardProgress[], events: readonly DeckReviewEvent[], deckId: string, now: Date) {
  const today = getLocalStudyDayKey(now);
  const effective = [...new Map(events.filter(e => e.deckId === deckId && e.reviewedAt <= now.getTime()
    && getLocalStudyDayKey(new Date(e.reviewedAt)) === today).map(e => [e.id, e])).values()];
  const ids = new Set(entries.map(e => e.id));
  const rows = [...new Map(progress.filter(p => p.deckId === deckId && ids.has(p.entryId)).map(p => [p.entryId, p])).values()];
  const scheduled = rows.filter(p => p.card.state !== 0);
  const future = Array.from({ length: 7 }, (_, i) => ({ day: i + 1, count: 0 }));
  let overdue = 0, laterToday = 0, beyond = 0, unknown = 0;
  for (const p of scheduled) {
    if (!Number.isFinite(p.card.due)) { unknown++; continue; }
    if (p.card.due <= now.getTime()) { overdue++; continue; }
    const days = deckDayOffset(p.card.due, now);
    if (days === 0) laterToday++;
    else if (days <= 7) future[days - 1].count++;
    else beyond++;
  }
  return { unique: new Set(effective.map(e => e.entryId)).size, attempts: effective.length,
    accuracy: effective.length ? Math.round(effective.filter(e => e.rating === 'good').length / effective.length * 100) : null,
    new: Math.max(0, ids.size - scheduled.length), learning: scheduled.filter(p => [1, 3].includes(p.card.state)).length,
    review: scheduled.filter(p => p.card.state === 2).length, future, overdue, laterToday, beyond, unknown };
}
