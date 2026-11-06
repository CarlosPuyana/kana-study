import { TestBed } from '@angular/core/testing';
import { IDBFactory } from 'fake-indexeddb';
import { State } from 'ts-fsrs';
import { DeckDefinition } from '../models/deck-catalog.model';
import { DeckCardProgress, DeckEntryIndexItem, DeckMixedCursor, DeckRating, DeckReviewEvent } from '../models/deck-study.model';
import { deckSeparations, separatedDeckChoice } from './deck-daily-queue';
import { deckCardHistory } from './deck-card-history';
import { DeckDatabaseService } from './deck-database.service';
import { deckDayDifficulties } from './deck-day-presentation';
import { deckLearningSummary, deckTimeGroups } from './deck-learning-presentation';
import { DECK_SCHEDULER_ENABLE_FUZZ } from './deck-scheduler.service';
import { DeckStudyService } from './deck-study.service';
import { nextLocalStudyDayStart } from './deck-study-time';
import { SyncOutboxService } from './sync-outbox.service';
import { WorkspaceService } from './workspace.service';

const NOW = new Date('2026-11-06T11:46:00Z'); // Madrid 12:46
const deck: DeckDefinition = { id: 'japanese-1500', cardCount: 100, contentType: 'japanese-word',
  settings: { desiredRetention: .9, newCardsPerDay: 10, newCardOrder: 'after-reviews' } };
const index = ['声', '持つ', '部屋', '食べる'].map((id, order) => ({ id, order }));
const time = (iso: string) => Date.parse(`2026-11-06T${iso}Z`);
function card(entryId: string, due: number, state: State = State.Review): DeckCardProgress {
  return { deckId: deck.id, entryId, due, state, card: { due, state, stability: 30, difficulty: 5,
    reps: 10, lapses: 1, learningSteps: 0, scheduledDays: 30, elapsedDays: 30,
    lastReview: NOW.getTime() - 30 * 86_400_000 } };
}

describe('Mazos dynamic daily queue: real FSRS and IndexedDB', () => {
  let study: DeckStudyService, db: DeckDatabaseService;
  let at: Date, cursor: DeckMixedCursor;
  function configure() {
    TestBed.configureTestingModule({ providers: [
      { provide: DECK_SCHEDULER_ENABLE_FUZZ, useValue: false },
      { provide: SyncOutboxService, useValue: { enqueue: async () => undefined } },
    ] });
    study = TestBed.inject(DeckStudyService); db = TestBed.inject(DeckDatabaseService);
  }
  beforeEach(() => {
    TestBed.resetTestingModule(); localStorage.clear();
    vi.stubGlobal('indexedDB', new IDBFactory());
    at = NOW; cursor = { debt: 0 }; configure();
  });
  afterEach(() => { TestBed.resetTestingModule(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
  async function seed(rows: DeckCardProgress[]) { await db.mergeFromCloud({ progress: rows, events: [], daily: [] }); }
  async function snapshot(entries: readonly DeckEntryIndexItem[] = index, definition = deck) {
    return study.snapshot(definition, entries, at);
  }
  async function answer(rating: DeckRating, entries: readonly DeckEntryIndexItem[] = index, definition = deck) {
    const decision = study.chooseNext(await snapshot(entries, definition), definition, cursor);
    expect(decision.choice).not.toBeNull(); cursor = decision.cursor;
    const event = await study.rate(definition, decision.choice!, study.preview(definition, decision.choice!, at), rating, 700, at);
    at = new Date(at.getTime() + 1_000);
    return event;
  }
  async function next(entries: readonly DeckEntryIndexItem[] = index) {
    return study.chooseNext(await snapshot(entries), deck, cursor).choice?.entryId;
  }

  it('implements the mandatory 声 → 持つ → 部屋 → 食べる → 部屋 example without waiting', async () => {
    await seed([card('声', time('11:30:00')), card('持つ', time('11:45:00')),
      card('部屋', time('17:00:00')), card('食べる', time('19:30:00'))]);
    expect(await next()).toBe('声'); await answer('good');
    expect(await next()).toBe('持つ'); await answer('good');
    expect(await next()).toBe('部屋');
    const failed = await answer('again');
    expect(failed.dueAfter).toBe(failed.reviewedAt + 600_000); // Real Review lapse: ten minutes.
    expect(failed.stateAfter).toBe(State.Relearning);
    expect(await next()).toBe('食べる'); await answer('good');
    expect(await next()).toBe('部屋');
    const recovered = await answer('good');
    expect(recovered.dueAfter).toBe(nextLocalStudyDayStart(at));
    expect(await next()).toBeUndefined();
    await study.completeSession(deck, index, at);
    expect((await snapshot()).completedToday).toBe(true);
    const events = await db.getDeckReviewEvents(deck.id);
    expect(events).toHaveLength(5);
    expect(new Set(events.map(e => e.id)).size).toBe(5);
    expect(deckLearningSummary(index, (await snapshot()).progress, events, deck.id, at)).toMatchObject({
      unique: 4, attempts: 5, accuracy: 80, learning: 0, review: 4,
    });
    expect(deckDayDifficulties(events, deck.id, at)).toMatchObject([{ entryId: '部屋', failures: 1 }]);
    expect(deckCardHistory(events, await db.getProgress(deck.id, '部屋'), deck.id, '部屋').rows.map(row => row.event.rating)).toEqual(['good', 'again']);
  });

  it.each(['again', 'good'] as const)('separates two DISTINCT alternatives after %s, even when A has the earliest due', async rating => {
    // A real new card exercises both Again +1m and Good +10m.
    await seed([card('持つ', time('17:00:00')), card('部屋', time('18:00:00')), card('食べる', time('19:00:00'))]);
    const before = { ...deck, settings: { ...deck.settings, newCardOrder: 'before-reviews' as const } };
    const event = await answer(rating, index, before);
    expect(event.entryId).toBe('声');
    expect(event.dueAfter - event.reviewedAt).toBe(rating === 'again' ? 60_000 : 600_000);
    expect(await next()).toBe('持つ'); await answer('good');
    expect(await next()).toBe('部屋'); await answer('good');
    expect(await next()).toBe('声');
    expect((await db.getProgress(deck.id, '声'))!.due).toBe(event.dueAfter);
    expect((await snapshot()).learningPending).toBe(0);
  });

  it('one alternative is enough; each repeated response still creates a real FSRS transition', async () => {
    const entries = index.slice(0, 2);
    await seed(entries.map(e => card(e.id, time('17:00:00'))));
    const first = await answer('again', entries);
    expect(await next(entries)).toBe('持つ');
    await answer('good', entries);
    expect(await next(entries)).toBe('声');
    const before = await db.getProgress(deck.id, '声');
    const second = await answer('good', entries);
    expect(second.cardBefore).toEqual(before!.card);
    expect(second.cardBefore!.reps).toBe(first.cardBefore!.reps + 1);
    expect(await next(entries)).toBeUndefined();
    expect(await db.getDeckReviewEvents(deck.id)).toHaveLength(3);
  });

  it('with no alternatives repeats immediately without an appearance limit, and updates FSRS every time', async () => {
    const entries = index.slice(0, 1);
    let before: DeckCardProgress | null = null;
    for (let i = 0; i < 7; i++) {
      const event = await answer('again', entries);
      expect(event.cardBefore).toEqual(before?.card ?? null);
      before = await db.getProgress(deck.id, entries[0].id);
      expect(before!.card.reps).toBe(i + 1);
      expect(await next(entries)).toBe('声');
    }
    expect(await db.getDeckReviewEvents(deck.id)).toHaveLength(7);
    await study.completeSession(deck, entries, at);
    expect((await snapshot(entries)).completedToday).toBe(false);
  });

  it('reorders after every intermediate answer without losing outstanding separation', async () => {
    await seed(index.map((e, i) => card(e.id, time('11:00:00') + i)));
    expect((await answer('again')).entryId).toBe('声');
    expect((await answer('again')).entryId).toBe('持つ');
    expect(await next()).toBe('部屋');
    expect((await answer('again')).entryId).toBe('部屋');
    expect(await next()).toBe('食べる'); // earlier due than the three new ten-minute steps
    await answer('good');
    expect(await next()).toBe('声');
    await answer('good');
    expect(await next()).toBe('持つ');
  });

  it('preserves live answer order even when three different cards share one millisecond', async () => {
    await seed(index.map((e, i) => card(e.id, time('17:00:00') + i)));
    for (const expected of ['声', '持つ', '部屋']) {
      at = NOW;
      expect((await answer('again')).entryId).toBe(expected);
    }
    at = NOW;
    expect(await next()).toBe('声');
    const events = await db.getDeckReviewEvents(deck.id);
    expect(events.every(e => e.reviewedAt === NOW.getTime())).toBe(true);
    expect(events).toHaveLength(3);
    TestBed.resetTestingModule();configure();
    expect(await next()).toBe('声'); // verified receipt metadata also restores simultaneous separation
  });

  it('resumes separation from effective events, preserves exact snapshots, and undo removes its constraint', async () => {
    await seed(index.map((e, i) => card(e.id, time('17:00:00') + i)));
    const event = await answer('again');
    const saved = await db.getDeckProgress(deck.id);
    expect(await next()).toBe('持つ');
    TestBed.resetTestingModule(); configure(); cursor = { debt: 0 };
    expect(await next()).toBe('持つ');
    expect(await db.getDeckProgress(deck.id)).toEqual(saved);
    expect(await db.getDeckReviewEvents(deck.id)).toHaveLength(1);
    await answer('good');
    expect(await next()).toBe('部屋');
    await study.undo(event);
    expect((await db.getDeckReviewEvents(deck.id)).some(e => e.id === event.id)).toBe(false);
    expect((await db.getProgress(deck.id, '声'))!.card).toEqual(event.cardBefore);
    expect((await snapshot()).separation?.some(row => row.entryId === '声')).toBe(false);
  });

  it('selects all forty daily reviews plus ten new cards by order, with stable ID ties', async () => {
    const rows = Array.from({ length: 40 }, (_, i) => card(`r${i}`, time('22:59:59') + i));
    await seed(rows);
    const entries = [...rows.map((r, i) => ({ id: r.entryId, order: i + 100 })),
      ...Array.from({ length: 15 }, (_, i) => ({ id: `n${i.toString().padStart(2, '0')}`, order: 10 - i }))].reverse();
    const snap = await snapshot(entries);
    expect(snap.reviewEntries).toHaveLength(40);
    expect(snap.newEntries.map(e => e.order)).toEqual([-4, -3, -2, -1, 0, 1, 2, 3, 4, 5]);
    expect(snap.newEntries).toHaveLength(10);
    const tied = [{ id: 'z', order: 1 }, { id: 'a', order: 1 }];
    expect((await snapshot(tied)).newEntries.map(e => e.id)).toEqual(['a', 'z']);
  });

  it('orders all FSRS states by full timestamps, excludes tomorrow and inactive/foreign IDs', async () => {
    const tomorrow = nextLocalStudyDayStart(at);
    await seed([card('声', time('17:00:00.002'), State.Learning), card('持つ', time('17:00:00.001'), State.Relearning),
      card('部屋', time('17:00:00.001')), card('食べる', tomorrow), card('removed', time('09:00:00')),
      { ...card('foreign', time('08:00:00')), deckId: 'other' }]);
    const snap = await snapshot();
    expect(study.chooseNext(snap, deck, cursor).choice?.entryId).toBe('持つ');
    expect(snap.progress.map(p => p.entryId).sort()).toEqual(index.map(e => e.id).sort());
    expect(snap.learningEntries.map(p => p.entryId)).toEqual(['持つ', '声']);
    expect(snap.reviewEntries.map(p => p.entryId)).toEqual(['部屋']);
    const groups = deckTimeGroups(index, snap.progress, deck.id, at);
    expect(groups.find(g => g.key === 'today')!.ids).toEqual(['持つ', '部屋', '声']);
    expect(groups.find(g => g.key === 'day1')!.ids).toEqual(['食べる']);
    expect((await db.getProgress(deck.id, 'removed'))!.entryId).toBe('removed'); // filtering never deletes
  });

  it.each(['2026-11-06T11:00:00Z', '2026-11-30T11:00:00Z', '2026-12-31T11:00:00Z',
    '2026-03-28T23:00:00Z', '2026-10-24T22:00:00Z'])(
    'respects Madrid day/month/year/DST boundaries and 23:59 availability at %s', async iso => {
      at = new Date(iso); const boundary = nextLocalStudyDayStart(at);
      const entries = index.slice(0, 3);
      await seed([card('声', at.getTime() - 86_400_000, State.Learning),
        card('持つ', boundary - 1, State.Relearning), card('部屋', boundary, State.Review)]);
      expect((await snapshot(entries)).learningDue).toBe(2);
      expect((await snapshot(entries)).reviewDue).toBe(0);
      expect((await snapshot(entries)).nextRefreshAt).toBe(boundary);
      at = new Date(boundary);
      expect((await snapshot(entries)).reviewDue).toBe(1);
      expect((await snapshot(entries)).learningDue).toBe(2);
    });

  it('isolates queue history, daily allowance and progress between workspaces A → B → A', async () => {
    const workspace = TestBed.inject(WorkspaceService);
    workspace.activateUser('A');
    const event = await answer('again');
    const a = await snapshot();
    workspace.activateUser('B');
    expect((await snapshot()).progress).toEqual([]);
    expect((await snapshot()).separation).toEqual([]);
    expect((await snapshot()).introducedToday).toBe(0);
    workspace.activateUser('A');
    expect((await snapshot()).progress).toEqual(a.progress);
    expect((await snapshot()).separation).toEqual(a.separation);
    expect((await db.getDeckReviewEvents(deck.id)).map(e => e.id)).toEqual([event.id]);
  });

  async function mixedFixture() {
    const rows = Array.from({length:40}, (_,i) => card(`r${i}`, NOW.getTime() + i));
    await seed(rows);
    return { definition: {...deck, settings:{...deck.settings,newCardOrder:'mixed' as const}},
      entries: [...rows.map((p,i)=>({id:p.entryId,order:100+i})),...Array.from({length:10},(_,i)=>({id:`new${i}`,order:i}))] };
  }
  it('persists the exact balanced phase across reload and undo, without changing FSRS history', async () => {
    const {definition,entries}=await mixedFixture();
    for(let i=0;i<4;i++) await answer('good',entries,definition);
    const before=await snapshot(entries,definition), saved=await db.getDeckProgress(deck.id);
    const decision=study.chooseNext(before,definition,{debt:0}), expected=decision.choice!;
    expect(expected.entryId).toBe('new0');
    TestBed.resetTestingModule();configure();
    const restored=await snapshot(entries,definition);
    expect(restored.mixedCursor).toEqual(before.mixedCursor);
    expect(await db.getDeckProgress(deck.id)).toEqual(saved);
    const choice=study.chooseNext(restored,definition,{debt:0}).choice!;
    expect(choice.entryId).toBe(expected.entryId);
    const event=await study.rate(definition,choice,study.preview(definition,choice,at),'good',0,at);
    await study.undo(event);
    expect((await snapshot(entries,definition)).mixedCursor).toEqual(before.mixedCursor);
    expect(study.chooseNext(await snapshot(entries,definition),definition,{debt:0}).choice?.entryId).toBe('new0');
    expect(await db.getDeckReviewEvents(deck.id)).toHaveLength(4);
    const undone = study.restoreAfterUndo(await snapshot(entries,definition), definition, {entryId:event.entryId,kind:'new',progress:null});
    await study.rate(definition,undone,study.preview(definition,undone,at),'good',0,at);
    expect((await snapshot(entries,definition)).mixedCursor?.debt).toBe(decision.cursor.debt);
    expect(await db.getDeckReviewEvents(deck.id)).toHaveLength(5);
  });
  it('resolves a staged checkpoint to before a failed FSRS commit and advances only after retry succeeds', async () => {
    const {definition,entries}=await mixedFixture();
    const choice=study.chooseNext(await snapshot(entries,definition),definition,{debt:0}).choice!;
    const preview=study.preview(definition,choice,at);
    vi.spyOn(db,'commitReview').mockRejectedValueOnce(Error('controlled commit failure'));
    await expect(study.rate(definition,choice,preview,'good',0,at)).rejects.toThrow('controlled');
    expect((await snapshot(entries,definition)).mixedCursor?.debt).toBe(0);
    expect(await db.getDeckReviewEvents(deck.id)).toHaveLength(0);
    await study.rate(definition,choice,preview,'good',0,at);
    expect((await snapshot(entries,definition)).mixedCursor?.debt).toBeCloseTo(.2);
    expect(await db.getDeckReviewEvents(deck.id)).toHaveLength(1);
  });
  it('does not commit an answer if its checkpoint intent cannot be persisted; retry keeps one real event', async () => {
    const {definition,entries}=await mixedFixture();
    const choice=study.chooseNext(await snapshot(entries,definition),definition,{debt:0}).choice!;
    const preview=study.preview(definition,choice,at), original=Storage.prototype.setItem;
    const spy=vi.spyOn(Storage.prototype,'setItem').mockImplementation(function(this:Storage,k,v){
      if(k.includes('deck-mix.v1'))throw Error('controlled checkpoint failure'); original.call(this,k,v);
    });
    await expect(study.rate(definition,choice,preview,'good',0,at)).rejects.toThrow('checkpoint');
    expect(await db.getDeckReviewEvents(deck.id)).toHaveLength(0);
    spy.mockRestore();await study.rate(definition,choice,preview,'good',0,at);
    expect(await db.getDeckReviewEvents(deck.id)).toHaveLength(1);
  });
  it('isolates checkpoint debt by account, deck and Madrid date even if the caller has an old cursor', async () => {
    const workspace=TestBed.inject(WorkspaceService);workspace.activateUser('mix-A');
    const {definition,entries}=await mixedFixture(); await answer('good',entries,definition);
    expect((await snapshot(entries,definition)).mixedCursor?.debt).toBeCloseTo(.2);
    workspace.activateUser('mix-B');expect((await snapshot(entries,definition)).mixedCursor?.debt).toBe(0);
    workspace.activateUser('mix-A');expect((await snapshot(entries,definition)).mixedCursor?.debt).toBeCloseTo(.2);
    expect((await snapshot(entries,{...definition,id:'another-deck'})).mixedCursor?.debt).toBe(0);
    at=new Date(nextLocalStudyDayStart(at));expect((await snapshot(entries,definition)).mixedCursor?.debt).toBe(0);
  });
});

describe('Separation deterministic conflict handling', () => {
  const choices = ['a', 'b', 'c'].map(entryId => ({ entryId, kind: 'new' as const, progress: null }));
  it('the same alternative never satisfies two distinct appearances', () => {
    const rows = [{ entryId: 'a', seen: ['b'] }, { entryId: 'b', seen: [] }];
    expect(separatedDeckChoice(choices, rows)?.entryId).toBe('c');
  });
  it('breaks conflicting constraints by oldest response without selection loops', () => {
    const rows = [{ entryId: 'b', seen: [] }, { entryId: 'c', seen: [] }, { entryId: 'a', seen: [] }];
    expect(separatedDeckChoice(choices, rows)?.entryId).toBe('b');
    expect(separatedDeckChoice([], rows)).toBeNull();
    expect(separatedDeckChoice(choices.slice(0, 1), rows)?.entryId).toBe('a');
  });
  it('deduplicates receipts and uses a stable tie policy when timestamps cannot prove inter-card order', () => {
    const event = (id: string, entryId: string): DeckReviewEvent => ({ id, entryId, deckId: deck.id,
      reviewedAt: NOW.getTime(), cardBefore: null } as DeckReviewEvent);
    const a = event('1', 'a'), b = event('2', 'b');
    expect(deckSeparations([b, a, a], deck.id, NOW)).toEqual(deckSeparations([a, b], deck.id, NOW));
    expect(deckSeparations([a, b], deck.id, NOW)).toEqual([{ entryId: 'a', seen: ['b'] }, { entryId: 'b', seen: [] }]);
  });
});
