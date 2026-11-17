import { DeckQueueSnapshot } from '../models/deck-study.model';

/** Pending cards, not attempts or queue slots. Scheduling remains owned by the snapshot. */
export function deckStudyCounts(snapshot: DeckQueueSnapshot | null) {
  return {
    new: snapshot?.newAvailable ?? 0,
    // FSRS Learning (1) and Relearning (3), including steps that are not due yet.
    learning: new Set(snapshot?.progress.filter(p => p.card.state === 1 || p.card.state === 3)
      .map(p => p.entryId)).size,
    review: snapshot?.reviewDue ?? 0,
  };
}
