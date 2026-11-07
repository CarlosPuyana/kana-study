import { TestBed } from '@angular/core/testing';
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { VOCABULARY_N5 } from '../../data/vocabulary-n5.generated';
import { VocabularyStudyUnit } from '../models/vocabulary.model';
import { VocabularyStudyProgress } from '../models/vocabulary-study.model';
import { VocabularyProgressService } from './vocabulary-progress.service';
import { VocabularySessionService } from './vocabulary-session.service';
import { VocabularyMedalService } from './vocabulary-medal.service';
import { SpacedRepetitionService } from './spaced-repetition.service';
import { WeaknessService } from './weakness.service';
import { StorageService } from './storage.service';
import { VocabularySettingsService } from './vocabulary-settings.service';
import { buildVocabularyRound } from './vocabulary-round-builder';
import { getSpainDayKey } from './daily-learning.service';

const NOW=new Date('2026-11-06T11:00:00.000Z');
const units:VocabularyStudyUnit[]=VOCABULARY_N5.filter(e=>e.enabled).slice(0,15).map(e=>({key:`vocab:${e.id}:japanese-to-meaning`,entryId:e.id,questionType:'japanese-to-meaning'}));
/** Supersedes the positional-refuerzo characterization after its explicitly authorized redesign.
 * The original observations remain in VOCABULARY_REVIEW_QUEUE_AUDIT.md. */
describe('Vocabulary daily queue audit with real FSRS',()=>{
 let progress:VocabularyProgressService,session:VocabularySessionService;
 function configure(){TestBed.configureTestingModule({providers:[{provide:VocabularyMedalService,useValue:{evaluateUnlocks:()=>[]}},{provide:WeaknessService,useValue:{recordLearn:()=>{}}}]});progress=TestBed.inject(VocabularyProgressService);vi.spyOn(progress,'activeUnits').mockReturnValue(units);session=TestBed.inject(VocabularySessionService);}
 beforeEach(()=>{TestBed.resetTestingModule();localStorage.clear();vi.stubGlobal('indexedDB',new IDBFactory());vi.stubGlobal('IDBKeyRange',IDBKeyRange);vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(NOW);configure();});
 afterEach(async()=>{await progress.flushAttempts();TestBed.resetTestingModule();vi.restoreAllMocks();vi.unstubAllGlobals();vi.useRealTimers();});
 function stored(unit:VocabularyStudyUnit,due:string,state:'learning'|'review'|'relearning'='learning'):VocabularyStudyProgress{
  return{...unit,fsrs:{due,stability:20,difficulty:5,elapsedDays:0,scheduledDays:0,learningSteps:0,reps:2,lapses:0,state,lastReview:NOW.toISOString()},firstSeenAt:NOW.toISOString(),lastSeenAt:NOW.toISOString(),totalAttempts:2,totalFirstTrySuccesses:0,totalFailures:0,lastRating:'good'};
 }
 function build(records:VocabularyStudyProgress[],at=NOW,limit=0){return buildVocabularyRound({units:limit===0?units.filter(u=>records.some(r=>r.key===u.key)):units,progress:Object.fromEntries(records.map(r=>[r.key,r])),now:at,limit:limit===0?10:limit,random:()=>0});}
 it('retains the real initial Again=1m, Hard=6m, Good=10m transitions',()=>{const engine=TestBed.inject(SpacedRepetitionService);expect(['again','hard','good'].map(rating=>Date.parse(engine.review(null,rating as 'again'|'hard'|'good',NOW).due)-NOW.getTime())).toEqual([60000,360000,600000]);});
 it('uses full timestamps and deterministic key ties across all scheduled states',()=>{
  const records=[stored(units[0],'2026-11-06T11:00:00.002Z','learning'),stored(units[1],'2026-11-06T11:00:00.001Z','review'),stored(units[2],'2026-11-06T11:00:00.000Z','relearning')];
  expect(build(records).map(u=>u.key)).toEqual([units[2].key,units[1].key,units[0].key]);
  const tied=records.map(r=>({...r,fsrs:{...r.fsrs,due:NOW.toISOString()}}));expect(build(tied).map(u=>u.key)).toEqual(tied.map(r=>r.key).sort());
 });
 it('includes every later-today step, including beyond the old minute and 20-minute boundaries',()=>{
  expect(build([stored(units[0],'2026-11-06T11:01:00Z'),stored(units[1],'2026-11-06T12:00:00Z'),stored(units[2],'2026-11-06T22:59:59.999Z')])).toHaveLength(3);
 });
 it('excludes tomorrow at the exact Madrid midnight and all later dates',()=>{expect(build([stored(units[0],'2026-11-06T23:00:00.000Z'),stored(units[1],'2026-11-07T12:00:00Z')])).toEqual([]);});
 it('caps the selected review lesson at ten, or fifteen when configured',()=>{const rows=units.map(u=>stored(u,NOW.toISOString()));expect(build(rows)).toHaveLength(10);expect(build(rows,NOW,15)).toHaveLength(15);});
 it('selects available words within the configured lesson rather than an unlimited queue',()=>{
  expect(build([],NOW,10)).toHaveLength(10);expect(build([],NOW,0)).toHaveLength(0);expect(build(units.slice(0,12).map(u=>stored(u,NOW.toISOString())),NOW,10)).toHaveLength(10);
 });
 it.each([
  ['2026-03-28T23:30:00Z','2026-03-29T21:59:59.999Z','2026-03-29T22:00:00Z'],
  ['2026-10-24T22:30:00Z','2026-10-25T22:59:59.999Z','2026-10-25T23:00:00Z'],
  ['2026-12-31T23:30:00Z','2027-01-01T22:59:59.999Z','2027-01-01T23:00:00Z']
 ])('uses Madrid calendar through DST/month/year: %s',(at,edge,next)=>{
  const now=new Date(at);expect(getSpainDayKey(now)).toBe(getSpainDayKey(new Date(edge)));
  expect(build([stored(units[0],edge),stored(units[1],next)],now).map(u=>u.key)).toEqual([units[0].key]);
 });
 it('resumes persisted Learning and its exact history without producing a synthetic review',()=>{
  progress.recordReview(units[0],'again',false,'first',NOW);const record=progress.get(units[0].key),events=progress.reviewEvents();TestBed.resetTestingModule();configure();
  expect(progress.get(units[0].key)).toEqual(record);expect(progress.reviewEvents()).toEqual(events);expect(progress.buildRound().some(u=>u.key===units[0].key)).toBe(true);session.start('self-assessment');expect(progress.reviewEvents()).toEqual(events);
 });
 it('applies current selection without deleting any disabled progress or history',()=>{
  progress.recordReview(units[0],'again',false,'first',NOW);const entry=VOCABULARY_N5.find(e=>e.id===units[0].entryId)!,settings=TestBed.inject(VocabularySettingsService);
  vi.mocked(progress.activeUnits).mockRestore();settings.save({...settings.selection(),categories:{...settings.selection().categories,[entry.studyCategory]:false}});
  expect(progress.buildRound().some(u=>u.key===units[0].key)).toBe(false);expect(progress.get(units[0].key)).not.toBeNull();expect(progress.reviewEvents()).toHaveLength(1);
 });
 it('an interrupted local review recovers on service recreation and preserves old events byte-for-byte',()=>{
  progress.recordReview(units[0],'good',true,'old',NOW);const old=progress.reviewEvents()[0];const raw=Storage.prototype.setItem;let fail=true;
  vi.spyOn(Storage.prototype,'setItem').mockImplementation(function(this:Storage,key:string,value:string){if(fail&&key==='kana-study.vocabulary-review-events.v1')throw Error('quota');return raw.call(this,key,value);});
  expect(()=>progress.recordReview(units[1],'again',false,'new',NOW,undefined,'recover-me')).toThrow();fail=false;TestBed.resetTestingModule();configure();
  expect(progress.reviewEvents()).toHaveLength(2);expect(progress.reviewEvents()[0]).toEqual(old);expect(progress.get(units[1].key)!.fsrs.reps).toBe(1);
 });
});
