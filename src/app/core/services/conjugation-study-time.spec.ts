import {ConjugationSelectionService} from './conjugation-selection.service';
import {TestBed} from '@angular/core/testing';
import {ConjugationPracticeService} from './conjugation-practice.service';
import {ConjugationStatsService,CONJUGATION_STATS_KEY,normalizeConjugationStats} from './conjugation-stats.service';
import {STUDY_MONOTONIC_NOW,STUDY_WALL_NOW} from './study-clock';
import {StorageService} from './storage.service';
import {WorkspaceService} from './workspace.service';
import {SyncOutboxService} from './sync-outbox.service';
import {VERB_CATEGORIES} from '../models/conjugation-practice.model';
import {ConjugationPracticeIntent} from '../models/conjugations.model';

describe('Conjugations use shared Anti-AFK V2',()=>{
  let now:number,wall:number,hidden:boolean;
  const enqueue=vi.fn();
  function configure(){TestBed.configureTestingModule({providers:[ConjugationPracticeService,{provide:STUDY_MONOTONIC_NOW,useValue:()=>now},{provide:STUDY_WALL_NOW,useValue:()=>wall},{provide:SyncOutboxService,useValue:{enqueue}}]});}
  function active(seconds:number){for(let left=seconds*1000;left>0;){const step=Math.min(250,left);now+=step;wall+=step;vi.advanceTimersByTime(step);left-=step;}}
  function visibility(value:boolean){hidden=!value;document.dispatchEvent(new Event('visibilitychange'));}
  function start(intent:ConjugationPracticeIntent={mode:'single',categoryIds:['adjective-negative']}){const p=TestBed.inject(ConjugationPracticeService);for(const id of intent.categoryIds)TestBed.inject(ConjugationSelectionService).setUnlocked(id,true);expect(p.start(intent)).toBe(true);p.clock.attach();return p;}
  const correct=(p:ConjugationPracticeService)=>p.answer(p.question()!.answers.kana[0]);
  beforeEach(()=>{localStorage.clear();now=wall=0;hidden=false;enqueue.mockClear();vi.useFakeTimers();vi.spyOn(document,'hidden','get').mockImplementation(()=>hidden);configure();});
  afterEach(()=>{TestBed.resetTestingModule();vi.restoreAllMocks();vi.useRealTimers();localStorage.clear();});

  it.each([10,45,179,180,181,240])('credits %s active seconds once without changing the checked response',seconds=>{
    const p=start(),question=p.question()!;active(seconds);expect(p.clock.seconds()).toBe(Math.min(seconds,180));expect(p.question()).toBe(question);expect(p.session()?.feedback).toBeNull();
    expect(correct(p)).toBe(true);expect(p.stats.get('adjective-negative')).toEqual({attempts:1,correct:1,wrong:0,bestStreak:1,durationSeconds:Math.min(seconds,180),timedAttempts:1});expect(p.clock.committedSeconds).toBe(Math.min(seconds,180));
    expect(correct(p)).toBe(false);active(300);expect(p.clock.seconds()).toBe(Math.min(seconds,180));expect(vi.getTimerCount()).toBe(0);expect(enqueue).not.toHaveBeenCalled();
  });
  it('excludes hidden time and repeated visibility changes, with one continuing allowance',()=>{
    const p=start();active(40);visibility(false);visibility(false);active(300);expect(p.clock.seconds()).toBe(40);expect(p.session()?.streak).toBe(0);visibility(true);visibility(true);active(20);correct(p);expect(p.stats.get('adjective-negative').durationSeconds).toBe(60);
    visibility(false);active(300);visibility(true);active(30);expect(p.clock.seconds()).toBe(60);p.next();p.clock.attach();active(10);p.answer('',true);expect(p.stats.get('adjective-negative')).toEqual({attempts:2,correct:1,wrong:1,bestStreak:1,durationSeconds:70,timedAttempts:2});
  });
  it('supports questions initially hidden and does not count feedback/Next waiting',()=>{
    hidden=true;const p=start();active(300);expect(p.clock.seconds()).toBe(0);visibility(true);active(45);p.answer('',true);expect(p.clock.seconds()).toBe(45);active(300);expect(p.stats.get('adjective-negative').durationSeconds).toBe(45);
    hidden=true;p.next();p.clock.attach();active(300);expect(p.clock.seconds()).toBe(45);visibility(true);active(180);correct(p);expect(p.clock.seconds()).toBe(225);
  });
  it('keeps six individual categories and mixed time in the same buckets as their attempts',()=>{
    for(const category of ['adjective-negative','adjective-past',...VERB_CATEGORIES] as const){const p=start({mode:'single',categoryIds:[category]});active(10);correct(p);expect(p.stats.get(category).durationSeconds).toBe(10);}
    const p=start({mode:'mixed',categoryIds:['adjective-negative','adjective-past',...VERB_CATEGORIES]});expect(p.session()?.questions).toHaveLength(826);active(45);correct(p);p.next();p.clock.attach();active(10);p.answer('',true);
    expect(p.stats.get('mixed')).toEqual({attempts:2,correct:1,wrong:1,bestStreak:1,durationSeconds:55,timedAttempts:2});for(const category of ['adjective-negative','adjective-past',...VERB_CATEGORIES] as const)expect(p.stats.get(category).durationSeconds).toBe(10);
  });
  it('keeps legacy family counters intact while new answers use transformation counters',()=>{
    const old={attempts:5,correct:3,wrong:2,bestStreak:2};localStorage.setItem(CONJUGATION_STATS_KEY,JSON.stringify({version:1,buckets:{'adjective-i':old}}));
    const stats=TestBed.inject(ConjugationStatsService);expect(stats.get('adjective-i')).toEqual(old);expect(stats.get('adjective-i').durationSeconds).toBeUndefined();const p=start();active(45);correct(p);expect(stats.get('adjective-i')).toEqual(old);expect(stats.get('adjective-negative').durationSeconds).toBe(45);
    TestBed.resetTestingModule();configure();expect(TestBed.inject(ConjugationStatsService).get('adjective-i')).toEqual(old);expect(TestBed.inject(ConjugationStatsService).get('adjective-negative').attempts).toBe(1);
  });
  it('distinguishes a measured zero-second answer from a legacy duration that is absent',()=>{
    const p=start();expect(p.stats.get('adjective-negative').durationSeconds).toBeUndefined();p.answer('',true);expect(p.stats.get('adjective-negative')).toEqual({attempts:1,correct:0,wrong:1,bestStreak:0,durationSeconds:0,timedAttempts:1});
  });
  it('retains valid counters when timing metadata is malformed instead of resetting progress',()=>{
    const base={attempts:5,correct:3,wrong:2,bestStreak:2};for(const time of [{durationSeconds:-1,timedAttempts:1},{durationSeconds:45},{durationSeconds:45,timedAttempts:6},{durationSeconds:181,timedAttempts:1},{durationSeconds:null,timedAttempts:1}])expect(normalizeConjugationStats({version:1,buckets:{'adjective-negative':{...base,...time}}}).buckets['adjective-negative']).toEqual(base);
  });
  it('freezes the first submission through failed-save waits and records a successful retry exactly once',()=>{
    const p=start();active(45);const spy=vi.spyOn(TestBed.inject(StorageService),'set').mockImplementation(()=>{throw Error('quota');});expect(correct(p)).toBe(false);expect(p.session()?.feedback).toBeNull();expect(p.stats.get('adjective-negative').attempts).toBe(0);active(300);visibility(false);active(300);visibility(true);active(10);expect(p.clock.seconds()).toBe(45);
    spy.mockRestore();expect(correct(p)).toBe(true);expect(correct(p)).toBe(false);expect(p.stats.get('adjective-negative').durationSeconds).toBe(45);expect(p.stats.get('adjective-negative').timedAttempts).toBe(1);expect(p.clock.committedSeconds).toBe(45);
  });
  it('never transfers confirmed or unfinished time during A→B→A, and preserves the originating workspace totals',()=>{
    const p=start(),workspace=TestBed.inject(WorkspaceService);active(10);correct(p);p.next();p.clock.attach();active(45);workspace.activateUser('a');workspace.activateUser('b');workspace.activateUser('a');expect(p.session()).toBeNull();expect(p.clock.seconds()).toBe(0);expect(p.answer('',true)).toBe(false);expect(p.stats.get('adjective-negative').durationSeconds).toBeUndefined();
    workspace.activateGuest();expect(p.session()).toBeNull();expect(p.clock.seconds()).toBe(0);expect(p.stats.get('adjective-negative').durationSeconds).toBe(10);start();active(10);correct(p);expect(p.stats.get('adjective-negative').durationSeconds).toBe(20);expect(enqueue).not.toHaveBeenCalled();
  });
  it('drops unsubmitted time on destruction/reload, with no listeners or timers left running',()=>{
    const p=start();active(45);const clock=p.clock;TestBed.resetTestingModule();expect(vi.getTimerCount()).toBe(0);active(300);document.dispatchEvent(new Event('visibilitychange'));expect(clock.seconds()).toBe(45);configure();const reloaded=start();expect(reloaded.clock.seconds()).toBe(0);expect(reloaded.stats.get('adjective-negative').durationSeconds).toBeUndefined();
  });
  it('freezes completion and resets only session time when explicitly restarting',()=>{
    const p=start({mode:'single',categoryIds:['adjective-past']});for(let i=0;i<25;i++){p.clock.attach();active(1);p.answer('',true);p.next();}expect(p.session()?.complete).toBe(true);expect(p.clock.seconds()).toBe(25);active(300);expect(p.clock.seconds()).toBe(25);expect(vi.getTimerCount()).toBe(0);start({mode:'single',categoryIds:['adjective-past']});expect(p.clock.seconds()).toBe(0);expect(p.stats.get('adjective-past').durationSeconds).toBe(25);
  });
});
