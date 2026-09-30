import { TestBed } from '@angular/core/testing';
import { Rating, State } from 'ts-fsrs';
import { StudyDeck } from '../models/deck.model';
import { DeckCardProgress, DeckDailyState, DeckEntryIndexItem, DeckQueueSnapshot, DeckReviewEvent, SerializedFsrsCard } from '../models/deck-study.model';
import { DeckDatabaseService } from './deck-database.service';
import { DeckSchedulePreview, DeckSchedulerService } from './deck-scheduler.service';
import { DeckSettingsService } from './deck-settings.service';
import { DeckStudyService } from './deck-study.service';

const NOW = new Date(2026, 8, 30, 12, 0, 0);
const TODAY = '2026-09-30';
const INDEX: DeckEntryIndexItem[] = Array.from({ length: 20 }, (_, index) => ({ id: `e${index + 1}`, order: index + 1 }));
const deck: StudyDeck = { id: 'japanese-1500', nameKey: 'deck', cardCount: 1500, contentType: 'japanese-word', settings: { desiredRetention: 0.9, newCardsPerDay: 10, newCardOrder: 'mixed' } };

describe('DeckStudyService', () => {
  let database: FakeDeckDatabase;
  let scheduler: FakeDeckScheduler;
  let settings: { current: StudyDeck['settings']; settingsFor: () => StudyDeck['settings'] };
  let service: DeckStudyService;

  beforeEach(() => {
    database = new FakeDeckDatabase();
    scheduler = new FakeDeckScheduler();
    settings = { current: deck.settings, settingsFor: () => settings.current };
    configure();
  });

  afterEach(() => TestBed.resetTestingModule());

  it('offers 10 new cards on a fresh day and keeps strict entry order', async () => {
    const snapshot = await service.snapshot(deck, INDEX, NOW);
    expect(snapshot.newAvailable).toBe(10);
    expect(snapshot.newEntries.map(item => item.order)).toEqual([1,2,3,4,5,6,7,8,9,10]);
    expect(snapshot.learningDue).toBe(0);
    expect(snapshot.reviewDue).toBe(0);
  });

  it.each([[0,10],[4,6],[10,0]])('with %i introduced cards exposes %i new cards', async (introduced, expected) => {
    database.daily = { deckId: deck.id, localDate: TODAY, introducedEntryIds: INDEX.slice(0, introduced).map(item => item.id), newLimitOverride: null };
    database.progress = INDEX.slice(0, introduced).map(item => progress(item.id, State.Learning, NOW.getTime() + 60_000));
    expect((await service.snapshot(deck, INDEX, NOW)).newAvailable).toBe(expected);
  });

  it('adds five cards only for today and resets to the base limit tomorrow', async () => {
    database.daily = { deckId: deck.id, localDate: TODAY, introducedEntryIds: INDEX.slice(0, 10).map(item => item.id), newLimitOverride: null };
    database.progress = INDEX.slice(0, 10).map(item => progress(item.id, State.Learning, NOW.getTime() + 60_000));
    await service.adjustTodayNewLimit(deck, 5, NOW);
    expect((await service.snapshot(deck, INDEX, NOW)).newAvailable).toBe(5);
    database.daily = null;
    expect((await service.snapshot(deck, INDEX, new Date(2026, 9, 1, 12))).newAvailable).toBe(10);
  });

  it('does not revert introduced cards when today limit is reduced below their count', async () => {
    database.daily = { deckId: deck.id, localDate: TODAY, introducedEntryIds: INDEX.slice(0, 7).map(item => item.id), newLimitOverride: 5 };
    database.progress = INDEX.slice(0, 7).map(item => progress(item.id, State.Learning, NOW.getTime() + 60_000));
    const snapshot = await service.snapshot(deck, INDEX, NOW);
    expect(snapshot.newAvailable).toBe(0);
    expect(database.progress).toHaveLength(7);
  });

  it('always prioritizes due Learning and Relearning cards', () => {
    for (const order of ['mixed', 'before-reviews', 'after-reviews'] as const) {
      settings.current = { ...settings.current, newCardOrder: order };
      const snapshot = queueSnapshot({ learning: [progress('learning', State.Learning, 1)], reviews: [progress('review', State.Review, 1)], newEntries: [{ id: 'new', order: 1 }] });
      expect(service.chooseNext(snapshot, deck, { debt: 0 }).choice?.entryId).toBe('learning');
    }
  });

  it('applies before-reviews and after-reviews ordering', () => {
    const snapshot = queueSnapshot({ reviews: [progress('review', State.Review, 1)], newEntries: [{ id: 'new', order: 1 }] });
    settings.current = { ...settings.current, newCardOrder: 'before-reviews' };
    expect(service.chooseNext(snapshot, deck, { debt: 0 }).choice?.kind).toBe('new');
    settings.current = { ...settings.current, newCardOrder: 'after-reviews' };
    expect(service.chooseNext(snapshot, deck, { debt: 0 }).choice?.kind).toBe('review');
  });

  it('mixes new cards deterministically among reviews', () => {
    settings.current = { ...settings.current, newCardOrder: 'mixed' };
    const snapshot = queueSnapshot({
      reviews: Array.from({ length: 8 }, (_, index) => progress(`r${index}`, State.Review, 1)),
      newEntries: [{ id: 'n1', order: 1 }, { id: 'n2', order: 2 }],
    });
    let cursor = { debt: 0 };
    const kinds = Array.from({ length: 8 }, () => {
      const decision = service.chooseNext(snapshot, deck, cursor); cursor = decision.cursor; return decision.choice!.kind;
    });
    expect(kinds).toEqual(['review', 'review', 'review', 'review', 'new', 'review', 'review', 'review']);
  });

  it('orders overdue reviews by lowest retrievability', async () => {
    database.progress = [progress('higher-r', State.Review, 1, 0.8), progress('lower-r', State.Review, 2, 0.3)];
    expect((await service.snapshot(deck, INDEX, NOW)).reviewEntries.map(item => item.entryId)).toEqual(['lower-r', 'higher-r']);
  });

  it('never includes future Review or Learning cards and reports the next due', async () => {
    const future = NOW.getTime() + 8 * 60_000;
    database.progress = [progress('review', State.Review, future), progress('learning', State.Learning, future + 1)];
    const snapshot = await service.snapshot(deck, INDEX, NOW);
    expect(snapshot.reviewDue).toBe(0);
    expect(snapshot.learningDue).toBe(0);
    expect(snapshot.nextDue).toBe(future);
  });

  it.each(['again', 'good'] as const)('atomically persists and undoes a first New → %s rating', async rating => {
    const choice = { entryId: 'e1', kind: 'new' as const, progress: null };
    const event = await service.rate(deck, choice, scheduler.previewValue, rating, 1234, NOW);
    expect(database.progress).toHaveLength(1);
    expect(database.events).toHaveLength(1);
    expect(database.daily?.introducedEntryIds).toEqual(['e1']);
    await service.undo(event);
    expect(database.progress).toHaveLength(0);
    expect(database.events).toHaveLength(0);
    expect(database.daily?.introducedEntryIds).toEqual([]);
  });

  it.each(['again', 'good'] as const)('atomically persists and undoes a Review → %s rating', async rating => {
    const before = progress('e1', State.Review, NOW.getTime() - 1);
    database.progress = [before];
    const choice = { entryId: 'e1', kind: 'review' as const, progress: before };
    const event = await service.rate(deck, choice, scheduler.previewValue, rating, 500, NOW);
    await service.undo(event);
    expect(database.progress[0].card).toEqual(before.card);
    expect(database.events).toHaveLength(0);
  });

  it('survives service recreation because persisted progress is repository-owned', async () => {
    await service.rate(deck, { entryId: 'e1', kind: 'new', progress: null }, scheduler.previewValue, 'good', 100, NOW);
    TestBed.resetTestingModule(); configure();
    const restored = await service.snapshot(deck, INDEX, NOW);
    expect(restored.progress).toHaveLength(1);
    expect(restored.introducedToday).toBe(1);
  });

  it('uses changed retention only for the next preview without changing existing due dates', async () => {
    database.progress = [progress('e1', State.Review, 12345)];
    settings.current = { ...settings.current, desiredRetention: 0.95 };
    service.preview(deck, { entryId: 'e1', kind: 'review', progress: database.progress[0] }, NOW);
    expect(scheduler.lastRetention).toBe(0.95);
    expect(database.progress[0].due).toBe(12345);
  });

  it('calculates raw and first-review-per-card/day retention separately', async () => {
    const first = await service.rate(deck, { entryId: 'e1', kind: 'new', progress: null }, scheduler.previewValue, 'again', 10, NOW);
    const e1Progress = database.progress.find(item => item.entryId === 'e1')!;
    await service.rate(deck, { entryId: 'e1', kind: 'learning', progress: e1Progress }, scheduler.previewValue, 'good', 10, new Date(NOW.getTime() + 1000));
    await service.rate(deck, { entryId: 'e2', kind: 'new', progress: null }, scheduler.previewValue, 'good', 10, new Date(NOW.getTime() + 2000));
    const stats = await service.statistics(deck, 1500, NOW);
    expect(first.rating).toBe('again');
    expect(stats.observedRetention).toBeCloseTo(2 / 3);
    expect(stats.trueRetention).toBe(0.5);
  });

  function configure(): void {
    TestBed.configureTestingModule({ providers: [
      DeckStudyService,
      { provide: DeckDatabaseService, useValue: database },
      { provide: DeckSchedulerService, useValue: scheduler },
      { provide: DeckSettingsService, useValue: settings },
    ] });
    service = TestBed.inject(DeckStudyService);
  }
});

class FakeDeckScheduler {
  lastRetention = 0;
  readonly previewValue = previewFixture();
  preview(_progress: DeckCardProgress | null, retention: number) { this.lastRetention = retention; return this.previewValue; }
  branch(preview: DeckSchedulePreview, rating: 'again' | 'good') { return rating === 'again' ? preview.again : preview.good; }
  retrievability(value: DeckCardProgress) { return value.card.stability; }
}

class FakeDeckDatabase {
  progress: DeckCardProgress[] = [];
  events: DeckReviewEvent[] = [];
  daily: DeckDailyState | null = null;
  async getDeckProgress() { return [...this.progress]; }
  async getDeckReviewEvents() { return [...this.events]; }
  async getDailyState(_deckId: string, localDate: string) { return this.daily?.localDate === localDate ? { ...this.daily, introducedEntryIds: [...this.daily.introducedEntryIds] } : null; }
  async writeDailyState(state: DeckDailyState) { this.daily = state; }
  async commitReview(value: DeckCardProgress, event: DeckReviewEvent, daily: DeckDailyState) { this.progress = [...this.progress.filter(item => item.entryId !== value.entryId), value]; this.events.push(event); this.daily = daily; }
  async undoReview(event: DeckReviewEvent, daily: DeckDailyState) { this.progress = event.cardBefore ? [...this.progress.filter(item => item.entryId !== event.entryId), progressFromCard(event.entryId, event.cardBefore)] : this.progress.filter(item => item.entryId !== event.entryId); this.events = this.events.filter(item => item.id !== event.id); this.daily = daily; }
}

function card(state: State, due: number, stability = 0.5): SerializedFsrsCard { return { due, stability, difficulty: 5, elapsedDays: 0, scheduledDays: 0, learningSteps: 0, reps: 1, lapses: 0, state, lastReview: due - 1000 }; }
function progress(entryId: string, state: State, due: number, stability = 0.5): DeckCardProgress { return { deckId: deck.id, entryId, due, state, card: card(state, due, stability) }; }
function progressFromCard(entryId: string, value: SerializedFsrsCard): DeckCardProgress { return { deckId: deck.id, entryId, due: value.due, state: value.state, card: value }; }
function previewFixture(): DeckSchedulePreview {
  const before = card(State.New, NOW.getTime(), 0);
  const branch = (rating: Rating.Again | Rating.Good, state: State) => ({ card: card(state, NOW.getTime() + 60_000), log: { rating, state: State.New, due: NOW.getTime(), stability: 0, difficulty: 0, elapsedDays: 0, lastElapsedDays: 0, scheduledDays: 0, learningSteps: 0, review: NOW.getTime() } });
  return { generatedAt: NOW.getTime(), desiredRetention: 0.9, cardBefore: before, retrievabilityBefore: null, again: branch(Rating.Again, State.Learning), good: branch(Rating.Good, State.Learning) };
}
function queueSnapshot(input: { learning?: DeckCardProgress[]; reviews?: DeckCardProgress[]; newEntries?: DeckEntryIndexItem[] }): DeckQueueSnapshot {
  return { progress: [], learningEntries: input.learning ?? [], reviewEntries: input.reviews ?? [], newEntries: input.newEntries ?? [], learningDue: input.learning?.length ?? 0, reviewDue: input.reviews?.length ?? 0, newAvailable: input.newEntries?.length ?? 0, introducedToday: 0, effectiveNewLimit: 10, nextLearningDue: null, nextDue: null, remainingUnseen: input.newEntries?.length ?? 0 };
}
