import {AttemptEvent} from '../models/attempt-event.model';
import {historicalAccumulator,madridDay,madridMidnight,objectiveAccuracy} from './attempt-analytics';
function e(at:string,correct=true):AttemptEvent{return {version:1,id:crypto.randomUUID(),occurredAt:at,module:'kana',activity:'learn',itemId:'a',result:{source:'objective',correct}};}
const now=new Date('2026-10-09T12:00:00.000Z');
describe('Stats V2 pure historical analytics',()=>{
  it('keeps absent data distinct from zero objective accuracy and separates self results',()=>{
    const a=historicalAccumulator(7,now);a.accept({...e('2026-10-08T12:00:00.000Z'),result:{source:'self',rating:'hard'}});
    a.accept({...e('2026-10-08T12:00:00.000Z'),result:{source:'self',rating:'again'}});a.accept({...e('2026-10-08T12:00:00.000Z'),result:{source:'self',rating:'good'}});
    a.accept(e('2026-10-07T12:00:00.000Z',false));const r=a.finish();expect(objectiveAccuracy(r.days.find(d=>d.day==='2026-10-08')!)).toBeNull();expect(objectiveAccuracy(r.days.find(d=>d.day==='2026-10-07')!)).toBe(0);
    expect(r.total).toMatchObject({attempts:4,objective:1,correct:0,hard:1,again:1,good:1});expect(r.comparison.delta).toBeNull();expect(r.recommendation).toBe('insufficient');
  });
  it('uses Madrid day boundaries and real 23/25-hour DST days',()=>{
    expect(madridDay(new Date('2026-10-08T22:30:00Z'))).toBe('2026-10-09');expect(madridDay(new Date('2026-01-08T22:30:00Z'))).toBe('2026-01-08');
    expect(Date.parse(madridMidnight('2026-03-30'))-Date.parse(madridMidnight('2026-03-29'))).toBe(23*3600000);
    expect(Date.parse(madridMidnight('2026-10-26'))-Date.parse(madridMidnight('2026-10-25'))).toBe(25*3600000);
    expect(madridDay(new Date('2026-10-25T00:30:00Z'))).toBe(madridDay(new Date('2026-10-25T01:30:00Z')));
  });
  for(const count of [7,30,90] as const)it(`fills ${count} daily buckets and excludes future/outside-range events`,()=>{
    const a=historicalAccumulator(count,now);a.accept(e('2027-01-01T00:00:00.000Z'));a.accept(e('2025-01-01T00:00:00.000Z'));const r=a.finish();expect(r.days).toHaveLength(count);expect(r.total.attempts).toBe(0);expect(r.days.every(d=>objectiveAccuracy(d)===null)).toBe(true);
  });
  it('requires ten objective answers per complete comparison period, excluding today',()=>{
    const a=historicalAccumulator(7,now);for(let n=0;n<9;n++){a.accept(e('2026-09-30T12:00:00.000Z',false));a.accept(e('2026-10-06T12:00:00.000Z'));}
    for(let n=0;n<50;n++)a.accept(e('2026-10-09T11:00:00.000Z'));expect(a.finish().comparison.delta).toBeNull();
    a.accept(e('2026-09-30T12:00:00.000Z',false));a.accept(e('2026-10-06T12:00:00.000Z'));const r=a.finish();expect(r.comparison).toMatchObject({delta:100,trend:'improving'});expect(r.moduleComparisons[0].delta).toBe(100);expect(r.recommendation).toBe('improving');
  });
  it('aggregates modules, skills, objective failures, self difficulty and repetitions with weighted samples',()=>{
    const a=historicalAccumulator(7,now);a.accept({...e('2026-10-08T12:00:00.000Z',false),module:'vocabulary',activity:'listening',firstAttempt:false});
    a.accept({...e('2026-10-08T12:00:00.000Z'),module:'kanji',activity:'writing',result:{source:'self',rating:'again'}});
    const r=a.finish();expect(r.total.repetitions).toBe(1);expect(r.modules.find(m=>m.module==='vocabulary')!.metrics.objective).toBe(1);expect(r.skills.find(s=>s.activity==='writing')!.metrics.again).toBe(1);expect(r.weeks[0].metrics.attempts).toBe(2);expect(objectiveAccuracy(r.total)).toBe(0);
  });
  it('recognizes recurring/declining difficulty only with sufficient objective samples',()=>{
    for(const decline of [false,true]){const a=historicalAccumulator(7,now);for(let n=0;n<10;n++){a.accept(e('2026-09-30T12:00:00.000Z',decline));a.accept(e('2026-10-06T12:00:00.000Z',false));}expect(a.finish().recommendation).toBe(decline?'declining':'recurring');}
  });
  it.each([
    [7,'2026-03-30T10:00:00.000Z','2026-03-24','2026-03-23T23:00:00.000Z'],
    [30,'2026-03-30T10:00:00.000Z','2026-03-01','2026-02-28T23:00:00.000Z'],
    [90,'2026-03-30T10:00:00.000Z','2025-12-31','2025-12-30T23:00:00.000Z'],
    [7,'2026-10-26T11:00:00.000Z','2026-10-20','2026-10-19T22:00:00.000Z'],
    [30,'2026-10-26T11:00:00.000Z','2026-09-27','2026-09-26T22:00:00.000Z'],
    [90,'2026-10-26T11:00:00.000Z','2026-07-29','2026-07-28T22:00:00.000Z'],
  ] as const)('uses %i calendar days through DST at %s, including the exact first midnight', (count,instant,firstDay,start)=>{
    const accumulator=historicalAccumulator(count,new Date(instant));
    accumulator.accept(e(new Date(Date.parse(start)-1).toISOString()));
    accumulator.accept(e(start));accumulator.accept(e(instant));
    accumulator.accept(e(new Date(Date.parse(instant)+1).toISOString()));
    const result=accumulator.finish();
    expect(result.days).toHaveLength(count);expect(result.days[0].day).toBe(firstDay);
    expect(result.total.attempts).toBe(2);expect(result.days[0].attempts).toBe(1);
    expect(result.days.at(-1)?.attempts).toBe(1);
    expect(result.comparison.current.attempts+result.comparison.previous.attempts).toBe(2);
  });
  it.each([
    ['2026-03-29','2026-03-29T00:30:00.000Z','2026-03-29T01:30:00.000Z','2026-03-30T10:00:00.000Z'],
    ['2026-10-25','2026-10-25T00:30:00.000Z','2026-10-25T01:30:00.000Z','2026-10-26T11:00:00.000Z'],
  ])('counts both UTC events on the same Madrid DST day %s without duplicates',(day,first,second,instant)=>{
    const accumulator=historicalAccumulator(7,new Date(instant));accumulator.accept(e(first));accumulator.accept(e(second));
    const result=accumulator.finish();expect(result.total.attempts).toBe(2);
    expect(result.days.find(d=>d.day===day)?.attempts).toBe(2);expect(result.comparison.current.attempts).toBe(2);
  });

});
