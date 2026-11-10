import {kanjiCatalogOverview,kanjiHistoryAccumulator,kanjiSessionActivity} from './kanji-statistics';
import {KanjiReviewEvent} from '../models/kanji-study.model';
import {CompletedSessionSummary} from '../models/learning-session.model';
import {objectiveAccuracy} from './attempt-analytics';

import {NOW,k4Progress,k4Review,k4Attempt} from './kanji-statistics.test-support';

const session=(id:string,seconds:number|undefined=4):CompletedSessionSummary=>({module:'kanji',sessionId:id,completedAt:NOW.toISOString(),mode:'self-assessment',exercisesCompleted:1,firstTrySuccesses:1,attempts:1,needsPracticeCount:0,durationSeconds:seconds!});

describe('Kanji K4 read-only projections',()=>{
  it('counts 80 unique kanji and 80 units in each direction when empty',()=>{
    const r=kanjiCatalogOverview({});expect(r).toMatchObject({total:80,new:80,learning:0,review:0});
    expect(r.directions.map(d=>d.new)).toEqual([80,80]);
  });
  it('requires both independent directions in review and groups relearning with learning',()=>{
    const a=k4Progress(),b=k4Progress('食','meaning-to-kanji'),map={[a.key]:a};
    expect(kanjiCatalogOverview(map)).toMatchObject({new:79,learning:1,review:0});
    expect(kanjiCatalogOverview({...map,[b.key]:b})).toMatchObject({new:79,learning:0,review:1});
    expect(kanjiCatalogOverview({...map,[b.key]:{...b,fsrs:{...b.fsrs,state:'relearning'}}})).toMatchObject({learning:1,review:0});
  });
  it('does not turn persisted FSRS new cards or unknown characters into learned kanji',()=>{
    const p=k4Progress(),foreign=k4Progress('偽');
    expect(kanjiCatalogOverview({[p.key]:{...p,fsrs:{...p.fsrs,state:'new'}},[foreign.key]:foreign}).new).toBe(80);
  });
  it('keeps missing recorded time unknown, deduplicates sessions, and excludes other modules and future data',()=>{
    const missing={...session('unknown'),durationSeconds:undefined} as unknown as CompletedSessionSummary;
    const rows=[session('a'),session('a'),missing,{...session('v'),module:'vocabulary' as const},{...session('future'),completedAt:'2027-01-01T00:00:00Z'}];
    const before=JSON.stringify(rows),r=kanjiSessionActivity(rows,30,NOW);
    expect(r).toMatchObject({sessions:2,today:2,measured:1,seconds:4});
    expect(r.recent.find(s=>s.sessionId==='unknown')!.seconds).toBeNull();expect(JSON.stringify(rows)).toBe(before);
    expect(kanjiSessionActivity([missing],30,NOW).seconds).toBeNull();
    expect(kanjiSessionActivity([session('zero',0)],30,NOW).seconds).toBe(0);
  });
  it('uses Madrid dates and applies the selected period to activity',()=>{
    const s={...session('midnight'),completedAt:'2026-11-09T23:00:00.000Z'};
    expect(kanjiSessionActivity([s],7,NOW).today).toBe(1);
    expect(kanjiSessionActivity([{...s,completedAt:'2026-10-31T12:00:00Z'}],7,NOW).sessions).toBe(0);
  });
  it('does not manufacture accuracy from legacy ratings or from self-assessment',()=>{
    const events=[k4Review(1,'good'),k4Review(2,'hard')],a=kanjiHistoryAccumulator(events,30,NOW);
    a.accept({...k4Attempt(events[1]),result:{source:'self',rating:'hard'}});
    const r=a.finish();expect(r.total).toEqual({reviews:2,again:0,hard:1,good:1});
    expect(r.unclassified).toBe(1);expect(objectiveAccuracy(r.measured)).toBeNull();
  });
  it('separates objective errors, self ratings, directions and detailed coverage',()=>{
    const events=[k4Review(1,'good'),k4Review(2,'again'),k4Review(3,'hard','食','meaning-to-kanji')];
    const a=kanjiHistoryAccumulator(events,7,NOW);
    a.accept(k4Attempt(events[0]));a.accept(k4Attempt(events[1]));a.accept({...k4Attempt(events[2]),result:{source:'self',rating:'hard'}});
    const r=a.finish();expect(objectiveAccuracy(r.measured)).toBe(50);expect(r.measured).toMatchObject({objective:2,correct:1,hard:1});
    expect(r.directions.map(d=>d.reviews)).toEqual([2,1]);expect(r.unclassified).toBe(0);
    expect(r.directions.map(d=>objectiveAccuracy(d.measured))).toEqual([50,null]);
    expect(r.ratingsByDay.at(-1)).toMatchObject({reviews:3,again:1,hard:1,good:1});
  });
  it('excludes reinforcement, voluntary practice, writing, other modules and contradictory attempts',()=>{
    const e=k4Review(),a=kanjiHistoryAccumulator([e],30,NOW),valid=k4Attempt(e);
    for(const attempt of [{...valid,firstAttempt:false},{...valid,firstAttempt:undefined},{...valid,sessionId:'practice'},
      {...valid,activity:'writing' as const},{...valid,module:'vocabulary' as const},
      {...valid,result:{source:'objective' as const,correct:true}}])a.accept(attempt);
    expect(a.finish().measured.attempts).toBe(0);
    a.accept(valid);a.accept(valid);expect(a.finish().measured.attempts).toBe(1);
  });
  it('deduplicates event IDs, rejects future and foreign units, and respects period edges',()=>{
    const e=k4Review(),old={...k4Review(1),reviewedAt:'2026-10-31T00:00:00Z'};
    const events=[e,e,old,{...k4Review(2),reviewedAt:'2027-01-01T00:00:00Z'},k4Review(3,'again','偽')];
    expect(kanjiHistoryAccumulator(events,7,NOW).finish().total.reviews).toBe(1);
    expect(kanjiHistoryAccumulator(events,30,NOW).finish().total.reviews).toBe(2);
  });
  it('ranks only kanji with at least three reviews and displays the underlying counts',()=>{
    const events=[...Array.from({length:3},(_,i)=>k4Review(i,'again')),...Array.from({length:4},(_,i)=>k4Review(i+10,i===0?'hard':'good','日')),k4Review(30,'again','山')];
    const r=kanjiHistoryAccumulator(events,30,NOW).finish();
    expect(r.difficult.map(d=>d.kanji.id)).toEqual(['食','日']);expect(r.difficult[0]).toMatchObject({reviews:3,again:3,hard:0});
  });
  it('reduces extensive history without retaining attempt rows or changing its sources',()=>{
    const events=Array.from({length:12000},(_,n)=>k4Review(n,n%2?'good':'again'));
    const before=JSON.stringify(events),a=kanjiHistoryAccumulator(events,90,NOW);
    for(const e of events)a.accept(k4Attempt(e));const r=a.finish();
    expect(r.days).toHaveLength(90);expect(r.total.reviews).toBe(12000);expect(r.measured.objective).toBe(12000);
    expect(objectiveAccuracy(r.measured)).toBe(50);expect(r.difficult).toHaveLength(1);expect(JSON.stringify(events)).toBe(before);
  });
});
