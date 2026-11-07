import { VocabularyEntry, VocabularyStudyUnit, VocabularyQuestionType } from '../models/vocabulary.model';
import { VocabularyStudyProgress, VocabularyReviewEvent } from '../models/vocabulary-study.model';
import { VocabularyLearningSession } from '../models/vocabulary-session.model';
import { VocabularyDailyLesson } from '../models/vocabulary-lesson.model';
import { AttemptEvent } from '../models/attempt-event.model';
import { madridDay, shiftDay } from './attempt-analytics';

export const VOCABULARY_HISTORY_PAGE_SIZE=20;
export function vocabularyForecast(dates:readonly string[],now:Date){
 const today=madridDay(now),days=Array.from({length:7},(_,i)=>({day:shiftDay(today,i),count:0}));let overdue=0,later=0;
 for(const date of dates){if(!Number.isFinite(Date.parse(date)))continue;const day=madridDay(new Date(date));if(day<today)overdue++;else{const bucket=days.find(d=>d.day===day);if(bucket)bucket.count++;else later++;}}
 return {days,overdue,later,total:dates.filter(d=>Number.isFinite(Date.parse(d))).length};
}
export function vocabularyOverview(units:readonly VocabularyStudyUnit[],progress:Readonly<Record<string,VocabularyStudyProgress>>,events:readonly VocabularyReviewEvent[],now:Date){
 const wordIds=new Set(units.map(u=>u.entryId)),known=new Set([...Object.values(progress).map(p=>p.entryId),...events.map(e=>e.entryId)]),cards=units.flatMap(u=>progress[u.key]?[progress[u.key]]:[]);
 const states={new:0,learning:0,review:0,relearning:0};for(const p of cards)states[p.fsrs.state]++;
 const forecast=vocabularyForecast(cards.map(p=>p.fsrs.due),now);
 return {words:wordIds.size,wordsWithProgress:new Set(Object.values(progress).filter(p=>wordIds.has(p.entryId)).map(p=>p.entryId)).size,
  newWords:[...wordIds].filter(id=>!known.has(id)).length,cards:cards.length,unstarted:units.length-cards.length,states,forecast,
  today:forecast.days[0].count,future:forecast.total-forecast.overdue-forecast.days[0].count};
}
const stable=(a:string,b:string)=>a<b?-1:a>b?1:0;
export function vocabularyLessonStatistics(session:VocabularyLearningSession,lesson:VocabularyDailyLesson|undefined,events:readonly VocabularyReviewEvent[],now:Date){
 const answered=session.units.filter(u=>session.items.some(i=>i.studyKey===u.key&&i.attempts>0)),ids=new Set(answered.map(u=>u.entryId));
 const initial={again:0,hard:0,good:0};for(const i of session.items)if(i.initialRating)initial[i.initialRating]++;
 const complete=new Set(answered.filter(u=>session.items.some(i=>i.studyKey===u.key&&i.resolved)).map(u=>u.entryId)).size;
 const measured=lesson?.version===2&&!lesson.legacyResolvedKeys?.length&&session.items.every(i=>i.consecutiveCorrect===2)&&complete===ids.size;
 const difficult=answered.flatMap(u=>{const item=session.items.find(i=>i.studyKey===u.key)!;return item.needsPractice||item.attempts>2?[{...u,...item}]:[];})
  .sort((a,b)=>b.attempts-a.attempts||(b.againCount??0)-(a.againCount??0)||(b.hardCount??0)-(a.hardCount??0)||stable(a.entryId,b.entryId));
 const dates=answered.flatMap(u=>{const matching=events.filter(e=>e.sessionId===session.id&&e.key===u.key).sort((a,b)=>stable(a.reviewedAt,b.reviewedAt)||stable(a.id,b.id));const event=lesson?.version===2?matching[0]:matching.at(-1);return event?[event.fsrsAfter.due]:[];});
 return {words:ids.size,completed:complete,responses:session.attempts,initial,objective:session.mode==='quick-practice',minimum:measured?ids.size*2:null,
  extra:measured?Math.max(0,session.attempts-ids.size*2):null,difficult,forecast:vocabularyForecast(dates,now),missingDates:answered.length-dates.length};
}
const interval=(due:string|undefined,at:string|null|undefined):number|null=>{if(!due||!at)return null;const n=Date.parse(due)-Date.parse(at);return Number.isFinite(n)&&n>=0?n:null;};
export function vocabularyDirectionHistory(events:readonly VocabularyReviewEvent[],entryId:string,type:VocabularyQuestionType){
 const seen=new Set<string>();return events.filter(e=>e.entryId===entryId&&e.questionType===type&&!seen.has(e.id)&&!!seen.add(e.id))
  .sort((a,b)=>stable(b.reviewedAt,a.reviewedAt)||stable(b.id,a.id)).map(event=>({event,before:interval(event.fsrsBefore?.due,event.fsrsBefore?.lastReview),after:interval(event.fsrsAfter.due,event.reviewedAt)}));
}
export function vocabularyAttemptKind(event:AttemptEvent,events:readonly VocabularyReviewEvent[],lessons:readonly VocabularyDailyLesson[]):'initial'|'internal'|'unknown'{
 if(event.firstAttempt===true)return 'initial';
 if(event.firstAttempt!==false||!event.sessionId||!event.questionType)return 'unknown';
 const key=`vocab:${event.itemId}:${event.questionType}`;
 const v2=events.some(e=>e.lessonVersion===2&&e.sessionId===event.sessionId&&e.key===key)||lessons.some(l=>l.version===2&&l.session.id===event.sessionId&&l.session.units.some(u=>u.key===key)&&!l.legacyResolvedKeys?.includes(key));
 return v2?'internal':'unknown';
}
