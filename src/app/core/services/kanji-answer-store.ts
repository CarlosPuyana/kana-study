import {DestroyRef,effect,inject,Injectable,signal,untracked} from '@angular/core';
import {LocalWorkspaceId} from '../models/account.model';
import {AttemptEvent,validAttemptEvent} from '../models/attempt-event.model';
import {KANJI_QUESTION_TYPES,KanjiStudyUnit} from '../models/kanji.model';
import {KanjiReviewEvent,KanjiStudyProgress} from '../models/kanji-study.model';
import {StudyRating} from '../models/progress.model';
import {WeaknessRecord} from '../models/weakness.model';
import {AttemptEventRepository} from './attempt-event.repository';
import {AttemptRecordingService} from './attempt-recording.service';
import {SpacedRepetitionService} from './spaced-repetition.service';
import {StorageService} from './storage.service';
import {readReviewEvents,readStudyProgress} from './study-progress-validation';
import {nextWeaknessRecord,weaknessKey,WEAKNESSES_KEY} from './weakness.service';
import {WorkspaceService} from './workspace.service';
import {SessionHistoryService} from './session-history.service';
import {CompletedSessionSummary} from '../models/learning-session.model';

export const KANJI_PROGRESS_KEY='kana-study.kanji-progress.v1';
export const KANJI_EVENTS_KEY='kana-study.kanji-review-events.v1';
export const KANJI_ANSWER_JOURNAL='kana-study.kanji-answer-intent.v1';
export const KANJI_ANSWER_RECEIPT='kana-study.kanji-answer-receipt.v1';
export const KANJI_FINISH_JOURNAL='kana-study.kanji-finish-intent.v1';
export interface KanjiAnswerRequest {
  attempt:AttemptEvent;rating:StudyRating;unit?:KanjiStudyUnit;
  progress:'review'|'practice'|'none';
}
export interface KanjiAnswerIntent {
  version:1;owner:LocalWorkspaceId;attempt:AttemptEvent;
  before:KanjiStudyProgress|null;after:KanjiStudyProgress|null;event:KanjiReviewEvent|null;
  weaknessBefore:WeaknessRecord|null;weaknessAfter:WeaknessRecord;
}
const same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);

/** Existing VocabularyReviewStore WAL pattern, with explicit owner and awaited AttemptEvent projection.
 * Canonical keys/IndexedDB are unchanged. This is recovery, not a cross-storage transaction.
 */
@Injectable({providedIn:'root'})
export class KanjiAnswerStore {
  private readonly storage=inject(StorageService);
  private readonly workspace=inject(WorkspaceService);
  private readonly attempts=inject(AttemptEventRepository);
  private readonly fsrs=inject(SpacedRepetitionService);
  private readonly history=inject(SessionHistoryService);
  private readonly running=new Map<string,Promise<void>>();
  private destroyed=false;
  readonly error=signal(false);
  constructor(){
    inject(DestroyRef).onDestroy(()=>this.destroyed=true);
    inject(AttemptRecordingService).registerDurableRetry(async()=>{try{await this.recover();return true;}catch{return false;}});
    effect(()=>{this.workspace.activationRevision();untracked(()=>{this.error.set(false);try{if(this.hasPending())void this.recover().catch(()=>undefined);}catch{this.error.set(true);}});});
  }
  private read<T>(key:string,owner=this.workspace.active(),fallback:T):T {
    const value=localStorage.getItem(this.workspace.storageKey(key,owner));return value===null?fallback:JSON.parse(value) as T;
  }
  hasPending():boolean {return this.read(KANJI_ANSWER_JOURNAL,this.workspace.active(),null)!==null||this.read(KANJI_FINISH_JOURNAL,this.workspace.active(),null)!==null;}
  private guard(owner:LocalWorkspaceId,epoch:number):void {
    if(this.destroyed||this.workspace.active()!==owner||this.workspace.activationRevision()!==epoch)throw Error('Kanji activation expired');
  }
  prepare(request:KanjiAnswerRequest):KanjiAnswerIntent {
    if(this.hasPending())throw Error('Kanji recovery required');
    const {attempt,rating,unit}=request;
    if(!validAttemptEvent(attempt)||attempt.module!=='kanji'||!['again','hard','good'].includes(rating))throw Error('Invalid Kanji answer');
    const identity={module:'kanji' as const,activity:attempt.activity,itemId:attempt.itemId,...(attempt.questionType?{questionType:attempt.questionType}:{})};
    const records=this.read<WeaknessRecord[]>(WEAKNESSES_KEY,this.workspace.active(),[]);
    if(!Array.isArray(records))throw Error('Invalid weakness container');
    const weaknessBefore=records.find(r=>weaknessKey(r)===weaknessKey(identity))??null;
    const progress=readStudyProgress<KanjiStudyProgress>(this.read(KANJI_PROGRESS_KEY,this.workspace.active(),{}),'kanjiId',KANJI_QUESTION_TYPES);
    const before=unit?progress[unit.key]??null:null,at=attempt.occurredAt;
    let after:KanjiStudyProgress|null=null,event:KanjiReviewEvent|null=null;
    if(request.progress==='review'){
      if(!unit)throw Error('Missing Kanji unit');
      const next=this.fsrs.review(before?.fsrs??null,rating,new Date(at));
      after={...unit,fsrs:next,firstSeenAt:before?.firstSeenAt??at,lastSeenAt:at,totalAttempts:(before?.totalAttempts??0)+1,
        totalFirstTrySuccesses:(before?.totalFirstTrySuccesses??0)+Number(rating==='good'),totalFailures:(before?.totalFailures??0)+Number(rating==='again'),lastRating:rating};
      event={...unit,id:attempt.id+':fsrs',sessionId:attempt.sessionId!,rating,reviewedAt:at,fsrsBefore:before?.fsrs??null,fsrsAfter:next};
    }else if(request.progress==='practice'&&before){
      // Preserve the historical internal-practice contract, including Hard's counter semantics.
      after={...before,lastSeenAt:at,totalAttempts:before.totalAttempts+1,totalFailures:before.totalFailures+Number(rating!=='good')};
    }
    return {version:1,owner:this.workspace.active(),attempt,before,after,event,weaknessBefore,
      weaknessAfter:nextWeaknessRecord(identity,weaknessBefore??undefined,rating,at)};
  }
  async commit(intent:KanjiAnswerIntent,epoch:number):Promise<void> {
    this.guard(intent.owner,epoch);
    const receipt=this.read<KanjiAnswerIntent|null>(KANJI_ANSWER_RECEIPT,intent.owner,null);
    const pending=this.read<KanjiAnswerIntent|null>(KANJI_ANSWER_JOURNAL,intent.owner,null);
    if(receipt?.attempt.id===intent.attempt.id){if(!same(receipt,intent))throw Error('Kanji receipt conflict');if(!pending)return;}
    if(pending&&!same(pending,intent))throw Error('Another Kanji answer needs recovery');
    if(!pending)this.storage.set(KANJI_ANSWER_JOURNAL,intent,{owner:intent.owner,localOnly:true,strict:true});
    await this.recover(epoch);
  }
  recover(epoch=this.workspace.activationRevision()):Promise<void> {
    const owner=this.workspace.active(),scope=JSON.stringify([owner,epoch]);
    const existing=this.running.get(scope);if(existing)return existing;
    const run=this.apply(owner,epoch).catch(error=>{if(this.workspace.active()===owner&&this.workspace.activationRevision()===epoch)this.error.set(true);throw error;})
      .finally(()=>this.running.delete(scope));
    this.running.set(scope,run);return run;
  }
  finish(summary:CompletedSessionSummary,owner:LocalWorkspaceId,epoch:number):void {
    this.guard(owner,epoch);
    const pending=this.read<{owner:LocalWorkspaceId;summary:CompletedSessionSummary}|null>(KANJI_FINISH_JOURNAL,owner,null);
    if(pending&&pending.summary.sessionId!==summary.sessionId)throw Error('Another Kanji completion needs recovery');
    if(!pending)this.storage.set(KANJI_FINISH_JOURNAL,{owner,summary},{strict:true,localOnly:true,owner});
    this.finishPending(owner,epoch);
  }
  private finishPending(owner:LocalWorkspaceId,epoch:number):void {
    this.guard(owner,epoch);
    const pending=this.read<{owner:LocalWorkspaceId;summary:CompletedSessionSummary}|null>(KANJI_FINISH_JOURNAL,owner,null);
    if(!pending)return;
    if(pending.owner!==owner||pending.summary?.module!=='kanji'||!pending.summary.sessionId||!Number.isFinite(Date.parse(pending.summary.completedAt)))throw Error('Invalid Kanji completion');
    this.guard(owner,epoch);this.history.record(pending.summary,{strict:true});this.guard(owner,epoch);
    localStorage.removeItem(this.workspace.storageKey(KANJI_FINISH_JOURNAL,owner));this.guard(owner,epoch);
  }
  private async apply(owner:LocalWorkspaceId,epoch:number):Promise<void> {
    this.guard(owner,epoch);
    const intent=this.read<KanjiAnswerIntent|null>(KANJI_ANSWER_JOURNAL,owner,null);
    if(!intent){this.finishPending(owner,epoch);this.error.set(false);return;}
    if(intent.version!==1||intent.owner!==owner||!validAttemptEvent(intent.attempt)||intent.attempt.module!=='kanji'
      ||intent.weaknessAfter?.module!=='kanji'||intent.weaknessAfter.itemId!==intent.attempt.itemId)throw Error('Invalid Kanji journal');
    const attempt=intent.attempt,rating=attempt.result.source==='self'?attempt.result.rating:attempt.result.correct?'good':'again';
    const identity={module:'kanji' as const,activity:attempt.activity,itemId:attempt.itemId,...(attempt.questionType?{questionType:attempt.questionType}:{})};
    if(!same(intent.weaknessAfter,nextWeaknessRecord(identity,intent.weaknessBefore??undefined,rating,attempt.occurredAt)))throw Error('Invalid Kanji weakness receipt');
    if(intent.after&&(intent.after.kanjiId!==attempt.itemId||intent.after.questionType!==attempt.questionType))throw Error('Invalid Kanji identity');
    if(intent.event&&(!intent.after||intent.event.id!==attempt.id+':fsrs'||intent.event.rating!==rating||intent.event.reviewedAt!==attempt.occurredAt
      ||intent.event.sessionId!==attempt.sessionId||intent.event.key!==intent.after.key||!same(intent.event.fsrsBefore,intent.before?.fsrs??null)
      ||!same(intent.event.fsrsAfter,intent.after.fsrs)||readReviewEvents([intent.event],'kanjiId',KANJI_QUESTION_TYPES).length!==1))throw Error('Invalid Kanji review receipt');
    const write=(key:string,value:unknown,localOnly=false)=>{this.guard(owner,epoch);this.storage.set(key,value,{owner,localOnly,strict:true});this.guard(owner,epoch);};
    if(intent.after){
      if(!readStudyProgress({[intent.after.key]:intent.after},'kanjiId',KANJI_QUESTION_TYPES)[intent.after.key])throw Error('Invalid Kanji snapshot');
      const progress=this.read<Record<string,KanjiStudyProgress>>(KANJI_PROGRESS_KEY,owner,{});
      if(!progress||typeof progress!=='object'||Array.isArray(progress))throw Error('Invalid Kanji progress container');
      const rawCurrent=progress[intent.after.key]??null;
      const current=rawCurrent?readStudyProgress<KanjiStudyProgress>({[intent.after.key]:rawCurrent},'kanjiId',KANJI_QUESTION_TYPES)[intent.after.key]??null:null;
      if(rawCurrent&&!current)throw Error('Invalid persisted Kanji card');
      if(!same(current,intent.before)&&!same(current,intent.after))throw Error('Kanji progress changed during recovery');
      write(KANJI_PROGRESS_KEY,{...progress,[intent.after.key]:intent.after});
    }
    if(intent.event){
      if(readReviewEvents([intent.event],'kanjiId',KANJI_QUESTION_TYPES).length!==1||!intent.after||intent.event.key!==intent.after.key
        ||!same(intent.event.fsrsBefore,intent.before?.fsrs??null)||!same(intent.event.fsrsAfter,intent.after.fsrs))throw Error('Invalid Kanji review');
      const events=this.read<KanjiReviewEvent[]>(KANJI_EVENTS_KEY,owner,[]);if(!Array.isArray(events))throw Error('Invalid Kanji event container');
      const existing=events.find(e=>e.id===intent.event!.id);
      if(existing&&!same(existing,intent.event))throw Error('Kanji event conflict');
      write(KANJI_EVENTS_KEY,existing?events:[...events,intent.event]);
    }
    const records=this.read<WeaknessRecord[]>(WEAKNESSES_KEY,owner,[]);if(!Array.isArray(records))throw Error('Invalid weakness container');
    const key=weaknessKey(intent.weaknessAfter),current=records.find(r=>weaknessKey(r)===key)??null;
    if(!same(current,intent.weaknessBefore)&&!same(current,intent.weaknessAfter))throw Error('Kanji weakness changed during recovery');
    write(WEAKNESSES_KEY,[...records.filter(r=>weaknessKey(r)!==key),intent.weaknessAfter],true);
    this.guard(owner,epoch);
    if(!await this.attempts.insert(intent.attempt,owner))throw Error('Kanji attempt not saved');
    this.guard(owner,epoch);
    write(KANJI_ANSWER_RECEIPT,intent,true);
    // Removal failure also remains recoverable: receipt and immutable ID prevent duplicate application.
    localStorage.removeItem(this.workspace.storageKey(KANJI_ANSWER_JOURNAL,owner));
    this.guard(owner,epoch);this.finishPending(owner,epoch);this.storage.cloudRevision.update(n=>n+1);this.error.set(false);
  }
}
