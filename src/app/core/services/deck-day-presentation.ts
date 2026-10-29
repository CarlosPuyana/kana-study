import { inject, Injectable } from '@angular/core';
import { DeckDefinition } from '../models/deck-catalog.model';
import { DeckQueueChoice, DeckQueueSnapshot, DeckReviewEvent } from '../models/deck-study.model';
import { DeckPersistenceRouter } from './deck-persistence-router';
import { getLocalStudyDayKey } from './deck-study-time';

export interface DeckDayCounts { new: number; repeat: number; review: number }
export interface DeckDayDifficulty { entryId: string; failures: number; lastFailure: number }

/** Effective events only; duplicate receipts cannot inflate the ranking. */
export function deckDayDifficulties(events: readonly DeckReviewEvent[], deckId: string, now: Date): DeckDayDifficulty[] {
  const day=getLocalStudyDayKey(now), seen=new Set<string>(), rows=new Map<string,DeckDayDifficulty>();
  for(const e of events){
    if(seen.has(e.id)||e.deckId!==deckId||e.rating!=='again'||getLocalStudyDayKey(new Date(e.reviewedAt))!==day)continue;
    seen.add(e.id);
    const row=rows.get(e.entryId)??{entryId:e.entryId,failures:0,lastFailure:0};
    row.failures++;row.lastFailure=Math.max(row.lastFailure,e.reviewedAt);rows.set(e.entryId,row);
  }
  return [...rows.values()].sort((a,b)=>b.failures-a.failures||b.lastFailure-a.lastFailure||(a.entryId<b.entryId?-1:a.entryId>b.entryId?1:0));
}

/** A read-only presentation of canonical history. Never participates in scheduling. */
export function deckDayCounts(snapshot: DeckQueueSnapshot, events: readonly DeckReviewEvent[], deckId: string,
  now: Date, active: DeckQueueChoice | null = null): DeckDayCounts {
  const day = getLocalStudyDayKey(now);
  const answered = new Set(events.filter(e => e.deckId === deckId && getLocalStudyDayKey(new Date(e.reviewedAt)) === day).map(e => e.entryId));
  const counts = { new: snapshot.newAvailable, repeat: 0, review: 0 };
  const pending = new Map(snapshot.progress.filter(p => p.card.state !== 0 &&
    getLocalStudyDayKey(new Date(p.due)) <= day).map(p => [p.entryId, p]));
  // Keep an already presented card visible even if the daily quota changes.
  if (active?.progress) pending.set(active.entryId, active.progress);
  if (active && !active.progress && !snapshot.newEntries.some(e => e.id === active.entryId)) counts.new++;
  for (const id of pending.keys()) answered.has(id) ? counts.repeat++ : counts.review++;
  return counts;
}

@Injectable({ providedIn: 'root' })
export class DeckDayPresentation {
  private readonly persistence = inject(DeckPersistenceRouter);
  async events(deck: DeckDefinition): Promise<readonly DeckReviewEvent[]> {
    // The router supplies effective events: builtin undo deletes them; custom
    // history excludes noncanonical/undone events before returning them.
    return this.persistence.bind(deck.id).getDeckReviewEvents(deck.id);
  }
}
