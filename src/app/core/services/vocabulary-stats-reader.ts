import { inject, Injectable } from '@angular/core';
import { WorkspaceService } from './workspace.service';
import { AttemptEventRepository } from './attempt-event.repository';
import { AttemptActivity, AttemptEvent, validAttemptEvent } from '../models/attempt-event.model';
import { VocabularyStudyProgress, VocabularyReviewEvent } from '../models/vocabulary-study.model';
import { VocabularyDailyLesson } from '../models/vocabulary-lesson.model';
import { VOCABULARY_QUESTION_TYPES } from '../models/vocabulary.model';
import { readStudyProgress, readReviewEvents } from './study-progress-validation';
import { validVocabularyLesson } from './vocabulary-lesson.repository';
import { historicalAccumulator } from './attempt-analytics';
export interface AttemptCursor {at:string;id:string}
@Injectable({providedIn:'root'})
export class VocabularyStatsReader {
 readonly workspace=inject(WorkspaceService);readonly repository=inject(AttemptEventRepository);
 snapshot(){
  let invalid=false;const read=(key:string,fallback:unknown):unknown=>{try{const raw=localStorage.getItem(this.workspace.storageKey(key));return raw===null?fallback:JSON.parse(raw);}catch{invalid=true;return fallback;}};
  const rawProgress=read('kana-study.vocabulary-progress.v1',{}),rawEvents=read('kana-study.vocabulary-review-events.v1',[]),rawLessons=read('kana-study.vocabulary-daily-lessons.v1',{});
  const progress=readStudyProgress<VocabularyStudyProgress>(rawProgress,'entryId',VOCABULARY_QUESTION_TYPES);
  const validated=readReviewEvents<VocabularyReviewEvent>(rawEvents,'entryId',VOCABULARY_QUESTION_TYPES),events=[...new Map(validated.map(e=>[e.id,e])).values()];
  const lessons=rawLessons&&typeof rawLessons==='object'?Object.values(rawLessons).filter(validVocabularyLesson):[];
  invalid ||= !rawProgress||typeof rawProgress!=='object'||Array.isArray(rawProgress)||Object.keys(progress).length!==Object.keys(rawProgress).length||!Array.isArray(rawEvents)||events.length!==rawEvents.length||!rawLessons||typeof rawLessons!=='object'||Array.isArray(rawLessons)||lessons.length!==Object.keys(rawLessons).length;
  const pending=read('kana-study.vocabulary-attempt-pending.v1',[]),intent=read('kana-study.vocabulary-review-intent.v1',null);
  return {progress,events,lessons:lessons as VocabularyDailyLesson[],invalid,pending:!!intent||Array.isArray(pending)&&pending.length>0};
 }
 async evolution(count:7|30|90,activity:AttemptActivity|'',now:Date){
  const owner=this.workspace.active(),epoch=this.workspace.activationRevision(),all=historicalAccumulator(count,now),first=historicalAccumulator(count,now);let unknown=0;
  await this.repository.scan({from:all.from,to:all.to,module:'vocabulary',...(activity?{activity}:{})},e=>{if(owner!==this.workspace.active()||epoch!==this.workspace.activationRevision())return false;all.accept(e);if(e.firstAttempt===true)first.accept(e);else if(e.firstAttempt===undefined)unknown++;return true;},owner);
  if(owner!==this.workspace.active()||epoch!==this.workspace.activationRevision())throw Error('Stale vocabulary query');
  return {all:all.finish(),first:first.finish(),unknown};
 }
 async attempts(entryId:string,type:string,before:AttemptCursor|null,now:Date){
  const owner=this.workspace.active(),epoch=this.workspace.activationRevision(),rows:AttemptEvent[]=[];let count=0;
  const lexical=(a:string,b:string)=>a<b?-1:a>b?1:0;
  const compare=(a:AttemptEvent,b:AttemptEvent)=>lexical(b.occurredAt,a.occurredAt)||lexical(b.id,a.id);
  await this.repository.scan({from:'0000-01-01T00:00:00.000Z',to:now.toISOString(),module:'vocabulary',activity:'learn'},e=>{
   if(owner!==this.workspace.active()||epoch!==this.workspace.activationRevision())return false;
   if(e.itemId!==entryId||e.questionType!==type||before&&(e.occurredAt>before.at||e.occurredAt===before.at&&e.id>=before.id))return true;
   if(!validAttemptEvent(e))return true;count++;rows.push(e);rows.sort(compare);if(rows.length>21)rows.pop();return true;
  },owner);
  if(owner!==this.workspace.active()||epoch!==this.workspace.activationRevision())throw Error('Stale vocabulary query');
  const page=rows.slice(0,20),last=page.at(-1);return {rows:page,next:count>20&&last?{at:last.occurredAt,id:last.id}:null};
 }
}
