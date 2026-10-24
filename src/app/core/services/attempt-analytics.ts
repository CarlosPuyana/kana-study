import {AttemptEvent,AttemptModule,AttemptActivity,ATTEMPT_MODULES,ATTEMPT_ACTIVITIES} from '../models/attempt-event.model';
export const TREND_MIN_ATTEMPTS=10;
export interface AttemptMetrics {attempts:number;objective:number;correct:number;again:number;hard:number;good:number;repetitions:number;}
export interface DailyAttempts extends AttemptMetrics {day:string;}
export interface AttemptHistory {days:DailyAttempts[];total:AttemptMetrics;modules:{module:AttemptModule;metrics:AttemptMetrics}[];skills:{activity:AttemptActivity;metrics:AttemptMetrics}[];weeks:{day:string;metrics:AttemptMetrics}[];
  comparison:{current:AttemptMetrics;previous:AttemptMetrics;delta:number|null;trend:'improving'|'declining'|'stable'|'insufficient'};
  moduleComparisons:{module:AttemptModule;delta:number|null}[];skillComparisons:{activity:AttemptActivity;delta:number|null}[];
  recommendation:'insufficient'|'improving'|'declining'|'recurring'|'maintain';weakSkill:AttemptActivity|null;}
export function emptyMetrics():AttemptMetrics{return {attempts:0,objective:0,correct:0,again:0,hard:0,good:0,repetitions:0};}
export function objectiveAccuracy(m:AttemptMetrics):number|null{return m.objective?m.correct/m.objective*100:null;}
export function addAttempt(m:AttemptMetrics,e:AttemptEvent):void{m.attempts++;if(e.firstAttempt===false)m.repetitions++;
  if(e.result.source==='objective'){m.objective++;if(e.result.correct)m.correct++;}else m[e.result.rating]++;}
const formatter=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit'});
export function madridDay(date:Date):string{const parts=formatter.formatToParts(date);return ['year','month','day'].map(t=>parts.find(p=>p.type===t)!.value).join('-');}
export function shiftDay(day:string,offset:number):string{return new Date(Date.parse(day+'T12:00:00Z')+offset*86400000).toISOString().slice(0,10);}
export function madridMidnight(day:string):string{
  const format=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
  const target=Date.parse(day+'T00:00:00Z');let instant=target;
  for(let n=0;n<2;n++){const p=format.formatToParts(new Date(instant));const v=(type:string)=>p.find(part=>part.type===type)!.value;
    const wall=Date.parse(`${v('year')}-${v('month')}-${v('day')}T${v('hour')}:${v('minute')}:${v('second')}Z`);instant+=target-wall;}
  return new Date(instant).toISOString();
}
export function comparisonDelta(current:AttemptMetrics,previous:AttemptMetrics):number|null{
  return current.objective>=TREND_MIN_ATTEMPTS&&previous.objective>=TREND_MIN_ATTEMPTS?objectiveAccuracy(current)!-objectiveAccuracy(previous)!:null;
}
/** At most 90 daily buckets + fixed category aggregates. Today is excluded from period comparisons. */
export function historicalAccumulator(count:7|30|90,now=new Date()){
  const today=madridDay(now),first=shiftDay(today,1-count),currentStart=shiftDay(today,-count),previousStart=shiftDay(today,-2*count);
  const result:AttemptHistory={days:Array.from({length:count},(_,n)=>({day:shiftDay(first,n),...emptyMetrics()})),total:emptyMetrics(),modules:ATTEMPT_MODULES.map(module=>({module,metrics:emptyMetrics()})),skills:ATTEMPT_ACTIVITIES.map(activity=>({activity,metrics:emptyMetrics()})),weeks:[],comparison:{current:emptyMetrics(),previous:emptyMetrics(),delta:null,trend:'insufficient'},moduleComparisons:[],skillComparisons:[],recommendation:'insufficient',weakSkill:null};
  const periods=new Map<string,{current:AttemptMetrics;previous:AttemptMetrics}>();
  for(const key of [...ATTEMPT_MODULES,...ATTEMPT_ACTIVITIES])periods.set(key,{current:emptyMetrics(),previous:emptyMetrics()});
  return {from:madridMidnight(previousStart),to:now.toISOString(),
    accept(e:AttemptEvent){if(e.occurredAt>now.toISOString())return;const day=madridDay(new Date(e.occurredAt));
      const bucket=result.days.find(d=>d.day===day);
      if(bucket){addAttempt(bucket,e);addAttempt(result.total,e);addAttempt(result.modules.find(m=>m.module===e.module)!.metrics,e);addAttempt(result.skills.find(s=>s.activity===e.activity)!.metrics,e);}
      if(day>=previousStart&&day<today){const period=day>=currentStart?'current':'previous';addAttempt(result.comparison[period],e);addAttempt(periods.get(e.module)![period],e);addAttempt(periods.get(e.activity)![period],e);}
    },
    finish():AttemptHistory{
      const c=result.comparison;c.delta=comparisonDelta(c.current,c.previous);c.trend=c.delta===null?'insufficient':c.delta>=5?'improving':c.delta<=-5?'declining':'stable';
      result.moduleComparisons=ATTEMPT_MODULES.map(module=>({module,delta:comparisonDelta(periods.get(module)!.current,periods.get(module)!.previous)}));
      result.skillComparisons=ATTEMPT_ACTIVITIES.map(activity=>({activity,delta:comparisonDelta(periods.get(activity)!.current,periods.get(activity)!.previous)}));
      for(let start=0;start<result.days.length;start+=7){const metrics=emptyMetrics();for(const d of result.days.slice(start,start+7))for(const key of Object.keys(metrics) as (keyof AttemptMetrics)[])metrics[key]+=d[key];result.weeks.push({day:result.days[start].day,metrics});}
      result.recommendation=c.trend==='improving'?'improving':c.trend==='declining'?'declining':c.delta===null?'insufficient':objectiveAccuracy(c.current)!<70&&objectiveAccuracy(c.previous)!<70?'recurring':'maintain';
      const comparable=result.skills.filter(s=>{const p=periods.get(s.activity)!;return p.current.objective>=10&&p.previous.objective>=10;});
      const worst=comparable.find(s=>comparable.some(other=>other!==s&&objectiveAccuracy(periods.get(s.activity)!.current)!+10<=objectiveAccuracy(periods.get(other.activity)!.current)!&&objectiveAccuracy(periods.get(s.activity)!.previous)!+10<=objectiveAccuracy(periods.get(other.activity)!.previous)!));
      result.weakSkill=worst?.activity??null;return result;
    }};
}
