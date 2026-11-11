import { VocabularyDailyLesson } from '../models/vocabulary-lesson.model';
import { consolidateVocabularyLesson, VocabularyLessonRepository } from './vocabulary-lesson.repository';
import { VocabularySettingsService } from './vocabulary-settings.service';
import { computed, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { VOCABULARY_N5 } from '../../data/vocabulary-n5.generated';
import { AppLanguage } from '../models/country.model';
import { LearningMode, SessionItem } from '../models/learning-session.model';
import { StudyRating } from '../models/progress.model';
import { VocabularyLearningSession, VocabularySessionFeedback } from '../models/vocabulary-session.model';
import { VOCABULARY_QUESTION_TYPES, VocabularyStudyUnit } from '../models/vocabulary.model';
import { AttemptRecordingService, AttemptRecordingSession } from './attempt-recording.service';
import { createStudyClock } from './study-clock';
import { WeaknessService } from './weakness.service';
import { SessionHistoryService } from './session-history.service';
import { VocabularyMedalService } from './vocabulary-medal.service';
import { buildVocabularyOptions } from './vocabulary-options';
import { VocabularyProgressService } from './vocabulary-progress.service';
import { MedalState } from '../models/medal.model';
import { DailyLearningService, getSpainDayKey } from './daily-learning.service';
import { WorkspaceService } from './workspace.service';
import {VocabularyUndoStore} from './vocabulary-undo-store';

interface State { readonly practice:boolean; readonly session:VocabularyLearningSession; readonly queue:readonly string[]; readonly queueIndex:number; readonly revealed:boolean; readonly feedback:VocabularySessionFeedback|null; readonly owner:string; readonly epoch:number; readonly day:string; readonly fresh:readonly string[]; readonly lesson?:VocabularyDailyLesson }
@Injectable({providedIn:'root'})
export class VocabularySessionService {
  readonly clock=createStudyClock();
  private readonly attempts=inject(AttemptRecordingService);private attemptSession?:AttemptRecordingSession;
  private readonly weaknesses=inject(WeaknessService);private readonly progress=inject(VocabularyProgressService);
  private readonly lessons=inject(VocabularyLessonRepository);private readonly settings=inject(VocabularySettingsService);
  private readonly history=inject(SessionHistoryService);private readonly medals=inject(VocabularyMedalService);
  private readonly dailyLearning=inject(DailyLearningService);private readonly workspace=inject(WorkspaceService);
  private readonly undoStore=inject(VocabularyUndoStore);private undoRequested=false;
  readonly undoBusy=this.undoStore.busy;
  readonly canUndo=computed(()=>{this.dailyLearning.spainDay();const s=this.state();return !!s&&!s.practice&&!s.session.completedAt&&!this.error()&&this.undoStore.eligible(s.session.id);});
  private readonly state=signal<State|null>(null);private readonly medalState=signal<readonly MedalState[]>([]);
  private pending:{id:string;at:Date;rating:StudyRating;source:'objective'|'self';key:string;durationSeconds:number}|null=null;
  private keepResults=false;
  private quickSelection:string|null=null;
  readonly error=signal(false);
  readonly isPractice=computed(()=>this.state()?.practice??false);
  readonly session=computed(()=>this.state()?.session??null);
  readonly newlyUnlockedMedals=this.medalState.asReadonly();
  readonly currentUnit=computed(()=>{const s=this.state();return !s||s.session.completedAt?null:s.session.units.find(u=>u.key===s.queue[s.queueIndex])??null;});
  readonly currentEntry=computed(()=>{const u=this.currentUnit();return u?VOCABULARY_N5.find(e=>e.id===u.entryId)??null:null;});
  readonly currentItem=computed(()=>this.session()?.items.find(i=>i.studyKey===this.currentUnit()?.key)??null);
  readonly feedback=computed(()=>this.state()?.feedback??null);readonly revealed=computed(()=>this.state()?.revealed??false);
  readonly completed=computed(()=>Boolean(this.session()?.completedAt));
  readonly initialReviewCount=computed(()=>this.isPractice()?0:this.session()?.items.filter(i=>i.initialRating!==null).length??0);
  readonly repeatedWordCount=computed(()=>this.session()?.items.filter(i=>i.attempts>2).length??0);
  readonly resolvedCount=computed(()=>this.session()?.items.filter(i=>i.resolved).length??0);
  readonly progressPercent=computed(()=>this.session()?.sessionSize?this.resolvedCount()/this.session()!.sessionSize*100:0);
  readonly ratingCounts=computed(()=>({again:this.session()?.items.reduce((n,i)=>n+(i.againCount??Number(i.initialRating==='again')),0)??0,hard:this.session()?.items.reduce((n,i)=>n+(i.hardCount??Number(i.initialRating==='hard')),0)??0,good:this.session()?.items.reduce((n,i)=>n+(i.goodCount??Number(i.initialRating==='good')),0)??0}));
  readonly firstTrySuccessCount=computed(()=>this.session()?.items.filter(i=>i.initialRating==='good').length??0);
  readonly firstTryPercentage=computed(()=>this.session()?.sessionSize?Math.round(this.firstTrySuccessCount()/this.session()!.sessionSize*100):0);
  constructor(){effect(()=>{const owner=this.workspace.active(),epoch=this.workspace.activationRevision();untracked(()=>{const s=this.state();if(s&&(s.owner!==owner||s.epoch!==epoch))this.clear();});});}
  start(mode:LearningMode){if(this.undoBusy())return false;try{const recovery=this.undoStore.pendingLesson();if(recovery){this.restore(this.lessons.active()??recovery,true);this.undoRequested=true;this.error.set(true);return true;}this.progress.recover?.();if(this.progress.error?.())return false;const lesson=this.lessons.active();if(lesson)return this.restore(lesson);if(this.progress.completedToday?.())return false;return this.initialize(this.progress.buildRound(),mode,false);}catch{this.error.set(true);return false;}}
  undoError(){return this.undoRequested;}
  private restore(saved:VocabularyDailyLesson,recovery=false,preserveClock=false){
    const lesson=consolidateVocabularyLesson(saved);if(lesson!==saved)this.lessons.save(lesson);
    this.clear(!preserveClock);const session=structuredClone(lesson.session),queue=[...(lesson.pendingKeys??[])];
    const state:State={session,lesson,practice:false,queue,queueIndex:0,revealed:false,feedback:null,owner:this.workspace.active(),epoch:this.workspace.activationRevision(),day:lesson.day,fresh:[]};
    this.clock.restoreCommitted(lesson.durationSeconds);this.state.set(state);if(!queue.length&&!recovery)this.finish(state);else if(queue.length)this.markAppearance();return true;
  }
  startPractice(units:readonly VocabularyStudyUnit[],mode:LearningMode='quick-practice'){
    try{this.undoStore.assertIdle();}catch{this.error.set(true);return false;}
    const valid=units.filter(u=>VOCABULARY_N5.some(e=>e.id===u.entryId&&e.enabled)&&VOCABULARY_QUESTION_TYPES.includes(u.questionType));
    return this.initialize([...new Map(valid.map(u=>[u.entryId+':'+u.questionType,{...u,key:'vocab:'+u.entryId+':'+u.questionType}])).values()],mode,true);
  }
  private initialize(units:readonly VocabularyStudyUnit[],mode:LearningMode,practice:boolean){
    if(!practice){const seen=new Set<string>();units=units.filter(u=>{if(seen.has(u.entryId))return false;seen.add(u.entryId);return true;});}if(!units.length)return false;this.clear();const now=new Date();
    const session:VocabularyLearningSession={id:crypto.randomUUID(),startedAt:now.toISOString(),completedAt:null,mode,sessionSize:units.length,units,items:units.map(u=>({...this.newItem(u),...(!practice?{consecutiveCorrect:0,againCount:0,hardCount:0,goodCount:0}:{})})),attempts:0};
    let lesson:VocabularyDailyLesson|undefined;
    if(!practice){const kinds=this.progress.lessonPlan?.().kinds??Object.fromEntries(units.map(u=>[u.key,this.progress.get?.(u.key)?'review':'new']));lesson={version:2,pendingKeys:units.map(u=>u.key),legacyResolvedKeys:[],day:getSpainDayKey(now),size:this.settings.selection().lessonSize===15?15:10,kinds,session:structuredClone(session),durationSeconds:0};try{this.lessons.save(lesson);}catch{this.error.set(true);return false;}}
    this.attemptSession=this.attempts.begin('vocabulary','learn',session.id);
    this.state.set({session,practice,lesson,queue:units.map(u=>u.key),queueIndex:0,revealed:false,feedback:null,owner:this.workspace.active(),epoch:this.workspace.activationRevision(),day:getSpainDayKey(now),fresh:units.filter(u=>!this.progress.get?.(u.key)).map(u=>u.key)});
    this.markAppearance();return true;
  }
  private valid(){const s=this.state();if(!s||s.owner!==this.workspace.active()||s.epoch!==this.workspace.activationRevision()){this.clear();return false;}return true;}
  options(language:AppLanguage){const u=this.currentUnit(),s=this.session();return u&&s?buildVocabularyOptions(u,VOCABULARY_N5,language,`${s.id}:${u.key}`):[];}
  answerQuick(id:string){const s=this.state(),u=this.currentUnit();if(this.undoBusy()||this.undoRequested||!this.valid()||!s||!u||s.feedback)return;if(!this.pending)this.quickSelection=id;const correct=id===u.entryId;if(this.register(correct?'good':'again','objective'))this.patch({feedback:{correct,selectedId:id,correctId:u.entryId}});}
  continueQuick(){if(!this.undoBusy()&&!this.undoRequested&&this.valid()&&this.state()?.feedback){if(this.isPractice()&&!this.feedback()!.correct&&!this.currentItem()?.resolved)this.practiceRepeat('again');this.advance();}}
  reveal(){if(!this.undoBusy()&&!this.undoRequested&&this.valid()&&this.currentUnit())this.patch({revealed:true});}
  rate(rating:StudyRating){if(this.undoBusy()||this.undoRequested||!this.valid()||!this.revealed()||!this.currentUnit())return;if(this.register(rating,'self')){if(this.isPractice()&&rating!=='good'&&!this.currentItem()?.resolved)this.practiceRepeat(rating);this.advance();}}
  async undo(){const s=this.state();if(this.undoBusy()||!s||s.practice||!this.valid()||(!this.undoRequested&&!this.canUndo()))return;
    this.undoRequested=true;this.clock.pause();
    try{const lesson=await this.undoStore.undo(s.session.id);if(!this.valid()||this.state()?.session.id!==s.session.id)return;this.progress.recover();this.restore(lesson,false,true);this.error.set(false);}
    catch{if(this.valid()&&this.state()?.session.id===s.session.id)this.error.set(true);}
  }
  retry(){const p=this.pending;if(!p||!this.valid())return;if(p.source==='self')this.rate(p.rating);else{const u=this.currentUnit();if(u)this.answerQuick(this.quickSelection??(p.rating==='good'?u.entryId:''));}}
  restart(mode=this.session()?.mode??'quick-practice'){return this.isPractice()?this.startPractice(this.session()!.units,mode):this.start(mode);}
  retainResults(){this.keepResults=this.completed();}
  leave(){if(this.keepResults){this.keepResults=false;this.clock.detach();}else this.clear();}
  clear(detachClock=true){this.clock.reset();if(detachClock)this.clock.detach();this.state.set(null);this.medalState.set([]);this.pending=null;this.error.set(false);this.keepResults=false;this.quickSelection=null;this.undoRequested=false;}
  dismissNextMedal(){this.medalState.update(v=>v.slice(1));}
  sessionWords(difficult=false){if(!this.valid())return[];const s=this.session();if(!s)return[];const keys=new Set(s.items.filter(i=>i.attempts>0&&(!difficult||i.needsPractice)).map(i=>i.studyKey));return [...new Set(s.units.filter(u=>keys.has(u.key)).map(u=>u.entryId))];}
  private register(rating:StudyRating,source:'objective'|'self'):boolean{
    const s=this.state(),u=this.currentUnit();if(!s||!u)return false;
    const first=this.currentItem()?.attempts===0;
    const pending=this.pending??{id:`${s.session.id}:fsrs:${s.session.attempts+1}:${crypto.randomUUID()}`,at:new Date(),rating,source,key:u.key,durationSeconds:this.clock.committedSeconds+this.clock.appearanceMilliseconds()/1000};
    if(pending.key!==u.key||pending.rating!==rating||pending.source!==source)return false;
    this.pending=pending;
    const items=s.session.items.map(item=>item.studyKey!==u.key?item:{...item,attempts:item.attempts+1,initialRating:item.initialRating??rating,resolved:s.practice?(rating==='good'||item.appearances>=4):(rating==='good'&&(item.consecutiveCorrect??0)+1>=2),...(!s.practice?{consecutiveCorrect:rating==='good'?Math.min(2,(item.consecutiveCorrect??0)+1):0}:{}),needsPractice:item.needsPractice||rating!=='good',againCount:(item.againCount??0)+Number(rating==='again'),hardCount:(item.hardCount??0)+Number(rating==='hard'),goodCount:(item.goodCount??0)+Number(rating==='good')});
    const nextSession={...s.session,items,attempts:s.session.attempts+1};
    const nextQueue=[...s.queue.slice(s.queueIndex+1),...(!items.find(i=>i.studyKey===u.key)!.resolved?[u.key]:[])];
    const lesson=s.lesson?{...s.lesson,pendingKeys:nextQueue,session:nextSession,durationSeconds:pending.durationSeconds}:undefined;
    try{
      if(!s.practice){
        const attempt={version:1 as const,id:`${s.session.id}:vocabulary:learn:${s.session.attempts+1}:${pending.id}`,occurredAt:pending.at.toISOString(),module:'vocabulary' as const,activity:'learn' as const,itemId:u.entryId,questionType:u.questionType,sessionId:s.session.id,firstAttempt:first,result:source==='objective'?{source,correct:rating==='good'}:{source,rating}};
        if(first)this.progress.recordReview(u,rating,rating==='good',s.session.id,pending.at,attempt,pending.id,lesson);
        else this.progress.recordInternalAttempt(attempt,lesson!);
      }
      else this.attemptSession?.record(u.entryId,source==='objective'?{source,correct:rating==='good'}:{source,rating},u.questionType,first);
    }catch{this.clock.pause();this.error.set(true);return false;}
    if(s.practice)this.weaknesses.recordLearn('vocabulary',u.entryId,u.questionType,rating);

    if(!s.practice&&source==='self')this.clock.restoreCommitted(pending.durationSeconds);else if(!s.practice)this.clock.resume();this.state.set({...s,lesson,session:nextSession});this.pending=null;this.error.set(false);return true;
  }
  private advance(){
    let s=this.state();if(!s||s.session.completedAt)return;if(s.practice)this.clock.commitAppearance();
    if(s.practice){const next=s.queueIndex+1;if(next<s.queue.length){this.state.set({...s,queueIndex:next,feedback:null,revealed:false});this.markAppearance();return;}this.finish(s);return;}
    if(s.feedback&&s.lesson){const durationSeconds=this.clock.committedSeconds+this.clock.appearanceMilliseconds()/1000;const lesson={...s.lesson,durationSeconds:Math.max(s.lesson.durationSeconds,durationSeconds)};try{this.lessons.save(lesson);}catch{this.clock.pause();this.error.set(true);return;}this.clock.restoreCommitted(lesson.durationSeconds);s={...s,lesson};this.state.set(s);this.error.set(false);}
    const queue=s.lesson?.pendingKeys??[];
    if(!queue.length){this.finish(s);return;}
    this.state.set({...s,queue:[...queue],queueIndex:0,feedback:null,revealed:false});this.markAppearance();
  }

  /** Existing voluntary practice only; never used by normal FSRS learning. */
  private practiceRepeat(rating:'again'|'hard'){
    const s=this.state(),u=this.currentUnit();if(!s||!u||!s.practice)return;
    const at=Math.min(s.queueIndex+1+(rating==='again'?2:4),s.queue.length);
    this.patch({queue:[...s.queue.slice(0,at),u.key,...s.queue.slice(at)]});
  }
  private finish(s:State){
    if(s.session.completedAt)return;
    if(!s.practice){try{this.undoStore.assertIdle();}catch{this.error.set(true);return;}}
    const now=new Date(),session={...s.session,sessionSize:s.session.items.filter(i=>i.attempts>0).length,completedAt:now.toISOString()};
    if(!s.practice){
      const ids=[...new Set(session.units.filter(u=>session.items.some(i=>i.studyKey===u.key&&i.attempts>0)).map(u=>u.entryId))];
      try{this.history.record({module:'vocabulary',sessionId:session.id,completedAt:session.completedAt,mode:session.mode,exercisesCompleted:session.items.filter(i=>i.attempts>0).length,firstTrySuccesses:session.items.filter(i=>i.initialRating==='good').length,attempts:session.attempts,needsPracticeCount:session.items.filter(i=>i.needsPractice).length,durationSeconds:this.clock.committedSeconds,questionTypes:[...new Set(session.units.map(u=>u.questionType))],vocabularyEntryIds:ids,vocabularyCategories:[...new Set(VOCABULARY_N5.filter(e=>ids.includes(e.id)).map(e=>e.studyCategory))]},{strict:true});if(s.lesson)this.lessons.save({...s.lesson,session,durationSeconds:this.clock.committedSeconds});}catch{this.state.set({...s,queue:[],queueIndex:0,revealed:false,feedback:null});this.error.set(true);return;}
    }
    this.state.set({...s,session,feedback:null,revealed:false});if(!s.practice){this.dailyLearning.refresh(now);this.medalState.set(this.medals.evaluateUnlocks(now));}
  }
  retryFinish(){if(this.undoRequested){void this.undo();return;}const s=this.state();if(s&&!this.currentUnit()&&this.valid())this.finish(s);else if(s?.feedback&&!this.pending)this.continueQuick();else this.retry();}
  private markAppearance(){const s=this.state(),u=this.currentUnit();if(!s||!u)return;this.clock.startAppearance();const seen=new Set(s.session.items.filter(i=>i.appearances>0).map(i=>i.studyKey));const units=seen.has(u.key)?s.session.units:[...s.session.units.filter(unit=>seen.has(unit.key)),u,...s.session.units.filter(unit=>unit.key!==u.key&&!seen.has(unit.key))];this.state.set({...s,session:{...s.session,units,items:s.session.items.map(i=>i.studyKey===u.key?{...i,appearances:i.appearances+1}:i)}});}
  private patch(p:Partial<State>){this.state.update(s=>s?{...s,...p}:null);}
  private newItem(u:VocabularyStudyUnit):SessionItem{return{studyKey:u.key,attempts:0,appearances:0,initialRating:null,resolved:false,needsPractice:false};}
}
