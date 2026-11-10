import {TestBed} from '@angular/core/testing';
import {fsrs,generatorParameters,Rating,State} from 'ts-fsrs';
import {DeckCardProgress,SerializedFsrsCard} from '../models/deck-study.model';
import {DeckSchedulerService,DECK_SCHEDULER_ENABLE_FUZZ} from './deck-scheduler.service';
import {deserializeDeckCard,serializeDeckCard,serializeDeckReviewLog} from './deck-study-serialization';
import reference from './fixtures/anki-25.9.2-reference.json';
import aheadReference from './fixtures/anki-25.9.2-learn-ahead.json';
const NOW=new Date('2026-11-09T12:00:00Z');
const progress=(card:SerializedFsrsCard):DeckCardProgress=>({deckId:'japanese-1500',entryId:'これ',due:card.due,state:card.state,card});
/** Replaces the old fixed-tomorrow expectations with the explicit Anki/FSRS contract. */
describe('Deck scheduler: Anki steps and unmodified FSRS-6',()=>{
 let scheduler:DeckSchedulerService;
 beforeEach(()=>{TestBed.configureTestingModule({providers:[{provide:DECK_SCHEDULER_ENABLE_FUZZ,useValue:false}]});scheduler=TestBed.inject(DeckSchedulerService);});
 afterEach(()=>TestBed.resetTestingModule());
 it('New Again→1m, repeated Again resets, Good→10m, then graduation uses the library interval',()=>{
   let at=NOW,p:DeckCardProgress|null=null;
   for(const[rating,minutes,step]of [[Rating.Again,1,0],[Rating.Again,1,0],[Rating.Good,10,1]] as const){const preview=scheduler.preview(p,.9,at),branch=rating===Rating.Again?preview.again:preview.good;expect(branch.card).toMatchObject({state:State.Learning,learningSteps:step});expect(branch.card.due-at.getTime()).toBe(minutes*60000);p=progress(branch.card);at=new Date(branch.card.due);}
   const expected=fsrs(generatorParameters({enable_fuzz:false,maximum_interval:36500})).repeat(deserializeDeckCard(p!.card),at)[Rating.Good];
   const branch=scheduler.preview(p,.9,at).good;expect(branch.card).toEqual(serializeDeckCard(expected.card));expect(branch.log).toEqual(serializeDeckReviewLog(expected.log));expect(branch.card.state).toBe(State.Review);
 });
 it.each([.85,.9,.95])('preserves every FSRS branch at retention %s, including graduation/recovery',retention=>{
   const first=scheduler.preview(null,retention,NOW).good.card;
   for(const state of [State.Learning,State.Review,State.Relearning]){
     const card={...first,state,learningSteps:state===State.Learning?1:0,stability:250,difficulty:5,reps:50,lapses:3,lastReview:NOW.getTime()-86400000};
     const before=structuredClone(card),original=fsrs(generatorParameters({request_retention:retention,enable_fuzz:false,maximum_interval:36500})).repeat(deserializeDeckCard(card),NOW),actual=scheduler.preview(progress(card),retention,NOW);
     for(const[rating,key]of [[Rating.Again,'again'],[Rating.Good,'good']]as const){expect(actual[key].card).toEqual(serializeDeckCard(original[rating].card));expect(actual[key].log).toEqual(serializeDeckReviewLog(original[rating].log));}
     expect(card).toEqual(before);
   }
 });
 it('supports configured intraday steps without changing Review math or rewriting saved snapshots',()=>{
   const options={learningSteps:[2,20,60],relearningSteps:[5,15]},first=scheduler.preview(null,.9,NOW,options);
   expect(first.again.card.due-NOW.getTime()).toBe(120000);expect(first.good.card.due-NOW.getTime()).toBe(1200000);
   const next=scheduler.preview(progress(first.good.card),.9,new Date(first.good.card.due),options);expect(next.good.card.state).toBe(State.Learning);expect(next.good.card.learningSteps).toBe(2);expect(next.good.card.due-first.good.card.due).toBe(3600000);
   expect(()=>scheduler.preview(null,.9,NOW,{learningSteps:[0]})).toThrow();
 });
 it('keeps displayed intervals frozen and anchors a delayed answer without forcing tomorrow',()=>{
   const first=scheduler.preview(null,.9,NOW).good.card,p=scheduler.preview(progress(first),.9,new Date(first.due)),saved=structuredClone(p),answer=new Date(p.generatedAt+123000);
   const actual=scheduler.branch(p,'good',answer);expect(actual.card.due-answer.getTime()).toBe(p.good.card.due-p.generatedAt);expect(actual.card.lastReview).toBe(answer.getTime());expect(p).toEqual(saved);expect([p.again.log.rating,p.good.log.rating]).toEqual([1,3]);
 });
 it('undo returns the exact snapshot without manufacturing a new review',()=>{
   const p=scheduler.preview(null,.9,NOW);for(const b of [p.again,p.good])expect(scheduler.rollback(b.card,b.log,.9)).toEqual(p.cardBefore);
 });
 for(const c of [...reference.cases,...aheadReference.cases])it(`official Anki 25.9.2: ${c.name}, retention ${c.retention}`,()=>{
   const before=c.before as SerializedFsrsCard,actual=scheduler.preview(before.state===0?null:progress(before),c.retention,new Date(c.now));
   for(const key of ['again','good']as const){const expected=c.branches[key],branch=actual[key].card;
     expect(branch.state).toBe(expected.state);expect(branch.learningSteps).toBe(expected.step);
     expect(branch.stability).toBeCloseTo(expected.stability,3);expect(branch.difficulty).toBeCloseTo(expected.difficulty,3);
     if(expected.seconds!==null)expect(branch.due-c.now).toBe(expected.seconds*1000);
     // Anki cannot disable review fuzz; its Rust f32 implementation and PRNG are independent.
     // Compare the raw FSRS interval to the documented Anki review-fuzz envelope, not exact RNG output.
     if(expected.days!==null)expect(Math.abs(branch.scheduledDays-expected.days)).toBeLessThanOrEqual(Math.ceil(Math.max(branch.scheduledDays,expected.days)*.05)+3);
   }
 });
});
