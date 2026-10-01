import 'fake-indexeddb/auto';
import { TestBed } from '@angular/core/testing';
import { DeckDatabaseService } from './deck-database.service';
import { SyncOutboxService } from './sync-outbox.service';
import { WorkspaceMigrationService } from './workspace-migration.service';
import { StorageService } from './storage.service';
import { WorkspaceService } from './workspace.service';

describe('Local workspaces', () => {
  beforeEach(() => { localStorage.clear(); TestBed.configureTestingModule({}); });
  afterEach(() => TestBed.resetTestingModule());

  it('maps legacy unscoped data to Guest without deleting it', () => {
    localStorage.setItem('kana-study.study-progress.v2', JSON.stringify({ legacy: { value: 1 } }));
    const workspace = TestBed.inject(WorkspaceService); const storage = TestBed.inject(StorageService);
    expect(workspace.active()).toBe('guest');
    expect(storage.get<any>('kana-study.study-progress.v2', {})).toHaveProperty('legacy');
    expect(localStorage.getItem('kana-study.study-progress.v2')).not.toBeNull();
  });

  it('isolates Guest, Carlos and Nora in the same browser', () => {
    const workspace = TestBed.inject(WorkspaceService); const storage = TestBed.inject(StorageService);
    storage.set('kana-study.study-progress.v2', { guest: true });
    workspace.activateUser('carlos'); storage.set('kana-study.study-progress.v2', { carlos: true });
    workspace.activateUser('nora'); storage.set('kana-study.study-progress.v2', { nora: true });
    expect(storage.get('kana-study.study-progress.v2', {})).toEqual({ nora: true });
    workspace.activateUser('carlos'); expect(storage.get('kana-study.study-progress.v2', {})).toEqual({ carlos: true });
    workspace.activateGuest(); expect(storage.get('kana-study.study-progress.v2', {})).toEqual({ guest: true });
  });

  it('keeps Guest intact when copying it into a user workspace', () => {
    const workspace = TestBed.inject(WorkspaceService);
    localStorage.setItem('kana-study.completed-sessions.v1', JSON.stringify([{ sessionId: 'guest-one' }]));
    workspace.copyGuestLocalStorageToUser('carlos');
    expect(localStorage.getItem('kana-study.completed-sessions.v1')).toContain('guest-one');
    expect(localStorage.getItem(workspace.storageKey('kana-study.completed-sessions.v1', 'user:carlos'))).toContain('guest-one');
  });

  it('does not copy Guest when account-only is selected', () => {
    const workspace = TestBed.inject(WorkspaceService);
    localStorage.setItem('kana-study.review-events.v1', JSON.stringify([{ id: 'guest' }]));
    workspace.markImportDecision('nora', 'account'); workspace.activateUser('nora');
    expect(TestBed.inject(StorageService).get('kana-study.review-events.v1', [])).toEqual([]);
    workspace.activateGuest(); expect(TestBed.inject(StorageService).get<any[]>('kana-study.review-events.v1', [])).toHaveLength(1);
  });

  it('isolates deck IndexedDB and migrates Guest non-destructively', async () => {
    const workspace = TestBed.inject(WorkspaceService); const decks = TestBed.inject(DeckDatabaseService);
    await decks.writeDailyState({ deckId: 'japanese-1500', localDate: '2026-10-01', introducedEntryIds: ['guest-card'], newLimitOverride: null });
    await TestBed.inject(WorkspaceMigrationService).copyGuestToUser('carlos');
    workspace.activateUser('carlos');
    expect((await decks.getDailyState('japanese-1500', '2026-10-01'))?.introducedEntryIds).toEqual(['guest-card']);
    await decks.writeDailyState({ deckId: 'japanese-1500', localDate: '2026-10-01', introducedEntryIds: ['carlos-card'], newLimitOverride: null });
    workspace.activateGuest();
    expect((await decks.getDailyState('japanese-1500', '2026-10-01'))?.introducedEntryIds).toEqual(['guest-card']);
  });

  it('deduplicates repeated pending writes to the same entity', async () => {
    const workspace = TestBed.inject(WorkspaceService); workspace.activateUser('carlos');
    const storage = TestBed.inject(StorageService); storage.set('kana-study.settings.v1', { theme: 'dark' }); storage.set('kana-study.settings.v1', { theme: 'nora' });
    await new Promise(resolve => setTimeout(resolve, 0));
    const pending = await TestBed.inject(SyncOutboxService).pending('user:carlos');
    expect(pending.filter(item => item.entityKey === 'kana-study.settings.v1')).toHaveLength(1);
    expect(pending.find(item => item.entityKey === 'kana-study.settings.v1')?.payload).toEqual({ theme: 'nora' });
  });

  it('does not remove a newer write that arrives while an older version is syncing',async()=>{const workspace=TestBed.inject(WorkspaceService);workspace.activateUser('carlos');const storage=TestBed.inject(StorageService),outbox=TestBed.inject(SyncOutboxService);storage.set('kana-study.settings.v1',{theme:'dark'});await new Promise(resolve=>setTimeout(resolve,0));const processing=await outbox.pending('user:carlos');storage.set('kana-study.settings.v1',{theme:'nora'});await new Promise(resolve=>setTimeout(resolve,0));await outbox.removeProcessed(processing);expect((await outbox.pending('user:carlos'))[0]?.payload).toEqual({theme:'nora'})});
});
