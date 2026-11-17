import { TestBed } from '@angular/core/testing';
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { DeckDefinition } from '../models/deck-catalog.model';
import { DeckCardProgress } from '../models/deck-study.model';
import { DeckDatabaseService } from './deck-database.service';
import { DECK_SCHEDULER_ENABLE_FUZZ } from './deck-scheduler.service';
import { DeckSettingsService } from './deck-settings.service';
import { deckStudyCounts } from './deck-study-counts';
import { DeckStudyService } from './deck-study.service';
import { SyncOutboxService } from './sync-outbox.service';
import { WorkspaceService } from './workspace.service';

const NOW = new Date('2026-11-10T18:00:00Z');
const deck: DeckDefinition = { id: 'japanese-1500', cardCount: 5, contentType: 'japanese-word',
  settings: { desiredRetention: .9, newCardsPerDay: 1, newCardOrder: 'before-reviews' } };
const index = ['a', 'b', 'c', 'd', 'e'].map((id, order) => ({ id, order }));
function progress(entryId: string, state: 1 | 2 | 3, minutes: number): DeckCardProgress {
  const due = NOW.getTime() + minutes * 60000;
  return { deckId: deck.id, entryId, due, state, card: { due, state, stability: 30, difficulty: 5,
    reps: 20, lapses: 1, learningSteps: 0, scheduledDays: 30, elapsedDays: 30,
    lastReview: NOW.getTime() - 30 * 86400000 } };
}

describe('Mazos pending header from canonical snapshots', () => {
  let study: DeckStudyService, db: DeckDatabaseService;
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('indexedDB', new IDBFactory()); vi.stubGlobal('IDBKeyRange', IDBKeyRange);
    TestBed.configureTestingModule({ providers: [
      { provide: DECK_SCHEDULER_ENABLE_FUZZ, useValue: false },
      { provide: DeckSettingsService, useValue: { settingsFor: (d: DeckDefinition) => d.settings } },
      { provide: SyncOutboxService, useValue: { enqueue: async () => {} } },
    ] });
    study = TestBed.inject(DeckStudyService); db = TestBed.inject(DeckDatabaseService);
  });
  afterEach(() => { TestBed.resetTestingModule(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
  const snapshot = (at = NOW) => study.snapshot(deck, index, at);
  async function seed(rows: DeckCardProgress[]) { await db.mergeFromCloud({ progress: rows, events: [], daily: [] }); }

  it.each(['again', 'good'] as const)('new %s moves to Learning; Undo restores quota and counters', async rating => {
    const before = await snapshot(), choice = study.chooseNext(before, deck, { debt: 0 }).choice!;
    expect(deckStudyCounts(before)).toEqual({ new: 1, learning: 0, review: 0 });
    const event = await study.rate(deck, choice, study.preview(deck, choice, NOW), rating, 1000, NOW);
    expect(event.stateAfter).toBe(1);
    const after = await snapshot();
    expect(after.learningDue).toBe(0); expect(after.learningPending).toBe(1);
    expect(deckStudyCounts(after)).toEqual({ new: 0, learning: 1, review: 0 });
    await study.undo(event);
    expect(deckStudyCounts(await snapshot())).toEqual(deckStudyCounts(before));
    expect(await db.getDeckReviewEvents(deck.id)).toEqual([]);
  });

  it.each(['again', 'good'] as const)('Review %s follows real FSRS state and Undo restores Review', async rating => {
    await seed([progress('a', 2, -1)]);
    const before = await snapshot(), choice = study.chooseNext({ ...before, newEntries: [] }, deck, { debt: 0 }).choice!;
    const event = await study.rate(deck, choice, study.preview(deck, choice, NOW), rating, 1000, NOW);
    expect(event.stateAfter).toBe(rating === 'again' ? 3 : 2);
    expect(deckStudyCounts(await snapshot())).toEqual({ new: 1, learning: rating === 'again' ? 1 : 0, review: 0 });
    await study.undo(event);
    expect(deckStudyCounts(await snapshot())).toEqual(deckStudyCounts(before));
  });

  it('counts all short steps once across due, learn-ahead and pending queues, without writes', async () => {
    await seed([progress('a', 1, -1), progress('b', 3, 10), progress('c', 1, 40), progress('d', 3, 60), progress('e', 2, 1440)]);
    const stored = await db.getDeckProgress(deck.id), events = await db.getDeckReviewEvents(deck.id);
    const commit = vi.spyOn(db, 'commitReview'), daily = vi.spyOn(db, 'writeDailyState');
    const first = await snapshot();
    expect(first.learningDue).toBe(1); expect(first.learningAhead).toBe(1); expect(first.learningPending).toBe(3);
    expect(deckStudyCounts(first)).toEqual({ new: 0, learning: 4, review: 0 });
    expect(deckStudyCounts({ ...first, progress: [...first.progress, ...first.progress] }).learning).toBe(4);
    for (const minutes of [20, 40, 61]) {
      const later = await snapshot(new Date(NOW.getTime() + minutes * 60000));
      expect(deckStudyCounts(later)).toEqual({ new: 0, learning: 4, review: 0 });
    }
    expect(deckStudyCounts(await snapshot(new Date('2026-11-11T18:00:00Z')))).toEqual({ new: 0, learning: 4, review: 1 });
    expect(await db.getDeckProgress(deck.id)).toEqual(stored);
    expect(await db.getDeckReviewEvents(deck.id)).toEqual(events);
    expect(commit).not.toHaveBeenCalled(); expect(daily).not.toHaveBeenCalled();
  });

  it('graduation removes Learning without losing history or counting repeated attempts', async () => {
    const ids = [index[0]];
    let s = await study.snapshot(deck, ids, NOW);
    for (let attempt = 0; attempt < 2; attempt++) {
      const choice = study.chooseNext(s, deck, { debt: 0 }).choice!;
      await study.rate(deck, choice, study.preview(deck, choice, NOW), 'good', 1000, NOW);
      s = await study.snapshot(deck, ids, NOW);
      expect(deckStudyCounts(s)).toEqual({ new: 0, learning: attempt === 0 ? 1 : 0, review: 0 });
    }
    expect(await db.getDeckReviewEvents(deck.id)).toHaveLength(2);
    expect(s.progress[0].card.state).toBe(2);
  });

  it('resume, closure and A→B→A keep the counts isolated in canonical progress', async () => {
    const workspace = TestBed.inject(WorkspaceService); workspace.activateUser('A');
    await seed([progress('a', 1, 40), progress('b', 3, 60)]);
    await study.startSession(deck, NOW);
    const expected = deckStudyCounts(await snapshot());
    expect(deckStudyCounts(await snapshot())).toEqual(expected);
    await study.completeSession(deck, index, NOW, true);
    const closed = await snapshot();
    expect(closed.completedToday).toBe(true); expect(deckStudyCounts(closed)).toEqual(expected);
    expect(study.chooseNext(closed, deck, { debt: 0 }).choice).toBeNull();
    workspace.activateUser('B'); expect(deckStudyCounts(await snapshot())).toEqual({ new: 1, learning: 0, review: 0 });
    workspace.activateUser('A'); expect(deckStudyCounts(await snapshot())).toEqual(expected);
    expect((await snapshot(new Date('2026-11-10T23:00:00Z'))).completedToday).toBe(false);
  });
});
