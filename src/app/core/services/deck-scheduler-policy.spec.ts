import {TestBed} from '@angular/core/testing';
import {signal} from '@angular/core';
import {CustomDeckRepository,CUSTOM_DECKS_ENABLED} from './custom-deck.repository';
import {customDeck,customCard} from './custom-deck.fixture';
import {DeckPersistenceRouter} from './deck-persistence-router';
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb';
import {State} from 'ts-fsrs';
import {DeckDefinition} from '../models/deck-catalog.model';
import {DeckCardProgress,DeckRating} from '../models/deck-study.model';
import {DeckStudyService,emptyDailyState} from './deck-study.service';
import {DeckDatabaseService} from './deck-database.service';
import {DeckSettingsService} from './deck-settings.service';
import {DECK_SCHEDULER_ENABLE_FUZZ} from './deck-scheduler.service';
import {SyncOutboxService} from './sync-outbox.service';
import {WorkspaceService} from './workspace.service';
import koreScenarios from './fixtures/deck-kore-scenarios.json';
const NOW=new Date('2026-11-09T12:00:00Z');
const deck:DeckDefinition={id:'japanese-1500',cardCount:100,contentType:'japanese-word',settings:{desiredRetention:.9,newCardsPerDay:10,newCardOrder:'mixed'}};
const fresh=Array.from({length:30},(_,i)=>({id:'n'+i,order:i}));
const review=(id:string,due=NOW.getTime()-1):DeckCardProgress=>({deckId:deck.id,entryId:id,due,state:2,card:{due,state:2,stability:30,difficulty:5,reps:20,lapses:1,learningSteps:0,scheduledDays:30,elapsedDays:30,lastReview:NOW.getTime()-30*86400000}});
/** Replaces the old policy of consuming future short steps immediately. */
describe('Anki contract: real FSRS, due queue and atomic IndexedDB receipts',()=>{
 let study:DeckStudyService,db:DeckDatabaseService,settings={...deck.settings};const enqueue=vi.fn(async()=>{});
 function configure(){TestBed.configureTestingModule({providers:[{provide:CUSTOM_DECKS_ENABLED,useValue:signal(true)},{provide:DECK_SCHEDULER_ENABLE_FUZZ,useValue:false},{provide:DeckSettingsService,useValue:{settingsFor:()=>settings}},{provide:SyncOutboxService,useValue:{enqueue}}]});study=TestBed.inject(DeckStudyService);db=TestBed.inject(DeckDatabaseService);}
 beforeEach(()=>{localStorage.clear();vi.stubGlobal('indexedDB',new IDBFactory());vi.stubGlobal('IDBKeyRange',IDBKeyRange);settings={...deck.settings};enqueue.mockReset();enqueue.mockResolvedValue(undefined);configure();});
 afterEach(()=>{TestBed.resetTestingModule();vi.restoreAllMocks();vi.unstubAllGlobals();});
 async function grade(at:Date,rating:DeckRating='good',index=fresh){const snapshot=await study.snapshot(deck,index,at),choice=study.chooseNext(snapshot,deck,{debt:0}).choice;if(!choice)throw Error('No due card');const preview=study.preview(deck,choice,at);return {event:await study.rate(deck,choice,preview,rating,1000,at),choice,preview};}
 it('10 new plus 20 due reviews leave ten advanceable steps without another introduction',async()=>{
   const reviews=Array.from({length:20},(_,i)=>review('r'+i)),index=[...fresh,...reviews.map((p,i)=>({id:p.entryId,order:100+i}))];await db.mergeFromCloud({progress:reviews,events:[],daily:[]});
   for(let n=0;n<30;n++)await grade(NOW,'good',index);
   let snapshot=await study.snapshot(deck,index,NOW);expect(snapshot).toMatchObject({newAvailable:0,learningDue:0,learningPending:10,reviewDue:0,introducedToday:10,nextLearningDue:NOW.getTime()+600000});expect(study.chooseNext(snapshot,deck,{debt:0}).choice?.advanced).toBe(true);await study.completeSession(deck,index,NOW);expect((await db.getDailyState(deck.id,'2026-11-09'))?.completedAt).toBeNull();
   const at=new Date(NOW.getTime()+600000);for(let n=0;n<10;n++)await grade(at,'good',index);
   snapshot=await study.snapshot(deck,index,at);expect(snapshot).toMatchObject({newAvailable:0,learningDue:0,learningPending:0,reviewDue:0,introducedToday:10});await study.completeSession(deck,index,at);expect((await study.snapshot(deck,index,at)).completedToday).toBe(true);const events=await db.getDeckReviewEvents(deck.id);expect(events).toHaveLength(40);expect(new Set(events.map(e=>e.id)).size).toBe(40);expect(events.filter(e=>e.cardBefore===null)).toHaveLength(10);expect(events.filter(e=>e.cardBefore===null).every(e=>e.fsrsRating===3)).toBe(true);
 });
 it.each(['again','good']as const)('persists %s short steps and reconstructs the exact next deadline after reload',async rating=>{
   settings.newCardsPerDay=1;const first=await grade(NOW,rating),due=first.event.dueAfter;const before=await db.getDeckProgress(deck.id);TestBed.resetTestingModule();configure();
   let s=await study.snapshot(deck,fresh,new Date(due-1));expect(s.learningDue).toBe(0);expect(s.nextRefreshAt).toBe(due);expect(s.learningPending).toBe(1);expect(await db.getDeckProgress(deck.id)).toEqual(before);
   s=await study.snapshot(deck,fresh,new Date(due));expect(s.learningDue).toBe(1);const next=await grade(new Date(due),'good');expect(next.event.cardBefore).toEqual(before[0].card);expect((await db.getDeckReviewEvents(deck.id)).map(e=>e.fsrsRating)).toEqual([rating==='again'?1:3,3]);expect((await db.getDailyState(deck.id,'2026-11-09'))!.introducedEntryIds).toHaveLength(1);
 });
 it('a failed write keeps an immutable receipt; retry uses one event, snapshot and answer time',async()=>{
   const s=await study.snapshot(deck,fresh,NOW),choice=study.chooseNext(s,deck,{debt:0}).choice!,preview=study.preview(deck,choice,NOW),frozen=structuredClone(preview);const commit=vi.spyOn(db,'commitReview').mockRejectedValueOnce(Error('Synthetic quota'));
   await expect(study.rate(deck,choice,preview,'again',1000,NOW)).rejects.toThrow('quota');expect(await db.getDeckProgress(deck.id)).toEqual([]);expect(await db.getDeckReviewEvents(deck.id)).toEqual([]);
   const event=await study.rate(deck,choice,preview,'again',9999,new Date(NOW.getTime()+2000));expect(event.reviewedAt).toBe(NOW.getTime());expect(event.elapsedAnswerMs).toBe(1000);expect(event.dueAfter).toBe(preview.again.card.due);expect(commit.mock.calls[0][1]).toEqual(event);expect(preview).toEqual(frozen);expect(await db.getDeckReviewEvents(deck.id)).toHaveLength(1);
 });
 it('retries after the local transaction committed but outbox failed without duplicating progress or reviews',async()=>{
   TestBed.inject(WorkspaceService).activateUser('outbox-test');const s=await study.snapshot(deck,fresh,NOW),choice=study.chooseNext(s,deck,{debt:0}).choice!,preview=study.preview(deck,choice,NOW);enqueue.mockRejectedValueOnce(Error('Synthetic outbox failure'));
   await expect(study.rate(deck,choice,preview,'again',1000,NOW)).rejects.toThrow('outbox');const before=await db.getDeckProgress(deck.id),events=await db.getDeckReviewEvents(deck.id);expect(events).toHaveLength(1);const event=await study.rate(deck,choice,preview,'again',9000,new Date(NOW.getTime()+3000));expect(event).toEqual(events[0]);expect(await db.getDeckProgress(deck.id)).toEqual(before);expect(await db.getDeckReviewEvents(deck.id)).toEqual(events);expect((await db.getDailyState(deck.id,'2026-11-09'))!.introducedEntryIds).toEqual([choice.entryId]);
 });
 it('two simultaneous stale ratings commit only one review using compare-and-set',async()=>{
   const s=await study.snapshot(deck,fresh,NOW),choice=study.chooseNext(s,deck,{debt:0}).choice!,a=study.preview(deck,choice,NOW),b=study.preview(deck,choice,NOW);const result=await Promise.allSettled([study.rate(deck,choice,a,'again',1000,NOW),study.rate(deck,choice,b,'good',1000,NOW)]);expect(result.filter(r=>r.status==='fulfilled')).toHaveLength(1);expect(await db.getDeckReviewEvents(deck.id)).toHaveLength(1);expect((await db.getDeckProgress(deck.id))[0].card.reps).toBe(1);
 });
 it('an uncommitted retry still respects a newly exhausted new-card allowance',async()=>{
   settings.newCardsPerDay=1;const s=await study.snapshot(deck,fresh,NOW),choice=study.chooseNext(s,deck,{debt:0}).choice!,preview=study.preview(deck,choice,NOW);vi.spyOn(db,'commitReview').mockRejectedValueOnce(Error('full'));await expect(study.rate(deck,choice,preview,'good',1000,NOW)).rejects.toThrow();await db.writeDailyState({...emptyDailyState(deck.id,'2026-11-09'),introducedEntryIds:['another']});await expect(study.rate(deck,choice,preview,'good',1000,NOW)).rejects.toThrow('limit');expect(await db.getDeckReviewEvents(deck.id)).toEqual([]);
 });
 it('A→B→A during a pending read rejects the old activation and never writes to either workspace',async()=>{
   const workspace=TestBed.inject(WorkspaceService);workspace.activateUser('A');const s=await study.snapshot(deck,fresh,NOW),choice=study.chooseNext(s,deck,{debt:0}).choice!,preview=study.preview(deck,choice,NOW);let release!:()=>void;const gate=new Promise<void>(r=>release=r),original=db.getDailyState.bind(db);vi.spyOn(db,'getDailyState').mockImplementationOnce(async(...args)=>{const v=await original(...args);await gate;return v;});const pending=study.rate(deck,choice,preview,'again',1000,NOW);workspace.activateUser('B');workspace.activateUser('A');release();await expect(pending).rejects.toThrow('workspace');expect(await db.getDeckReviewEvents(deck.id)).toEqual([]);workspace.activateUser('B');expect(await db.getDeckReviewEvents(deck.id)).toEqual([]);
 });
 it('preserves historical states/dates/events byte-for-byte while reading with the new queue',async()=>{
   const old=review('legacy'),s=JSON.stringify(old);await db.mergeFromCloud({progress:[old],events:[],daily:[{...emptyDailyState(deck.id,'2026-11-09'),completedAt:NOW.getTime()}]});await study.snapshot(deck,[{id:'legacy',order:0}],NOW);expect(JSON.stringify((await db.getDeckProgress(deck.id))[0])).toBe(s);expect(await db.getDeckReviewEvents(deck.id)).toEqual([]);
 });
 it('a stored New snapshot remains eligible, counts against the new quota and is restored exactly by undo',async()=>{
   settings.newCardsPerDay=1;const stored:DeckCardProgress={...review('n0'),state:State.New,due:NOW.getTime(),card:{due:NOW.getTime(),state:State.New,stability:0,difficulty:0,reps:0,lapses:0,learningSteps:0,scheduledDays:0,elapsedDays:0,lastReview:null}};
   await db.mergeFromCloud({progress:[stored],events:[],daily:[]});expect((await study.statistics(deck,30,NOW)).unseen).toBe(30);
   const first=await grade(NOW,'again');expect(first.choice.kind).toBe('new');expect(first.event.cardBefore).toEqual(stored.card);expect((await study.snapshot(deck,fresh,NOW)).newAvailable).toBe(0);
   await study.undo(first.event);expect(await db.getDeckProgress(deck.id)).toEqual([stored]);expect((await study.snapshot(deck,fresh,NOW)).newAvailable).toBe(1);expect(await db.getDeckReviewEvents(deck.id)).toEqual([]);
 });
 it.each(['japanese-1500','mazo-puyi','md-parity'])('shares the same New/Learning/Review contract and exact receipts in %s',async id=>{
   const entryId=id.startsWith('md-')?'card-猫':'これ';if(id.startsWith('md-'))await TestBed.inject(CustomDeckRepository).create('parity-create',customDeck(id),[await customCard(id)]);
   const definition={...deck,id},ids=[{id:entryId,order:0}],persistence=TestBed.inject(DeckPersistenceRouter).bind(id);let at=NOW;
   for(const[rating,state,delay]of [['again',1,60000],['good',1,600000],['good',2,null]]as const){
     const snap=await study.snapshot(definition,ids,at),choice=study.chooseNext(snap,definition,{debt:0}).choice!,preview=study.preview(definition,choice,at),e=await study.rate(definition,choice,preview,rating,1000,at);expect(e.stateAfter).toBe(state);if(delay)expect(e.dueAfter-at.getTime()).toBe(delay);expect(e.dueAfter).toBe(preview[rating].card.due);expect((await persistence.getDeckProgress(id))[0].card).toEqual(preview[rating].card);at=new Date(e.dueAfter);
   }
   expect((await persistence.getDeckReviewEvents(id)).sort((a,b)=>a.reviewedAt-b.reviewedAt).map(e=>e.fsrsRating)).toEqual([1,3,3]);expect((await persistence.getDailyState(id,'2026-11-09'))!.introducedEntryIds).toEqual([entryId]);
 });
 it('two concurrent introductions cannot exceed the atomic daily allowance or lose either daily ID',async()=>{
   settings.newCardsPerDay=1;const a={entryId:'n0',kind:'new' as const,progress:null},b={entryId:'n1',kind:'new' as const,progress:null};const result=await Promise.allSettled([study.rate(deck,a,study.preview(deck,a,NOW),'good',1000,NOW),study.rate(deck,b,study.preview(deck,b,NOW),'good',1000,NOW)]);expect(result.filter(r=>r.status==='fulfilled')).toHaveLength(1);expect(await db.getDeckReviewEvents(deck.id)).toHaveLength(1);expect((await db.getDailyState(deck.id,'2026-11-09'))!.introducedEntryIds).toHaveLength(1);
 });
 it('an obsolete undo cannot overwrite a later review; repeating an applied undo is a no-op',async()=>{
   settings.newCardsPerDay=1;const first=await grade(NOW,'again'),second=await grade(new Date(first.event.dueAfter),'good'),saved=await db.getDeckProgress(deck.id);await expect(study.undo(first.event)).rejects.toThrow('stale');expect(await db.getDeckProgress(deck.id)).toEqual(saved);await study.undo(second.event);const undone=await db.getDeckProgress(deck.id);await study.undo(second.event);expect(await db.getDeckProgress(deck.id)).toEqual(undone);expect(undone[0].card).toEqual(second.event.cardBefore);expect(await db.getDeckReviewEvents(deck.id)).toHaveLength(1);
 });
 // Numerical engine examples, independent from the official Anki reference fixtures.
 // Each row also traverses the real local transaction, not just a mocked scheduler.
 for(const [i,row]of koreScenarios.entries())it(`persists synthetic これ scenario ${i}: ${row.scenario} / ${row.rating}`,async()=>{
   const at=new Date(row.at),before=row.before as DeckCardProgress['card'];
   if(before.state!==State.New)await db.mergeFromCloud({progress:[{deckId:deck.id,entryId:'これ',card:before,state:before.state,due:before.due}],events:[],daily:[]});
   const result=await grade(at,row.rating as DeckRating,[{id:'これ',order:0}]);
   expect(result.preview[row.rating as DeckRating].card).toEqual(row.after);
   expect((await db.getDeckProgress(deck.id))[0].card).toEqual(row.after);
   const events=await db.getDeckReviewEvents(deck.id);expect(events).toEqual([result.event]);
   expect(result.event).toMatchObject({stateBefore:before.state,stateAfter:row.after.state,dueAfter:row.after.due,stabilityAfter:row.after.stability,difficultyAfter:row.after.difficulty});
   expect(result.event.cardBefore).toEqual(before.state===State.New?null:before);
 });
});
