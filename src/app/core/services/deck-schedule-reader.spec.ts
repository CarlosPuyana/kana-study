import { TestBed } from '@angular/core/testing';
import { IDBFactory } from 'fake-indexeddb';
import { DeckScheduleReader } from './deck-schedule-reader';
import { DeckDatabaseService } from './deck-database.service';
import { DeckCatalogService } from './deck-catalog.service';
import { SyncOutboxService } from './sync-outbox.service';
import { WorkspaceService } from './workspace.service';
import { DeckCardProgress } from '../models/deck-study.model';
import { signal } from '@angular/core';
import { CUSTOM_DECKS_ENABLED } from './custom-deck-gates';
import { CustomDeckRepository } from './custom-deck.repository';
import { customCard, customDeck } from './custom-deck.fixture';
import { DeckStudyService } from './deck-study.service';
import { deckCardHistory } from './deck-card-history';
import { DeckBackupService } from './deck-backup.service';

describe('Schedule reader: existing workspace persistence fence', () => {
  beforeEach(() => {
    localStorage.clear(); vi.stubGlobal('indexedDB', new IDBFactory());
    TestBed.configureTestingModule({ providers: [
      { provide: DeckCatalogService, useValue: { publicEntryIds: () => new Set(['a']) } },
      { provide: SyncOutboxService, useValue: { enqueue: async () => undefined } },
    ] });
  });
  afterEach(() => { TestBed.resetTestingModule(); vi.unstubAllGlobals(); localStorage.clear(); });
  const row = (deckId: string, due: number): DeckCardProgress => ({ deckId, entryId: 'a', state: 2, due,
    card: { due, state: 2, stability: 30, difficulty: 5, reps: 5, lapses: 0, learningSteps: 0, scheduledDays: 30, elapsedDays: 30, lastReview: due - 86_400_000 } });
  it('keeps Puyi and Japanese 1500 schedules private and restores A after A→B→A', async () => {
    const workspace = TestBed.inject(WorkspaceService), db = TestBed.inject(DeckDatabaseService), reader = TestBed.inject(DeckScheduleReader);
    workspace.activateUser('test-a'); await db.mergeFromCloud({ progress: [row('mazo-puyi', 100), row('japanese-1500', 200)], events: [], daily: [] });
    expect((await reader.read('mazo-puyi')).progress.map(p => p.due)).toEqual([100]);
    workspace.activateUser('test-b'); expect((await reader.read('mazo-puyi')).progress).toEqual([]);
    await db.mergeFromCloud({ progress: [row('mazo-puyi', 300)], events: [], daily: [] });
    expect((await reader.read('japanese-1500')).progress).toEqual([]);
    workspace.activateUser('test-a'); expect((await reader.read('mazo-puyi')).progress.map(p => p.due)).toEqual([100]);
    expect((await reader.read('japanese-1500')).progress.map(p => p.due)).toEqual([200]);
  });
  it('rejects a read interrupted by A→B→A even when the final owner name matches', async () => {
    const workspace = TestBed.inject(WorkspaceService), reader = TestBed.inject(DeckScheduleReader);
    workspace.activateUser('test-a'); const pending = reader.read('mazo-puyi');
    workspace.activateUser('test-b'); workspace.activateUser('test-a');
    await expect(pending).rejects.toThrow('Deck workspace changed');
  });
  it('reads custom canonical history, preserves idempotent retries and undo, and exports without a new schema', async () => {
    TestBed.overrideProvider(CUSTOM_DECKS_ENABLED,{useValue:signal(true)});
    const repo=TestBed.inject(CustomDeckRepository),reader=TestBed.inject(DeckScheduleReader),study=TestBed.inject(DeckStudyService);
    const d=customDeck(),c=await customCard(),deck={...d,cardCount:1};await repo.create('history-create',d,[c]);
    const now=new Date('2026-11-05T11:00:00Z'),choice={entryId:c.id,kind:'new' as const,progress:null},preview=study.preview(deck,choice,now);
    const saved=await study.rate(deck,choice,preview,'again',500,now);
    await study.rate(deck,choice,preview,'again',500,now);
    const data=await reader.read(d.id),before=JSON.stringify(data);
    expect(data.events).toHaveLength(1);expect(deckCardHistory(data.events,data.progress[0],d.id,c.id).rows[0].waitMs).toBe(60000);
    expect(JSON.stringify(await reader.read(d.id))).toBe(before);
    const raw=await TestBed.inject(DeckBackupService).export(new AbortController().signal);expect(raw).toContain(saved.id);
    await study.undo(saved);expect((await reader.read(d.id)).events).toEqual([]);
  });
});
