import { DeckCardProgress, DeckReviewEvent } from '../models/deck-study.model';

const date = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && Number.isFinite(new Date(v).getTime());
export interface DeckHistoryRow {
  event: DeckReviewEvent;
  ordinal: number;
  waitMs: number | null;
  complete: boolean;
}
/** Effective events come from the workspace router, never from public content. No replay or writes. */
export function deckCardHistory(events: readonly DeckReviewEvent[], progress: DeckCardProgress | null, deckId: string, entryId: string) {
  const matching = [...new Map(events.filter(e => e.deckId === deckId && e.entryId === entryId).map(e => [e.id, e])).values()];
  const chronological = matching.filter(e => date(e.reviewedAt) && ['again', 'good'].includes(e.rating))
    .sort((a, b) => a.reviewedAt - b.reviewedAt || (a.cardBefore?.reps ?? 0) - (b.cardBefore?.reps ?? 0) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const rows: DeckHistoryRow[] = chronological.map((event, i) => {
    const waitMs = date(event.dueAfter) && event.dueAfter >= event.reviewedAt ? event.dueAfter - event.reviewedAt : null;
    return { event, ordinal: i + 1, waitMs, complete: waitMs !== null && [0, 1, 2, 3].includes(event.stateAfter) };
  });
  return { rows: rows.reverse(), incomplete: matching.length !== rows.length || rows.some(r => !r.complete)
    || !!progress && progress.card.reps > rows.length || !!rows.length && rows.at(-1)!.event.stateBefore !== 0 };
}
