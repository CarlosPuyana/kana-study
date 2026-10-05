import { GRAMMAR_QUESTION_TYPES, grammarWeaknessTitleKey } from '../../features/grammar/services/grammar-weakness';
import {computed, inject, Injectable, signal} from '@angular/core';
import {CompletedSessionSummary} from '../models/learning-session.model';
import {LearningAnalytics, LearningDirection, LearningPerformance, LearningRecommendation, RecordedActivity} from '../models/learning-analytics.model';
import {WeaknessActivity, WeaknessModule, WeaknessRecord} from '../models/weakness.model';
import {WeaknessService} from './weakness.service';
import {SessionHistoryService} from './session-history.service';

const MODULES:readonly WeaknessModule[]=['kana','vocabulary','kanji','grammar'];
const SKILLS:readonly WeaknessActivity[]=['learn','writing','listening'];
const DIRECTIONS:Readonly<Record<WeaknessModule,readonly string[]>>={
  grammar:GRAMMAR_QUESTION_TYPES,
  kana:['kana-to-romaji','romaji-to-kana'],
  vocabulary:['japanese-to-meaning','meaning-to-japanese','japanese-to-reading','reading-to-japanese'],
  kanji:['kanji-to-meaning','meaning-to-kanji'],
};
export const ANALYTICS_DIRECTION_MIN_ATTEMPTS=3;
export const ANALYTICS_STRENGTH_MIN_ATTEMPTS=5;
export const ANALYTICS_STRENGTH_MIN_ACCURACY=80;
const madridFormatter=new Intl.DateTimeFormat('en',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit'});
function dayKey(date:Date):string {
  const parts=madridFormatter.formatToParts(date);
  return ['year','month','day'].map(type=>parts.find(part=>part.type===type)!.value).join('-');
}
function previousDay(key:string,offset=1):string {
  const [year,month,day]=key.split('-').map(Number);
  return new Date(Date.UTC(year,month-1,day-offset)).toISOString().slice(0,10);
}
function nonnegative(value:unknown):value is number{return typeof value==='number'&&Number.isFinite(value)&&value>=0;}
function validRecord(record:WeaknessRecord):boolean {
  return !!record&&MODULES.includes(record.module)&&SKILLS.includes(record.activity)
    &&Number.isInteger(record.attempts)&&record.attempts>0&&Number.isInteger(record.failures)
    &&record.failures>=0&&record.failures<=record.attempts;
}
function performance(records:readonly WeaknessRecord[]):LearningPerformance {
  const attempts=records.reduce((sum,r)=>sum+r.attempts,0),failures=records.reduce((sum,r)=>sum+r.failures,0);
  return {attempts,failures,successes:attempts-failures,accuracy:attempts?(attempts-failures)/attempts*100:null,
    weakCount:records.filter(r=>r.score>=3).length};
}
function validSession(session:CompletedSessionSummary,now:Date):boolean {
  return !!session&&typeof session.sessionId==='string'&&!!session.sessionId
    &&['kana','vocabulary','kanji','flags','grammar'].includes(session.module??'kana')
    &&Number.isFinite(Date.parse(session.completedAt))&&Date.parse(session.completedAt)<=now.getTime()
    &&Number.isInteger(session.exercisesCompleted)&&session.exercisesCompleted>0;
}
function activity(sessions:readonly CompletedSessionSummary[]):RecordedActivity {
  const exercises=sessions.reduce((sum,s)=>sum+s.exercisesCompleted,0);
  // Missing legacy values are unknown, never fabricated as failed answers.
  const measured=sessions.filter(s=>Number.isInteger(s.firstTrySuccesses)&&s.firstTrySuccesses>=0&&s.firstTrySuccesses<=s.exercisesCompleted);
  const firstTrySuccesses=measured.reduce((sum,s)=>sum+s.firstTrySuccesses,0),denominator=measured.reduce((sum,s)=>sum+s.exercisesCompleted,0);
  return {sessions:sessions.length,exercises,seconds:sessions.reduce((sum,s)=>sum+(nonnegative(s.durationSeconds)?s.durationSeconds:0),0),
    firstTrySuccesses,firstTryAccuracy:denominator?firstTrySuccesses/denominator*100:null};
}
function difficulty(a:LearningDirection,b:LearningDirection):number {
  return a.accuracy!-b.accuracy!||b.failures-a.failures||b.attempts-a.attempts
    ||a.module.localeCompare(b.module)||a.questionType.localeCompare(b.questionType);
}

/** Read-only projection: no analytics storage, FSRS writes, Profile or Auth dependency. */
export function calculateLearningAnalytics(records:readonly WeaknessRecord[],history:readonly CompletedSessionSummary[],now=new Date()):LearningAnalytics {
  const valid=records.filter(validRecord);
  const sessions=[...new Map(history.filter(s=>validSession(s,now)).map(s=>[s.sessionId,s])).values()];
  const modules=MODULES.map(module=>({module,...performance(valid.filter(r=>r.module===module))}));
  const skills=SKILLS.map(activity=>({activity,...performance(valid.filter(r=>r.activity===activity))}));
  const directions=MODULES.flatMap(module=>DIRECTIONS[module].map(questionType=>({module,questionType,
    ...performance(valid.filter(r=>r.module===module&&r.activity==='learn'&&r.questionType===questionType))})));
  const difficult=directions.filter(d=>d.attempts>=ANALYTICS_DIRECTION_MIN_ATTEMPTS).sort(difficulty);
  const strengths=directions.filter(d=>d.attempts>=ANALYTICS_STRENGTH_MIN_ATTEMPTS&&d.accuracy!>=ANALYTICS_STRENGTH_MIN_ACCURACY)
    .sort((a,b)=>-difficulty(a,b)).slice(0,3);
  const today=dayKey(now),days=new Set(sessions.map(s=>dayKey(new Date(s.completedAt))));
  let cursor=days.has(today)?today:previousDay(today),streak=0;
  while(days.has(cursor)){streak++;cursor=previousDay(cursor);}
  const recommendations:LearningRecommendation[]=[];
  const comparable=skills.filter(s=>s.attempts>=3).sort((a,b)=>a.accuracy!-b.accuracy!);
  if(comparable.length>=2&&comparable[0].accuracy!<comparable[1].accuracy!&&comparable[0].accuracy!<80)
    recommendations.push({key:'stats.recommendSkill',activity:comparable[0].activity});
  const worst=difficult[0];
  if(worst&&worst.accuracy!<80){
    const recognition=directions.find(d=>d.module==='vocabulary'&&d.questionType==='japanese-to-meaning');
    if(worst.module==='vocabulary'&&worst.questionType==='meaning-to-japanese'&&recognition&&recognition.attempts>=3&&worst.accuracy!<recognition.accuracy!)
      recommendations.push({key:'stats.recommendProduction'});
    else recommendations.push({key:worst.module==='grammar'?'grammar.weakness.recommend':'stats.recommendDirection',direction:worst});
  }
  if(!recommendations.length)recommendations.push({key:strengths.length?'stats.recommendMaintain':'stats.recommendMore'});
  const grammarRecords=valid.filter(r=>r.module==='grammar'&&r.activity==='learn'&&grammarWeaknessTitleKey(r.itemId));
  const grammarConcepts=[...new Set(grammarRecords.map(r=>r.itemId))].map(itemId=>({itemId,...performance(grammarRecords.filter(r=>r.itemId===itemId))}))
    .filter(c=>c.attempts>=ANALYTICS_DIRECTION_MIN_ATTEMPTS)
    .sort((a,b)=>a.accuracy!-b.accuracy!||b.failures-a.failures||b.attempts-a.attempts||a.itemId.localeCompare(b.itemId)).slice(0,3);
  const total=activity(sessions);
  return {summary:{streak,sessions:total.sessions,seconds:total.seconds,weakCount:valid.filter(r=>r.score>=3).length},modules,skills,difficult,strengths,grammarConcepts,
    recent:([7,30] as const).map(count=>({days:count,...activity(sessions.filter(s=>dayKey(new Date(s.completedAt))>=previousDay(today,count-1)))})),
    recommendations:recommendations.slice(0,2)};
}

@Injectable({providedIn:'root'})
export class LearningAnalyticsService {
  private readonly weaknesses=inject(WeaknessService);
  private readonly history=inject(SessionHistoryService);
  private readonly now=signal(new Date());
  readonly stats=computed(()=>calculateLearningAnalytics(this.weaknesses.records(),this.history.sessions(),this.now()));
  refresh(now=new Date()):void{this.now.set(now);}
}
