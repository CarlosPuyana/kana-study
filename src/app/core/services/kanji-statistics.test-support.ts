import {KanjiQuestionType} from '../models/kanji.model';
import {KanjiReviewEvent,KanjiStudyProgress} from '../models/kanji-study.model';
import {AttemptEvent} from '../models/attempt-event.model';

export const NOW=new Date('2026-11-10T12:00:00.000Z');
export function k4Progress(id='食',type:KanjiQuestionType='kanji-to-meaning'):KanjiStudyProgress {
  return {key:`kanji:${id}:${type}`,kanjiId:id,questionType:type,
    fsrs:{due:NOW.toISOString(),stability:1,difficulty:5,elapsedDays:0,scheduledDays:0,learningSteps:0,reps:1,lapses:0,state:'review',lastReview:NOW.toISOString()},
    firstSeenAt:NOW.toISOString(),lastSeenAt:NOW.toISOString(),totalAttempts:1,totalFirstTrySuccesses:1,totalFailures:0,lastRating:'good'};
}
export function k4Review(n=0,rating:KanjiReviewEvent['rating']='again',id='食',type:KanjiQuestionType='kanji-to-meaning'):KanjiReviewEvent {
  const p=k4Progress(id,type);
  return {...p,id:`a${n}:fsrs`,sessionId:`s${n}`,rating,reviewedAt:new Date(NOW.getTime()-n*1000).toISOString(),fsrsBefore:null,fsrsAfter:p.fsrs};
}
export function k4Attempt(e:KanjiReviewEvent):AttemptEvent {
  return {version:1,id:e.id.replace(':fsrs',''),occurredAt:e.reviewedAt,module:'kanji',activity:'learn',itemId:e.kanjiId,questionType:e.questionType,sessionId:e.sessionId,firstAttempt:true,result:{source:'objective',correct:e.rating==='good'}};
}
