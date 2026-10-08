import { TestBed } from '@angular/core/testing';
import { MedalUnlock } from '../models/medal.model';
import { SyncService } from './sync.service';
import { SyncOutboxService } from './sync-outbox.service';
import { StorageService } from './storage.service';
import { WorkspaceService } from './workspace.service';
import { SupabaseClientService } from './supabase-client.service';
import { DeviceService } from './device.service';
import { SessionHistoryService } from './session-history.service';
import { DeckDatabaseService } from './deck-database.service';
import { LocalRushRepository } from './rush-repository.service';
import { profileMedals } from './profile-stats.service';
import { RUSH_MEDAL_DEFINITIONS } from '../../data/rush-medals';

describe('Medal synchronization', () => {
  const normalKey = 'kana-study.medal-unlocks.v1', rushKey = 'kana-study.rush.medal-unlocks.v1';
  let rows: {medal_id: string; module_category: string; unlocked_at: string}[];
  beforeEach(() => {
    localStorage.clear(); vi.useFakeTimers(); rows = [];
    const client = {from: (table: string) => {
      const query = {
        select: () => query, eq: () => query, order: () => query, range: () => query, gte: () => query,
        maybeSingle: async () => ({data: null, error: null}),
        then: (resolve: (value: unknown) => unknown) => Promise.resolve(resolve({data: table === 'medal_unlocks' ? rows : [], error: null})),
        upsert: async () => ({error: null}),
      }; return query;
    }};
    TestBed.configureTestingModule({providers: [
      {provide: SupabaseClientService, useValue: {config: {configured: true}, getClient: async () => client}},
      {provide: SyncOutboxService, useValue: {
        markLegacyGuestMapped: async () => undefined, enqueue: async () => undefined, pending: async () => [],
        count: async () => 0, getMeta: async () => null, putMeta: async () => undefined,
        removeProcessed: async () => undefined, markAttempt: async () => undefined,
      }},
      {provide: DeviceService, useValue: {id: 'test-device'}},
      {provide: SessionHistoryService, useValue: {mergeFromCloud: vi.fn()}},
      {provide: DeckDatabaseService, useValue: {getDeckProgress: async () => [], getDeckReviewEvents: async () => [], getAllDailyStates: async () => [], mergeFromCloud: async () => undefined}},
      {provide: LocalRushRepository, useValue: {getStats: async () => ({sessions: [], coverage: []}), mergeFromCloud: async () => undefined}},
    ]});
    TestBed.inject(WorkspaceService).activateUser('tester');
  });
  afterEach(() => {TestBed.resetTestingModule(); vi.useRealTimers();});
  const read = (key: string) => TestBed.inject(StorageService).get<MedalUnlock[]>(key, []);
  it('routes normal medals only to normal storage', async () => {
    rows = [{medal_id: 'normal', module_category: 'normal', unlocked_at: '2026-10-01T00:00:00Z'}];
    expect(await TestBed.inject(SyncService).syncNow()).toBe(true);
    expect(read(normalKey).map(m => m.medalId)).toEqual(['normal']); expect(read(rushKey)).toEqual([]);
  });
  it('routes rush medals only to rush storage', async () => {
    rows = [{medal_id: 'rush', module_category: 'rush', unlocked_at: '2026-10-01T00:00:00Z'}];
    expect(await TestBed.inject(SyncService).syncNow()).toBe(true);
    expect(read(rushKey).map(m => m.medalId)).toEqual(['rush']); expect(read(normalKey)).toEqual([]);
  });
  it('separates mixed pulls, deduplicates repeated sync and retains earliest dates', async () => {
    rows = [{medal_id: 'normal', module_category: 'normal', unlocked_at: '2026-10-01T00:00:00Z'},
      {medal_id: 'rush', module_category: 'rush', unlocked_at: '2026-10-01T00:00:00Z'}];
    const sync = TestBed.inject(SyncService); expect(await sync.syncNow()).toBe(true);
    rows = rows.map(row => ({...row, unlocked_at: '2026-10-02T00:00:00Z'}));
    expect(await sync.syncNow()).toBe(true);
    expect(read(normalKey)).toEqual([{medalId: 'normal', unlockedAt: '2026-10-01T00:00:00Z'}]);
    expect(read(rushKey)).toEqual([{medalId: 'rush', unlockedAt: '2026-10-01T00:00:00Z'}]);
  });
  it('preserves legacy contaminated storage and displays one owned medal', async () => {
    const medalId = RUSH_MEDAL_DEFINITIONS[0].id;
    TestBed.inject(StorageService).setFromCloud(normalKey, [{medalId, unlockedAt: '2026-09-30T00:00:00Z'}]);
    TestBed.inject(StorageService).setFromCloud(rushKey, [{medalId, unlockedAt: '2026-10-02T00:00:00Z'}]);
    rows = [{medal_id: medalId, module_category: 'rush', unlocked_at: '2026-10-01T00:00:00Z'}];
    expect(await TestBed.inject(SyncService).syncNow()).toBe(true);
    expect(read(normalKey)).toHaveLength(1);
    const medals = profileMedals(read(normalKey), read(rushKey));
    expect(medals).toHaveLength(1); expect(medals[0].unlockedAt).toBe('2026-09-30T00:00:00Z');
  });
});
