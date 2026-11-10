import {TestBed} from '@angular/core/testing';
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb';
import {State} from 'ts-fsrs';
import {DeckDefinition} from '../models/deck-catalog.model';
import {DeckCardProgress,DeckRating} from '../models/deck-study.model';
import {DeckStudyService,emptyDailyState} from './deck-study.service';
import {DeckDatabaseService} from './deck-database.service';
import {DECK_SCHEDULER_ENABLE_FUZZ} from './deck-scheduler.service';
import {SyncOutboxService} from './sync-outbox.service';
import {nextLocalStudyDayStart,deckCardEligible} from './deck-study-time';
const NOW=new Date('2026-11-09T12:00:00Z');
const deck:DeckDefinition={id:'japanese-1500',cardCount:5,contentType:'japanese-word',settings:{desiredRetention:.9,newCardsPerDay:0,newCardOrder:'before-reviews'}};
const row=(id:string,state:State,due:number):DeckCardProgress=>({deckId:deck.id,entryId:id,due,state,card:{due,state,stability:30,difficulty:5,reps:20,lapses:2,learningSteps:0,scheduledDays:30,elapsedDays:30,lastReview:NOW.getTime()-30*86400000}});
/** Replaces positional repeats with actual scheduled deadlines; old history is not rewritten. */
describe('Mazos Anki due queue: deadlines, Madrid calendar and lapse recovery',()=>{
 let study:DeckStudyService,db:DeckDatabaseService;
 beforeEach(()=>{localStorage.clear();vi.stubGlobal('indexedDB',new IDBFactory());vi.stubGlobal('IDBKeyRange',IDBKeyRange);TestBed.configureTestingModule({providers:[{provide:DECK_SCHEDULER_ENABLE_FUZZ,useValue:false},{provide:SyncOutboxService,useValue:{enqueue:async()=>{}}}]});study=TestBed.inject(DeckStudyService);db=TestBed.inject(DeckDatabaseService);});
 afterEach(()=>{TestBed.resetTestingModule();vi.restoreAllMocks();vi.unstubAllGlobals();});
 const index=(rows:readonly DeckCardProgress[])=>rows.map((p,i)=>({id:p.entryId,order:i}));
 async function seed(rows:DeckCardProgress[]){await db.mergeFromCloud({progress:rows,events:[],daily:[]});}
 async function grade(definition:DeckDefinition,ids:ReturnType<typeof index>,at:Date,rating:DeckRating){const s=await study.snapshot(definition,ids,at),choice=study.chooseNext(s,definition,{debt:0}).choice!;if(!choice)throw Error('Nothing due');return study.rate(definition,choice,study.preview(definition,choice,at),rating,1000,at);}
 it.each(['mixed','before-reviews','after-reviews']as const)('gives intraday due steps priority even with %s; future short steps never enter the queue',async order=>{
   const at=NOW.getTime(),rows=[row('review',State.Review,at-90000),row('learning',State.Learning,at-1),row('relearning',State.Relearning,at-2),row('future',State.Learning,at+1)];await seed(rows);const d={...deck,settings:{...deck.settings,newCardOrder:order,newCardsPerDay:1}},s=await study.snapshot(d,[...index(rows),{id:'fresh',order:99}],NOW);
   expect(s.learningEntries.map(p=>p.entryId)).toEqual(['relearning','learning']);expect(s.learningPending).toBe(1);expect(study.chooseNext(s,d,{debt:0}).choice?.entryId).toBe('relearning');expect(s.nextRefreshAt).toBe(at+1);
 });
 it('offers a pending Again via Learn Ahead when no alternatives remain',async()=>{
   const d={...deck,settings:{...deck.settings,newCardsPerDay:1}},ids=[{id:'これ',order:0}];const first=await grade(d,ids,NOW,'again');let s=await study.snapshot(d,ids,new Date(first.dueAfter-1));expect(study.chooseNext(s,d,{debt:0}).choice).toMatchObject({entryId:'これ',advanced:true});expect(s.learningPending).toBe(1);
   const second=await grade(d,ids,new Date(first.dueAfter),'again');expect(second.cardBefore?.reps).toBe(1);expect(second.dueAfter).toBe(first.dueAfter+60000);expect(second.stateAfter).toBe(State.Learning);expect((await db.getDeckReviewEvents(d.id)).map(e=>e.fsrsRating)).toEqual([1,1]);
 });
 it('an unselected or foreign card never contributes eligible work',async()=>{
   const selected=row('selected',State.Review,NOW.getTime()),hidden=row('hidden',State.Learning,NOW.getTime()),foreign={...row('foreign',State.Review,NOW.getTime()),deckId:'other'};await seed([selected,hidden,foreign]);const s=await study.snapshot(deck,index([selected]),NOW);expect(s.progress).toEqual([selected]);expect(s.learningDue).toBe(0);expect(s.reviewDue).toBe(1);
 });
 it('a completed marker closes access even with pending steps and unused new quota',async()=>{
   const existing=row('old',State.Relearning,NOW.getTime()+600000);await seed([existing]);await db.writeDailyState({...emptyDailyState(deck.id,'2026-11-09'),completedAt:NOW.getTime(),introducedEntryIds:['old']});const d={...deck,settings:{...deck.settings,newCardsPerDay:2}},ids=[...index([existing]),{id:'fresh',order:1}];let s=await study.snapshot(d,ids,NOW);expect(s).toMatchObject({newAvailable:1,learningDue:0,learningPending:1,completedToday:true});s=await study.snapshot(d,ids,new Date(existing.due));expect(s.learningDue).toBe(1);expect(study.chooseNext(s,d,{debt:0}).choice).toBeNull();expect((await db.getDailyState(d.id,'2026-11-09'))!.completedAt).toBe(NOW.getTime());
 });
 it('Review Again enters Relearning; Again stays at its step, Good returns to library-scheduled Review',async()=>{
   const before=row('mature',State.Review,NOW.getTime());await seed([before]);const ids=index([before]);const first=await grade(deck,ids,NOW,'again');expect(first).toMatchObject({stateBefore:2,stateAfter:3,dueAfter:NOW.getTime()+600000});const failed=await grade(deck,ids,new Date(first.dueAfter),'again');expect(failed.stateAfter).toBe(3);expect(failed.dueAfter-first.dueAfter).toBe(600000);
   const at=new Date(failed.dueAfter),s=await study.snapshot(deck,ids,at),choice=study.chooseNext(s,deck,{debt:0}).choice!,preview=study.preview(deck,choice,at),recovered=await study.rate(deck,choice,preview,'good',1000,at);expect(recovered.stateAfter).toBe(2);expect(recovered.dueAfter).toBe(preview.good.card.due);expect(recovered.cardBefore?.lapses).toBe(before.card.lapses+1);expect((await db.getDeckReviewEvents(deck.id)).map(e=>e.fsrsRating)).toEqual([1,1,3]);
 });
 it('これ after repeated failures yesterday and one Good today remains Learning when the last step was not reached',async()=>{
   const yesterday=new Date('2026-11-08T12:00:00Z'),d={...deck,settings:{...deck.settings,newCardsPerDay:1}},ids=[{id:'これ',order:0}];let at=yesterday;
   for(let i=0;i<3;i++){const failed=await grade(d,ids,at,'again');at=new Date(failed.dueAfter);}
   const correct=await grade(d,ids,NOW,'good');expect(correct.stateAfter).toBe(State.Learning);expect(correct.dueAfter-NOW.getTime()).toBe(600000);expect((await db.getDeckProgress(d.id))[0].card.learningSteps).toBe(1);expect((await db.getDeckReviewEvents(d.id))).toHaveLength(4);
 });
 it('a mature successful review can legitimately produce months; a lapse still must use the relearning step',async()=>{
   const before=row('これ',State.Review,NOW.getTime()),mature={...before,card:{...before.card,stability:90,scheduledDays:90,lastReview:NOW.getTime()-90*86400000}};await seed([mature]);const s=await study.snapshot(deck,index([mature]),NOW),choice=study.chooseNext(s,deck,{debt:0}).choice!,preview=study.preview(deck,choice,NOW);expect(preview.good.card.scheduledDays).toBeGreaterThan(60);expect(preview.again.card.state).toBe(3);expect(preview.again.card.due-NOW.getTime()).toBe(600000);const e=await study.rate(deck,choice,preview,'good',1000,NOW);expect(e.dueAfter).toBe(preview.good.card.due);expect(e.stabilityBefore).toBe(90);
 });
 it.each([['2026-03-28T23:00:00Z','2026-03-29T22:00:00Z',23],['2026-10-24T22:00:00Z','2026-10-25T23:00:00Z',25]]as const)('keeps exact minute deadlines on Madrid day %s→%s lasting %i hours',(now,end,hours)=>{
   const at=new Date(now);expect(nextLocalStudyDayStart(at)).toBe(Date.parse(end));expect((Date.parse(end)-at.getTime())/3600000).toBe(hours);
   for(const state of [State.Learning,State.Relearning]){const c=row('x',state,at.getTime()+600000).card;expect(deckCardEligible(c,new Date(c.due-1))).toBe(false);expect(deckCardEligible(c,new Date(c.due))).toBe(true);}
 });
 it('a cross-midnight short step waits for its minute deadline while a Review opens at Madrid midnight',()=>{
   const before=new Date('2026-11-09T22:59:00Z'),due=Date.parse('2026-11-09T23:09:00Z'),learning=row('x',State.Learning,due).card,review=row('r',State.Review,due).card;expect(deckCardEligible(learning,before)).toBe(false);expect(deckCardEligible(review,before)).toBe(false);const midnight=new Date('2026-11-09T23:00:00Z');expect(deckCardEligible(learning,midnight)).toBe(false);expect(deckCardEligible(review,midnight)).toBe(true);
 });
});
