import { TestBed } from '@angular/core/testing';
import { GRAMMAR_PROGRESS_KEY, emptyGrammarProgress, GrammarProgressStateV1 } from '../models/grammar-progress.model';
import { SyncOutboxItem } from '../models/account.model';
import { SyncService } from './sync.service';
import { SyncOutboxService } from './sync-outbox.service';
import { StorageService } from './storage.service';
import { WorkspaceService } from './workspace.service';
import { SupabaseClientService } from './supabase-client.service';
import { DeviceService } from './device.service';
import { SessionHistoryService } from './session-history.service';
import { DeckDatabaseService } from './deck-database.service';
import { LocalRushRepository } from './rush-repository.service';

describe('Grammar sync through the existing preferences transport', () => {
  let remote: GrammarProgressStateV1, pending: SyncOutboxItem[], failRead: boolean;
  const writes: Record<string, unknown>[] = [];
  beforeEach(() => {
    localStorage.clear(); vi.useFakeTimers(); remote = emptyGrammarProgress(); pending = []; failRead = false; writes.length = 0;
    const client = {from: (table: string) => {
      const query = {
        select: () => query, eq: () => query, order: () => query, range: () => query, gte: () => query,
        maybeSingle: async () => ({data: {payload: remote, updated_at: '2027-01-01T00:00:00Z'}, error: failRead ? new Error('network') : null}),
        then: (resolve: (value: unknown) => unknown) => Promise.resolve(resolve({data: table === 'user_preferences' ? [{preference_key: GRAMMAR_PROGRESS_KEY, payload: remote}] : [], error: null})),
        upsert: async (rows: Record<string, unknown>[]) => { if (table === 'user_preferences') { writes.push(...rows); remote = rows.find(row => row['preference_key'] === GRAMMAR_PROGRESS_KEY)?.['payload'] as GrammarProgressStateV1 ?? remote; } return {error: null}; },
      }; return query;
    }};
    TestBed.configureTestingModule({providers: [
      {provide: SupabaseClientService, useValue: {config: {configured: true}, getClient: async () => client}},
      {provide: SyncOutboxService, useValue: {
        markLegacyGuestMapped: async () => undefined, enqueue: async (item: SyncOutboxItem) => { pending = [item]; }, pending: async () => pending,
        count: async () => pending.length, getMeta: async () => null, putMeta: async () => undefined, removeProcessed: async () => {pending = [];}, markAttempt: async () => undefined,
      }},
      {provide: DeviceService, useValue: {id: 'test-device'}}, {provide: SessionHistoryService, useValue: {mergeFromCloud: vi.fn()}},
      {provide: DeckDatabaseService, useValue: {getDeckProgress: async () => [], getDeckReviewEvents: async () => [], getAllDailyStates: async () => [], mergeFromCloud: async () => undefined}},
      {provide: LocalRushRepository, useValue: {getStats: async () => ({sessions: [], coverage: []}), mergeFromCloud: async () => undefined}},
    ]});
    TestBed.inject(WorkspaceService).activateUser('carlos');
  });
  afterEach(() => {TestBed.resetTestingModule(); vi.useRealTimers();});
  const localRecord = (): GrammarProgressStateV1 => {
    const state = emptyGrammarProgress(); state.review['00.1'] = {conceptId: '00.1', topicId: '00', active: true, updatedAt: '2026-10-03T10:00:00Z'}; return state;
  };
  it('pushes a per-record union even when the remote payload timestamp is newer', async () => {
    TestBed.inject(StorageService).set(GRAMMAR_PROGRESS_KEY, localRecord());
    remote.review['06.1'] = {conceptId: '06.1', topicId: '06', active: false, clearedAt: '2026-10-03T11:00:00Z', updatedAt: '2026-10-03T11:00:00Z'};
    expect(await TestBed.inject(SyncService).syncNow()).toBe(true);
    expect(Object.keys(remote.review).sort()).toEqual(['00.1', '06.1']);
    expect(TestBed.inject(StorageService).get<GrammarProgressStateV1>(GRAMMAR_PROGRESS_KEY, emptyGrammarProgress()).review['06.1'].active).toBe(false);
    expect(writes.every(row => row['preference_key'] === GRAMMAR_PROGRESS_KEY && row['user_id'] === 'carlos')).toBe(true);
  });
  it('merges pull-only changes and reconciles the local union back to cloud', async () => {
    const sync = TestBed.inject(SyncService); expect(await sync.syncNow()).toBe(true);
    // A second-device change arrives while this device has local data but no queued write.
    localStorage.setItem(TestBed.inject(StorageService).rawKey(GRAMMAR_PROGRESS_KEY), JSON.stringify(localRecord())); pending = [];
    remote.review['06.1'] = {conceptId: '06.1', topicId: '06', active: true, updatedAt: '2026-10-03T11:00:00Z'};
    expect(await sync.syncNow()).toBe(true); expect(Object.keys(remote.review).sort()).toEqual(['00.1', '06.1']);
  });
  it('a failed remote read does not discard local grammar progress or its queued write', async () => {
    const state = localRecord(); TestBed.inject(StorageService).set(GRAMMAR_PROGRESS_KEY, state); failRead = true;
    expect(await TestBed.inject(SyncService).syncNow()).toBe(false); expect(pending.length).toBeGreaterThan(0);
    expect(TestBed.inject(StorageService).get(GRAMMAR_PROGRESS_KEY, null)).toEqual(state); expect(writes).toHaveLength(0);
  });
  it('retains its local copy after a competing cloud write and converges on subsequent pulls', async () => {
    const storage = TestBed.inject(StorageService), sync = TestBed.inject(SyncService);
    storage.set(GRAMMAR_PROGRESS_KEY,localRecord()); expect(await sync.syncNow()).toBe(true);
    // Device B wrote from the same old cloud snapshot and overwrote A's cloud payload.
    remote = emptyGrammarProgress(); remote.review['06.1'] = {conceptId:'06.1',topicId:'06',active:true,updatedAt:'2026-10-03T11:00:00Z'};
    const deviceB = structuredClone(remote);
    expect(storage.get<GrammarProgressStateV1>(GRAMMAR_PROGRESS_KEY,emptyGrammarProgress()).review['00.1']).toBeDefined();
    expect(await sync.syncNow()).toBe(true); expect(Object.keys(remote.review).sort()).toEqual(['00.1','06.1']);
    // A subsequent pull by B reconciles the same union without losing B's own copy.
    storage.setFromCloud(GRAMMAR_PROGRESS_KEY,deviceB); pending=[];
    expect(await sync.syncNow()).toBe(true);
    expect(Object.keys(storage.get<GrammarProgressStateV1>(GRAMMAR_PROGRESS_KEY,emptyGrammarProgress()).review).sort()).toEqual(['00.1','06.1']);
    expect(Object.keys(remote.review).sort()).toEqual(['00.1','06.1']);
  });
});
