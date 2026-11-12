import {signal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb';
import {DeckDefinition} from '../models/deck-catalog.model';
import {DeckStudyService} from './deck-study.service';
import {DeckDatabaseService} from './deck-database.service';
import {DeckSettingsService} from './deck-settings.service';
import {DeckUndoPendingService} from './deck-undo-pending.service';
import {DeckPersistenceRouter} from './deck-persistence-router';
import {DECK_SCHEDULER_ENABLE_FUZZ} from './deck-scheduler.service';
import {CUSTOM_DECKS_ENABLED,CustomDeckRepository} from './custom-deck.repository';
import {customDeck,customCard} from './custom-deck.fixture';
import {WorkspaceService} from './workspace.service';
import {makeOutboxItem,SyncOutboxService} from './sync-outbox.service';

const NOW=new Date('2026-11-10T18:00:00Z'),DAY='2026-11-10',IDS=['japanese-1500','mazo-puyi','md-reconcile'];
function configure(){TestBed.configureTestingModule({providers:[{provide:CUSTOM_DECKS_ENABLED,useValue:signal(true)},{provide:DECK_SCHEDULER_ENABLE_FUZZ,useValue:false},{provide:DeckSettingsService,useValue:{settingsFor:(d:DeckDefinition)=>d.settings}}]});}
async function rated(id:string,rating:'again'|'good'='again'){
 const custom=id.startsWith('md-');if(custom)await TestBed.inject(CustomDeckRepository).create('synthetic-create',customDeck(id),[await customCard(id)]);
 const deck:DeckDefinition={id,cardCount:1,contentType:'japanese-word',settings:{desiredRetention:.9,newCardsPerDay:1,newCardOrder:'before-reviews'}};
 const study=TestBed.inject(DeckStudyService),port=TestBed.inject(DeckPersistenceRouter).bind(id),index=[{id:custom?'card-猫':'a',order:0}];
 await study.startSession(deck,NOW);const daily=await port.getDailyState(id,DAY),progress=await port.getDeckProgress(id);
 const choice=study.chooseNext(await study.snapshot(deck,index,NOW),deck,{debt:0}).choice!;
 const event=await study.rate(deck,choice,study.preview(deck,choice,NOW),rating,1200,NOW);
 const pending=TestBed.inject(DeckUndoPendingService);pending.begin(event,false);
 return {deck,study,port,event,pending,index,before:{daily,progress}};
}
describe('Undo canonical reconciliation (synthetic workspaces only)',()=>{
 beforeEach(()=>{localStorage.clear();vi.stubGlobal('indexedDB',new IDBFactory());vi.stubGlobal('IDBKeyRange',IDBKeyRange);vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(NOW);configure();});
 afterEach(()=>{TestBed.resetTestingModule();vi.restoreAllMocks();vi.unstubAllGlobals();vi.useRealTimers();localStorage.clear();});
 it.each(IDS)('%s: pre-commit rejection survives reload, retry restores exact rows',async id=>{
  const c=await rated(id),target=id.startsWith('md-')?TestBed.inject(CustomDeckRepository):TestBed.inject(DeckDatabaseService);
  vi.spyOn(target,'undoReview').mockRejectedValueOnce(new DOMException('synthetic','QuotaExceededError'));
  await expect(c.study.reconcileUndo(c.event)).rejects.toThrow('synthetic');expect(await c.port.getDeckReviewEvents(id)).toEqual([c.event]);expect(await c.study.undoState(c.event)).toBe('not-executed');
  TestBed.resetTestingModule();configure();const study=TestBed.inject(DeckStudyService),saved=TestBed.inject(DeckUndoPendingService).read(id)!;
  expect(await study.reconcileUndo(saved.event)).toBe('committed');const port=TestBed.inject(DeckPersistenceRouter).bind(id);
  expect(await port.getDeckProgress(id)).toEqual(c.before.progress);expect(await port.getDailyState(id,DAY)).toEqual(c.before.daily);expect(await port.getDeckReviewEvents(id)).toEqual([]);
 });
 it.each(IDS)('%s: confirmed post-commit rejection is reconciled without a second rating or rollback',async id=>{
  const c=await rated(id,'good'),target=id.startsWith('md-')?TestBed.inject(CustomDeckRepository):TestBed.inject(DeckDatabaseService),original=target.undoReview.bind(target);
  vi.spyOn(target,'undoReview').mockImplementationOnce(async(...args:any[])=>{await (original as any)(...args);throw Error('synthetic post-commit');});
  expect(await c.study.reconcileUndo(c.event)).toBe('committed');expect(await c.study.reconcileUndo(c.event)).toBe('committed');
  expect(await c.port.getDeckProgress(id)).toEqual(c.before.progress);expect(await c.port.getDailyState(id,DAY)).toEqual(c.before.daily);expect(await c.port.getDeckReviewEvents(id)).toEqual([]);
 });
 it.each(IDS)('%s: a legacy committed marker is recoverable after midnight and reload',async id=>{
  const c=await rated(id);await c.study.undo(c.event);vi.setSystemTime(new Date('2026-11-11T18:00:00Z'));TestBed.resetTestingModule();configure();
  const pending=TestBed.inject(DeckUndoPendingService),event=pending.read(id)!.event,study=TestBed.inject(DeckStudyService);
  expect(await study.undoState(event)).toBe('committed');expect(await study.reconcileUndo(event)).toBe('committed');pending.clear(event);
  const port=TestBed.inject(DeckPersistenceRouter).bind(id);expect(await port.getDeckProgress(id)).toEqual(c.before.progress);expect(await port.getDailyState(id,DAY)).toEqual(c.before.daily);expect(await port.getDailyState(id,'2026-11-11')).toBeNull();
 });
 it.each(IDS)('%s: an unexecuted old marker expires without reversing yesterday or deleting evidence',async id=>{
  const c=await rated(id);const progress=await c.port.getDeckProgress(id),daily=await c.port.getDailyState(id,DAY);vi.setSystemTime(new Date('2026-11-11T18:00:00Z'));
  expect(await c.study.reconcileUndo(c.event)).toBe('expired');c.pending.retire(c.event);expect(c.pending.read(id)).toBeNull();
  expect(await c.port.getDeckReviewEvents(id)).toEqual([c.event]);expect(await c.port.getDeckProgress(id)).toEqual(progress);expect(await c.port.getDailyState(id,DAY)).toEqual(daily);
  expect(Object.values(localStorage).some(value=>typeof value==='string'&&value.includes(c.event.id))).toBe(true);
 });
 it.each(IDS)('%s: a failed verification read retains the pending intent for reload',async id=>{
  const c=await rated(id);await c.study.undo(c.event);vi.spyOn(c.study,'undoState').mockRejectedValueOnce(new DOMException('synthetic read','UnknownError'));
  await expect(c.study.reconcileUndo(c.event)).rejects.toThrow('synthetic read');expect(c.pending.read(id)?.event).toEqual(c.event);
  TestBed.resetTestingModule();configure();expect(await TestBed.inject(DeckStudyService).reconcileUndo(c.event)).toBe('committed');expect(await TestBed.inject(DeckPersistenceRouter).bind(id).getDeckReviewEvents(id)).toEqual([]);
 });
 it.each(IDS)('%s: voluntary closures expire the request without reopening',async id=>{
  const c=await rated(id);await c.study.completeSession(c.deck,c.index,NOW,true);
  expect(await c.study.reconcileUndo(c.event)).toBe('expired');expect((await c.port.getDailyState(id,DAY))?.closureOrigin).toBe('voluntary');expect(await c.port.getDeckReviewEvents(id)).toEqual([c.event]);
 });
 it.each(IDS)('%s: an unknown historical closure is never inferred to be automatic',async id=>{
  const c=await rated(id),daily=await c.port.getDailyState(id,DAY);await c.port.writeDailyState({...daily!,completedAt:NOW.getTime()});
  expect(await c.study.reconcileUndo(c.event)).toBe('expired');expect((await c.port.getDailyState(id,DAY))?.completedAt).toBe(NOW.getTime());expect(await c.port.getDeckReviewEvents(id)).toEqual([c.event]);
 });
 it.each(IDS)('%s: two successive answer/undo pairs preserve previous work exactly',async id=>{
  const c=await rated(id);await c.study.reconcileUndo(c.event);c.pending.clear(c.event);
  vi.setSystemTime(new Date(NOW.getTime()+1000));const snapshot=await c.study.snapshot(c.deck,c.index),choice=c.study.chooseNext(snapshot,c.deck,{debt:0}).choice!;
  const next=await c.study.rate(c.deck,choice,c.study.preview(c.deck,choice),'good',500);expect(next.id).not.toBe(c.event.id);c.pending.begin(next,false);
  await c.study.reconcileUndo(next);expect(await c.port.getDeckProgress(id)).toEqual(c.before.progress);expect(await c.port.getDeckReviewEvents(id)).toEqual([]);expect(await c.port.getDailyState(id,DAY)).toEqual(c.before.daily);
 });
 it.each(IDS)('%s: undo of a learning review restores non-null FSRS, previous event and statistics',async id=>{
  const c=await rated(id);c.pending.clear(c.event);vi.setSystemTime(new Date(NOW.getTime()+1000));
  const before=await c.port.getDeckProgress(id),daily=await c.port.getDailyState(id,DAY),stats=await c.study.statistics(c.deck,1);
  const snapshot=await c.study.snapshot(c.deck,c.index),choice=c.study.chooseNext(snapshot,c.deck,{debt:0}).choice!;
  const next=await c.study.rate(c.deck,choice,c.study.preview(c.deck,choice),'good',500);c.pending.begin(next,false);
  expect(next.cardBefore).not.toBeNull();await c.study.reconcileUndo(next);
  expect(await c.port.getDeckProgress(id)).toEqual(before);expect(await c.port.getDailyState(id,DAY)).toEqual(daily);expect(await c.port.getDeckReviewEvents(id)).toEqual([c.event]);expect(await c.study.statistics(c.deck,1)).toEqual(stats);
 });
 it.each(['japanese-1500','mazo-puyi'])('%s: unavailable outbox does not block verified local undo; receipt retries after reload',async id=>{
  TestBed.inject(WorkspaceService).activateUser('synthetic-outbox');const c=await rated(id),outbox=TestBed.inject(SyncOutboxService);
  vi.spyOn(outbox,'enqueueIfRevision').mockRejectedValue(Error('synthetic outbox offline'));
  expect(await c.study.reconcileUndo(c.event)).toBe('sync-pending');c.pending.clear(c.event);expect(await c.port.getDeckReviewEvents(id)).toEqual([]);
  TestBed.resetTestingModule();configure();const db=TestBed.inject(DeckDatabaseService);await db.retryUndoPublications();
  const queue=await TestBed.inject(SyncOutboxService).pending('user:synthetic-outbox');
  expect(queue.find(row=>row.entityType==='deck-review-event'&&row.entityKey===c.event.id)?.operation).toBe('delete');
  expect(queue.find(row=>row.entityType==='deck-card-progress')?.operation).toBe('delete');expect(queue.find(row=>row.entityType==='deck-daily-state')?.payload).toEqual(c.before.daily);
  expect(await db.getDeckProgress(id)).toEqual(c.before.progress);expect(await db.getDeckReviewEvents(id)).toEqual([]);
 });
 it('does not overwrite an outbox revision inserted after the recovery snapshot',async()=>{
  const outbox=TestBed.inject(SyncOutboxService),old=makeOutboxItem('user:synthetic','deck-card-progress','d:a',{old:true})!,newer={...old,revision:'newer',payload:{newer:true}};
  await outbox.enqueue(old);await outbox.enqueue(newer);expect(await outbox.enqueueIfRevision(old,old.revision!)).toBe(false);expect(await outbox.pending('user:synthetic')).toEqual([newer]);
 });
 it('publishes current canonical progress after local study continues with an offline undo receipt',async()=>{
  TestBed.inject(WorkspaceService).activateUser('synthetic-continue');const c=await rated('japanese-1500');
  vi.spyOn(TestBed.inject(SyncOutboxService),'enqueueIfRevision').mockRejectedValue(Error('synthetic offline'));
  expect(await c.study.reconcileUndo(c.event)).toBe('sync-pending');c.pending.clear(c.event);vi.setSystemTime(new Date(NOW.getTime()+1000));
  const snap=await c.study.snapshot(c.deck,c.index),choice=c.study.chooseNext(snap,c.deck,{debt:0}).choice!;
  const next=await c.study.rate(c.deck,choice,c.study.preview(c.deck,choice),'good',500),current=await c.port.getDeckProgress(c.deck.id),daily=await c.port.getDailyState(c.deck.id,DAY);
  TestBed.resetTestingModule();configure();const db=TestBed.inject(DeckDatabaseService);await db.retryUndoPublications();
  expect(await db.getDeckProgress(c.deck.id)).toEqual(current);expect(await db.getDeckReviewEvents(c.deck.id)).toEqual([next]);
  const queue=await TestBed.inject(SyncOutboxService).pending('user:synthetic-continue');
  expect(queue.find(row=>row.entityType==='deck-card-progress')?.payload).toEqual(current[0]);expect(queue.find(row=>row.entityType==='deck-daily-state')?.payload).toEqual(daily);
  expect(queue.find(row=>row.entityKey===c.event.id)?.operation).toBe('delete');expect(queue.find(row=>row.entityKey===next.id)?.operation).toBe('upsert');
 });
 it('preserves invalid markers for diagnosis and never calls them a storage outage',()=>{
  const pending=TestBed.inject(DeckUndoPendingService);localStorage.setItem('kana-study.deck-undo-pending.v1.japanese-1500','{broken');
  expect(()=>pending.read('japanese-1500')).toThrowError(expect.objectContaining({reason:'invalid'}));expect(localStorage.getItem('kana-study.deck-undo-pending.v1.japanese-1500')).toBe('{broken');
 });
 it('refuses a stale marker after a later answer instead of undoing later work',async()=>{
  const c=await rated('japanese-1500');vi.setSystemTime(new Date(NOW.getTime()+1000));const snap=await c.study.snapshot(c.deck,c.index),choice=c.study.chooseNext(snap,c.deck,{debt:0}).choice!;
  const next=await c.study.rate(c.deck,choice,c.study.preview(c.deck,choice),'good',500),before=await c.port.getDeckProgress(c.deck.id);
  await expect(c.study.reconcileUndo(c.event)).rejects.toMatchObject({reason:'inconsistent'});expect(await c.port.getDeckProgress(c.deck.id)).toEqual(before);expect(await c.port.getDeckReviewEvents(c.deck.id)).toEqual([c.event,next]);
 });
 it('fences reconciliation across A→B→A, including its lazy boundary',async()=>{
  const w=TestBed.inject(WorkspaceService);w.activateUser('synthetic-a');const c=await rated('japanese-1500'),operation=c.study.reconcileUndo(c.event);
  w.activateUser('synthetic-b');w.activateUser('synthetic-a');await expect(operation).rejects.toThrow('workspace');expect(await c.study.undoState(c.event)).toBe('not-executed');
 });
 it('upgrades the original database additively, preserving all three canonical stores',async()=>{
  const db=await new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open('kana-study-decks',1);r.onupgradeneeded=()=>{
   const p=r.result.createObjectStore('card-progress',{keyPath:['deckId','entryId']});p.createIndex('deckId','deckId');
   const e=r.result.createObjectStore('review-events',{keyPath:'id'});e.createIndex('deckId','deckId');r.result.createObjectStore('daily-state',{keyPath:['deckId','localDate']});
  };r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
  const progress={deckId:'japanese-1500',entryId:'synthetic',card:{due:1,state:2},due:1,state:2},event={id:'synthetic-event',deckId:'japanese-1500',reviewedAt:1},daily={deckId:'japanese-1500',localDate:DAY,introducedEntryIds:['synthetic'],newLimitOverride:null};
  await new Promise<void>((resolve,reject)=>{const tx=db.transaction(['card-progress','review-events','daily-state'],'readwrite');tx.objectStore('card-progress').put(progress);tx.objectStore('review-events').put(event);tx.objectStore('daily-state').put(daily);tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error);});db.close();
  const store=TestBed.inject(DeckDatabaseService);expect(await store.getDeckProgress('japanese-1500')).toEqual([progress]);expect(await store.getDeckReviewEvents('japanese-1500')).toEqual([event]);expect(await store.getDailyState('japanese-1500',DAY)).toEqual(daily);
 });
});
