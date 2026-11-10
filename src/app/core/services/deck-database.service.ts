import { LocalWorkspaceId } from '../models/account.model';
import { DestroyRef, inject, Injectable, signal } from '@angular/core';
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
  /** Read-model invalidation after the local commit, even if outbox enqueue later fails. */
  readonly revision = signal(0);
  private readonly workspace = inject(WorkspaceService);
  private readonly outbox = inject(SyncOutboxService);
  private readonly databases = new Map<string, Promise<IDBDatabase>>();

  constructor() { inject(DestroyRef).onDestroy(() => { for (const db of this.databases.values()) void db.then(value => value.close()).catch(() => undefined); }); }

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
    const workspace=this.workspace.active(),epoch=this.workspace.activationRevision();
    const assertOwner=()=>{if(workspace!==this.workspace.active()||epoch!==this.workspace.activationRevision())throw new Error('Deck workspace changed');};
    const db=await this.database(workspace);assertOwner();
    const transaction=db.transaction(DAILY_STORE,'readwrite'),done=transactionDone(transaction);
    try{
      const stored=await requestResult<DeckDailyState|undefined>(transaction.objectStore(DAILY_STORE).get([state.deckId,state.localDate]));assertOwner();
      state={...state,introducedEntryIds:stored?.introducedEntryIds??state.introducedEntryIds,completedAt:stored?.completedAt??(state.completedAt===undefined?stored?.completedAt:state.completedAt)};
      transaction.objectStore(DAILY_STORE).put(state);
    }catch(error){try{transaction.abort();}catch{}await done.catch(()=>{});throw error;}
    await done;
    await this.enqueue(workspace,'deck-daily-state',`${state.deckId}:${state.localDate}`,state);
  }

  async commitReview(progress: DeckCardProgress, event: DeckReviewEvent, dailyState: DeckDailyState,newCardLimit?:number): Promise<void> {
    const workspace = this.workspace.active();
    const db = await this.database(workspace);
    const transaction = db.transaction([PROGRESS_STORE, EVENTS_STORE, DAILY_STORE], 'readwrite');
    const done=transactionDone(transaction);
    let publishedProgress:DeckCardProgress|null=progress,publishedDaily=dailyState;
    try{
      const previous=await requestResult<DeckReviewEvent|undefined>(transaction.objectStore(EVENTS_STORE).get(event.id));
      const current=await requestResult<DeckCardProgress|undefined>(transaction.objectStore(PROGRESS_STORE).get([progress.deckId,progress.entryId]));
      const currentDaily=await requestResult<DeckDailyState|undefined>(transaction.objectStore(DAILY_STORE).get([dailyState.deckId,dailyState.localDate]));
      if(previous){
        if(JSON.stringify(previous)!==JSON.stringify(event))throw new Error('Deck receipt conflict');
        publishedProgress=current??null;publishedDaily=currentDaily??dailyState;
      }else{
        if(currentDaily?.completedAt!=null)throw new Error('Deck session is closed');
        if(JSON.stringify(current?.card??null)!==JSON.stringify(event.cardBefore))throw new Error('Deck card changed during review');
        if((event.cardBefore===null||event.cardBefore.state===0)&&newCardLimit!==undefined&&!currentDaily?.introducedEntryIds.includes(event.entryId)
          &&new Set(currentDaily?.introducedEntryIds??[]).size>=(currentDaily?.newLimitOverride??newCardLimit))throw new Error('Daily new-card limit reached');
        publishedDaily={...dailyState,...(currentDaily??{}),introducedEntryIds:[...new Set([...(currentDaily?.introducedEntryIds??[]),...dailyState.introducedEntryIds])]};
        transaction.objectStore(PROGRESS_STORE).put(progress);
        transaction.objectStore(EVENTS_STORE).add(event);
        transaction.objectStore(DAILY_STORE).put(publishedDaily);
      }
    }catch(error){try{transaction.abort();}catch{/* Already aborted by IndexedDB. */}await done.catch(()=>{});throw error;}
    await done;
    this.revision.update(n => n + 1);
    await this.enqueue(workspace, 'deck-card-progress', `${progress.deckId}:${progress.entryId}`, publishedProgress,publishedProgress?'upsert':'delete');
    await this.enqueue(workspace, 'deck-review-event', event.id, event);
    await this.enqueue(workspace, 'deck-daily-state', `${dailyState.deckId}:${dailyState.localDate}`, publishedDaily);
  }

  async undoReview(event: DeckReviewEvent, dailyState: DeckDailyState): Promise<void> {
    const workspace = this.workspace.active();
    const db = await this.database(workspace);
    const transaction = db.transaction([PROGRESS_STORE, EVENTS_STORE, DAILY_STORE], 'readwrite');
    const done=transactionDone(transaction);let publishedProgress:DeckCardProgress|null=null,publishedDaily=dailyState,changed=false;
    try{
      const record=await requestResult<DeckReviewEvent|undefined>(transaction.objectStore(EVENTS_STORE).get(event.id));
      const current=await requestResult<DeckCardProgress|undefined>(transaction.objectStore(PROGRESS_STORE).get([event.deckId,event.entryId]));
      const storedDaily=await requestResult<DeckDailyState|undefined>(transaction.objectStore(DAILY_STORE).get([dailyState.deckId,dailyState.localDate]));
      publishedProgress=current??null;publishedDaily=storedDaily??dailyState;
      if(record){
        if(JSON.stringify(record)!==JSON.stringify(event)||!current||current.card.lastReview!==event.reviewedAt||current.due!==event.dueAfter||current.state!==event.stateAfter||current.card.stability!==event.stabilityAfter)throw new Error('Deck undo is based on stale progress');
        publishedProgress=event.cardBefore?{deckId:event.deckId,entryId:event.entryId,due:event.cardBefore.due,state:event.cardBefore.state,card:event.cardBefore}:null;
        if(publishedProgress)transaction.objectStore(PROGRESS_STORE).put(publishedProgress);else transaction.objectStore(PROGRESS_STORE).delete([event.deckId,event.entryId]);
        transaction.objectStore(EVENTS_STORE).delete(event.id);
        publishedDaily={...publishedDaily,introducedEntryIds:(event.cardBefore===null||event.cardBefore.state===0)?publishedDaily.introducedEntryIds.filter(id=>id!==event.entryId):publishedDaily.introducedEntryIds};
        transaction.objectStore(DAILY_STORE).put(publishedDaily);changed=true;
      }
    }catch(error){try{transaction.abort();}catch{}await done.catch(()=>{});throw error;}
    await done;if(changed)this.revision.update(n=>n+1);
    await this.enqueue(workspace,'deck-card-progress',`${event.deckId}:${event.entryId}`,publishedProgress,publishedProgress?'upsert':'delete');
    await this.enqueue(workspace,'deck-review-event',event.id,event,'delete');
    await this.enqueue(workspace,'deck-daily-state',`${dailyState.deckId}:${dailyState.localDate}`,publishedDaily);
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
    this.revision.update(n => n + 1);
  }

  private database(workspace = this.workspace.active()): Promise<IDBDatabase> {
    const name = this.workspace.databaseName(DATABASE_NAME, workspace);
    let database = this.databases.get(name);
    if (!database) { database = openDatabase(name); this.databases.set(name, database); }
    return database;
  }

  private async enqueue(workspace: LocalWorkspaceId, type: 'deck-card-progress' | 'deck-review-event' | 'deck-daily-state', key: string, payload: unknown, operation: 'upsert' | 'delete' = 'upsert'): Promise<void> {
    const item = makeOutboxItem(workspace, type, key, payload, operation);
    if (item) await this.outbox.enqueue(item);
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
