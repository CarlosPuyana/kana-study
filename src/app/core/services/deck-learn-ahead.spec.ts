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
describe('Mazos Learn Ahead and one durable daily session',()=>{
 let study:DeckStudyService,db:DeckDatabaseService;
 beforeEach(()=>{localStorage.clear();vi.stubGlobal('indexedDB',new IDBFactory());vi.stubGlobal('IDBKeyRange',IDBKeyRange);TestBed.configureTestingModule({providers:[{provide:CUSTOM_DECKS_ENABLED,useValue:signal(true)},{provide:DECK_SCHEDULER_ENABLE_FUZZ,useValue:false},{provide:DeckSettingsService,useValue:{settingsFor:(d:DeckDefinition)=>d.settings}},{provide:SyncOutboxService,useValue:{enqueue:async()=>{}}}]});study=TestBed.inject(DeckStudyService);db=TestBed.inject(DeckDatabaseService);});
 afterEach(()=>{TestBed.resetTestingModule();vi.restoreAllMocks();vi.unstubAllGlobals();});
 async function snap(ids=index,at=NOW,d=deck){return study.snapshot(d,ids,at);}
 const next=(s:Awaited<ReturnType<typeof snap>>,d=deck)=>study.chooseNext(s,d,{debt:0}).choice;
 for(const c of reference.cases)it(`official Anki queue: ${c.name} retention ${c.retention}`,async()=>{
   const card=c.before as DeckCardProgress['card'],ids=[index[0]],at=new Date(c.now);await db.mergeFromCloud({progress:[{deckId:deck.id,entryId:'a',card,due:card.due,state:card.state}],events:[],daily:[]});
   const choice=next(await snap(ids,at));expect(!!choice).toBe((c.queue as {cards?:unknown[]}).cards?.length===1);if(choice)expect(choice.advanced).toBe(true);
 });
 it.each(['again','good']as const)('new %s preserves 1m/10m due and can finish its steps without moving the clock',async rating=>{
  const ids=[index[0]],c=next(await snap(ids))!,e=await study.rate(deck,c,study.preview(deck,c,NOW),rating,1000,NOW);expect(e.dueAfter-e.reviewedAt).toBe(rating==='again'?60000:600000);
  let s=await snap(ids);expect(s.learningDue).toBe(0);expect(s.learningAhead).toBe(1);const early=next(s)!;expect(early.advanced).toBe(true);const preview=study.preview(deck,early,NOW),second=await study.rate(deck,early,preview,'good',1000,NOW);expect(second.reviewedAt).toBe(NOW.getTime());expect(second.cardBefore?.due).toBe(e.dueAfter);expect(second.dueAfter).toBe(preview.good.card.due);if(rating==='good')expect(second.stateAfter).toBe(2);else expect(second.stateAfter).toBe(1);
 });
 it.each([1,3]as const)('state %s: 19m is advanceable, 21m is not, and an expired step has priority',async state=>{
  await db.mergeFromCloud({progress:[row('a',state,19),row('b',state,21),row('c',state,-1)],events:[],daily:[]});const ids=[...index,{id:'c',order:2}];let s=await snap(ids);expect(s.learningAhead).toBe(1);expect(next(s)?.entryId).toBe('c');s=await snap(index);expect(next(s)).toMatchObject({entryId:'a',advanced:true});s=await snap([index[1]]);expect(next(s)).toBeNull();
 });
 it('prioritizes available New and Review over advanceable Learning, never tomorrow Review',async()=>{
  await db.mergeFromCloud({progress:[row('a',1,10),row('b',2,-1),row('tomorrow',2,1440)],events:[],daily:[]});const ids=[...index,{id:'fresh',order:2},{id:'tomorrow',order:3}],s=await snap(ids);expect(next(s)).toMatchObject({entryId:'fresh',kind:'new'});expect(next({...s,newEntries:[],newAvailable:0})).toMatchObject({entryId:'b',kind:'review'});const only=await snap([{id:'tomorrow',order:0}]);expect(next(only)).toBeNull();
 });
 it('cannot forge an advance or rate it while newly available ordinary work exists',async()=>{
  const p=row('a',1,10);await db.mergeFromCloud({progress:[p],events:[],daily:[]});const forged={entryId:'a',kind:'learning' as const,progress:p,advanced:true};await expect(study.rate(deck,forged,study.preview(deck,forged,NOW),'good',1000,NOW)).rejects.toThrow('not due');
  const c=next(await snap([index[0]]))!,preview=study.preview(deck,c,NOW);await db.mergeFromCloud({progress:[{...row('a',1,21),card:{...row('a',1,21).card,lastReview:NOW.getTime()}}],events:[],daily:[]});await expect(study.rate(deck,c,preview,'good',1000,NOW)).rejects.toThrow('cannot be advanced');
 });
 it.each(['japanese-1500','mazo-puyi','md-ahead'])('persists resume and closure in %s; quota changes cannot open another session',async id=>{
  const entryId=id.startsWith('md-')?'card-猫':'a';if(id.startsWith('md-'))await TestBed.inject(CustomDeckRepository).create('create',customDeck(id),[await customCard(id)]);const d={...deck,id},ids=[{id:entryId,order:0}],p=TestBed.inject(DeckPersistenceRouter).bind(id);await study.startSession(d,NOW);expect((await snap(ids,NOW,d)).startedToday).toBe(true);const c=next(await snap(ids,NOW,d),d)!,preview=study.preview(d,c,NOW);await study.completeSession(d,ids,NOW);expect((await snap(ids,NOW,d)).completedToday).toBe(false);await study.completeSession(d,ids,NOW,true);const saved=await p.getDailyState(id,'2026-11-10');expect(saved?.completedAt).toBe(NOW.getTime());expect(next(await snap(ids,NOW,d),d)).toBeNull();await study.startSession(d,NOW);await study.adjustTodayNewLimit(d,5,NOW);expect((await snap(ids,NOW,d)).completedToday).toBe(true);await expect(study.rate(d,c,preview,'good',1000,NOW)).rejects.toThrow('closed');expect(await p.getDeckReviewEvents(id)).toEqual([]);expect((await snap(ids,new Date('2026-11-10T23:00:00Z'),d)).completedToday).toBe(false);
 });
 it('closing with a 21m step preserves its snapshot; normal completion waits for a 19m step',async()=>{
  const a=row('a',1,19),b=row('b',3,21);await db.mergeFromCloud({progress:[a,b],events:[],daily:[]});await study.completeSession(deck,index,NOW);expect((await snap()).completedToday).toBe(false);await study.completeSession(deck,index,NOW,true);expect(await db.getDeckProgress(deck.id)).toEqual([a,b]);expect((await snap()).completedToday).toBe(true);expect(next(await snap())).toBeNull();
 });
 it('a failed close is retryable without changing memory or adding events; closure wins over stale writers',async()=>{
  const s=await snap(),c=next(s)!,preview=study.preview(deck,c,NOW),commit=vi.spyOn(db,'commitReview').mockRejectedValueOnce(Error('save'));await expect(study.rate(deck,c,preview,'good',1000,NOW)).rejects.toThrow('save');const args=commit.mock.calls[0];commit.mockRestore();
  const write=vi.spyOn(db,'writeDailyState').mockRejectedValueOnce(Error('quota'));await expect(study.completeSession(deck,index,NOW,true)).rejects.toThrow('quota');expect((await snap()).completedToday).toBe(false);await study.completeSession(deck,index,NOW,true);write.mockRestore();await expect(db.commitReview(...args)).rejects.toThrow('closed');expect(await db.getDeckReviewEvents(deck.id)).toEqual([]);
 });
 it.each([['2026-03-28T23:00:00Z','2026-03-29T22:00:00Z'],['2026-10-24T22:00:00Z','2026-10-25T23:00:00Z']])('closed Madrid day %s opens at the actual DST boundary %s',async(start,end)=>{
   const at=new Date(start);await study.completeSession(deck,index,at,true);const closed=await snap(index,new Date(Date.parse(end)-1));expect(closed.completedToday).toBe(true);expect(closed.nextRefreshAt).toBe(Date.parse(end));expect((await snap(index,new Date(end))).completedToday).toBe(false);
 });
 it('undo restores memory after closure without opening a second daily session',async()=>{
   const c=next(await snap())!,e=await study.rate(deck,c,study.preview(deck,c,NOW),'again',1000,NOW);await study.completeSession(deck,index,NOW,true);await study.undo(e);expect(await db.getDeckProgress(deck.id)).toEqual([]);expect(await db.getDeckReviewEvents(deck.id)).toEqual([]);expect((await snap()).completedToday).toBe(true);
 });
 it('A→B→A invalidates a pending close; Guest completion is separate',async()=>{
  const w=TestBed.inject(WorkspaceService);w.activateUser('A');let release!:()=>void;const gate=new Promise<void>(r=>release=r),read=db.getDailyState.bind(db);vi.spyOn(db,'getDailyState').mockImplementationOnce(async(...args)=>{const v=await read(...args);await gate;return v;});const close=study.completeSession(deck,index,NOW,true);w.activateUser('B');w.activateUser('A');release();await expect(close).rejects.toThrow('workspace');expect((await snap()).completedToday).toBe(false);w.activateGuest();expect((await snap()).completedToday).toBe(false);
 });
});
