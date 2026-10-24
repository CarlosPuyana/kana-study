export const ATTEMPT_MODULES = ['kana','kanji','vocabulary','grammar'] as const;
export const ATTEMPT_ACTIVITIES = ['learn','writing','listening'] as const;
export type AttemptModule = typeof ATTEMPT_MODULES[number];
export type AttemptActivity = typeof ATTEMPT_ACTIVITIES[number];
export type AttemptResult = {readonly source:'objective';readonly correct:boolean}
  | {readonly source:'self';readonly rating:'again'|'hard'|'good'};
export interface AttemptEvent {
  readonly version:1; readonly id:string; readonly occurredAt:string;
  readonly module:AttemptModule; readonly activity:AttemptActivity; readonly itemId:string;
  readonly questionType?:string; readonly sessionId?:string; readonly firstAttempt?:boolean;
  readonly result:AttemptResult;
}
const bounded=(value:unknown,max:number):value is string=>typeof value==='string'&&value.length>0&&value.length<=max;
/** Strict UTC and bounded metadata; no answer text, strokes or dictionary payload. */
export function validAttemptEvent(value:unknown):value is AttemptEvent {
  if(!value||typeof value!=='object')return false;
  const e=value as AttemptEvent,r=e.result;
  return e.version===1&&bounded(e.id,512)&&bounded(e.itemId,2048)
    &&ATTEMPT_MODULES.includes(e.module)&&ATTEMPT_ACTIVITIES.includes(e.activity)
    &&typeof e.occurredAt==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(e.occurredAt)
    &&Number.isFinite(Date.parse(e.occurredAt))&&new Date(e.occurredAt).toISOString()===e.occurredAt
    &&(e.questionType===undefined||bounded(e.questionType,128))&&(e.sessionId===undefined||bounded(e.sessionId,256))
    &&(e.firstAttempt===undefined||typeof e.firstAttempt==='boolean')&&!!r
    &&(r.source==='objective'?typeof r.correct==='boolean':r.source==='self'&&['again','hard','good'].includes(r.rating));
}
