import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { CompletedSessionSummary } from '../models/learning-session.model';
import { MedalUnlock } from '../models/medal.model';
import { SyncOutboxItem, SyncStatus } from '../models/account.model';
import { getSpainDayKey } from './daily-learning.service';
import { DeviceService } from './device.service';
import { SessionHistoryService } from './session-history.service';
import { StorageService } from './storage.service';
import { SupabaseClientService } from './supabase-client.service';
import { makeOutboxItem, SyncOutboxService } from './sync-outbox.service';
import { mergeGrammarProgress, mergeMedalUnlocks, mergeProgressSnapshots, unionById } from './sync-merge';
import { GRAMMAR_PROGRESS_KEY } from '../models/grammar-progress.model';
import { WORKSPACE_LOCAL_KEYS, WorkspaceService } from './workspace.service';
import { DeckDatabaseService } from './deck-database.service';
import { LocalRushRepository } from './rush-repository.service';
import type { SupabaseClient } from '@supabase/supabase-js';
import { STUDY_DECKS } from '../../data/study-decks';

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
const OVERLAP_MS = 60_000;

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
  private readonly destroyRef = inject(DestroyRef);
  private readonly statusState = signal<SyncStatus>(this.workspace.active() === 'guest' ? 'guest' : 'pending');
  private readonly pendingState = signal(0);
  private readonly lastSyncState = signal<string | null>(null);
  private timer: ReturnType<typeof setTimeout> | null = null;
  private client: SupabaseClient | null = null;
  private reconciledThisBoot = false;

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
    window.addEventListener('offline', () => this.statusState.set(this.available() ? 'offline' : 'guest'));
    window.addEventListener('focus', visible);
    document.addEventListener('visibilitychange', visible);
    this.destroyRef.onDestroy(() => {
      window.removeEventListener('kana-study:sync-pending', schedule);
      window.removeEventListener('online', online);
      window.removeEventListener('focus', visible);
      document.removeEventListener('visibilitychange', visible);
      if (this.timer) clearTimeout(this.timer);
    });
    if (this.available()) this.schedule(0);
  }

  async syncNow(): Promise<boolean> {
    const client = await this.supabase.getClient(); const userId = this.workspace.userId(); const workspace = this.workspace.active();
    if (!client || !userId || workspace === 'guest') { this.statusState.set('guest'); return false; }
    this.client = client;
    if (!navigator.onLine) { this.statusState.set('offline'); await this.refreshPending(); return false; }
    if (this.statusState() === 'syncing') return false;
    this.statusState.set('syncing');
    try {
      if (!this.reconciledThisBoot) { await this.reconcileLocalSnapshot(); this.reconciledThisBoot = true; }
      const items = await this.outbox.pending(workspace);
      if (items.length) await this.push(items, userId);
      await this.pull(userId);
      if (items.length) await this.outbox.removeProcessed(items);
      const now = new Date().toISOString();
      this.lastSyncState.set(now); this.statusState.set('synced'); await this.refreshPending();
      return true;
    } catch {
      const items = await this.outbox.pending(workspace);
      if (items.length) await this.outbox.markAttempt(items).catch(() => undefined);
      this.statusState.set(navigator.onLine ? 'error' : 'offline'); await this.refreshPending();
      return false;
    }
  }

  schedule(delay = 900): void {
    if (!this.available()) { this.statusState.set('guest'); return; }
    this.statusState.set(navigator.onLine ? 'pending' : 'offline');
    void this.refreshPending();
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => { this.timer = null; void this.syncNow(); }, delay);
  }

  private async push(items: readonly SyncOutboxItem[], userId: string): Promise<void> {
    const localItems = items.filter(item => item.entityType === 'local-storage');
    for (const item of localItems) await this.pushLocalStorage(item, userId);
    await this.upsert('deck_card_progress', upsertsByType(items, 'deck-card-progress').map(item => ({
      user_id: userId, deck_id: field(item.payload, 'deckId'), entry_id: field(item.payload, 'entryId'),
      card_json: item.payload, last_review_at: timestamp(field(item.payload, 'card.lastReview')),
    })));
    await this.upsert('deck_review_events', upsertsByType(items, 'deck-review-event').map(item => ({
      id: item.entityKey, user_id: userId, deck_id: field(item.payload, 'deckId'), entry_id: field(item.payload, 'entryId'),
      reviewed_at: timestamp(field(item.payload, 'reviewedAt')), payload: item.payload, device_id: this.device.id,
    })));
    await this.upsert('deck_daily_state', upsertsByType(items, 'deck-daily-state').map(item => ({
      user_id: userId, deck_id: field(item.payload, 'deckId'), local_day: field(item.payload, 'localDate'),
      introduced_entry_ids: field(item.payload, 'introducedEntryIds') ?? [], new_limit_override: field(item.payload, 'newLimitOverride'),
    })));
    await this.upsert('rush_sessions', upsertsByType(items, 'rush-session').map(item => rushSessionRow(item, userId)));
    await this.upsert('rush_coverage', upsertsByType(items, 'rush-coverage').map(item => ({
      user_id: userId, module: field(item.payload, 'module'), content_id: field(item.payload, 'contentId'),
      first_seen_at: timestamp(field(item.payload, 'firstSeenAt')),
    })));
    for (const item of items.filter(item => item.operation === 'delete' && item.entityType !== 'local-storage')) await this.deleteEntity(item, userId);
  }

  private async pushLocalStorage(item: SyncOutboxItem, userId: string): Promise<void> {
    const key = item.entityKey; const value = item.payload;
    if (item.operation === 'delete') { await this.deleteForKey(key, userId); return; }
    if (key in PROGRESS_KEYS) {
      const module = PROGRESS_KEYS[key]; const records = Object.values(asRecord(value));
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
      const { data: remote } = await this.client!.from('deck_settings').select('deck_id,payload,updated_at').eq('user_id', userId);
      const newestRemote = (remote ?? []).reduce((latest, row) => String(row.updated_at) > latest ? String(row.updated_at) : latest, '');
      if (newestRemote > item.createdAt) {
        const merged = Object.fromEntries((remote ?? []).map(row => [String(row.deck_id), row.payload]));
        this.storage.setFromCloud(DECK_SETTINGS_KEY, merged); return;
      }
      await this.upsert('deck_settings', Object.entries(asRecord(value)).map(([deckId, settings]) => ({
        user_id: userId, deck_id: deckId, payload: settings,
      }))); return;
    }
    const { data: remotePreference, error: preferenceError } = await this.client!.from('user_preferences').select('payload,updated_at')
      .eq('user_id', userId).eq('preference_key', key).maybeSingle();
    if (key === GRAMMAR_PROGRESS_KEY) {
      if (preferenceError) throw preferenceError;
      if (this.workspace.userId() !== userId) throw new Error('Workspace changed during grammar sync');
      const merged = mergeGrammarProgress(mergeGrammarProgress(value, this.storage.get(key, null)), remotePreference?.payload);
      await this.upsert('user_preferences', [{user_id: userId, preference_key: key, payload: merged}]);
      if (this.workspace.userId() !== userId) throw new Error('Workspace changed during grammar sync');
      this.storage.setFromCloud(key, mergeGrammarProgress(merged, this.storage.get(key, null)));
      return;
    }
    if (remotePreference && String(remotePreference.updated_at) > item.createdAt) {
      this.storage.setFromCloud(key, remotePreference.payload); return;
    }
    await this.upsert('user_preferences', [{ user_id: userId, preference_key: key, payload: value }]);
  }

  private async pull(userId: string): Promise<void> {
    const since = await this.incrementalSince('all');
    const [progress, events, sessions, medals, preferences, deckProgress, deckEvents, deckDaily, deckSettings, rushSessions, rushCoverage] = await Promise.all([
      this.selectChanged('study_progress', userId, since), this.selectChanged('review_events', userId, since),
      this.selectChanged('completed_sessions', userId, since), this.selectChanged('medal_unlocks', userId, since),
      this.selectChanged('user_preferences', userId, since),
      this.selectChanged('deck_card_progress', userId, since), this.selectChanged('deck_review_events', userId, since),
      this.selectChanged('deck_daily_state', userId, since), this.selectChanged('deck_settings', userId, since),
      this.selectChanged('rush_sessions', userId, since), this.selectChanged('rush_coverage', userId, since),
    ]);
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
      if (key === GRAMMAR_PROGRESS_KEY) {
        if (this.workspace.userId() !== userId) throw new Error('Workspace changed during grammar sync');
        const merged = mergeGrammarProgress(this.storage.get(key, null), row['payload']);
        // Reconcile the union back to the existing preference row, including on pull-only syncs.
        if (JSON.stringify(merged) !== JSON.stringify(mergeGrammarProgress(null, row['payload']))) {
          await this.upsert('user_preferences', [{user_id: userId, preference_key: key, payload: merged}]);
        }
        if (this.workspace.userId() !== userId) throw new Error('Workspace changed during grammar sync');
        this.storage.setFromCloud(key, mergeGrammarProgress(merged, this.storage.get(key, null)));
      } else this.storage.setFromCloud(key, row['payload']);
    }
    if (deckSettings.length) {
      const local = this.storage.get<Record<string, unknown>>(DECK_SETTINGS_KEY, {});
      for (const row of deckSettings) local[String(row['deck_id'])] = row['payload'];
      this.storage.setFromCloud(DECK_SETTINGS_KEY, local);
    }
    await this.decks.mergeFromCloud({
      progress: deckProgress.map(row => row['card_json']),
      events: deckEvents.map(row => row['payload']),
      daily: deckDaily.map(row => ({ deckId: String(row['deck_id']), localDate: String(row['local_day']),
        introducedEntryIds: row['introduced_entry_ids'] ?? [], newLimitOverride: row['new_limit_override'] ?? null })),
    });
    await this.rush.mergeFromCloud({
      sessions: rushSessions.map(rushSessionFromRow),
      coverage: rushCoverage.map(row => ({ module: row['module'], contentId: String(row['content_id']), firstSeenAt: new Date(row['first_seen_at']).getTime() })),
    });
    const now = new Date().toISOString();
    await this.outbox.putMeta({ workspace: this.workspace.active(), table: 'all', lastPulledAt: now, lastSyncedAt: now });
  }

  private async selectChanged(table: string, userId: string, since: string | null): Promise<Record<string, any>[]> {
    let query = this.client!.from(table).select('*').eq('user_id', userId);
    if (since) query = query.gte('updated_at', since);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as Record<string, any>[];
  }

  private async incrementalSince(table: string): Promise<string | null> {
    const meta = await this.outbox.getMeta(this.workspace.active(), table);
    if (!meta?.lastPulledAt) return null;
    return new Date(new Date(meta.lastPulledAt).getTime() - OVERLAP_MS).toISOString();
  }

  private async upsert(table: string, rows: readonly Record<string, unknown>[]): Promise<void> {
    if (!rows.length) return;
    for (let index = 0; index < rows.length; index += 200) {
      const { error } = await this.client!.from(table).upsert(rows.slice(index, index + 200));
      if (error) throw error;
    }
  }

  private async deleteForKey(key: string, userId: string): Promise<void> {
    if (key in PROGRESS_KEYS) await this.client!.from('study_progress').delete().eq('user_id', userId).eq('module', PROGRESS_KEYS[key]);
    else if (key in EVENT_KEYS) await this.client!.from('review_events').delete().eq('user_id', userId).eq('module', EVENT_KEYS[key]);
    else if (key === SESSION_KEY) await this.client!.from('completed_sessions').delete().eq('user_id', userId);
    else if (MEDAL_KEYS.has(key)) await this.client!.from('medal_unlocks').delete().eq('user_id', userId);
    else await this.client!.from('user_preferences').delete().eq('user_id', userId).eq('preference_key', key);
  }

  private async deleteEntity(item: SyncOutboxItem, userId: string): Promise<void> {
    if (item.entityType === 'deck-review-event') await this.client!.from('deck_review_events').delete().eq('user_id', userId).eq('id', item.entityKey);
    else if (item.entityType === 'deck-card-progress') {
      const [deckId, ...entry] = item.entityKey.split(':');
      await this.client!.from('deck_card_progress').delete().eq('user_id', userId).eq('deck_id', deckId).eq('entry_id', entry.join(':'));
    } else if (item.entityType === 'rush-session') await this.client!.from('rush_sessions').delete().eq('user_id', userId).eq('id', item.entityKey);
  }

  private async refreshPending(): Promise<void> { this.pendingState.set(await this.outbox.count(this.workspace.active())); }

  private async reconcileLocalSnapshot(): Promise<void> {
    const workspace = this.workspace.active();
    for (const key of WORKSPACE_LOCAL_KEYS) {
      try {
        const raw = localStorage.getItem(this.workspace.storageKey(key));
        if (raw !== null) { const item = makeOutboxItem(workspace, 'local-storage', key, JSON.parse(raw)); if (item) await this.outbox.enqueue(item); }
      } catch { /* invalid/blocked storage is ignored without affecting local study */ }
    }
    for (const deck of STUDY_DECKS) {
      const [progress, events] = await Promise.all([this.decks.getDeckProgress(deck.id), this.decks.getDeckReviewEvents(deck.id)]);
      for (const value of progress) await this.enqueueSnapshot('deck-card-progress', `${value.deckId}:${value.entryId}`, value);
      for (const value of events) await this.enqueueSnapshot('deck-review-event', value.id, value);
    }
    for (const value of await this.decks.getAllDailyStates()) await this.enqueueSnapshot('deck-daily-state', `${value.deckId}:${value.localDate}`, value);
    const rush = await this.rush.getStats();
    for (const value of rush.sessions) await this.enqueueSnapshot('rush-session', value.id, value);
    for (const value of rush.coverage) await this.enqueueSnapshot('rush-coverage', `${value.module}:${value.contentId}`, value);
  }

  private async enqueueSnapshot(type: SyncOutboxItem['entityType'], key: string, payload: unknown): Promise<void> {
    const item = makeOutboxItem(this.workspace.active(), type, key, payload); if (item) await this.outbox.enqueue(item);
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
