import { TestBed } from '@angular/core/testing';
import { createEmptyCard, dateDiffInDays, forgetting_curve, FSRSAlgorithm, generatorParameters, Rating, State } from 'ts-fsrs';
import { VOCABULARY_N5 } from '../../data/vocabulary-n5.generated';
import { DeckCardProgress } from '../models/deck-study.model';
import { VocabularyStudyUnit } from '../models/vocabulary.model';
import { DeckSchedulerService, DECK_SCHEDULER_ENABLE_FUZZ } from './deck-scheduler.service';
import { serializeDeckCard } from './deck-study-serialization';
import { deckCardEligible, formatStudyInterval } from './deck-study-time';
import { SpacedRepetitionService } from './spaced-repetition.service';
import { VocabularyProgressService } from './vocabulary-progress.service';

const NOW = new Date('2026-11-04T11:00:00Z');
const DAY = 86_400_000;
const card = serializeDeckCard({ ...createEmptyCard(NOW), state: State.Review, stability: 30, difficulty: 5,
  reps: 8, scheduled_days: 30, last_review: new Date(NOW.getTime() - 30 * DAY) });
const progress: DeckCardProgress = { deckId: 'japanese-1500', entryId: 'audit-only', due: card.due, state: card.state, card };

// Characterization of the audited implementation, not authorization to change its policy.
describe('SRS audit: independently checked equations and persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [{ provide: DECK_SCHEDULER_ENABLE_FUZZ, useValue: false }] });
  });
  afterEach(() => { TestBed.resetTestingModule(); localStorage.clear(); });

  it('agrees with the FSRS-6 equations for initialization, difficulty, recall and lapse', () => {
    const params = generatorParameters(), w = params.w, engine = new FSRSAlgorithm(params);
    const initial = engine.next_state(null, 0, Rating.Good);
    expect(initial.stability).toBe(w[2]);
    expect(initial.difficulty).toBeCloseTo(Math.max(1, Math.min(10, w[4] - Math.exp(2 * w[5]) + 1)), 7);
    const r = (1 + (Math.pow(.9, -1 / w[20]) - 1)) ** -w[20];
    expect(forgetting_curve(w, 30, 30)).toBe(.9);
    const good = engine.next_state({ stability: 30, difficulty: 5 }, 30, Rating.Good);
    expect(good.stability).toBeCloseTo(30 * (1 + Math.exp(w[8]) * 6 * 30 ** -w[9] * (Math.exp(w[10] * (1 - r)) - 1)), 6);
    expect(good.difficulty).toBeCloseTo(w[7] * (w[4] - Math.exp(3 * w[5]) + 1) + (1 - w[7]) * 5, 7);
    const failed = engine.next_state({ stability: 30, difficulty: 5 }, 30, Rating.Again);
    const raw = w[11] * 5 ** -w[12] * (31 ** w[13] - 1) * Math.exp(w[14] * (1 - r));
    expect(failed.stability).toBeCloseTo(Math.min(30 / Math.exp(w[17] * w[18]), raw), 6);
    expect(failed.difficulty).toBeGreaterThan(good.difficulty);
  });

  it('starts a genuinely new card in minutes, never months, for every available Vocabulary rating', () => {
    const service = TestBed.inject(SpacedRepetitionService);
    expect(['again', 'hard', 'good'].map(rating => {
      const next = service.review(null, rating as 'again' | 'hard' | 'good', NOW);
      expect(next.state).toBe('learning');
      expect(next.reps).toBe(1);
      return (Date.parse(next.due) - NOW.getTime()) / 60_000;
    })).toEqual([1, 6, 10]);
  });

  it('produces the same normal Review memory and due in both modules when fuzz and retention match', () => {
    const next = TestBed.inject(SpacedRepetitionService).review({ ...card, state: 'review',
      due: new Date(card.due).toISOString(), lastReview: new Date(card.lastReview!).toISOString() }, 'good', NOW);
    const actual = TestBed.inject(DeckSchedulerService).preview(progress, .9, NOW).good.card;
    expect(actual).toEqual({ ...next, due: Date.parse(next.due), lastReview: Date.parse(next.lastReview!), state: State.Review });
    expect(actual.scheduledDays).toBe(85);
  });

  it('persists exact Vocabulary before/after states across reload without practice rescheduling', () => {
    const entry = VOCABULARY_N5[0];
    const unit: VocabularyStudyUnit = { key: `vocab:${entry.id}:japanese-to-meaning`, entryId: entry.id, questionType: 'japanese-to-meaning' };
    const service = TestBed.inject(VocabularyProgressService);
    service.recordReview(unit, 'good', true, 'audit-session', NOW);
    const first = structuredClone(service.get(unit.key)!.fsrs);
    service.recordPracticeAttempt(unit, true, new Date(NOW.getTime() + 1_000));
    expect(service.get(unit.key)!.fsrs).toEqual(first);
    expect(service.reviewEvents()).toHaveLength(1);
    TestBed.resetTestingModule();
    const restored = TestBed.inject(VocabularyProgressService);
    expect(restored.get(unit.key)!.fsrs).toEqual(first);
    const nextAt = new Date(NOW.getTime() + DAY);
    restored.recordReview(unit, 'good', true, 'audit-session-2', nextAt);
    expect(restored.reviewEvents()[1].fsrsBefore).toEqual(first);
    expect(restored.reviewEvents()[1].fsrsAfter).toEqual(restored.get(unit.key)!.fsrs);
    expect(restored.get(unit.key)!.fsrs).toMatchObject({ reps: 2, scheduledDays: 7, state: 'review' });
  });

  it('shows rounded months while keeping the exact scheduled number of days', () => {
    for (const days of [45, 60, 74]) expect(formatStudyInterval(days * DAY)).toEqual({ value: 2, unit: 'months' });
    for (const days of [75, 90, 104]) expect(formatStudyInterval(days * DAY)).toEqual({ value: 3, unit: 'months' });
    const preview = TestBed.inject(DeckSchedulerService).preview(progress, .9, NOW);
    expect(formatStudyInterval(preview.good.card.scheduledDays * DAY)).toEqual({ value: 3, unit: 'months' });
    expect(preview.good.card.due).toBe(NOW.getTime() + 85 * DAY);
  });

  it('preserves the displayed interval when answering later without rerolling the preview', () => {
    const scheduler = TestBed.inject(DeckSchedulerService), preview = scheduler.preview(progress, .9, NOW);
    const answerAt = new Date(NOW.getTime() + 13_000), branch = scheduler.branch(preview, 'good', answerAt);
    expect(branch.card.due - answerAt.getTime()).toBe(preview.good.card.due - NOW.getTime());
    expect(branch.card.stability).toBe(preview.good.card.stability);
  });

  it('documents the UTC-day vs full-day recoverability discrepancy without changing production', () => {
    const last = new Date('2026-11-04T23:59:00Z'), now = new Date('2026-11-05T00:01:00Z');
    const scheduler = TestBed.inject(DeckSchedulerService);
    const preview = scheduler.preview({ ...progress, card: { ...card, lastReview: last.getTime() } }, .9, now);
    expect(dateDiffInDays(last, now)).toBe(1);
    expect(preview.good.card.elapsedDays).toBe(1);
    expect(preview.retrievabilityBefore).toBe(1);
    expect(forgetting_curve(generatorParameters().w, 1, 30)).toBe(.99505387);
  });

  it('documents a stale multi-day preview rather than hiding it with recalculation', () => {
    const scheduler = TestBed.inject(DeckSchedulerService), preview = scheduler.preview(progress, .9, NOW);
    const at = new Date(NOW.getTime() + 2 * DAY);
    const frozen = scheduler.branch(preview, 'good', at), fresh = scheduler.preview(progress, .9, at);
    expect(frozen.card.stability).not.toBe(fresh.good.card.stability);
    expect(frozen.card.elapsedDays).toBe(30);
    expect(fresh.good.card.elapsedDays).toBe(32);
  });

  it('uses Madrid-day availability for Review and Learning independently of the due hour', () => {
    expect(deckCardEligible({ ...card, due: Date.parse('2026-11-04T20:00:00Z') }, NOW)).toBe(true);
    expect(deckCardEligible({ ...card, state: State.Learning, due: Date.parse('2026-11-04T20:00:00Z') }, NOW)).toBe(true);
  });
});
