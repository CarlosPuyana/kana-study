import { DeckQueueChoice, DeckReviewEvent } from '../models/deck-study.model';
import { getLocalStudyDayKey } from './deck-study-time';

export interface DeckSeparation {
  readonly entryId: string;
  readonly seen: readonly string[];
}

/** Rebuild presentation metadata from effective history; never writes a review. */
export function deckSeparations(events: readonly DeckReviewEvent[], deckId: string, now: Date,
  receiptOrder: ReadonlyMap<string, number> = new Map()): DeckSeparation[] {
  const day = getLocalStudyDayKey(now);
  const ordered = [...new Map(events.filter(e => e.deckId === deckId && e.reviewedAt <= now.getTime()
    && getLocalStudyDayKey(new Date(e.reviewedAt)) === day).map(e => [e.id, e])).values()]
    .sort((a, b) => a.reviewedAt - b.reviewedAt
      || (receiptOrder.has(a.id) || receiptOrder.has(b.id) ? (receiptOrder.get(a.id) ?? -1) - (receiptOrder.get(b.id) ?? -1) : 0)
      || (a.cardBefore?.reps ?? 0) - (b.cardBefore?.reps ?? 0)
      || compareDeckId(a.id, b.id));
  const pending = new Map<string, Set<string>>();
  for (const event of ordered) {
    for (const [id, seen] of pending) {
      if (id !== event.entryId) seen.add(event.entryId);
      if (seen.size >= 2) pending.delete(id);
    }
    pending.delete(event.entryId);
    pending.set(event.entryId, new Set());
  }
  return [...pending].map(([entryId, seen]) => ({ entryId, seen: [...seen] }));
}

/** Chronological/new-order candidates, delayed only while a distinct alternative remains. */
export function separatedDeckChoice(choices: readonly DeckQueueChoice[], separation: readonly DeckSeparation[]): DeckQueueChoice | null {
  const byId = new Map(separation.map(row => [row.entryId, row]));
  const available = choices.find(choice => {
    const row = byId.get(choice.entryId);
    return !row || row.seen.length >= 2 || !choices.some(other => other.entryId !== choice.entryId && !row.seen.includes(other.entryId));
  });
  if (available) return available;
  // A changed candidate set can produce conflicting constraints. Oldest answer wins;
  // every selection returns a real candidate and no internal retry loop is needed.
  return separation.map(row => choices.find(choice => choice.entryId === row.entryId)).find(choice => !!choice) ?? choices[0] ?? null;
}

export function compareDeckId(a: string, b: string): number { return a < b ? -1 : a > b ? 1 : 0; }
