import { inject, Injectable } from '@angular/core';
import { DeckCardProgress, DeckDailyState, DeckReviewEvent } from '../models/deck-study.model';
import { makeOutboxItem, SyncOutboxService } from './sync-outbox.service';
import { WorkspaceService } from './workspace.service';

const DATABASE_NAME = 'kana-study-decks';
const DATABASE_VERSION = 1;
const PROGRESS_STORE = 'card-progress';
const EVENTS_STORE = 'review-events';
const DAILY_STORE = 'daily-state';

@Injectable({ providedIn: 'root' })
export class DeckDatabaseService {
  private readonly workspace = inject(WorkspaceService);
  private readonly outbox = inject(SyncOutboxService);
  private readonly databases = new Map<string, Promise<IDBDatabase>>();

  async getProgress(deckId: string, entryId: string): Promise<DeckCardProgress | null> {
    const db = await this.database();
    const transaction = db.transaction(PROGRESS_STORE, 'readonly');
    return (await requestResult(transaction.objectStore(PROGRESS_STORE).get([deckId, entryId]))) ?? null;
  }

  async getDeckProgress(deckId: string): Promise<DeckCardProgress[]> {
    const db = await this.database();
    const transaction = db.transaction(PROGRESS_STORE, 'readonly');
    return requestResult(transaction.objectStore(PROGRESS_STORE).index('deckId').getAll(deckId));
  }

  async getDeckReviewEvents(deckId: string): Promise<DeckReviewEvent[]> {
    const db = await this.database();
    const transaction = db.transaction(EVENTS_STORE, 'readonly');
    const events = await requestResult<DeckReviewEvent[]>(transaction.objectStore(EVENTS_STORE).index('deckId').getAll(deckId));
    return events.sort((left, right) => left.reviewedAt - right.reviewedAt);
  }

  async getDailyState(deckId: string, localDate: string): Promise<DeckDailyState | null> {
    const db = await this.database();
    const transaction = db.transaction(DAILY_STORE, 'readonly');
    return (await requestResult(transaction.objectStore(DAILY_STORE).get([deckId, localDate]))) ?? null;
  }

  async getAllDailyStates(): Promise<DeckDailyState[]> {
    const db = await this.database();
    return requestResult(db.transaction(DAILY_STORE).objectStore(DAILY_STORE).getAll());
  }

  async writeDailyState(state: DeckDailyState): Promise<void> {
    const db = await this.database();
    const transaction = db.transaction(DAILY_STORE, 'readwrite');
    transaction.objectStore(DAILY_STORE).put(state);
    await transactionDone(transaction);
    this.enqueue('deck-daily-state', `${state.deckId}:${state.localDate}`, state);
  }

  async commitReview(progress: DeckCardProgress, event: DeckReviewEvent, dailyState: DeckDailyState): Promise<void> {
    const db = await this.database();
    const transaction = db.transaction([PROGRESS_STORE, EVENTS_STORE, DAILY_STORE], 'readwrite');
    transaction.objectStore(PROGRESS_STORE).put(progress);
    transaction.objectStore(EVENTS_STORE).add(event);
    transaction.objectStore(DAILY_STORE).put(dailyState);
    await transactionDone(transaction);
    this.enqueue('deck-card-progress', `${progress.deckId}:${progress.entryId}`, progress);
    this.enqueue('deck-review-event', event.id, event);
    this.enqueue('deck-daily-state', `${dailyState.deckId}:${dailyState.localDate}`, dailyState);
  }

  async undoReview(event: DeckReviewEvent, dailyState: DeckDailyState): Promise<void> {
    const db = await this.database();
    const transaction = db.transaction([PROGRESS_STORE, EVENTS_STORE, DAILY_STORE], 'readwrite');
    const progressStore = transaction.objectStore(PROGRESS_STORE);
    if (event.cardBefore) {
      progressStore.put({
        deckId: event.deckId,
        entryId: event.entryId,
        due: event.cardBefore.due,
        state: event.cardBefore.state,
        card: event.cardBefore,
      } satisfies DeckCardProgress);
    } else {
      progressStore.delete([event.deckId, event.entryId]);
    }
    transaction.objectStore(EVENTS_STORE).delete(event.id);
    transaction.objectStore(DAILY_STORE).put(dailyState);
    await transactionDone(transaction);
    this.enqueue('deck-card-progress', `${event.deckId}:${event.entryId}`, event.cardBefore ? {
      deckId: event.deckId, entryId: event.entryId, due: event.cardBefore.due, state: event.cardBefore.state, card: event.cardBefore,
    } : null, event.cardBefore ? 'upsert' : 'delete');
    this.enqueue('deck-review-event', event.id, event, 'delete');
    this.enqueue('deck-daily-state', `${dailyState.deckId}:${dailyState.localDate}`, dailyState);
  }

  async mergeFromCloud(input: { progress: readonly DeckCardProgress[]; events: readonly DeckReviewEvent[]; daily: readonly DeckDailyState[] }): Promise<void> {
    const db = await this.database();
    const transaction = db.transaction([PROGRESS_STORE, EVENTS_STORE, DAILY_STORE], 'readwrite');
    const progressStore = transaction.objectStore(PROGRESS_STORE);
    for (const remote of input.progress) {
      const local = await requestResult<DeckCardProgress | undefined>(progressStore.get([remote.deckId, remote.entryId]));
      if (!local || (remote.card.lastReview ?? 0) > (local.card.lastReview ?? 0)) progressStore.put(remote);
    }
    const eventStore = transaction.objectStore(EVENTS_STORE);
    for (const event of input.events) eventStore.put(event);
    const dailyStore = transaction.objectStore(DAILY_STORE);
    for (const remote of input.daily) {
      const local = await requestResult<DeckDailyState | undefined>(dailyStore.get([remote.deckId, remote.localDate]));
      dailyStore.put({ ...remote, completedAt: local?.completedAt ?? remote.completedAt, introducedEntryIds: [...new Set([...(local?.introducedEntryIds ?? []), ...remote.introducedEntryIds])] });
    }
    await transactionDone(transaction);
  }

  private database(): Promise<IDBDatabase> {
    const name = this.workspace.databaseName(DATABASE_NAME);
    let database = this.databases.get(name);
    if (!database) { database = openDatabase(name); this.databases.set(name, database); }
    return database;
  }

  private enqueue(type: 'deck-card-progress' | 'deck-review-event' | 'deck-daily-state', key: string, payload: unknown, operation: 'upsert' | 'delete' = 'upsert'): void {
    const item = makeOutboxItem(this.workspace.active(), type, key, payload, operation);
    if (item) void this.outbox.enqueue(item).catch(() => undefined);
  }
}

function openDatabase(name: string): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') return Promise.reject(new Error('IndexedDB is unavailable.'));
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, DATABASE_VERSION);
    request.onerror = () => reject(request.error ?? new Error('Could not open the deck database.'));
    request.onblocked = () => reject(new Error('The deck database upgrade is blocked.'));
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PROGRESS_STORE)) {
        const store = db.createObjectStore(PROGRESS_STORE, { keyPath: ['deckId', 'entryId'] });
        store.createIndex('deckId', 'deckId');
        store.createIndex('due', 'due');
        store.createIndex('state', 'state');
      }
      if (!db.objectStoreNames.contains(EVENTS_STORE)) {
        const store = db.createObjectStore(EVENTS_STORE, { keyPath: 'id' });
        store.createIndex('deckId', 'deckId');
        store.createIndex('entryId', 'entryId');
        store.createIndex('reviewedAt', 'reviewedAt');
        store.createIndex('deckId-reviewedAt', ['deckId', 'reviewedAt']);
      }
      if (!db.objectStoreNames.contains(DAILY_STORE)) {
        db.createObjectStore(DAILY_STORE, { keyPath: ['deckId', 'localDate'] });
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed.'));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction was aborted.'));
  });
}
