import { TestBed } from '@angular/core/testing';
import { Rating, State } from 'ts-fsrs';
import { DeckCardProgress } from '../models/deck-study.model';
import { DECK_SCHEDULER_ENABLE_FUZZ, DeckSchedulerService } from './deck-scheduler.service';
import { deserializeDeckCard, deserializeDeckReviewLog, serializeDeckCard, serializeDeckReviewLog } from './deck-study-serialization';

describe('DeckSchedulerService', () => {
  let scheduler: DeckSchedulerService;
  const now = new Date('2026-09-30T10:00:00.000Z');

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [
      DeckSchedulerService,
      { provide: DECK_SCHEDULER_ENABLE_FUZZ, useValue: false },
    ] });
    scheduler = TestBed.inject(DeckSchedulerService);
  });

  afterEach(() => TestBed.resetTestingModule());

  it('creates a New card preview with the configured learning steps', () => {
    const preview = scheduler.preview(null, 0.9, now);
    expect(preview.cardBefore.state).toBe(State.New);
    expect(preview.again.card.due - now.getTime()).toBe(60_000);
    expect(preview.good.card.due - now.getTime()).toBe(10 * 60_000);
  });

  it('maps the two public ratings only to FSRS Again and Good', () => {
    const preview = scheduler.preview(null, 0.9, now);
    expect(scheduler.branch(preview, 'again').log.rating).toBe(Rating.Again);
    expect(scheduler.branch(preview, 'good').log.rating).toBe(Rating.Good);
    expect([preview.again.log.rating, preview.good.log.rating]).not.toContain(Rating.Hard);
    expect([preview.again.log.rating, preview.good.log.rating]).not.toContain(Rating.Easy);
  });

  it('persists the exact branch shown by the preview', () => {
    const preview = scheduler.preview(null, 0.9, now);
    expect(scheduler.branch(preview, 'again').card).toBe(preview.again.card);
    expect(scheduler.branch(preview, 'good').card).toBe(preview.good.card);
  });

  it('calculates retrievability before a non-New review', () => {
    const first = scheduler.preview(null, 0.9, now).good.card;
    const progress = asProgress(first);
    const next = scheduler.preview(progress, 0.9, new Date(first.due));
    expect(next.retrievabilityBefore).not.toBeNull();
    expect(next.retrievabilityBefore!).toBeGreaterThan(0);
  });

  it('uses the configured 10 minute relearning step after a Review lapse', () => {
    const learning = scheduler.preview(null, 0.9, now).good.card;
    const review = scheduler.preview(asProgress(learning), 0.9, new Date(learning.due)).good.card;
    expect(review.state).toBe(State.Review);
    const lapseAt = new Date(review.due);
    const lapse = scheduler.preview(asProgress(review), 0.9, lapseAt).again.card;
    expect(lapse.state).toBe(State.Relearning);
    expect(lapse.due - lapseAt.getTime()).toBe(10 * 60_000);
  });

  it('round-trips FSRS cards and review logs with Date conversion centralized', () => {
    const preview = scheduler.preview(null, 0.9, now);
    const card = deserializeDeckCard(preview.good.card);
    const log = deserializeDeckReviewLog(preview.good.log);
    expect(card.due).toBeInstanceOf(Date);
    expect(log.review).toBeInstanceOf(Date);
    expect(serializeDeckCard(card as never)).toEqual(preview.good.card);
    expect(serializeDeckReviewLog(log as never)).toEqual(preview.good.log);
  });

  it('rolls a reviewed card back to its previous FSRS state', () => {
    const preview = scheduler.preview(null, 0.9, now);
    const rolledBack = scheduler.rollback(preview.good.card, preview.good.log, 0.9);
    expect(rolledBack).toEqual(preview.cardBefore);
  });

  it('uses desired retention for subsequent Review intervals', () => {
    const initial = scheduler.preview(null, 0.9, now).good.card;
    const second = scheduler.preview(asProgress(initial), 0.9, new Date(initial.due)).good.card;
    const review = asProgress(second);
    const reviewAt = new Date(second.due);
    const lowRetention = scheduler.preview(review, 0.8, reviewAt).good.card.due;
    const highRetention = scheduler.preview(review, 0.97, reviewAt).good.card.due;
    expect(highRetention).toBeLessThanOrEqual(lowRetention);
  });
});

function asProgress(card: DeckCardProgress['card']): DeckCardProgress {
  return { deckId: 'japanese-1500', entryId: 'entry-1', due: card.due, state: card.state, card };
}
