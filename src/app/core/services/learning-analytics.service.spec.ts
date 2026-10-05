import {signal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {WeaknessRecord} from '../models/weakness.model';
import {CompletedSessionSummary} from '../models/learning-session.model';
import {calculateLearningAnalytics, LearningAnalyticsService} from './learning-analytics.service';
import {WeaknessService} from './weakness.service';
import {SessionHistoryService} from './session-history.service';
import {StorageService} from './storage.service';

const now=new Date('2026-10-26T12:00:00Z');
function record(patch:Partial<WeaknessRecord>={}):WeaknessRecord {
  return {module:'vocabulary',activity:'learn',itemId:'word',questionType:'japanese-to-meaning',attempts:5,failures:1,score:3,consecutiveCorrect:0,lastAttemptAt:now.toISOString(),...patch};
}
function session(date='2026-10-26T09:00:00Z',patch:Partial<CompletedSessionSummary>={}):CompletedSessionSummary {
  return {module:'kana',sessionId:date,completedAt:date,mode:'quick-practice',exercisesCompleted:10,firstTrySuccesses:7,attempts:14,needsPracticeCount:3,durationSeconds:120,...patch};
}
const calculate=(records:readonly WeaknessRecord[]=[],sessions:readonly CompletedSessionSummary[]=[])=>calculateLearningAnalytics(records,sessions,now);
describe('LearningAnalyticsService projections',()=>{
  it('weights accuracy by attempts rather than averaging item percentages',()=>{
    const stats=calculate([record({attempts:1,failures:1}),record({itemId:'other',attempts:99,failures:0})]);
    expect(stats.modules[1]).toEqual(expect.objectContaining({attempts:100,successes:99,failures:1,accuracy:99}));
  });
  it('aggregates each module without merging its identity into other modules',()=>{
    const stats=calculate([record({module:'kana',attempts:4,failures:2}),record({attempts:6,failures:1}),record({module:'kanji',attempts:8,failures:0})]);
    expect(stats.modules.map(m=>[m.module,m.attempts,m.failures])).toEqual([['kana',4,2],['vocabulary',6,1],['kanji',8,0]]);
  });
  it('keeps Learn, Writing and Listening separate while weighting across modules',()=>{
    const stats=calculate([record({activity:'writing',attempts:1,failures:1}),record({module:'kanji',activity:'writing',attempts:9,failures:0}),record({activity:'listening',attempts:10,failures:4}),record({attempts:5,failures:1})]);
    expect(stats.skills.map(s=>[s.activity,s.attempts,s.accuracy])).toEqual([['learn',5,80],['writing',10,90],['listening',10,60]]);
    expect(stats.modules[0].accuracy).toBeNull();
  });
  it('aggregates Learn directions by complete module/question identity across items',()=>{
    const stats=calculate([record({attempts:4,failures:2}),record({itemId:'second',attempts:6,failures:1}),record({questionType:'meaning-to-japanese',attempts:3,failures:2}),record({activity:'writing',attempts:100,failures:0})]);
    expect(stats.difficult.map(d=>[d.questionType,d.attempts,d.failures])).toEqual([['meaning-to-japanese',3,2],['japanese-to-meaning',10,3]]);
  });
  it('requires three attempts per aggregated direction',()=>{
    const stats=calculate([record({attempts:2,failures:2}),record({questionType:'meaning-to-japanese',attempts:3,failures:2})]);
    expect(stats.difficult.map(d=>d.questionType)).toEqual(['meaning-to-japanese']);expect(stats.strengths).toEqual([]);
  });
  it('ranks difficulty by accuracy, then failures, then attempts',()=>{
    const stats=calculate([
      record({questionType:'japanese-to-reading',attempts:4,failures:2}),
      record({questionType:'reading-to-japanese',attempts:8,failures:4}),
      record({questionType:'meaning-to-japanese',attempts:4,failures:3}),
      record({questionType:'japanese-to-meaning',attempts:4,failures:0}),
      record({module:'kana',questionType:'kana-to-romaji',attempts:10,failures:0}),
    ]);
    expect(stats.difficult.map(d=>d.questionType)).toEqual(['meaning-to-japanese','reading-to-japanese','japanese-to-reading','kana-to-romaji','japanese-to-meaning']);
  });
  it('requires five attempts and 80% accuracy for strengths, with at most three',()=>{
    const stats=calculate([
      record({attempts:5,failures:1}),record({questionType:'meaning-to-japanese',attempts:4,failures:0}),
      record({questionType:'japanese-to-reading',attempts:5,failures:0}),record({questionType:'reading-to-japanese',attempts:10,failures:0}),
      record({module:'kana',questionType:'kana-to-romaji',attempts:20,failures:0}),record({module:'kanji',questionType:'kanji-to-meaning',attempts:10,failures:3}),
    ]);
    expect(stats.strengths).toHaveLength(3);
    expect(stats.strengths.every(d=>d.attempts>=5&&d.accuracy!>=80)).toBe(true);
    expect(stats.strengths.map(d=>d.questionType)).toEqual(['japanese-to-reading','reading-to-japanese','kana-to-romaji']);
  });
  it('never uses weakness score as accuracy and counts each weak skill separately',()=>{
    const stats=calculate([record({score:10}),record({activity:'listening',score:0}),record({module:'kanji',activity:'writing',score:3})]);
    expect(stats.modules[1].accuracy).toBe(80);expect(stats.summary.weakCount).toBe(2);
    expect(stats.skills.map(s=>s.weakCount)).toEqual([1,1,0]);expect(stats.modules.map(m=>m.weakCount)).toEqual([0,1,1]);
  });
  it('returns null percentages and a useful recommendation for a new user',()=>{
    const stats=calculate();expect(stats.modules.every(m=>m.accuracy===null)).toBe(true);expect(stats.skills.every(s=>s.accuracy===null)).toBe(true);
    expect(stats.summary).toEqual({sessions:0,seconds:0,streak:0,weakCount:0});
    expect(stats.recent.every(r=>r.firstTryAccuracy===null)).toBe(true);expect(stats.recommendations).toEqual([{key:'stats.recommendMore'}]);
  });
  it('counts legacy Learn without questionType but does not invent a direction',()=>{
    const stats=calculate([record({questionType:undefined}),record({questionType:'obsolete-type'})]);
    expect(stats.modules[1].attempts).toBe(10);expect(stats.skills[0].attempts).toBe(10);expect(stats.difficult).toEqual([]);
  });
  it('makes skill recommendations only from sufficient comparable evidence',()=>{
    const input=[record({activity:'listening',attempts:10,failures:8}),record({activity:'writing',attempts:10,failures:2})];
    expect(calculate(input).recommendations).toEqual([{key:'stats.recommendSkill',activity:'listening'}]);
    expect(calculate(input).recommendations).toEqual(calculate(input).recommendations);
    expect(calculate([record({activity:'listening',attempts:2,failures:2}),input[1]]).recommendations).toEqual([{key:'stats.recommendMore'}]);
  });
  it('compares production and recognition only when both have sufficient attempts',()=>{
    const input=[record({questionType:'meaning-to-japanese',attempts:5,failures:4}),record({attempts:5,failures:1})];
    expect(calculate(input).recommendations).toContainEqual({key:'stats.recommendProduction'});
    expect(calculate([input[0],record({attempts:2,failures:0})]).recommendations[0].key).toBe('stats.recommendDirection');
  });
  it('limits recommendations to two and does not claim weakness when all evidence is strong',()=>{
    expect(calculate([record({attempts:5,failures:0})]).recommendations).toEqual([{key:'stats.recommendMaintain'}]);
    expect(calculate([record({activity:'listening',attempts:5,failures:4}),record({activity:'writing',attempts:5,failures:0}),record({attempts:5,failures:3})]).recommendations).toHaveLength(2);
  });
  it('uses Madrid calendar days including today across the autumn DST change',()=>{
    const stats=calculate([], [session('2026-10-19T22:00:00Z'), // Oct 20 midnight: included in 7 days
      session('2026-10-19T21:59:59Z'), // Oct 19: excluded from 7
      session('2026-09-26T22:00:00Z'), // Sep 27: included in 30
      session('2026-09-26T21:59:59Z'), // Sep 26: excluded from 30
      session('2026-10-26T12:00:01Z')]); // Future: excluded everywhere
    expect(stats.recent.map(r=>r.sessions)).toEqual([1,3]);expect(stats.summary.sessions).toBe(4);
    expect(stats.recent[0]).toEqual(expect.objectContaining({exercises:10,seconds:120,firstTryAccuracy:70}));
  });
  it('weights first-try success by initial exercises, never by attempts',()=>{
    const stats=calculate([], [session(undefined,{exercisesCompleted:1,firstTrySuccesses:0,attempts:4}),session('2026-10-25T10:00:00Z',{exercisesCompleted:9,firstTrySuccesses:9,attempts:20})]);
    expect(stats.recent[0].firstTryAccuracy).toBe(90);expect(stats.recent[0].exercises).toBe(10);
  });
  it('does not interpret missing legacy time or first-try values as mistakes',()=>{
    const old=session(undefined,{durationSeconds:undefined,firstTrySuccesses:undefined} as unknown as Partial<CompletedSessionSummary>);
    const stats=calculate([], [old]);expect(stats.recent[0].firstTryAccuracy).toBeNull();expect(stats.summary.seconds).toBe(0);
    const mixed=calculate([], [old,session('2026-10-25T10:00:00Z')]);expect(mixed.recent[0].firstTryAccuracy).toBe(70);
  });
  it('derives a registered-session streak with a grace day and breaks older gaps',()=>{
    const days=[session(),session('2026-10-25T10:00:00Z'),session('2026-10-24T10:00:00Z')];
    expect(calculate([],days).summary.streak).toBe(3);expect(calculate([],days.slice(1)).summary.streak).toBe(2);
    expect(calculate([],days.slice(2)).summary.streak).toBe(0);
  });
  it('tolerates invalid legacy entries, deduplicates session IDs and sums only known durations',()=>{
    const stats=calculate([record({attempts:0}),record({failures:99})],[session(),session(),session('bad'),session('2026-10-25T10:00:00Z',{durationSeconds:-10}),session('2026-10-24T10:00:00Z',{exercisesCompleted:0})]);
    expect(stats.summary.sessions).toBe(2);expect(stats.summary.seconds).toBe(120);expect(stats.modules[1].accuracy).toBeNull();
  });
  it('reacts to existing source signals and refreshes date windows without creating storage',()=>{
    const records=signal<readonly WeaknessRecord[]>([]),sessions=signal<readonly CompletedSessionSummary[]>([]);
    TestBed.configureTestingModule({providers:[{provide:WeaknessService,useValue:{records}},{provide:SessionHistoryService,useValue:{sessions}}]});
    const s=TestBed.inject(LearningAnalyticsService);s.refresh(now);expect(s.stats().modules[1].accuracy).toBeNull();
    records.set([record()]);sessions.set([session()]);expect(s.stats().modules[1].accuracy).toBe(80);expect(s.stats().recent[0].sessions).toBe(1);
    s.refresh(new Date('2026-11-20T12:00:00Z'));expect(s.stats().recent[0].sessions).toBe(0);
  });
  for(const stored of [null,{},[null,{},session(undefined,{module:undefined})]]){
    it(`loads partially empty session storage safely: ${JSON.stringify(stored)}`,()=>{
      const set=vi.fn();TestBed.configureTestingModule({providers:[{provide:StorageService,useValue:{get:()=>stored,set}}]});
      const history=TestBed.inject(SessionHistoryService);
      expect(()=>calculate([],history.sessions())).not.toThrow();expect(set).not.toHaveBeenCalled();
    });
  }
});
