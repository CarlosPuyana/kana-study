import {Component,DestroyRef,inject} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {KanjiAvailabilityService} from './kanji-availability.service';
import {KanjiProgressService} from './kanji-progress.service';
import {KanjiSettingsService} from './kanji-settings.service';
import {SessionHistoryService} from './session-history.service';
import {DailyLearningService,getSpainDayKey} from './daily-learning.service';
import {WorkspaceService} from './workspace.service';
import {SyncOutboxService} from './sync-outbox.service';
import {KANJI_N5} from '../../data/kanji-n5.generated';

@Component({template:''})
class AvailabilityProbe {readonly availability=inject(KanjiAvailabilityService);constructor(){this.availability.watch(inject(DestroyRef));}}

describe('Kanji K1 deadline availability',()=>{
  const BASE='2026-11-09T12:00:00.000Z';
  function seed(first=Date.now()+120000,owner='guest'){
    const progress=Object.fromEntries(KANJI_N5.map((k,i)=>{const key='kanji:'+k.id+':kanji-to-meaning',due=new Date(i?Date.now()+3*86400000:first).toISOString(),at=new Date(Date.now()-1000).toISOString();return [key,{key,kanjiId:k.id,questionType:'kanji-to-meaning',fsrs:{due,stability:1,difficulty:5,elapsedDays:0,scheduledDays:0,learningSteps:0,reps:1,lapses:0,state:'learning',lastReview:at},firstSeenAt:at,lastSeenAt:at,totalAttempts:1,totalFirstTrySuccesses:1,totalFailures:0,lastRating:'good'}];}));
    const key=owner==='guest'?'kana-study.kanji-progress.v1':'kana-study.workspace.'+owner+'.kana-study.kanji-progress.v1';localStorage.setItem(key,JSON.stringify(progress));
  }
  function probe(){const f=TestBed.createComponent(AvailabilityProbe);f.detectChanges();TestBed.tick();return f;}
  function finishToday(){TestBed.inject(SessionHistoryService).record({module:'kanji',sessionId:'k1-completed',completedAt:new Date().toISOString(),mode:'self-assessment',exercisesCompleted:10,firstTrySuccesses:9,attempts:11,needsPracticeCount:1,durationSeconds:30});}
  beforeEach(()=>{localStorage.clear();vi.useFakeTimers();vi.setSystemTime(new Date(BASE));TestBed.configureTestingModule({providers:[{provide:SyncOutboxService,useValue:{enqueue:vi.fn(async()=>{})}}]});});
  afterEach(()=>{TestBed.resetTestingModule();vi.restoreAllMocks();vi.useRealTimers();localStorage.clear();});

  it('updates the panel and builder before, at, and after a two-minute deadline without writes',()=>{
    seed();const f=probe(),clock=f.componentInstance.availability,p=TestBed.inject(KanjiProgressService),writes=vi.spyOn(Storage.prototype,'setItem');
    expect(clock.state()).toMatchObject({due:0,fresh:0,status:'waiting',canStart:false});expect(p.roundSummary().roundSize).toBe(0);
    vi.advanceTimersByTime(119999);expect(clock.state().due).toBe(0);expect(p.stats().dueCount).toBe(0);
    vi.advanceTimersByTime(1);expect(clock.state()).toMatchObject({due:1,status:'due',canStart:true});expect(p.stats().dueCount).toBe(1);expect(p.roundSummary()).toMatchObject({roundSize:1,roundDue:1,roundNew:0});expect(p.buildRound()).toHaveLength(1);
    vi.advanceTimersByTime(1000);expect(clock.state().due).toBe(1);expect(writes).not.toHaveBeenCalled();f.destroy();
  });
  it('schedules successive deadlines and counts new units separately from overdue reviews',()=>{
    seed();const raw=JSON.parse(localStorage.getItem('kana-study.kanji-progress.v1')!);delete raw['kanji:七:kanji-to-meaning'];raw['kanji:万:kanji-to-meaning'].fsrs.due=new Date(Date.now()+180000).toISOString();localStorage.setItem('kana-study.kanji-progress.v1',JSON.stringify(raw));
    const f=probe(),s=f.componentInstance.availability;expect(s.state()).toMatchObject({due:0,fresh:1,status:'fresh',canStart:true});
    vi.advanceTimersByTime(120000);expect(s.state()).toMatchObject({due:1,fresh:1,status:'due'});expect(TestBed.inject(KanjiProgressService).roundSummary().roundSize).toBe(2);
    vi.advanceTimersByTime(60000);expect(s.state()).toMatchObject({due:2,fresh:1});f.destroy();
  });
  it('keeps actual overdue counts after daily completion while blocking another normal round',()=>{
    seed(Date.now()-1);const f=probe(),s=f.componentInstance.availability;expect(s.state().canStart).toBe(true);finishToday();
    expect(s.state()).toMatchObject({due:1,blocked:true,status:'completedDue',canStart:false});expect(TestBed.inject(KanjiProgressService).buildRound()).toHaveLength(1);f.destroy();
  });
  it('distinguishes daily completion without overdue cards from future review availability',()=>{
    seed();const f=probe(),s=f.componentInstance.availability;finishToday();expect(s.state()).toMatchObject({due:0,status:'completed',canStart:false});
    vi.advanceTimersByTime(120000);expect(s.state()).toMatchObject({due:1,status:'completedDue',canStart:false});f.destroy();
  });
  it('unlocks exactly at Madrid midnight, not UTC midnight',()=>{
    vi.setSystemTime(new Date('2026-11-09T22:59:59.999Z'));seed(Date.now()-1);const f=probe(),s=f.componentInstance.availability;finishToday();expect(s.state().blocked).toBe(true);
    vi.advanceTimersByTime(1);expect(getSpainDayKey(new Date())).toBe('2026-11-10');expect(s.state()).toMatchObject({blocked:false,canStart:true,due:1});f.destroy();
  });
  it.each([['2026-03-28T23:00:00.000Z',23],['2026-10-24T22:00:00.000Z',25]])('uses a %s Madrid day lasting %s hours across DST', (start,hours)=>{
    vi.setSystemTime(new Date(start));seed(Date.now()-1);const f=probe(),s=f.componentInstance.availability;finishToday();const day=getSpainDayKey(new Date());
    vi.advanceTimersByTime(Number(hours)*3600000-1);expect(getSpainDayKey(new Date())).toBe(day);expect(s.state().blocked).toBe(true);
    vi.advanceTimersByTime(1);expect(getSpainDayKey(new Date())).not.toBe(day);expect(s.state().canStart).toBe(true);f.destroy();
  });
  it('pauses its deadline while hidden and recomputes due/day on visibility return',()=>{
    vi.setSystemTime(new Date('2026-11-09T22:59:00.000Z'));seed();let hidden=false;vi.spyOn(document,'hidden','get').mockImplementation(()=>hidden);
    const f=probe(),s=f.componentInstance.availability;finishToday();hidden=true;document.dispatchEvent(new Event('visibilitychange'));vi.advanceTimersByTime(180000);
    hidden=false;document.dispatchEvent(new Event('visibilitychange'));expect(s.state()).toMatchObject({due:1,blocked:false,canStart:true});f.destroy();
  });
  it('starts hidden without a deadline timer and refreshes on focus/pageshow',()=>{
    seed();let hidden=true;vi.spyOn(document,'hidden','get').mockImplementation(()=>hidden);const f=probe(),s=f.componentInstance.availability;
    vi.advanceTimersByTime(120000);hidden=false;window.dispatchEvent(new Event('focus'));expect(s.state().due).toBe(1);
    window.dispatchEvent(new Event('pagehide'));vi.setSystemTime(new Date(Date.now()+3*86400000));window.dispatchEvent(new Event('pageshow'));expect(s.state().due).toBe(80);f.destroy();
  });
  it('recomputes A→B→A using current selection, progress and the matching daily history',()=>{
    seed(Date.now()+120000,'a');seed(Date.now()-1,'b');const w=TestBed.inject(WorkspaceService);w.activateUser('a');const f=probe(),s=f.componentInstance.availability;
    expect(s.state().due).toBe(0);w.activateUser('b');TestBed.tick();expect(s.state().due).toBe(1);finishToday();expect(s.state().blocked).toBe(true);
    w.activateUser('a');TestBed.tick();expect(s.state()).toMatchObject({due:0,blocked:false});vi.advanceTimersByTime(120000);expect(s.state().canStart).toBe(true);f.destroy();
  });
  it('cleans the feature timer and listeners on destruction and does not duplicate timers with two views',()=>{
    seed();const p=TestBed.inject(KanjiProgressService);TestBed.inject(DailyLearningService);const base=vi.getTimerCount(),f=probe(),one=vi.getTimerCount(),g=probe();
    expect(one).toBe(base+1);expect(vi.getTimerCount()).toBe(one);f.destroy();expect(vi.getTimerCount()).toBe(one);g.destroy();expect(vi.getTimerCount()).toBe(base);expect(p.availabilityTime()).toBeNull();
    const timeout=vi.spyOn(globalThis,'setTimeout');window.dispatchEvent(new Event('focus'));document.dispatchEvent(new Event('visibilitychange'));expect(timeout).not.toHaveBeenCalled();
  });
  it('handles no selected cards and initial fresh content without inventing due dates',()=>{
    const f=probe(),s=f.componentInstance.availability;expect(s.state()).toMatchObject({due:0,fresh:80,status:'fresh',canStart:true,nextDue:null});
    TestBed.inject(KanjiSettingsService).setLevel(false);TestBed.tick();expect(s.state()).toMatchObject({total:0,status:'empty',canStart:false,nextDue:null});f.destroy();
  });
});
