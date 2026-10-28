import { TestBed } from '@angular/core/testing';
import { fsrs, generatorParameters, Rating, State } from 'ts-fsrs';
import { DeckCardProgress, SerializedFsrsCard } from '../models/deck-study.model';
import { DECK_SCHEDULER_ENABLE_FUZZ, DeckSchedulerService, DECK_LEARNING_STEPS, DECK_RELEARNING_STEPS } from './deck-scheduler.service';
import { deserializeDeckCard, deserializeDeckReviewLog, serializeDeckCard, serializeDeckReviewLog } from './deck-study-serialization';
import { nextLocalStudyDayStart } from './deck-study-time';

const NOW=new Date('2026-10-28T10:00:00Z');
const progress=(card:SerializedFsrsCard):DeckCardProgress=>({deckId:'japanese-1500',entryId:'e1',due:card.due,state:card.state,card});
describe('Deck scheduler: short steps plus FSRS memory',()=>{
 let scheduler:DeckSchedulerService;
 beforeEach(()=>{TestBed.configureTestingModule({providers:[{provide:DECK_SCHEDULER_ENABLE_FUZZ,useValue:false}]});scheduler=TestBed.inject(DeckSchedulerService);});
 afterEach(()=>TestBed.resetTestingModule());
 const advance=(date:Date,minutes:number)=>new Date(date.getTime()+minutes*60_000);
 it('New Again is Learning step 0 at 1m; New Good is step 1 at 10m',()=>{
  const p=scheduler.preview(null,.9,NOW);
  expect(p.again.card).toMatchObject({state:State.Learning,learningSteps:0,due:advance(NOW,1).getTime(),reps:1});
  expect(p.good.card).toMatchObject({state:State.Learning,learningSteps:1,due:advance(NOW,10).getTime(),reps:1});
 });
 it('initial-step Good advances to 10m, and either Learning failure restarts 1m',()=>{
  const first=scheduler.preview(null,.9,NOW).again.card,at=advance(NOW,1);
  const p=scheduler.preview(progress(first),.9,at);
  expect(p.again.card).toMatchObject({state:State.Learning,learningSteps:0,due:advance(at,1).getTime()});
  expect(p.good.card).toMatchObject({state:State.Learning,learningSteps:1,due:advance(at,10).getTime()});
  const last=scheduler.preview(progress(p.good.card),.9,advance(at,10));
  expect(last.again.card).toMatchObject({state:State.Learning,learningSteps:0,due:advance(at,11).getTime()});
  expect(last.good.card).toMatchObject({state:State.Review,scheduledDays:1,due:nextLocalStudyDayStart(advance(at,10))});
 });
 it('Review Again is Relearning 10m; repeated failure stays 10m and Good recovers tomorrow',()=>{
  const initial=scheduler.preview(null,.9,NOW).good.card;
  const review=scheduler.preview(progress(initial),.9,advance(NOW,10)).good.card;
  const at=new Date(review.due),p=scheduler.preview(progress(review),.9,at);
  expect(p.again.card).toMatchObject({state:State.Relearning,learningSteps:0,due:advance(at,10).getTime(),lapses:review.lapses+1});
  const recovery=scheduler.preview(progress(p.again.card),.9,advance(at,10));
  expect(recovery.again.card).toMatchObject({state:State.Relearning,due:advance(at,20).getTime(),lapses:p.again.card.lapses});
  expect(recovery.good.card).toMatchObject({state:State.Review,scheduledDays:1,due:nextLocalStudyDayStart(advance(at,10))});
 });
 it('normal Review Good and its memory remain identical to official FSRS, not forced to one day',()=>{
  const learned=scheduler.preview(null,.9,NOW).good.card;
  const card={...learned,state:State.Review,learningSteps:0,stability:45,difficulty:5,scheduledDays:30,reps:30,lapses:2,lastReview:NOW.getTime()-30*86_400_000};
  const expected=fsrs(generatorParameters({request_retention:.9,enable_short_term:true,learning_steps:DECK_LEARNING_STEPS,relearning_steps:DECK_RELEARNING_STEPS,enable_fuzz:false,maximum_interval:36500})).repeat(deserializeDeckCard(card),NOW);
  const actual=scheduler.preview(progress(card),.9,NOW);
  expect(actual.good.card).toEqual(serializeDeckCard(expected[Rating.Good].card));
  expect(actual.again.card).toEqual(serializeDeckCard(expected[Rating.Again].card));
  expect(actual.good.card.scheduledDays).toBeGreaterThan(1);
  expect(actual.retrievabilityBefore).toBeGreaterThan(0);
 });
 it('graduation/recovery preserve the library memory, reps and lapses, overriding only the calendar policy',()=>{
  const first=scheduler.preview(null,.9,NOW).good.card;
  for(const state of [State.Learning,State.Relearning]){
   const before={...first,state,learningSteps:state===State.Learning?1:0,reps:12,lapses:2};
   const original=structuredClone(before),at=advance(NOW,10);
   const expected=fsrs(generatorParameters({enable_short_term:true,enable_fuzz:false})).repeat(deserializeDeckCard(before),at)[Rating.Good].card;
   const result=scheduler.preview(progress(before),.9,at).good.card;
   expect(result.stability).toBe(expected.stability);expect(result.difficulty).toBe(expected.difficulty);
   expect(result.reps).toBe(expected.reps);expect(result.lapses).toBe(expected.lapses);expect(before).toEqual(original);
  }
 });
 it.each([
  ['2026-03-28T23:00:00Z','2026-03-29T22:00:00Z',23],
  ['2026-10-24T22:00:00Z','2026-10-25T23:00:00Z',25],
 ])('graduates by Madrid calendar across DST %s', (now,tomorrow,hours)=>{
  const at=new Date(now);expect(nextLocalStudyDayStart(at)).toBe(Date.parse(tomorrow));
  expect((nextLocalStudyDayStart(at)-at.getTime())/3_600_000).toBe(hours);
  const step=scheduler.preview(null,.9,at).good.card;
  expect(scheduler.preview(progress(step),.9,at).good.card.due).toBe(Date.parse(tomorrow));
 });
 it('early answers use the real answer clock and keep one immutable FSRS/fuzz preview',()=>{
  const first=scheduler.preview(null,.9,NOW).good.card;
  const at=advance(NOW,1),p=scheduler.preview(progress(first),.9,at),saved=structuredClone(p);
  const actual=advance(at,1),branch=scheduler.branch(p,'good',actual);
  expect(branch.card.due).toBe(nextLocalStudyDayStart(actual));expect(branch.card.lastReview).toBe(actual.getTime());
  expect(branch.log.review).toBe(actual.getTime());expect(p).toEqual(saved);
  const next=scheduler.branch(scheduler.preview(null,.9,at),'again',actual);
  expect(next.card.due).toBe(actual.getTime()+60_000);
 });
 it('keeps tomorrow after a reveal/answer crosses Madrid midnight',()=>{
  const at=new Date('2026-10-28T22:59:59Z'),step=scheduler.preview(null,.9,at).good.card;
  const p=scheduler.preview(progress(step),.9,at),answer=new Date('2026-10-28T23:00:01Z');
  expect(scheduler.isTomorrow(p,'good')).toBe(true);
  expect(scheduler.branch(p,'good',answer).card.due).toBe(Date.parse('2026-10-29T23:00:00Z'));
 });
 it('maps only Again/Good and reuses the displayed branch when the anchor is unchanged',()=>{
  const p=scheduler.preview(null,.9,NOW);
  expect(scheduler.branch(p,'again')).toBe(p.again);expect(scheduler.branch(p,'good',NOW)).toBe(p.good);
  expect([p.again.log.rating,p.good.log.rating]).toEqual([Rating.Again,Rating.Good]);
 });
 it('round-trips cards/logs and rolls back short steps and graduation to the exact prior state',()=>{
  const first=scheduler.preview(null,.9,NOW),second=scheduler.preview(progress(first.good.card),.9,advance(NOW,10));
  for(const p of [first,second])for(const branch of [p.again,p.good]){
   expect(serializeDeckCard(deserializeDeckCard(branch.card) as never)).toEqual(branch.card);
   expect(serializeDeckReviewLog(deserializeDeckReviewLog(branch.log) as never)).toEqual(branch.log);
   expect(scheduler.rollback(branch.card,branch.log,.9)).toEqual(p.cardBefore);
  }
 });
 it('respects retention on normal Review and keeps short steps/graduation fixed even with fuzz',()=>{
  TestBed.resetTestingModule();scheduler=TestBed.inject(DeckSchedulerService);
  for(const retention of [.8,.85,.9,.95,.97]){
   const step=scheduler.preview(null,retention,NOW).good.card;
   expect(step.due-NOW.getTime()).toBe(600_000);
   expect(scheduler.preview(progress(step),retention,advance(NOW,10)).good.card.due).toBe(nextLocalStudyDayStart(NOW));
  }
  const card={...scheduler.preview(null,.9,NOW).good.card,state:State.Review,stability:45,learningSteps:0};
  expect(scheduler.preview(progress(card),.97,NOW).good.card.scheduledDays).toBeLessThanOrEqual(scheduler.preview(progress(card),.8,NOW).good.card.scheduledDays);
 });
});
