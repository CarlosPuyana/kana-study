import { inject, Injectable } from '@angular/core';
import { AttemptEvent, validAttemptEvent } from '../models/attempt-event.model';
import { VocabularyReviewEvent, VocabularyStudyProgress } from '../models/vocabulary-study.model';
import { VOCABULARY_QUESTION_TYPES } from '../models/vocabulary.model';
import { AttemptEventRepository } from './attempt-event.repository';
import { AttemptRecordingService } from './attempt-recording.service';
import { StorageService } from './storage.service';
import { WorkspaceService } from './workspace.service';
import { readReviewEvents, readStudyProgress } from './study-progress-validation';
import { VocabularyDailyLesson } from '../models/vocabulary-lesson.model';
import { VocabularyLessonRepository, validVocabularyLesson } from './vocabulary-lesson.repository';
import {VocabularyUndoReceipt,VocabularyUndoStore} from './vocabulary-undo-store';

export const VOCABULARY_PROGRESS_KEY = 'kana-study.vocabulary-progress.v1';
export const VOCABULARY_EVENTS_KEY = 'kana-study.vocabulary-review-events.v1';
const JOURNAL = 'kana-study.vocabulary-review-intent.v1';
const PENDING = 'kana-study.vocabulary-attempt-pending.v1';
interface Intent { progress?: VocabularyStudyProgress; event?: VocabularyReviewEvent; attempt?: AttemptEvent; lesson?:VocabularyDailyLesson; undo?:VocabularyUndoReceipt }

/** Recoverable local write using existing canonical keys and immutable event IDs. */
@Injectable({providedIn:'root'})
export class VocabularyReviewStore {
  private readonly storage = inject(StorageService);
  private readonly workspace = inject(WorkspaceService);
  private readonly attempts = inject(AttemptEventRepository);
  private readonly lessons=inject(VocabularyLessonRepository);
  private readonly undo=inject(VocabularyUndoStore);
  private readonly flushing = new Map<string, Promise<boolean>>();
  constructor(){inject(AttemptRecordingService).registerDurableRetry(()=>this.flushAttempts());}
  progress() { return readStudyProgress<VocabularyStudyProgress>(this.storage.get(VOCABULARY_PROGRESS_KEY, {}), 'entryId', VOCABULARY_QUESTION_TYPES); }
  events() { return readReviewEvents<VocabularyReviewEvent>(this.storage.get(VOCABULARY_EVENTS_KEY, []), 'entryId', VOCABULARY_QUESTION_TYPES); }
  recover(): void {
    this.undo.assertIdle();
    const intent = this.storage.get<Intent | null>(JOURNAL, null);
    if (!intent) return;
    if(intent.event){
      if (!intent.progress || !readStudyProgress({[intent.progress.key]:intent.progress}, 'entryId', VOCABULARY_QUESTION_TYPES)[intent.progress.key]
        || readReviewEvents([intent.event], 'entryId', VOCABULARY_QUESTION_TYPES).length !== 1
        || intent.progress.key !== intent.event.key)throw Error('Invalid vocabulary intent');
    }else if(intent.progress||!intent.attempt||!intent.lesson||intent.lesson.version!==2)throw Error('Invalid internal practice intent');
    if(intent.attempt&&!validAttemptEvent(intent.attempt))throw Error('Invalid vocabulary attempt');
    if(intent.attempt)this.undo.assertNotRevoked(intent.attempt);
    if(intent.lesson){
      if(!validVocabularyLesson(intent.lesson))throw Error('Invalid lesson receipt');
      const session=intent.lesson.session,key=intent.event?.key??`vocab:${intent.attempt!.itemId}:${intent.attempt!.questionType}`;
      if(session.id!==(intent.event?.sessionId??intent.attempt?.sessionId)||!session.items.some(i=>i.studyKey===key&&i.attempts>0)
        ||intent.attempt&&(intent.attempt.sessionId!==session.id||!(intent.attempt.id===`${session.id}:vocabulary:learn:${session.attempts}`
          ||intent.undo&&intent.attempt.id.startsWith(`${session.id}:vocabulary:learn:${session.attempts}:`)&&intent.undo.attempt.id===intent.attempt.id)))throw Error('Invalid lesson answer');
    }
    this.apply(intent);
  }
  commit(intent: Intent): void {
    this.recover();
    if (intent.event && this.events().some(e => e.id === intent.event!.id)) return;
    if(intent.attempt&&intent.lesson)intent={...intent,undo:this.undo.prepare(intent.attempt,intent.lesson,intent.progress,intent.event)};
    this.storage.set(JOURNAL, intent, {localOnly:true, strict:true});
    this.recover();
  }
  commitPractice(attempt:AttemptEvent,lesson:VocabularyDailyLesson):void {
    this.recover();
    const current=this.lessons.active();
    if(!current||current.version!==2||current.session.id!==lesson.session.id)throw Error('No active vocabulary lesson');
    if(current.session.attempts===lesson.session.attempts&&JSON.stringify(current.session)===JSON.stringify(lesson.session))return;
    const key=`vocab:${attempt.itemId}:${attempt.questionType}`;
    if(current.session.attempts+1!==lesson.session.attempts||!current.session.items.some(i=>i.studyKey===key&&i.attempts>0&&!i.resolved)
      ||!validVocabularyLesson(lesson)||!validAttemptEvent(attempt))throw Error('Invalid internal practice receipt');
    this.storage.set(JOURNAL,{attempt,lesson,undo:this.undo.prepare(attempt,lesson)},{localOnly:true,strict:true});
    this.recover();
  }
  private apply(intent: Intent): void {
    const owner=this.workspace.active(),epoch=this.workspace.activationRevision();
    const guard=()=>{if(this.workspace.active()!==owner||this.workspace.activationRevision()!==epoch||intent.undo&&intent.undo.owner!==owner)throw Error('Stale vocabulary answer');};
    const write=(key:string,value:unknown,localOnly=false)=>{guard();this.storage.set(key,value,{strict:true,localOnly,owner});guard();};
    guard();
    const pending = this.storage.get<AttemptEvent[]>(PENDING, []).filter(validAttemptEvent);
    if (intent.attempt && !pending.some(e => e.id === intent.attempt!.id)) pending.push(intent.attempt);
    write(PENDING,pending,true);
    if(intent.event&&intent.progress){
      const progress=this.progress(),events=this.events(),event=intent.event;
      const rawProgress=this.storage.get<Record<string,unknown>>(VOCABULARY_PROGRESS_KEY,{});
      const rawEvents=this.storage.get<unknown[]>(VOCABULARY_EVENTS_KEY,[]);
      if(!rawProgress||typeof rawProgress!=='object'||Array.isArray(rawProgress)||!Array.isArray(rawEvents))throw Error('Invalid vocabulary history container');
      const existing=events.some(e=>e.id===event.id),current=progress[event.key];
      if(Object.hasOwn(rawProgress,event.key)&&!current)throw Error('Invalid persisted vocabulary card');
      const same=(value:unknown,other:unknown)=>JSON.stringify(value)===JSON.stringify(other);
      if(!existing&&current&&!same(current.fsrs,event.fsrsBefore)&&!same(current.fsrs,event.fsrsAfter))throw Error('Vocabulary state changed during recovery');
      if(!existing||!current||current.fsrs.reps<intent.progress.fsrs.reps)progress[event.key]=intent.progress;
      write(VOCABULARY_PROGRESS_KEY,{...rawProgress,[event.key]:progress[event.key]});
      write(VOCABULARY_EVENTS_KEY,existing?rawEvents:[...rawEvents,event]);
    }
    if(intent.lesson){guard();this.lessons.save(intent.lesson);guard();}
    if(intent.undo){this.undo.confirm(intent.undo);guard();}
    localStorage.removeItem(this.storage.rawKey(JOURNAL));
    guard();this.storage.cloudRevision.update(n=>n+1);
  }
  flushAttempts(): Promise<boolean> {
    const owner=this.workspace.active(), epoch=this.workspace.activationRevision(), scope=JSON.stringify([owner,epoch]);
    const running=this.flushing.get(scope); if(running)return running;
    if(!this.storage.get<AttemptEvent[]>(PENDING,[]).length)return Promise.resolve(true);
    const run=(async()=>{
      const key=this.workspace.storageKey(PENDING,owner);
      try {
        for(;;){
        if(this.workspace.active()!==owner||this.workspace.activationRevision()!==epoch)return false;
        const pending=(JSON.parse(localStorage.getItem(key)??'[]') as AttemptEvent[]).filter(validAttemptEvent);
        if(!pending.length)return true;
        for(const event of pending){
          if(this.workspace.active()!==owner||this.workspace.activationRevision()!==epoch)return false;
          if(!await this.attempts.insert(event,owner))return false;
          const latest=JSON.parse(localStorage.getItem(key)??'[]') as AttemptEvent[];
          localStorage.setItem(key,JSON.stringify(latest.filter(e=>e.id!==event.id)));
        }
        }
      }catch{this.attempts.writeError.set(true);return false;}
    })().finally(()=>this.flushing.delete(scope));
    this.flushing.set(scope,run);return run;
  }
}
