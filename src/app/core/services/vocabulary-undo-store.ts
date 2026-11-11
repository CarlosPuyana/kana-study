import {inject,Injectable,signal} from '@angular/core';
import {LocalWorkspaceId} from '../models/account.model';
import {AttemptEvent,validAttemptEvent} from '../models/attempt-event.model';
import {VocabularyDailyLesson,VOCABULARY_LESSONS_KEY} from '../models/vocabulary-lesson.model';
import {VocabularyReviewEvent,VocabularyStudyProgress} from '../models/vocabulary-study.model';
import {WeaknessRecord} from '../models/weakness.model';
import {StudyRating} from '../models/progress.model';
import {StorageService} from './storage.service';
import {WorkspaceService} from './workspace.service';
import {validVocabularyLesson} from './vocabulary-lesson.repository';
import {nextWeaknessRecord,weaknessKey,WEAKNESSES_KEY} from './weakness.service';
import {getSpainDayKey} from './daily-learning.service';
import {AttemptEventRepository} from './attempt-event.repository';
import {makeOutboxItem,SyncOutboxService} from './sync-outbox.service';
import {retractVocabularyAttempt} from './vocabulary-attempt-retraction';
import {readStudyProgress,readReviewEvents} from './study-progress-validation';
import {VOCABULARY_QUESTION_TYPES} from '../models/vocabulary.model';

export const VOCABULARY_UNDO_RECEIPT='kana-study.vocabulary-undo-receipt.v1';
export const VOCABULARY_UNDO_PENDING='kana-study.vocabulary-undo-pending.v1';
const REVOKED='kana-study.vocabulary-undo-revoked.v1';
const PROGRESS='kana-study.vocabulary-progress.v1',EVENTS='kana-study.vocabulary-review-events.v1',PENDING='kana-study.vocabulary-attempt-pending.v1';
const same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
export interface VocabularyUndoReceipt {
  version:1;owner:LocalWorkspaceId;attempt:AttemptEvent;before:VocabularyDailyLesson;after:VocabularyDailyLesson;
  key:string;progressBefore:VocabularyStudyProgress|null;progressAfter:VocabularyStudyProgress|null;
  event:VocabularyReviewEvent|null;weaknessBefore:WeaknessRecord|null;weaknessAfter:WeaknessRecord;weaknessIndex:number;
}
interface Pending {version:1;receipt:VocabularyUndoReceipt;expected:VocabularyDailyLesson;}

/** Explicit reverse journal for an open daily lesson. Normal lesson saves remain monotonic. */
@Injectable({providedIn:'root'})
export class VocabularyUndoStore {
  private readonly storage=inject(StorageService);private readonly workspace=inject(WorkspaceService);
  private readonly attempts=inject(AttemptEventRepository);private readonly outbox=inject(SyncOutboxService);
  readonly revision=signal(0);readonly busy=signal(false);
  private read<T>(key:string,fallback:T):T{const raw=localStorage.getItem(this.workspace.storageKey(key));return raw===null?fallback:JSON.parse(raw);}
  pending():boolean{return this.read(VOCABULARY_UNDO_PENDING,null)!==null;}
  pendingLesson():VocabularyDailyLesson|null{const pending=this.read<Pending|null>(VOCABULARY_UNDO_PENDING,null);if(!pending)return null;this.validate(pending.receipt);return pending.receipt.after;}
  assertIdle(){if(this.busy()||this.pending())throw Error('Vocabulary undo needs recovery');}
  assertNotRevoked(attempt:AttemptEvent){const revoked=this.read<{sessionId:string;ids:string[]}|null>(REVOKED,null);if(revoked&&revoked.sessionId===attempt.sessionId&&revoked.ids.includes(attempt.id))throw Error('Vocabulary answer was revoked');}
  private revoked(attempt:AttemptEvent){const value=this.read<{sessionId:string;ids:string[]}|null>(REVOKED,null);return !!value&&value.sessionId===attempt.sessionId&&value.ids.includes(attempt.id);}
  prepare(attempt:AttemptEvent,after:VocabularyDailyLesson,progressAfter?:VocabularyStudyProgress,event?:VocabularyReviewEvent):VocabularyUndoReceipt {
    this.assertIdle();this.assertNotRevoked(attempt);const owner=this.workspace.active(),epoch=this.workspace.activationRevision();const before=this.read<Record<string,VocabularyDailyLesson>>(VOCABULARY_LESSONS_KEY,{})[after.day];
    if(!before||!validVocabularyLesson(before)||before.session.completedAt||before.session.id!==after.session.id||before.session.attempts+1!==after.session.attempts)throw Error('Vocabulary undo snapshot conflict');
    const key=`vocab:${attempt.itemId}:${attempt.questionType}`,records=this.read<WeaknessRecord[]>(WEAKNESSES_KEY,[]);
    const identity={module:'vocabulary' as const,activity:'learn' as const,itemId:attempt.itemId,questionType:attempt.questionType};
    const index=records.findIndex(r=>weaknessKey(r)===weaknessKey(identity)),weaknessBefore=records[index]??null;
    const rating:StudyRating=attempt.result.source==='self'?attempt.result.rating:attempt.result.correct?'good':'again';
    const progressBefore=this.read<Record<string,VocabularyStudyProgress>>(PROGRESS,{})[key]??null;
    if(owner!==this.workspace.active()||epoch!==this.workspace.activationRevision())throw Error('Stale vocabulary snapshot');
    const receipt:VocabularyUndoReceipt={version:1,owner,attempt,before,after,key,progressBefore,progressAfter:progressAfter??progressBefore,event:event??null,
      weaknessBefore,weaknessAfter:nextWeaknessRecord(identity,weaknessBefore??undefined,rating,attempt.occurredAt),weaknessIndex:index};
    this.validate(receipt);return receipt;
  }
  /** Applied as part of the existing forward answer journal, including recovery after reload. */
  confirm(receipt:VocabularyUndoReceipt){
    const epoch=this.workspace.activationRevision(),guard=()=>{if(this.workspace.active()!==receipt.owner||this.workspace.activationRevision()!==epoch)throw Error('Stale vocabulary receipt');};
    this.validate(receipt);const records=this.read<WeaknessRecord[]>(WEAKNESSES_KEY,[]),key=weaknessKey(receipt.weaknessAfter),current=records.find(r=>weaknessKey(r)===key)??null;
    if(!same(current,receipt.weaknessBefore)&&!same(current,receipt.weaknessAfter))throw Error('Vocabulary weakness receipt conflict');
    guard();this.storage.set(WEAKNESSES_KEY,[...records.filter(r=>weaknessKey(r)!==key),receipt.weaknessAfter],{strict:true,localOnly:true,owner:receipt.owner});guard();
    this.storage.set(VOCABULARY_UNDO_RECEIPT,receipt,{strict:true,localOnly:true,owner:receipt.owner});guard();this.revision.update(n=>n+1);
  }
  eligible(sessionId:string):boolean{
    this.revision();if(this.busy())return false;
    try{if(this.pending())return false;const receipt=this.read<VocabularyUndoReceipt|null>(VOCABULARY_UNDO_RECEIPT,null);if(!receipt)return false;
      this.validate(receipt);const current=this.read<Record<string,VocabularyDailyLesson>>(VOCABULARY_LESSONS_KEY,{})[receipt.after.day];
      return getSpainDayKey(new Date())===receipt.after.day&&receipt.after.session.id===sessionId&&this.matches(receipt,current)&&!this.closed(sessionId);
    }catch{return false;}
  }
  private closed(sessionId:string){return this.read<{sessionId:string}[]>('kana-study.completed-sessions.v1',[]).some(s=>s.sessionId===sessionId);}
  private matches(r:VocabularyUndoReceipt,current:VocabularyDailyLesson|undefined){return !!current&&validVocabularyLesson(current)&&!current.session.completedAt&&same({...current,durationSeconds:0},{...r.after,durationSeconds:0});}
  private validate(r:VocabularyUndoReceipt){
    if(r.version!==1||r.owner!==this.workspace.active()||!validAttemptEvent(r.attempt)||r.attempt.module!=='vocabulary'||r.attempt.activity!=='learn'
      ||!validVocabularyLesson(r.before)||!validVocabularyLesson(r.after)||r.before.session.completedAt||r.after.session.completedAt
      ||r.before.session.id!==r.after.session.id||r.attempt.sessionId!==r.after.session.id||r.after.session.attempts!==r.before.session.attempts+1
      ||r.key!==`vocab:${r.attempt.itemId}:${r.attempt.questionType}`||!r.before.pendingKeys?.includes(r.key))throw Error('Invalid vocabulary undo receipt');
    const b=r.before,a=r.after,identity=(v:VocabularyDailyLesson)=>[v.version,v.day,v.size,v.kinds,v.legacyResolvedKeys,v.session.id,v.session.startedAt,v.session.mode,v.session.sessionSize,v.session.units];
    if(b.version!==2||!same(identity(b),identity(a))||b.pendingKeys?.[0]!==r.key||a.durationSeconds<b.durationSeconds)throw Error('Vocabulary undo composition conflict');
    const previous=b.session.items.find(i=>i.studyKey===r.key)!,next=a.session.items.find(i=>i.studyKey===r.key)!;
    const rating=r.attempt.result.source==='self'?r.attempt.result.rating:r.attempt.result.correct?'good':'again',streak=rating==='good'?Math.min(2,previous.consecutiveCorrect!+1):0;
    const expected={...previous,attempts:previous.attempts+1,appearances:previous.appearances+1,initialRating:previous.initialRating??rating,
      resolved:streak===2,consecutiveCorrect:streak,needsPractice:previous.needsPractice||rating!=='good',againCount:previous.againCount!+Number(rating==='again'),hardCount:previous.hardCount!+Number(rating==='hard'),goodCount:previous.goodCount!+Number(rating==='good')};
    if(!same(next,expected)||b.session.items.some(i=>i.studyKey!==r.key&&!same(i,a.session.items.find(n=>n.studyKey===i.studyKey)))
      ||!same(a.pendingKeys,[...b.pendingKeys!.slice(1),...(!next.resolved?[r.key]:[])])||r.attempt.firstAttempt!==(previous.attempts===0))throw Error('Invalid vocabulary undo transition');
    if(!same(r.weaknessAfter,nextWeaknessRecord({module:'vocabulary',activity:'learn',itemId:r.attempt.itemId,questionType:r.attempt.questionType},r.weaknessBefore??undefined,rating,r.attempt.occurredAt)))throw Error('Invalid vocabulary undo weakness');
    for(const p of [r.progressBefore,r.progressAfter])if(p&&!readStudyProgress({[r.key]:p},'entryId',VOCABULARY_QUESTION_TYPES)[r.key])throw Error('Invalid vocabulary undo progress');
    const normalizedBefore=r.progressBefore?readStudyProgress<VocabularyStudyProgress>({[r.key]:r.progressBefore},'entryId',VOCABULARY_QUESTION_TYPES)[r.key]:null;
    if(previous.attempts===0){const e=r.event;if(!e||readReviewEvents([e],'entryId',VOCABULARY_QUESTION_TYPES).length!==1||e.key!==r.key||e.sessionId!==a.session.id||e.rating!==rating||e.reviewedAt!==r.attempt.occurredAt
      ||!same(e.fsrsBefore,normalizedBefore?.fsrs??null)||!same(e.fsrsAfter,r.progressAfter?.fsrs))throw Error('Invalid vocabulary undo review');}
    else if(r.event||!same(r.progressBefore,r.progressAfter))throw Error('Internal vocabulary undo cannot change FSRS');
  }
  async undo(sessionId:string):Promise<VocabularyDailyLesson>{
    if(this.busy())throw Error('Vocabulary undo already running');this.busy.set(true);
    const owner=this.workspace.active(),epoch=this.workspace.activationRevision(),guard=()=>{if(this.workspace.active()!==owner||this.workspace.activationRevision()!==epoch)throw Error('Stale vocabulary undo');};
    const read=<T>(key:string,fallback:T)=>{guard();return this.read(key,fallback);};
    const write=(key:string,value:unknown)=>{guard();this.storage.set(key,value,{strict:true,localOnly:true,owner});guard();};
    try{
      let pending=read<Pending|null>(VOCABULARY_UNDO_PENDING,null);
      if(!pending){const receipt=read<VocabularyUndoReceipt|null>(VOCABULARY_UNDO_RECEIPT,null);if(!receipt)throw Error('No vocabulary undo receipt');
        this.validate(receipt);const expected=read<Record<string,VocabularyDailyLesson>>(VOCABULARY_LESSONS_KEY,{})[receipt.after.day];
        const confirmed=this.revoked(receipt.attempt)&&same(expected,receipt.before);
        if(receipt.after.session.id!==sessionId||!confirmed&&getSpainDayKey(new Date())!==receipt.after.day||!confirmed&&!this.matches(receipt,expected)||this.closed(sessionId))throw Error('Vocabulary undo no longer eligible');
        pending={version:1,receipt,expected:confirmed?receipt.after:expected};write(VOCABULARY_UNDO_PENDING,pending);
      }
      const {receipt:r,expected}=pending;this.validate(r);
      if(pending.version!==1||r.after.session.id!==sessionId||!this.matches(r,expected)||this.closed(sessionId))throw Error('Vocabulary undo recovery conflict');
      const all=read<Record<string,VocabularyDailyLesson>>(VOCABULARY_LESSONS_KEY,{}),current=all[r.before.day];
      if(!same(current,expected)&&!same(current,r.before))throw Error('Vocabulary lesson changed during undo');
      const progress=read<Record<string,VocabularyStudyProgress>>(PROGRESS,{}),card=progress[r.key]??null;
      if(!same(card,r.progressBefore)&&!same(card,r.progressAfter))throw Error('Vocabulary card changed during undo');
      const events=read<VocabularyReviewEvent[]>(EVENTS,[]),event=r.event&&events.find(e=>e.id===r.event!.id);
      if(event&&!same(event,r.event))throw Error('Vocabulary event changed during undo');
      const records=read<WeaknessRecord[]>(WEAKNESSES_KEY,[]),key=weaknessKey(r.weaknessAfter),weak=records.find(w=>weaknessKey(w)===key)??null;
      if(!same(weak,r.weaknessBefore)&&!same(weak,r.weaknessAfter))throw Error('Vocabulary weakness changed during undo');
      const revoked=read<{sessionId:string;ids:string[]}|null>(REVOKED,null),ids=revoked?.sessionId===sessionId?revoked.ids:[];
      write(REVOKED,{sessionId,ids:ids.includes(r.attempt.id)?ids:[...ids,r.attempt.id]});
      // Retraction commits first; the durable journal blocks every subsequent answer until all projections agree.
      await retractVocabularyAttempt(r.attempt,owner);guard();this.attempts.revision.update(n=>n+1);
      if(this.closed(sessionId)||!same(read<Record<string,VocabularyDailyLesson>>(VOCABULARY_LESSONS_KEY,{})[r.before.day],current))throw Error('Vocabulary lesson changed while retracting');
      const queued=read<AttemptEvent[]>(PENDING,[]);write(PENDING,queued.filter(e=>e.id!==r.attempt.id));
      if(r.progressBefore)progress[r.key]=r.progressBefore;else delete progress[r.key];
      write(PROGRESS,progress);write(EVENTS,events.filter(e=>e.id!==r.event?.id));
      const restored=records.filter(w=>weaknessKey(w)!==key);if(r.weaknessBefore)restored.splice(Math.min(r.weaknessIndex,restored.length),0,r.weaknessBefore);
      write(WEAKNESSES_KEY,restored);
      // Only this verified reverse journal may move a lesson backwards; save() is intentionally untouched.
      write(VOCABULARY_LESSONS_KEY,{...all,[r.before.day]:r.before});
      for(const [key,value]of [[PROGRESS,progress],[EVENTS,events.filter(e=>e.id!==r.event?.id)]] as const){const item=makeOutboxItem(owner,'local-storage',key,value,'upsert');if(item)await this.outbox.enqueue(item);guard();}
      if(!same(read<Record<string,VocabularyDailyLesson>>(VOCABULARY_LESSONS_KEY,{})[r.before.day],r.before)
        ||!same(read<Record<string,VocabularyStudyProgress>>(PROGRESS,{})[r.key]??null,r.progressBefore)
        ||read<VocabularyReviewEvent[]>(EVENTS,[]).some(e=>e.id===r.event?.id)
        ||!same(read<WeaknessRecord[]>(WEAKNESSES_KEY,[]).find(w=>weaknessKey(w)===key)??null,r.weaknessBefore)
        ||read<AttemptEvent[]>(PENDING,[]).some(e=>e.id===r.attempt.id))throw Error('Vocabulary undo verification failed');
      // Retain the terminal receipt: even an exception after journal removal can verify this exact operation.
      write(VOCABULARY_UNDO_RECEIPT,r);guard();localStorage.removeItem(this.workspace.storageKey(VOCABULARY_UNDO_PENDING,owner));guard();
      this.storage.cloudRevision.update(n=>n+1);this.revision.update(n=>n+1);return r.before;
    }finally{this.busy.set(false);}
  }
}
