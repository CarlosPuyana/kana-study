import { SyncDiagnosticReport, SyncDiagnosticsService } from './sync-diagnostics.service';
import { MangaSavedSyncService } from './manga-saved-sync.service';
import { MangaStudySavedRepository } from './manga-study-saved.repository';
import { computed, DestroyRef, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { CompletedSessionSummary } from '../models/learning-session.model';
import { MedalUnlock } from '../models/medal.model';
import { SyncOutboxItem, SyncStatus } from '../models/account.model';
import { getSpainDayKey } from './daily-learning.service';
import { DeviceService } from './device.service';
import { SessionHistoryService } from './session-history.service';
import { StorageService } from './storage.service';
import { SupabaseClientService } from './supabase-client.service';
import { SyncOutboxService } from './sync-outbox.service';
import { mergeGrammarProgress as mergeGrammarV1, mergeMedalUnlocks, mergeProgressSnapshots, mergeRushSession, unionById } from './sync-merge';
import { GRAMMAR_PROGRESS_KEY } from '../models/grammar-progress.model';
import { WorkspaceService } from './workspace.service';
import { DeckDatabaseService } from './deck-database.service';
import { LocalRushRepository } from './rush-repository.service';
import type { SupabaseClient } from '@supabase/supabase-js';
import { GRAMMAR_PROGRESS_V2_KEY } from '../models/grammar-v2.model';
import { mergeGrammarV2Progress } from './grammar-v2-progress-state';

const PROGRESS_KEYS: Record<string, string> = {
  'kana-study.study-progress.v2': 'kana',
  'kana-study.flags-progress.v1': 'flags',
  'kana-study.kanji-progress.v1': 'kanji',
  'kana-study.vocabulary-progress.v1': 'vocabulary',
};
const EVENT_KEYS: Record<string, string> = {
  'kana-study.review-events.v1': 'kana',
  'kana-study.flags-review-events.v1': 'flags',
  'kana-study.kanji-review-events.v1': 'kanji',
  'kana-study.vocabulary-review-events.v1': 'vocabulary',
};
const MEDAL_KEYS = new Set(['kana-study.medal-unlocks.v1', 'kana-study.rush.medal-unlocks.v1']);
const SESSION_KEY = 'kana-study.completed-sessions.v1';
const DECK_SETTINGS_KEY = 'kana-study.deck-settings.v1';
const PAGE_SIZE = 500;
const TABLE_KEYS: Record<string, string[]> = {
  study_progress: ['module', 'unit_key'], medal_unlocks: ['medal_id'], user_preferences: ['preference_key'],
  deck_card_progress: ['deck_id', 'entry_id'], deck_daily_state: ['deck_id', 'local_day'],
  deck_settings: ['deck_id'], rush_coverage: ['module', 'content_id'],
};

@Injectable({ providedIn: 'root' })
export class SyncService {
  private readonly supabase = inject(SupabaseClientService);
  private readonly workspace = inject(WorkspaceService);
  private readonly outbox = inject(SyncOutboxService);
  private readonly storage = inject(StorageService);
  private readonly history = inject(SessionHistoryService);
  private readonly device = inject(DeviceService);
  private readonly decks = inject(DeckDatabaseService);
  private readonly rush = inject(LocalRushRepository);
  private readonly manga = inject(MangaSavedSyncService);
  private readonly diagnostics = inject(SyncDiagnosticsService);
  private readonly savedManga = inject(MangaStudySavedRepository);
  private readonly destroyRef = inject(DestroyRef);
  private readonly statusState = signal<SyncStatus>(this.workspace.active() === 'guest' ? 'guest' : 'pending');
  private readonly pendingState = signal(0);
  private readonly lastSyncState = signal<string | null>(null);
  private timer: ReturnType<typeof setTimeout> | null = null;
  private client: SupabaseClient | null = null;
  private running: {workspace: string; promise: Promise<boolean>} | null = null;
  private processed: readonly SyncOutboxItem[] = [];

  readonly status = this.statusState.asReadonly();
  readonly pendingCount = this.pendingState.asReadonly();
  readonly lastSyncedAt = this.lastSyncState.asReadonly();
  readonly available = computed(() => this.supabase.config.configured && this.workspace.userId() !== null);

  constructor() {
    void this.outbox.markLegacyGuestMapped().catch(() => undefined);
    const schedule = () => this.schedule();
    const online = () => { if (this.available()) this.schedule(0); };
    const visible = () => { if (!document.hidden && this.available()) this.schedule(150); };
    window.addEventListener('kana-study:sync-pending', schedule);
    window.addEventListener('online', online);
    const offline = () => this.statusState.set(this.available() ? 'offline' : 'guest');
    window.addEventListener('offline', offline);
    window.addEventListener('focus', visible);
    document.addEventListener('visibilitychange', visible);
    this.destroyRef.onDestroy(() => {
      window.removeEventListener('kana-study:sync-pending', schedule);
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
      window.removeEventListener('focus', visible);
      document.removeEventListener('visibilitychange', visible);
      if (this.timer) clearTimeout(this.timer);
    });
    effect(() => {
      const workspace = this.workspace.active();
      untracked(() => {
        this.lastSyncState.set(null); this.pendingState.set(0);this.diagnostics.reset();
        if (workspace === 'guest') { this.statusState.set('guest'); if (this.timer) clearTimeout(this.timer); return; }
        void this.outbox.getMeta(workspace, 'all').then(meta => {
          if (this.workspace.active() === workspace) this.lastSyncState.set(meta?.lastSyncedAt ?? null);
        }).catch(() => undefined);
        this.schedule(0);
      });
    });
  }

  syncNow(): Promise<boolean> {
    const workspace = this.workspace.active();
    if (this.running) {
      if (this.running.workspace === workspace) return this.running.promise;
      return this.running.promise.then(() => this.syncNow());
    }
    const promise = this.runSync(workspace).finally(() => { this.running = null; });
    this.running = {workspace, promise};
    return promise;
  }

  private async runSync(workspace: ReturnType<WorkspaceService['active']>): Promise<boolean> {
    const userId = workspace.startsWith('user:') ? workspace.slice(5) : null;
    if(this.workspace.active()===workspace)this.diagnostics.begin();
    let client:SupabaseClient|null;
    try{client=await this.diagnostics.run('connect','supabase',()=>this.supabase.getClient());}
    catch(error){
      if(this.workspace.active()===workspace){this.diagnostics.capture(error,'connect','supabase');this.statusState.set(navigator.onLine?'error':'offline');}
      return false;
    }
    if (!client || !userId) { this.statusState.set('guest'); return false; }
    this.client = client;
    if (this.workspace.active() !== workspace) return false;
    if (!navigator.onLine) {
      this.statusState.set('offline');
      await this.refreshPending().catch(error=>{if(this.workspace.active()===workspace)this.diagnostics.capture(error,'pending','indexeddb');});
      return false;
    }
    this.statusState.set('syncing'); this.processed = [];
    try {
      await this.diagnostics.run('prepare','manga-indexeddb',()=>this.manga.prepare(client,userId));
      this.assertWorkspace(userId);
      this.processed = await this.diagnostics.run('pending','sync-indexeddb',()=>this.outbox.pending(workspace));
      this.assertWorkspace(userId);
      if (this.processed.length) await this.push(this.processed, userId);
      this.assertWorkspace(userId);
      await this.diagnostics.run('pull','local-reconciliation',()=>this.pull(userId));
      await this.diagnostics.run('pull','manga-indexeddb',()=>this.manga.pull(client,userId));
      this.assertWorkspace(userId);
      await this.cleanConfirmed();
      await this.refreshPending();
      this.assertWorkspace(userId);
      if (this.pendingState() > 0) { this.statusState.set('pending'); this.schedule(); return false; }
      const now = new Date().toISOString();
      await this.diagnostics.run('metadata','sync-indexeddb',()=>this.outbox.putMeta({workspace,table:'all',lastPulledAt:null,lastSyncedAt:now}));
      await this.refreshPending();
      this.assertWorkspace(userId);
      if (this.pendingState() > 0) {
        await this.diagnostics.run('metadata','sync-indexeddb',()=>this.outbox.putMeta({workspace,table:'all',lastPulledAt:null,lastSyncedAt:this.lastSyncState()}));
        this.statusState.set('pending'); this.schedule(); return false;
      }
      this.lastSyncState.set(now); this.statusState.set('synced');
      return true;
    } catch(error) {
      if(this.workspace.active()===workspace)this.diagnostics.capture(error,'push','sync');
      // A later module/pull failure must not retain already verified writes.
      // removeProcessed still protects a replacement outbox revision.
      await this.cleanConfirmed().catch(error=>{if(this.workspace.active()===workspace)this.diagnostics.capture(error,'outbox-ack','sync-indexeddb');});
      await this.outbox.markAttempt(this.diagnostics.attemptedItems(this.processed)).catch(error=>{if(this.workspace.active()===workspace)this.diagnostics.capture(error,'outbox-ack','sync-indexeddb');});
      if (this.workspace.active() === workspace) {
        this.statusState.set(navigator.onLine ? 'error' : 'offline');
        await this.refreshPending().catch(error=>this.diagnostics.capture(error,'pending','indexeddb'));
      }
      return false;
    }
  }

  private assertWorkspace(userId: string): void {
    if (this.workspace.userId() !== userId) throw new Error('Workspace changed during sync');
  }

  schedule(delay = 900): void {
    if (!this.available()) { this.statusState.set('guest'); return; }
    if (!this.running || this.running.workspace !== this.workspace.active()) this.statusState.set(navigator.onLine ? 'pending' : 'offline');
    const workspace=this.workspace.active();
    void this.refreshPending().catch(error=>{if(this.workspace.active()===workspace&&this.available()){this.diagnostics.capture(error,'pending','indexeddb');this.statusState.set('error');}});
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => { this.timer = null; void this.syncNow(); }, delay);
  }

  private async push(items: readonly SyncOutboxItem[], userId: string): Promise<void> {
    await this.manga.push(this.client!,userId,items);
    const localItems = items.filter(item => item.entityType === 'local-storage');
    for (const item of localItems) { this.assertWorkspace(userId); await this.diagnostics.run('push','local-storage',()=>this.pushLocalStorage(item,userId),item);this.diagnostics.confirmed(item); }
    const reconciled: SyncOutboxItem[] = [];
    for (const type of ['deck-card-progress', 'deck-daily-state', 'rush-session', 'rush-coverage'] as const) {
      const values = upsertsByType(items, type); if (!values.length) continue;this.diagnostics.attempting(values);
      const table = {'deck-card-progress':'deck_card_progress', 'deck-daily-state':'deck_daily_state',
        'rush-session':'rush_sessions', 'rush-coverage':'rush_coverage'}[type];
      const remote = await this.selectChanged(table, userId, null);
      for (const item of values) {
        const value = item.payload as any;
        const row = remote.find(row => type === 'rush-session' ? row['id'] === item.entityKey
          : type === 'rush-coverage' ? row['module'] === value.module && row['content_id'] === value.contentId
          : row['deck_id'] === value.deckId && (type === 'deck-card-progress' ? row['entry_id'] === value.entryId : row['local_day'] === value.localDate));
        let payload = value;
        if (row) {
          if (type === 'deck-card-progress' && (row['card_json']?.card?.lastReview ?? 0) >= (value.card?.lastReview ?? 0)) payload = row['card_json'];
          if (type === 'deck-daily-state') payload = {...value, introducedEntryIds: [...new Set([...(row['introduced_entry_ids'] ?? []), ...value.introducedEntryIds])]};
          if (type === 'rush-session') payload = mergeRushSession(value, rushSessionFromRow(row));
          if (type === 'rush-coverage') payload = {...value, firstSeenAt: Math.min(value.firstSeenAt, new Date(row['first_seen_at']).getTime())};
        }
        reconciled.push({...item, payload});
      }
    }
    items = items.map(item => reconciled.find(value => value.id === item.id) ?? item);
    await this.upsert('deck_card_progress', upsertsByType(items, 'deck-card-progress').map(item => ({
      user_id: userId, deck_id: field(item.payload, 'deckId'), entry_id: field(item.payload, 'entryId'),
      card_json: item.payload, last_review_at: timestamp(field(item.payload, 'card.lastReview')),
    })));
    for(const item of upsertsByType(items,'deck-card-progress'))this.diagnostics.confirmed(item);
    await this.upsert('deck_review_events', upsertsByType(items, 'deck-review-event').map(item => ({
      id: item.entityKey, user_id: userId, deck_id: field(item.payload, 'deckId'), entry_id: field(item.payload, 'entryId'),
      reviewed_at: timestamp(field(item.payload, 'reviewedAt')), payload: item.payload, device_id: this.device.id,
    })));
    for(const item of upsertsByType(items,'deck-review-event'))this.diagnostics.confirmed(item);
    await this.upsert('deck_daily_state', upsertsByType(items, 'deck-daily-state').map(item => ({
      user_id: userId, deck_id: field(item.payload, 'deckId'), local_day: field(item.payload, 'localDate'),
      introduced_entry_ids: field(item.payload, 'introducedEntryIds') ?? [], new_limit_override: field(item.payload, 'newLimitOverride'),
    })));
    for(const item of upsertsByType(items,'deck-daily-state'))this.diagnostics.confirmed(item);
    await this.upsert('rush_sessions', upsertsByType(items, 'rush-session').map(item => rushSessionRow(item, userId)));
    for(const item of upsertsByType(items,'rush-session'))this.diagnostics.confirmed(item);
    await this.upsert('rush_coverage', upsertsByType(items, 'rush-coverage').map(item => ({
      user_id: userId, module: field(item.payload, 'module'), content_id: field(item.payload, 'contentId'),
      first_seen_at: timestamp(field(item.payload, 'firstSeenAt')),
    })));
    for(const item of upsertsByType(items,'rush-coverage'))this.diagnostics.confirmed(item);
    for(const item of items.filter(item=>item.operation==='delete'&&item.entityType!=='local-storage'&&item.entityType!=='manga-saved-item')){await this.diagnostics.run('push',item.entityType,()=>this.deleteEntity(item,userId),item);this.diagnostics.confirmed(item);}
  }

  private async pushLocalStorage(item: SyncOutboxItem, userId: string): Promise<void> {
    const key = item.entityKey; let value = item.payload;
    if (item.operation === 'delete') { await this.deleteForKey(key, userId); return; }
    if (key in PROGRESS_KEYS) {
      const module = PROGRESS_KEYS[key];
      const remoteRows = await this.selectChanged('study_progress', userId, null); this.assertWorkspace(userId);
      const remote = Object.fromEntries(remoteRows.filter(row => row['module'] === module).map(row => [String(row['unit_key']), row['card_json']]));
      value = mergeProgressSnapshots(asRecord(value), remote);
      const records = Object.values(asRecord(value));
      await this.upsert('study_progress', records.map(progress => ({
        user_id: userId, module, unit_key: field(progress, 'key'), card_json: progress,
        last_review_at: field(progress, 'lastSeenAt'),
      }))); return;
    }
    if (key in EVENT_KEYS) {
      const module = EVENT_KEYS[key];
      await this.upsert('review_events', asArray(value).map(event => ({
        id: field(event, 'id'), user_id: userId, module, unit_key: field(event, 'key'),
        reviewed_at: field(event, 'reviewedAt'), rating: field(event, 'rating'), payload: event, device_id: this.device.id,
      }))); return;
    }
    if (key === SESSION_KEY) {
      await this.upsert('completed_sessions', asArray(value).map(session => ({
        id: field(session, 'sessionId'), user_id: userId, module: field(session, 'module') ?? 'kana',
        completed_at: field(session, 'completedAt'), spain_day: getSpainDayKey(new Date(String(field(session, 'completedAt')))),
        payload: session, device_id: this.device.id,
      }))); return;
    }
    if (MEDAL_KEYS.has(key)) {
      const category = key.includes('.rush.') ? 'rush' : 'normal';
      await this.upsert('medal_unlocks', asArray(value).map(unlock => ({
        user_id: userId, medal_id: field(unlock, 'medalId'), module_category: category,
        unlocked_at: field(unlock, 'unlockedAt'),
      }))); return;
    }
    if (key === DECK_SETTINGS_KEY) {
      const { data: remote, error } = await this.client!.from('deck_settings').select('deck_id,payload,updated_at').eq('user_id', userId);
      if (error) throw error; this.assertWorkspace(userId);
      const newestRemote = (remote ?? []).reduce((latest, row) => String(row.updated_at) > latest ? String(row.updated_at) : latest, '');
      if (newestRemote > item.createdAt) {
        const merged = Object.fromEntries((remote ?? []).map(row => [String(row.deck_id), row.payload]));
        await this.hydrateProcessedPreference(item, merged, userId); return;
      }
      await this.upsert('deck_settings', Object.entries(asRecord(value)).map(([deckId, settings]) => ({
        user_id: userId, deck_id: deckId, payload: settings,
      }))); return;
    }
    const { data: remotePreference, error: preferenceError } = await this.client!.from('user_preferences').select('payload,updated_at')
      .eq('user_id', userId).eq('preference_key', key).maybeSingle();
    if (preferenceError) throw preferenceError; this.assertWorkspace(userId);
    if (key === GRAMMAR_PROGRESS_KEY || key === GRAMMAR_PROGRESS_V2_KEY) {
      const mergeGrammarProgress = await this.grammarMerge(key);
      this.assertWorkspace(userId);
      if (this.workspace.userId() !== userId) throw new Error('Workspace changed during grammar sync');
      const merged = mergeGrammarProgress(mergeGrammarProgress(value, this.storage.get(key, null)), remotePreference?.payload);
      await this.upsert('user_preferences', [{user_id: userId, preference_key: key, payload: merged}]);
      if (this.workspace.userId() !== userId) throw new Error('Workspace changed during grammar sync');
      this.storage.setFromCloud(key, mergeGrammarProgress(merged, this.storage.get(key, null)));
      return;
    }
    if (remotePreference && String(remotePreference.updated_at) > item.createdAt) {
      await this.hydrateProcessedPreference(item, remotePreference.payload, userId); return;
    }
    await this.upsert('user_preferences', [{ user_id: userId, preference_key: key, payload: value }]);
  }

  private async grammarMerge(key: string) {
    if (key !== GRAMMAR_PROGRESS_V2_KEY) return mergeGrammarV1;
    // The curriculum remains a lazy feature dependency, including during Guest import.
    const {GRAMMAR_V2_CONCEPTS} = await import('../../data/grammar/grammar-n5-v2.generated');
    const catalog = new Map(GRAMMAR_V2_CONCEPTS.map(concept => [concept.id, concept.exercises.map(exercise => exercise.id)]));
    return (local: unknown, remote: unknown) => mergeGrammarV2Progress(local, remote, catalog);
  }

  private async hydrateProcessedPreference(item: SyncOutboxItem, value: unknown, userId: string): Promise<void> {
    const pending = await this.outbox.pending(item.workspace);
    this.assertWorkspace(userId);
    if (!pending.some(current => current.id === item.id && current.revision !== item.revision))
      this.storage.setFromCloud(item.entityKey, value);
  }

  private async unprocessedItems(userId: string): Promise<SyncOutboxItem[]> {
    const items = await this.outbox.pending(`user:${userId}`);
    this.assertWorkspace(userId);
    return items.filter(item => !this.processed.some(done => done.id === item.id && done.revision === item.revision));
  }

  private async pull(userId: string): Promise<void> {
    // Full, ordered pages deliberately ignore legacy client-clock cursors.
    const since = null;
    const [progress, events, sessions, medals, preferences, deckProgress, deckEvents, deckDaily, deckSettings, rushSessions, rushCoverage] = await Promise.all([
      this.selectChanged('study_progress', userId, since), this.selectChanged('review_events', userId, since),
      this.selectChanged('completed_sessions', userId, since), this.selectChanged('medal_unlocks', userId, since),
      this.selectChanged('user_preferences', userId, since),
      this.selectChanged('deck_card_progress', userId, since), this.selectChanged('deck_review_events', userId, since),
      this.selectChanged('deck_daily_state', userId, since), this.selectChanged('deck_settings', userId, since),
      this.selectChanged('rush_sessions', userId, since), this.selectChanged('rush_coverage', userId, since),
    ]);
    this.assertWorkspace(userId);
    await this.unprocessedItems(userId);
    for (const [key, module] of Object.entries(PROGRESS_KEYS)) {
      const local = this.storage.get<Record<string, any>>(key, {});
      const remote = Object.fromEntries(progress.filter(row => row['module'] === module).map(row => [String(row['unit_key']), row['card_json']]));
      if (Object.keys(remote).length) this.storage.setFromCloud(key, mergeProgressSnapshots(local, remote));
    }
    for (const [key, module] of Object.entries(EVENT_KEYS)) {
      const local = this.storage.get<any[]>(key, []);
      const remote = events.filter(row => row['module'] === module).map(row => row['payload']);
      if (remote.length) this.storage.setFromCloud(key, unionById(local, remote, item => String(field(item, 'id'))));
    }
    const localSessions = this.storage.get<CompletedSessionSummary[]>(SESSION_KEY, []);
    const remoteSessions = sessions.map(row => row['payload'] as CompletedSessionSummary);
    if (remoteSessions.length) {
      const merged = unionById(localSessions, remoteSessions, item => item.sessionId);
      this.storage.setFromCloud(SESSION_KEY, merged); this.history.mergeFromCloud(merged);
    }
    for (const category of ['normal', 'rush'] as const) {
      const key = category === 'rush' ? 'kana-study.rush.medal-unlocks.v1' : 'kana-study.medal-unlocks.v1';
      const remoteMedals = medals.filter(row => (row['module_category'] === 'rush' ? 'rush' : 'normal') === category)
        .map(row => ({medalId:String(row['medal_id']), unlockedAt:String(row['unlocked_at'])}));
      if (remoteMedals.length) this.storage.setFromCloud(key, mergeMedalUnlocks(this.storage.get<MedalUnlock[]>(key, []), remoteMedals));
    }
    for (const row of preferences) {
      const key = String(row['preference_key']);
      if (key === GRAMMAR_PROGRESS_KEY || key === GRAMMAR_PROGRESS_V2_KEY) {
        const mergeGrammarProgress = await this.grammarMerge(key);
        this.assertWorkspace(userId);
        if (this.workspace.userId() !== userId) throw new Error('Workspace changed during grammar sync');
        const merged = mergeGrammarProgress(this.storage.get(key, null), row['payload']);
        // Reconcile the union back to the existing preference row, including on pull-only syncs.
        if (JSON.stringify(merged) !== JSON.stringify(mergeGrammarProgress(null, row['payload']))) {
          await this.upsert('user_preferences', [{user_id: userId, preference_key: key, payload: merged}]);
        }
        if (this.workspace.userId() !== userId) throw new Error('Workspace changed during grammar sync');
        this.storage.setFromCloud(key, mergeGrammarProgress(merged, this.storage.get(key, null)));
      } else if (!(await this.unprocessedItems(userId)).some(item => item.entityType === 'local-storage' && item.entityKey === key)) this.storage.setFromCloud(key, row['payload']);
    }
    if (deckSettings.length && !(await this.unprocessedItems(userId)).some(item => item.entityType === 'local-storage' && item.entityKey === DECK_SETTINGS_KEY)) {
      const local = this.storage.get<Record<string, unknown>>(DECK_SETTINGS_KEY, {});
      for (const row of deckSettings) local[String(row['deck_id'])] = row['payload'];
      this.storage.setFromCloud(DECK_SETTINGS_KEY, local);
    }
    let changed = await this.unprocessedItems(userId);
    const protectedEntity = (type: SyncOutboxItem['entityType'], key: string) => changed.some(item => item.entityType === type && item.entityKey === key);
    await this.decks.mergeFromCloud({
      progress: deckProgress.filter(row => !protectedEntity('deck-card-progress', `${row['deck_id']}:${row['entry_id']}`)).map(row => row['card_json']),
      events: deckEvents.filter(row => !protectedEntity('deck-review-event', String(row['id']))).map(row => row['payload']),
      daily: deckDaily.filter(row => !protectedEntity('deck-daily-state', `${row['deck_id']}:${row['local_day']}`)).map(row => ({ deckId: String(row['deck_id']), localDate: String(row['local_day']),
        introducedEntryIds: row['introduced_entry_ids'] ?? [], newLimitOverride: row['new_limit_override'] ?? null })),
    });
    changed = await this.unprocessedItems(userId);
    await this.rush.mergeFromCloud({
      sessions: rushSessions.filter(row => !protectedEntity('rush-session', String(row['id']))).map(rushSessionFromRow),
      coverage: rushCoverage.filter(row => !protectedEntity('rush-coverage', `${row['module']}:${row['content_id']}`)).map(row => ({ module: row['module'], contentId: String(row['content_id']), firstSeenAt: new Date(row['first_seen_at']).getTime() })),
    });
    this.assertWorkspace(userId);
  }

  private async selectChanged(table: string, userId: string, _since: string | null): Promise<Record<string, any>[]> {
    const rows: Record<string, any>[] = [];
    for (let offset = 0; ; offset += PAGE_SIZE) {
      this.assertWorkspace(userId);
      let query = this.client!.from(table).select('*').eq('user_id', userId);
      for (const key of TABLE_KEYS[table] ?? ['id']) query = query.order(key, {ascending: true});
      const data=await this.diagnostics.run('pull',table,async()=>{const {data,error}=await query.range(offset,offset+PAGE_SIZE-1);if(error)throw error;return data;});
      this.assertWorkspace(userId);
      rows.push(...(data ?? []));
      if ((data?.length ?? 0) < PAGE_SIZE) return rows;
    }
  }

  private async upsert(table: string, rows: readonly Record<string, unknown>[]): Promise<void> {
    if (!rows.length) return;
    for (let index = 0; index < rows.length; index += 200) {
      this.assertWorkspace(String(rows[index]['user_id']));
      await this.diagnostics.run('push',table,async()=>{const {error}=await this.client!.from(table).upsert(rows.slice(index,index+200));if(error)throw error;});
    }
  }

  private async deleteForKey(key: string, userId: string): Promise<void> {
    if (key in PROGRESS_KEYS) await this.checkDelete(this.client!.from('study_progress').delete().eq('user_id', userId).eq('module', PROGRESS_KEYS[key]), userId);
    else if (key in EVENT_KEYS) await this.checkDelete(this.client!.from('review_events').delete().eq('user_id', userId).eq('module', EVENT_KEYS[key]), userId);
    else if (key === SESSION_KEY) await this.checkDelete(this.client!.from('completed_sessions').delete().eq('user_id', userId), userId);
    else if (MEDAL_KEYS.has(key)) await this.checkDelete(this.client!.from('medal_unlocks').delete().eq('user_id', userId), userId);
    else await this.checkDelete(this.client!.from('user_preferences').delete().eq('user_id', userId).eq('preference_key', key), userId);
  }

  private async deleteEntity(item: SyncOutboxItem, userId: string): Promise<void> {
    if (item.entityType === 'deck-review-event') await this.checkDelete(this.client!.from('deck_review_events').delete().eq('user_id', userId).eq('id', item.entityKey), userId);
    else if (item.entityType === 'deck-card-progress') {
      const [deckId, ...entry] = item.entityKey.split(':');
      await this.checkDelete(this.client!.from('deck_card_progress').delete().eq('user_id', userId).eq('deck_id', deckId).eq('entry_id', entry.join(':')), userId);
    } else if (item.entityType === 'rush-session') await this.checkDelete(this.client!.from('rush_sessions').delete().eq('user_id', userId).eq('id', item.entityKey), userId);
  }

  private async checkDelete(query: PromiseLike<{error: unknown}>, userId: string): Promise<void> {
    this.assertWorkspace(userId);
    const {error} = await query;
    if (error) throw error;
    this.assertWorkspace(userId);
  }

  async inspectDiagnostics():Promise<SyncDiagnosticReport|null> {
    const workspace=this.workspace.active();if(workspace==='guest')return null;
    try{
      const queued=await this.outbox.pending(workspace),journals=await this.savedManga.pending(workspace);
      if(this.workspace.active()!==workspace)return null;
      return this.diagnostics.report(this.status(),queued,journals);
    }catch(error){
      if(this.workspace.active()!==workspace)return null;
      this.diagnostics.capture(error,'pending','indexeddb');return this.diagnostics.report(this.status(),[],[]);
    }
  }
  private async cleanConfirmed():Promise<void> {
    const items=this.diagnostics.confirmedItems(this.processed);
    if(!items.length)return;
    await this.diagnostics.run('outbox-ack','sync-indexeddb',()=>this.outbox.removeProcessed(items));
    this.diagnostics.cleaned(items);
  }

  private async refreshPending(): Promise<void> {
    const workspace = this.workspace.active();
    const queued = await this.diagnostics.run('pending','sync-indexeddb',()=>this.outbox.pending(workspace));
    const manga = await this.diagnostics.run('pending','manga-indexeddb',()=>this.savedManga.pending(workspace));
    const count = new Set([...queued.map(item=>item.id),...manga.map(item=>`${workspace}:manga-saved-item:${item.id}`)]).size;
    if (this.workspace.active() === workspace) this.pendingState.set(count);
  }

}

function asRecord(value: unknown): Record<string, any> { return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, any> : {}; }
function asArray(value: unknown): any[] { return Array.isArray(value) ? value : []; }
function upsertsByType(items: readonly SyncOutboxItem[], type: SyncOutboxItem['entityType']): SyncOutboxItem[] { return items.filter(item => item.entityType === type && item.operation === 'upsert'); }
function field(value: unknown, path: string): any { return path.split('.').reduce<any>((current, key) => current?.[key], value); }
function timestamp(value: unknown): string | null { if (value == null) return null; const date = new Date(value as string | number); return Number.isNaN(date.getTime()) ? null : date.toISOString(); }
function rushSessionRow(item: SyncOutboxItem, userId: string): Record<string, unknown> {
  const value = item.payload;
  return {
    id: item.entityKey, user_id: userId, module: field(value, 'module'), started_at: timestamp(field(value, 'startedAt')),
    ended_at: timestamp(field(value, 'endedAt')), active_seconds: field(value, 'activeSeconds'), cards_completed: field(value, 'cardsCompleted'),
    unique_contents_seen: field(value, 'uniqueContentsSeen'), cycles_completed: field(value, 'cyclesCompleted'),
    initial_unit_count: field(value, 'initialUnitCount'), local_day: field(value, 'localDay'), interrupted: field(value, 'interrupted'),
  };
}
function rushSessionFromRow(row: Record<string, any>): any {
  return { id:String(row['id']),module:row['module'],startedAt:new Date(row['started_at']).getTime(),endedAt:row['ended_at']?new Date(row['ended_at']).getTime():null,
    activeSeconds:Number(row['active_seconds']),cardsCompleted:Number(row['cards_completed']),uniqueContentsSeen:Number(row['unique_contents_seen']),cyclesCompleted:Number(row['cycles_completed']),
    initialUnitCount:Number(row['initial_unit_count']),localDay:String(row['local_day']),interrupted:Boolean(row['interrupted']) };
}
