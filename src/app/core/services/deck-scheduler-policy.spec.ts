import { TestBed } from '@angular/core/testing';
import { IDBFactory } from 'fake-indexeddb';
import { State } from 'ts-fsrs';
import { DeckDefinition } from '../models/deck-catalog.model';
import { DeckCardProgress, DeckEntryIndexItem, SerializedFsrsCard } from '../models/deck-study.model';
import { DeckStudyService, emptyDailyState } from './deck-study.service';
import { DeckDatabaseService } from './deck-database.service';
import { DeckSettingsService } from './deck-settings.service';
import { DECK_SCHEDULER_ENABLE_FUZZ, DeckSchedulerService } from './deck-scheduler.service';
import { SyncOutboxService } from './sync-outbox.service';
import { WorkspaceService } from './workspace.service';
import { CustomDeckAccess } from './custom-deck-access';
import { getLocalStudyDayKey, nextLocalStudyDayStart } from './deck-study-time';

const NOW=new Date('2026-10-28T10:00:00Z');
const deck:DeckDefinition={id:'japanese-1500',cardCount:50,contentType:'japanese-word',settings:{desiredRetention:.9,newCardsPerDay:10,newCardOrder:'mixed'}};
const index:DeckEntryIndexItem[]=Array.from({length:30},(_,i)=>({id:'n'+i,order:i}));
const card=(entryId:string,state:State,due:number):DeckCardProgress=>({deckId:deck.id,entryId,due,state,card:{due,state,stability:30,difficulty:5,reps:20,lapses:1,learningSteps:state===State.Learning?1:0,scheduledDays:30,elapsedDays:30,lastReview:NOW.getTime()-30*86_400_000}});
describe('SCHEDULER-1 real persistence and queue policy',()=>{
 let study:DeckStudyService,db:DeckDatabaseService;
 let settings={...deck.settings};const enqueue=vi.fn(async()=>{});
 function configure(){TestBed.configureTestingModule({providers:[{provide:DECK_SCHEDULER_ENABLE_FUZZ,useValue:false},
  {provide:DeckSettingsService,useValue:{settingsFor:()=>settings}},
  {provide:CustomDeckAccess,useValue:{permitted:()=>true}},
  {provide:SyncOutboxService,useValue:{enqueue}}]});study=TestBed.inject(DeckStudyService);db=TestBed.inject(DeckDatabaseService);}
 beforeEach(()=>{TestBed.resetTestingModule();localStorage.clear();vi.stubGlobal('indexedDB',new IDBFactory());settings={...deck.settings};enqueue.mockClear();configure();});
 afterEach(()=>{TestBed.resetTestingModule();vi.restoreAllMocks();vi.unstubAllGlobals();});
 async function seed(rows:DeckCardProgress[],at=NOW,completed=false){await db.mergeFromCloud({progress:rows,events:[],daily:completed?[{...emptyDailyState(deck.id,getLocalStudyDayKey(at)),introducedEntryIds:['historic-introduction'],completedAt:at.getTime()-1000}]:[]});}
 it('introduces ten distinct new cards with twenty daily reviews, repetitions and only two public ratings',async()=>{
  const reviews=Array.from({length:20},(_,i)=>card('r'+i,State.Review,NOW.getTime()+7*3_600_000));await seed(reviews);
  const all=[...index,...reviews.map((r,i)=>({id:r.entryId,order:100+i}))];
  let cursor={debt:0},newFailure=false,reviewFailure=false,responses=0;
  while(responses<100){
   const snapshot=await study.snapshot(deck,all,NOW),decision=study.chooseNext(snapshot,deck,cursor);if(!decision.choice)break;
   cursor=decision.cursor;const choice=decision.choice;
   const fail=choice.kind==='new'&&!newFailure||choice.kind==='review'&&!reviewFailure;
   if(choice.kind==='new')newFailure=true;if(choice.kind==='review')reviewFailure=true;
   const preview=study.preview(deck,choice,NOW);await study.rate(deck,choice,preview,fail?'again':'good',500,NOW);responses++;
   expect((await study.snapshot(deck,all,NOW)).introducedToday).toBeLessThanOrEqual(10);
  }
  expect(responses).toBe(42);const snapshot=await study.snapshot(deck,all,NOW);
  expect(snapshot.introducedToday).toBe(10);expect(snapshot.progress).toHaveLength(30);expect(snapshot.newAvailable).toBe(0);
  expect(snapshot.learningDue).toBe(0);expect(snapshot.learningPending).toBe(0);expect(snapshot.reviewDue).toBe(0);
  expect(new Set((await db.getDailyState(deck.id,getLocalStudyDayKey(NOW)))!.introducedEntryIds).size).toBe(10);
  await study.completeSession(deck,all,NOW);expect((await study.snapshot(deck,all,NOW)).completedToday).toBe(true);
  const events=await db.getDeckReviewEvents(deck.id);expect(events).toHaveLength(42);expect(events.every(e=>e.reviewedAt===NOW.getTime()&&e.fsrsLog.review===NOW.getTime())).toBe(true);
 });
 it('advances only after ready work is exhausted; earliest due wins and exactly 20m is inclusive',async()=>{
  settings={...settings,newCardsPerDay:0};
  await seed([card('late',State.Learning,NOW.getTime()+20*60_000+1),card('edge',State.Relearning,NOW.getTime()+20*60_000),card('early',State.Learning,NOW.getTime()+3*60_000)]);
  let snapshot=await study.snapshot(deck,index,NOW);
  expect(snapshot.advanceEntries?.map(c=>c.entryId)).toEqual(['early','edge']);expect(snapshot.learningPending).toBe(3);
  expect(study.chooseNext(snapshot,deck,{debt:0}).choice).toMatchObject({entryId:'early',advanced:true});
  await seed([card('ready',State.Review,NOW.getTime()+8*3_600_000)]);
  snapshot=await study.snapshot(deck,index,NOW);expect(study.chooseNext(snapshot,deck,{debt:0}).choice?.entryId).toBe('ready');
  settings={...settings,newCardsPerDay:1,newCardOrder:'before-reviews'};
  expect(study.chooseNext(await study.snapshot(deck,index,NOW),deck,{debt:0}).choice?.kind).toBe('new');
 });
 it('keeps a real wait outside 20m, schedules the advance boundary and never closes pending learning today',async()=>{
  settings={...settings,newCardsPerDay:0};const due=NOW.getTime()+40*60_000;await seed([card('wait',State.Learning,due)]);
  const snapshot=await study.snapshot(deck,index,NOW);
  expect(study.chooseNext(snapshot,deck,{debt:0}).choice).toBeNull();expect(snapshot.learningPending).toBe(1);
  expect(snapshot.nextLearningDue).toBe(due);expect(snapshot.nextRefreshAt).toBe(due-20*60_000);
  await study.completeSession(deck,index,NOW);expect((await db.getDailyState(deck.id,getLocalStudyDayKey(NOW)))?.completedAt).toBeUndefined();
  const later=await study.snapshot(deck,index,new Date(due-20*60_000));expect(study.chooseNext(later,deck,{debt:0}).choice?.advanced).toBe(true);
 });
 it('resumes one persisted early step after reload, then graduates tomorrow without another introduction',async()=>{
  const only=index.slice(0,1);let snapshot=await study.snapshot(deck,only,NOW);let choice=study.chooseNext(snapshot,deck,{debt:0}).choice!;
  const preview=study.preview(deck,choice,NOW);const first=await study.rate(deck,choice,preview,'good',400,NOW);
  expect(first.stateAfter).toBe(State.Learning);expect(first.dueAfter).toBe(NOW.getTime()+600_000);
  TestBed.resetTestingModule();configure();snapshot=await study.snapshot(deck,only,NOW);choice=study.chooseNext(snapshot,deck,{debt:0}).choice!;
  expect(choice).toMatchObject({entryId:only[0].id,advanced:true});expect(choice.progress?.card.learningSteps).toBe(1);
  const responseAt=new Date(NOW.getTime()+1000),p=study.preview(deck,choice,responseAt);
  const event=await study.rate(deck,choice,p,'good',700,responseAt);
  expect(event.reviewedAt).toBe(responseAt.getTime());expect(event.fsrsLog.review).toBe(responseAt.getTime());expect(event.dueAfter).toBe(nextLocalStudyDayStart(responseAt));
  await study.completeSession(deck,only,responseAt);expect((await study.snapshot(deck,only,responseAt)).completedToday).toBe(true);
  await study.undo(event);expect(await db.getProgress(deck.id,only[0].id)).toEqual(choice.progress);
  expect((await study.snapshot(deck,only,responseAt)).completedToday).toBe(false);expect((await study.snapshot(deck,only,responseAt)).introducedToday).toBe(1);
  await study.undo(first);expect(await db.getProgress(deck.id,only[0].id)).toBeNull();expect((await study.snapshot(deck,only,responseAt)).introducedToday).toBe(0);
 });
 it('preserves old completion records while reopening actual pending work and preserving prior introductions',async()=>{
  const pending=card('old',State.Learning,NOW.getTime()+10*60_000);await seed([pending],NOW,true);
  const before=await db.getDailyState(deck.id,getLocalStudyDayKey(NOW)),snapshot=await study.snapshot(deck,index,NOW);
  expect(snapshot.completedToday).toBe(false);expect(snapshot.newAvailable).toBe(0);expect(snapshot.introducedToday).toBe(1);
  expect(await db.getDailyState(deck.id,getLocalStudyDayKey(NOW))).toEqual(before);expect(await db.getProgress(deck.id,'old')).toEqual(pending);
  const choice=study.chooseNext(snapshot,deck,{debt:0}).choice!,preview=study.preview(deck,choice,NOW);
  await study.rate(deck,choice,preview,'good',100,NOW);expect((await study.snapshot(deck,index,NOW)).completedToday).toBe(true);
  expect((await db.getDailyState(deck.id,getLocalStudyDayKey(NOW)))!.completedAt).toBe(before!.completedAt);
 });
 it('old completion cannot hide a review scheduled later today, but tomorrow Review stays excluded',async()=>{
  await seed([card('today',State.Review,NOW.getTime()+10*3_600_000),card('tomorrow',State.Review,nextLocalStudyDayStart(NOW)+1000)],NOW,true);
  const snapshot=await study.snapshot(deck,index,NOW);expect(snapshot.completedToday).toBe(false);expect(snapshot.reviewEntries.map(c=>c.entryId)).toEqual(['today']);
  expect(snapshot.nextDue).toBe(nextLocalStudyDayStart(NOW));
  expect((await study.statistics(deck,50,NOW)).dueNow).toBe(1);
 });
 it('short steps that cross midnight are never advanced into the preceding Madrid day',async()=>{
  const late=new Date('2026-10-28T22:55:00Z'),only=index.slice(0,1);
  const choice=study.chooseNext(await study.snapshot(deck,only,late),deck,{debt:0}).choice!;
  await study.rate(deck,choice,study.preview(deck,choice,late),'good',10,late);
  const before=await study.snapshot(deck,only,late);expect(before.learningPending).toBe(0);expect(before.advanceEntries).toEqual([]);
  expect(study.chooseNext(before,deck,{debt:0}).choice).toBeNull();await study.completeSession(deck,only,late);
  expect((await study.snapshot(deck,only,late)).completedToday).toBe(true);
  const midnight=new Date('2026-10-28T23:00:00Z'),after=await study.snapshot(deck,only,midnight);
  expect(after.completedToday).toBe(false);expect(after.introducedToday).toBe(0);expect(study.chooseNext(after,deck,{debt:0}).choice?.advanced).toBe(true);
 });
 it.each(['2026-03-28T23:00:00Z','2026-10-24T22:00:00Z'])('review day eligibility and future steps respect the DST calendar at %s',async value=>{
  const now=new Date(value),tomorrow=nextLocalStudyDayStart(now);settings={...settings,newCardsPerDay:0};
  await seed([card('today',State.Review,tomorrow-1),card('next',State.Review,tomorrow),card('step',State.Learning,tomorrow+60_000)],now);
  const snapshot=await study.snapshot(deck,index,now);expect(snapshot.reviewEntries.map(c=>c.entryId)).toEqual(['today']);expect(snapshot.advanceEntries).toEqual([]);
  expect(snapshot.nextRefreshAt).toBe(tomorrow);expect((await study.snapshot(deck,index,new Date(tomorrow))).reviewDue).toBe(2);
 });
 it('a failed atomic write leaves no introduced card/event; retry commits once, with the displayed transition',async()=>{
  const choice=study.chooseNext(await study.snapshot(deck,index,NOW),deck,{debt:0}).choice!,p=study.preview(deck,choice,NOW);
  const before=structuredClone(p);vi.spyOn(db,'commitReview').mockRejectedValueOnce(new Error('controlled write failure'));
  await expect(study.rate(deck,choice,p,'again',500,NOW)).rejects.toThrow('controlled');
  expect(await db.getDeckProgress(deck.id)).toEqual([]);expect(await db.getDeckReviewEvents(deck.id)).toEqual([]);
  const response=new Date(NOW.getTime()+2000),event=await study.rate(deck,choice,p,'again',500,response);
  const expected=TestBed.inject(DeckSchedulerService).branch(p,'again',response).card;
  expect((await db.getDeckProgress(deck.id))[0].card).toEqual(expected);expect(event.dueAfter).toBe(expected.due);
  expect(event.reviewedAt).toBe(response.getTime());expect(await db.getDeckReviewEvents(deck.id)).toHaveLength(1);expect(p).toEqual(before);
 });
 it('rejects a stale first introduction after the unique daily allowance is consumed',async()=>{
  settings={...settings,newCardsPerDay:1};
  const choice=study.chooseNext(await study.snapshot(deck,index,NOW),deck,{debt:0}).choice!,preview=study.preview(deck,choice,NOW);
  await db.writeDailyState({...emptyDailyState(deck.id,getLocalStudyDayKey(NOW)),introducedEntryIds:['another-card']});
  await expect(study.rate(deck,choice,preview,'good',500,NOW)).rejects.toThrow('limit');
  expect(await db.getDeckProgress(deck.id)).toEqual([]);expect(await db.getDeckReviewEvents(deck.id)).toEqual([]);
 });
 it('isolates workspaces, rejects a response after account activation changes and preserves legacy memory',async()=>{
  const workspace=TestBed.inject(WorkspaceService);workspace.activateUser('A');
  const old=card('legacy',State.Review,NOW.getTime()-1);await seed([old]);
  const before=await db.getProgress(deck.id,'legacy');expect((await study.snapshot(deck,index,NOW)).progress[0]).toEqual(before);
  const choice=study.chooseNext(await study.snapshot(deck,index,NOW),deck,{debt:0}).choice!,p=study.preview(deck,choice,NOW);
  let release!:()=>void;const held=new Promise<void>(r=>release=r),original=db.getDailyState.bind(db);
  vi.spyOn(db,'getDailyState').mockImplementationOnce(async(...args)=>{const value=await original(...args);await held;return value;});
  const saving=study.rate(deck,choice,p,'again',100,NOW);workspace.activateUser('B');release();await expect(saving).rejects.toThrow('workspace');
  expect((await study.snapshot(deck,index,NOW)).progress).toEqual([]);workspace.activateUser('A');
  expect(await db.getProgress(deck.id,'legacy')).toEqual(before);expect(await db.getDeckReviewEvents(deck.id)).toEqual([]);
 });
});
