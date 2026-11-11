import {DeckUndoPendingService} from './deck-undo-pending.service';
import reference from './fixtures/anki-25.9.2-learn-ahead.json';
import {TestBed} from '@angular/core/testing';
import {signal} from '@angular/core';
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb';
import {DeckStudyService} from './deck-study.service';
import {DeckDatabaseService} from './deck-database.service';
import {DeckSettingsService} from './deck-settings.service';
import {DECK_SCHEDULER_ENABLE_FUZZ} from './deck-scheduler.service';
import {SyncOutboxService} from './sync-outbox.service';
import {WorkspaceService} from './workspace.service';
import {CUSTOM_DECKS_ENABLED,CustomDeckRepository} from './custom-deck.repository';
import {customDeck,customCard} from './custom-deck.fixture';
import {DeckPersistenceRouter} from './deck-persistence-router';
import {DeckDefinition} from '../models/deck-catalog.model';
import {DeckCardProgress} from '../models/deck-study.model';
const NOW=new Date('2026-11-10T18:00:00Z'),deck:DeckDefinition={id:'japanese-1500',cardCount:3,contentType:'japanese-word',settings:{desiredRetention:.9,newCardsPerDay:1,newCardOrder:'before-reviews'}},index=[{id:'a',order:0},{id:'b',order:1}];
const row=(id:string,state:1|2|3,minutes:number):DeckCardProgress=>{const due=NOW.getTime()+minutes*60000;return {deckId:deck.id,entryId:id,due,state,card:{due,state,stability:30,difficulty:5,reps:20,lapses:1,learningSteps:0,scheduledDays:30,elapsedDays:30,lastReview:NOW.getTime()-86400000}};};

describe('Durable undo recovery and automatic closure',()=>{
 let study:DeckStudyService,db:DeckDatabaseService;
  beforeEach(()=>{localStorage.clear();vi.stubGlobal('indexedDB',new IDBFactory());vi.stubGlobal('IDBKeyRange',IDBKeyRange);TestBed.configureTestingModule({providers:[{provide:CUSTOM_DECKS_ENABLED,useValue:signal(true)},{provide:DECK_SCHEDULER_ENABLE_FUZZ,useValue:false},{provide:DeckSettingsService,useValue:{settingsFor:(d:DeckDefinition)=>d.settings}},{provide:SyncOutboxService,useValue:{enqueue:async()=>{}}}]});study=TestBed.inject(DeckStudyService);db=TestBed.inject(DeckDatabaseService);});
 afterEach(()=>{TestBed.resetTestingModule();vi.restoreAllMocks();vi.unstubAllGlobals();vi.useRealTimers();});

 it.each(['japanese-1500','mazo-puyi','md-undo'])('%s: restores exact snapshots for Again and Good and reopens only automatic completion',async id=>{
  vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(NOW);
  if(id.startsWith('md-'))await TestBed.inject(CustomDeckRepository).create('create',customDeck(id),[await customCard(id)]);
  const d={...deck,id},entryId=id.startsWith('md-')?'card-猫':'a',ids=[{id:entryId,order:0}],port=TestBed.inject(DeckPersistenceRouter).bind(id);
  await study.startSession(d,NOW);
  for(const rating of ['again','good'] as const){
   const before=await port.getDeckProgress(id),daily=await port.getDailyState(id,'2026-11-10');
   const snapshot=await study.snapshot(d,ids,NOW),c=study.chooseNext(snapshot,d,{debt:0}).choice!;
   const event=await study.rate(d,c,study.preview(d,c,NOW),rating,1000,NOW);
   await study.undo(event);expect(await port.getDeckProgress(id)).toEqual(before);expect(await port.getDeckReviewEvents(id)).toEqual([]);
   expect((await port.getDailyState(id,'2026-11-10'))?.introducedEntryIds).toEqual(daily?.introducedEntryIds);
  }
  let last!:Awaited<ReturnType<DeckStudyService['rate']>>,beforeLast:unknown;
  for(let i=0;i<5;i++){
   const at=new Date(NOW.getTime()+i+1);vi.setSystemTime(at);const snapshot=await study.snapshot(d,ids,at),c=study.chooseNext(snapshot,d,{debt:0}).choice;if(!c)break;
   beforeLast=await port.getDeckProgress(id);last=await study.rate(d,c,study.preview(d,c,at),'good',1000,at);
  }
  const closedAt=new Date(NOW.getTime()+20);vi.setSystemTime(closedAt);await study.completeSession(d,ids,closedAt);
  expect(await port.getDailyState(id,'2026-11-10')).toMatchObject({closureOrigin:'automatic',closedByReviewId:last.id});
  await study.undo(last,true);expect(await port.getDeckProgress(id)).toEqual(beforeLast);expect((await port.getDailyState(id,'2026-11-10'))?.completedAt).toBeNull();
  const events=await port.getDeckReviewEvents(id);await study.undo(last,true);expect(await port.getDeckReviewEvents(id)).toEqual(events);
 });
 it.each(['japanese-1500','mazo-puyi','md-undo'])('%s: pending intent survives reload and post-commit rejection without a duplicate',async id=>{
  vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(NOW);
  if(id.startsWith('md-'))await TestBed.inject(CustomDeckRepository).create('create',customDeck(id),[await customCard(id)]);
  const d={...deck,id},entryId=id.startsWith('md-')?'card-猫':'a',ids=[{id:entryId,order:0}],port=TestBed.inject(DeckPersistenceRouter).bind(id);
  await study.startSession(d,NOW);const c=study.chooseNext(await study.snapshot(d,ids,NOW),d,{debt:0}).choice!;
  const event=await study.rate(d,c,study.preview(d,c,NOW),'again',1000,NOW);
  const pending=TestBed.inject(DeckUndoPendingService);pending.begin(event,false);
  const target=id.startsWith('md-')?TestBed.inject(CustomDeckRepository):db,original=target.undoReview.bind(target) as (...args:any[])=>Promise<void>;
  const fault=vi.spyOn(target,'undoReview').mockImplementationOnce(async(...args:any[])=>{await original(...args);throw Error('after commit');});
  await expect(study.undo(event)).rejects.toThrow('after commit');fault.mockRestore();
  expect(pending.read(id)?.event).toEqual(event);
  TestBed.resetTestingModule();configureRecovery();study=TestBed.inject(DeckStudyService);
  const recovered=TestBed.inject(DeckUndoPendingService),saved=recovered.read(id)!;await study.undo(saved.event,saved.reopen);recovered.clear(saved.event);
  const restored=TestBed.inject(DeckPersistenceRouter).bind(id);expect(await restored.getDeckProgress(id)).toEqual([]);expect(await restored.getDeckReviewEvents(id)).toEqual([]);expect((await restored.getDailyState(id,'2026-11-10'))?.introducedEntryIds).toEqual([]);expect(recovered.read(id)).toBeNull();
 });

 it.each(['japanese-1500','mazo-puyi'])('%s: outbox rejection after local undo survives reload and retry',async id=>{
  vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(NOW);TestBed.inject(WorkspaceService).activateUser('undo-synthetic');const d={...deck,id},ids=[{id:'a',order:0}];await study.startSession(d,NOW);
  const c=study.chooseNext(await study.snapshot(d,ids,NOW),d,{debt:0}).choice!,event=await study.rate(d,c,study.preview(d,c,NOW),'again',1000,NOW);
  const pending=TestBed.inject(DeckUndoPendingService);pending.begin(event,false);
  const outbox=TestBed.inject(SyncOutboxService),publish=vi.spyOn(outbox,'enqueue').mockRejectedValueOnce(Error('outbox unavailable'));
  await expect(study.undo(event)).rejects.toThrow('outbox');expect(await db.getDeckReviewEvents(id)).toEqual([]);expect(await db.getDeckProgress(id)).toEqual([]);publish.mockRestore();
  TestBed.resetTestingModule();configureRecovery();const recovered=TestBed.inject(DeckUndoPendingService),saved=recovered.read(id)!;
  await TestBed.inject(DeckStudyService).undo(saved.event);recovered.clear(saved.event);expect(await TestBed.inject(DeckDatabaseService).getDeckReviewEvents(id)).toEqual([]);
 });
 it.each(['japanese-1500','mazo-puyi','md-undo'])('%s: a failure before undo commit retains the confirmed review and can retry',async id=>{
  vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(NOW);if(id.startsWith('md-'))await TestBed.inject(CustomDeckRepository).create('create',customDeck(id),[await customCard(id)]);
  const d={...deck,id},entryId=id.startsWith('md-')?'card-猫':'a',ids=[{id:entryId,order:0}],port=TestBed.inject(DeckPersistenceRouter).bind(id);
  await study.startSession(d,NOW);const c=study.chooseNext(await study.snapshot(d,ids,NOW),d,{debt:0}).choice!,event=await study.rate(d,c,study.preview(d,c,NOW),'again',1000,NOW);
  const before=await port.getDeckProgress(id),target=id.startsWith('md-')?TestBed.inject(CustomDeckRepository):db;
  TestBed.inject(DeckUndoPendingService).begin(event,false);const write=vi.spyOn(target,'undoReview').mockRejectedValueOnce(Error('before commit'));
  await expect(study.undo(event)).rejects.toThrow('before commit');expect(await port.getDeckProgress(id)).toEqual(before);expect(await port.getDeckReviewEvents(id)).toEqual([event]);write.mockRestore();
  await study.undo(event);TestBed.inject(DeckUndoPendingService).clear(event);expect(await port.getDeckProgress(id)).toEqual([]);expect(await port.getDeckReviewEvents(id)).toEqual([]);
 });

 it.each(['japanese-1500','mazo-puyi','md-undo'])('%s: an automatic close based on a pre-undo snapshot cannot win later',async id=>{
  vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(NOW);if(id.startsWith('md-'))await TestBed.inject(CustomDeckRepository).create('create',customDeck(id),[await customCard(id)]);
  const d={...deck,id},entryId=id.startsWith('md-')?'card-猫':'a',ids=[{id:entryId,order:0}],port=TestBed.inject(DeckPersistenceRouter).bind(id);
  await study.startSession(d,NOW);const c=study.chooseNext(await study.snapshot(d,ids,NOW),d,{debt:0}).choice!,event=await study.rate(d,c,study.preview(d,c,NOW),'again',1000,NOW),oldProgress=await port.getDeckProgress(id);
  await study.undo(event);await expect(port.writeDailyState({deckId:id,localDate:'2026-11-10',introducedEntryIds:[entryId],newLimitOverride:null,completedAt:NOW.getTime(),closureOrigin:'automatic',closedByReviewId:event.id},{progress:oldProgress,entryIds:[entryId]})).rejects.toThrow('changed during automatic closure');
  expect((await port.getDailyState(id,'2026-11-10'))?.completedAt).toBeNull();expect(await port.getDeckProgress(id)).toEqual([]);
 });

 it('A→B→A cancels an undo waiting for IndexedDB without changing the confirmed event',async()=>{
  vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(NOW);const w=TestBed.inject(WorkspaceService);w.activateUser('a');
  const ids=[{id:'a',order:0}];await study.startSession(deck,NOW);const c=study.chooseNext(await study.snapshot(deck,ids,NOW),deck,{debt:0}).choice!,event=await study.rate(deck,c,study.preview(deck,c,NOW),'again',1000,NOW);
  const before=await db.getDeckProgress(deck.id),open=(db as any).database.bind(db);let release!:()=>void;const gate=new Promise<void>(r=>release=r);
  const pending=vi.spyOn(db as any,'database').mockImplementationOnce(async(...args:unknown[])=>{const value=await open(...args);await gate;return value;});
  const undo=db.undoReview(event,{deckId:deck.id,localDate:'2026-11-10',introducedEntryIds:[],newLimitOverride:null});w.activateUser('b');w.activateUser('a');release();await expect(undo).rejects.toThrow('workspace');pending.mockRestore();
  expect(await db.getDeckProgress(deck.id)).toEqual(before);expect(await db.getDeckReviewEvents(deck.id)).toEqual([event]);
 });
});
function configureRecovery(){TestBed.configureTestingModule({providers:[{provide:CUSTOM_DECKS_ENABLED,useValue:signal(true)},{provide:DECK_SCHEDULER_ENABLE_FUZZ,useValue:false},{provide:DeckSettingsService,useValue:{settingsFor:(d:DeckDefinition)=>d.settings}},{provide:SyncOutboxService,useValue:{enqueue:async()=>{}}}]});}
