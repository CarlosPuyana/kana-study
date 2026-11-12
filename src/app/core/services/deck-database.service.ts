import {preserveClosure} from './deck-closure-state';
import { LocalWorkspaceId } from '../models/account.model';
import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { DeckCardProgress, DeckDailyState, DeckReviewEvent } from '../models/deck-study.model';
import { makeOutboxItem, SyncOutboxService } from './sync-outbox.service';
import { WorkspaceService } from './workspace.service';

const DATABASE_NAME = 'kana-study-decks';
const DATABASE_VERSION = 2;
const UNDO_STORE='undo-publications';
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
  private readonly publishing=new Set<string>();

  constructor() { inject(DestroyRef).onDestroy(() => { for (const db of this.databases.values()) void db.then(value => value.close()).catch(() => undefined); }); }

  async getProgress(deckId: string, entryId: string): Promise<DeckCardProgress | null> {
    const db = await this.database();
    const transaction = db.transaction(PROGRESS_STORE, 'readonly');
    return (await requestResult(transaction.objectStore(PROGRESS_STORE).get([deckId, entryId]))) ?? null;
  }

  async getDeckProgress(deckId: string): Promise<DeckCardProgress[]> {
    void this.retryUndoPublications().catch(error=>console.warn('deck-undo',{phase:'publication',code:'deferred',name:error instanceof Error?error.name:'unknown'}));
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

  async writeDailyState(state: DeckDailyState,expected?:{progress:readonly DeckCardProgress[];entryIds:readonly string[]}): Promise<void> {
    const workspace=this.workspace.active(),epoch=this.workspace.activationRevision();
    const assertOwner=()=>{if(workspace!==this.workspace.active()||epoch!==this.workspace.activationRevision())throw new Error('Deck workspace changed');};
    const check=expected?(await import('./deck-undo-closure')).assertClosureSnapshot:null;assertOwner();
    const db=await this.database(workspace);assertOwner();
    const transaction=db.transaction([DAILY_STORE,PROGRESS_STORE],'readwrite'),done=transactionDone(transaction);
    try{
      const stored=await requestResult<DeckDailyState|undefined>(transaction.objectStore(DAILY_STORE).get([state.deckId,state.localDate]));assertOwner();
      if(expected)check!(expected,await requestResult<DeckCardProgress[]>(transaction.objectStore(PROGRESS_STORE).index('deckId').getAll(state.deckId)));
      assertOwner();
      state=preserveClosure(stored,state);
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
    const epoch=this.workspace.activationRevision(),guard=()=>{if(workspace!==this.workspace.active()||epoch!==this.workspace.activationRevision())throw Error('Deck workspace changed');};
    const {undoDailyState}=await import('./deck-undo-closure');guard();
    const db = await this.database(workspace);
    guard();
    const transaction = db.transaction([PROGRESS_STORE, EVENTS_STORE, DAILY_STORE,UNDO_STORE], 'readwrite');
    const done=transactionDone(transaction);let publishedProgress:DeckCardProgress|null=null,publishedDaily=dailyState,changed=false;
    try{
      const record=await requestResult<DeckReviewEvent|undefined>(transaction.objectStore(EVENTS_STORE).get(event.id));
      const current=await requestResult<DeckCardProgress|undefined>(transaction.objectStore(PROGRESS_STORE).get([event.deckId,event.entryId]));
      const storedDaily=await requestResult<DeckDailyState|undefined>(transaction.objectStore(DAILY_STORE).get([dailyState.deckId,dailyState.localDate]));
      publishedProgress=current??null;publishedDaily=storedDaily??dailyState;
      guard();
      if(record){
        if(JSON.stringify(record)!==JSON.stringify(event)||!current||current.card.lastReview!==event.reviewedAt||current.due!==event.dueAfter||current.state!==event.stateAfter||current.card.stability!==event.stabilityAfter)throw new Error('Deck undo is based on stale progress');
        publishedProgress=event.cardBefore?{deckId:event.deckId,entryId:event.entryId,due:event.cardBefore.due,state:event.cardBefore.state,card:event.cardBefore}:null;
        if(publishedProgress)transaction.objectStore(PROGRESS_STORE).put(publishedProgress);else transaction.objectStore(PROGRESS_STORE).delete([event.deckId,event.entryId]);
        transaction.objectStore(EVENTS_STORE).delete(event.id);
        const events=await requestResult<DeckReviewEvent[]>(transaction.objectStore(EVENTS_STORE).index('deckId').getAll(event.deckId));
        guard();
        publishedDaily=undoDailyState(event,publishedDaily,dailyState,events);
        transaction.objectStore(DAILY_STORE).put(publishedDaily);changed=true;
      }
      transaction.objectStore(UNDO_STORE).put({id:event.id,event});
    }catch(error){try{transaction.abort();}catch{}await done.catch(()=>{});throw error;}
    await done;if(changed)this.revision.update(n=>n+1);
    try{await this.retryUndoPublications();}catch(error){
      const {DeckUndoPublicationError}=await import('./deck-undo-reconciliation');throw new DeckUndoPublicationError(error);
    }
  }

  async retryUndoPublications():Promise<void>{
    const owner=this.workspace.active(),epoch=this.workspace.activationRevision();if(this.publishing.has(owner))return;
    this.publishing.add(owner);
    const guard=()=>{if(owner!==this.workspace.active()||epoch!==this.workspace.activationRevision())throw Error('Deck workspace changed');};
    try{
      const db=await this.database(owner);guard();
      const rows=await requestResult<{id:string;event:DeckReviewEvent}[]>(db.transaction(UNDO_STORE).objectStore(UNDO_STORE).getAll());
      for(const row of rows){
        if(owner==='guest'){const finish=db.transaction(UNDO_STORE,'readwrite');finish.objectStore(UNDO_STORE).delete(row.id);await transactionDone(finish);continue;}
        const pending=await this.outbox.pending(owner);guard();
        const day=(await import('./deck-study-time')).getLocalStudyDayKey(new Date(row.event.reviewedAt));guard();
        const tx=db.transaction([PROGRESS_STORE,EVENTS_STORE,DAILY_STORE]);
        const [progress,event,daily]=await Promise.all([
          requestResult<DeckCardProgress|undefined>(tx.objectStore(PROGRESS_STORE).get([row.event.deckId,row.event.entryId])),
          requestResult<DeckReviewEvent|undefined>(tx.objectStore(EVENTS_STORE).get(row.id)),
          requestResult<DeckDailyState|undefined>(tx.objectStore(DAILY_STORE).get([row.event.deckId,day]))]);
        guard();if(event)throw Error('Undo publication conflicts with canonical event');
        for(const [type,key,payload,operation]of [
          ['deck-card-progress',`${row.event.deckId}:${row.event.entryId}`,progress??null,progress?'upsert':'delete'],
          ['deck-review-event',row.id,row.event,'delete'],
          ['deck-daily-state',`${row.event.deckId}:${daily?.localDate}`,daily,'upsert'],
        ] as const){
          const item=makeOutboxItem(owner,type,key,payload,operation);if(!item)continue;
          const existing=pending.find(p=>p.id===item.id);guard();
          if(!await this.outbox.enqueueIfRevision(item,existing?.revision??null))throw Error('Undo publication raced with another write');
        }
        guard();
        const check=db.transaction([PROGRESS_STORE,DAILY_STORE,EVENTS_STORE]);
        const [latest,latestDaily,latestEvent]=await Promise.all([requestResult(check.objectStore(PROGRESS_STORE).get([row.event.deckId,row.event.entryId])),requestResult(check.objectStore(DAILY_STORE).get([row.event.deckId,day])),requestResult(check.objectStore(EVENTS_STORE).get(row.id))]);
        guard();if(latestEvent||JSON.stringify(latest)!==JSON.stringify(progress)||JSON.stringify(latestDaily)!==JSON.stringify(daily))throw Error('Canonical state changed during publication');
        const finish=db.transaction(UNDO_STORE,'readwrite');finish.objectStore(UNDO_STORE).delete(row.id);await transactionDone(finish);
      }
    }finally{this.publishing.delete(owner);}
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
      dailyStore.put({...preserveClosure(local,remote),introducedEntryIds:[...new Set([...(local?.introducedEntryIds??[]),...remote.introducedEntryIds])]});
    }
    await transactionDone(transaction);
    this.revision.update(n => n + 1);
  }

  private database(workspace = this.workspace.active()): Promise<IDBDatabase> {
    const name = this.workspace.databaseName(DATABASE_NAME, workspace);
    let database = this.databases.get(name);
    if (!database) {
      database = openDatabase(name); this.databases.set(name, database);
      const opening=database;
      void opening.catch(()=>{if(this.databases.get(name)===opening)this.databases.delete(name);});
    }
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
      if(!db.objectStoreNames.contains(UNDO_STORE))db.createObjectStore(UNDO_STORE,{keyPath:'id'});
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
