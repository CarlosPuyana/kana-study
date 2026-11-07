import { computed, inject, Injectable, signal } from '@angular/core';
import { VOCABULARY_N5 } from '../../data/vocabulary-n5.generated';
import { AttemptEvent } from '../models/attempt-event.model';
import { VOCABULARY_CATEGORIES, VOCABULARY_QUESTION_TYPES, VocabularyStudyUnit } from '../models/vocabulary.model';
import { VocabularyReviewEvent, VocabularyRoundSummary, VocabularyStudyProgress } from '../models/vocabulary-study.model';
import { ProgressStats, StudyRating } from '../models/progress.model';
import { SpacedRepetitionService } from './spaced-repetition.service';
import { StorageService, workspaceStorageSignal } from './storage.service';
import { VocabularySettingsService } from './vocabulary-settings.service';
import { vocabularyStudyUnits } from './vocabulary-selection';
import { buildVocabularyLesson } from './vocabulary-round-builder';
import { VocabularyLessonRepository } from './vocabulary-lesson.repository';
import { VocabularyDailyLesson } from '../models/vocabulary-lesson.model';
import { DailyLearningService, getSpainDayKey } from './daily-learning.service';
import { VocabularyReviewStore } from './vocabulary-review-store';
import { SessionHistoryService } from './session-history.service';

export const VOCABULARY_ROUND_SIZE = 10; // Legacy default size; the current lesson uses the 10/15 preference.
@Injectable({providedIn:'root'})
export class VocabularyProgressService {
  private readonly storage=inject(StorageService);
  private readonly settings=inject(VocabularySettingsService);
  private readonly fsrs=inject(SpacedRepetitionService);
  private readonly store=inject(VocabularyReviewStore);
  readonly lessons=inject(VocabularyLessonRepository);
  private readonly daily=inject(DailyLearningService);
  private readonly history=inject(SessionHistoryService);
  private readonly state=workspaceStorageSignal(()=>this.store.progress());
  private readonly events=workspaceStorageSignal(()=>this.store.events());
  readonly error=signal(false);
  readonly allProgress=this.state.asReadonly(); readonly reviewEvents=this.events.asReadonly();
  readonly activeUnits=computed(()=>vocabularyStudyUnits(VOCABULARY_N5,this.settings.selection()));
  readonly stats=computed<ProgressStats>(()=>{
    this.daily.spainDay(); let newCount=0,pendingCount=0,memorizedCount=0,dueCount=0;const now=new Date(),day=getSpainDayKey(now);
    for(const u of this.activeUnits()){const p=this.state()[u.key];
      if(!p||p.fsrs.state==='new')newCount++;else if(p.fsrs.state==='review')memorizedCount++;else pendingCount++;
      if(p&&getSpainDayKey(new Date(p.fsrs.due))<=day)dueCount++;
    }
    const total=this.activeUnits().length;return{total,newCount,pendingCount,memorizedCount,dueCount,percentage:total?Math.round(memorizedCount/total*100):0};
  });
  readonly roundSummary=computed<VocabularyRoundSummary>(()=>{
    this.daily.spainDay();const round=this.lessonPlan().units,p=this.state(),s=this.settings.selection();
    return{enabledLevels:Number(s.levels.N5),totalLevels:1,enabledCategories:VOCABULARY_CATEGORIES.filter(c=>s.categories[c]).length,totalCategories:VOCABULARY_CATEGORIES.length,enabledQuestionTypes:s.questionTypes.length,totalQuestionTypes:VOCABULARY_QUESTION_TYPES.length,available:this.activeUnits().length,due:this.stats().dueCount,newCount:this.stats().newCount,roundSize:round.length,roundDue:round.filter(u=>this.lessonKinds()[u.key]==='review').length,roundNew:round.filter(u=>this.lessonKinds()[u.key]==='new').length,roundAdditional:round.filter(u=>this.lessonKinds()[u.key]==='direction').length,roundRemaining:this.buildRound().length};
  });
  constructor(){this.recover();}
  get(key:string){return this.state()[key]??null;}
  activeLesson(){try{return this.lessons.active();}catch{this.error.set(true);return null;}}
  completedToday(now=new Date()){if(this.activeLesson())return false;return this.lessons.completed(now)||this.introductionsClosed(now);}
  private introductionsClosed(now:Date){return this.history.sessions().some(s=>s.module==='vocabulary'&&s.exercisesCompleted>0&&getSpainDayKey(new Date(s.completedAt))===getSpainDayKey(now));}
  lessonPlan(now=new Date()){
    this.daily.spainDay();const active=this.activeLesson();if(active)return{units:active.session.units,kinds:active.kinds};
    if(this.completedToday(now))return{units:[],kinds:{}};
    return buildVocabularyLesson({units:this.activeUnits(),progress:this.state(),now,limit:this.settings.selection().lessonSize===15?15:10,knownEntryIds:new Set(this.events().map(e=>e.entryId))});
  }
  private lessonKinds(){return this.lessonPlan().kinds;}
  buildRound(now=new Date(),_selectedNew?:readonly string[]){const active=this.activeLesson();return active?active.session.units.filter(u=>!active.session.items.find(i=>i.studyKey===u.key)?.resolved):this.lessonPlan(now).units;}
  recover(){try{this.store.recover();this.lessons.all();this.state.set(this.store.progress());this.events.set(this.store.events());this.error.set(false);void this.store.flushAttempts();}catch{this.error.set(true);}}
  recordReview(unit:VocabularyStudyUnit,rating:StudyRating,firstTry:boolean,sessionId:string,now=new Date(),attempt?:AttemptEvent,eventId:string=crypto.randomUUID(),lesson?:VocabularyDailyLesson):VocabularyReviewEvent {
    try{
      this.store.recover();const previous=this.store.events().find(e=>e.id===eventId);
      if(previous){if(previous.key!==unit.key||previous.sessionId!==sessionId||previous.rating!==rating)throw Error('Vocabulary receipt conflict');this.state.set(this.store.progress());this.events.set(this.store.events());this.error.set(false);void this.store.flushAttempts();return previous;}
      const current=this.store.progress()[unit.key],iso=now.toISOString(),nextFsrs=this.fsrs.review(current?.fsrs??null,rating,now);
      const next:VocabularyStudyProgress={...unit,fsrs:nextFsrs,firstSeenAt:current?.firstSeenAt??iso,lastSeenAt:iso,totalAttempts:(current?.totalAttempts??0)+1,totalFirstTrySuccesses:(current?.totalFirstTrySuccesses??0)+Number(firstTry),totalFailures:(current?.totalFailures??0)+Number(rating==='again'),lastRating:rating};
      const event:VocabularyReviewEvent={...unit,...(lesson?.version===2?{lessonVersion:2 as const}:{}),id:eventId,sessionId,rating,reviewedAt:iso,fsrsBefore:current?.fsrs??null,fsrsAfter:nextFsrs};
      this.store.commit({progress:next,event,attempt,lesson});
      this.state.set(this.store.progress());this.events.set(this.store.events());this.error.set(false);void this.store.flushAttempts();return event;
    }catch(error){this.error.set(true);throw error;}
  }
  recordInternalAttempt(attempt:AttemptEvent,lesson:VocabularyDailyLesson):void {
    try{this.store.commitPractice(attempt,lesson);this.state.set(this.store.progress());this.error.set(false);void this.store.flushAttempts();}
    catch(error){this.error.set(true);throw error;}
  }
  flushAttempts(){return this.store.flushAttempts();}
  /** Legacy API retained for compatible consumers; normal learning no longer calls it. */
  recordPracticeAttempt(unit:VocabularyStudyUnit,success:boolean,now=new Date()){
    const current=this.state()[unit.key];if(!current)return;
    const next={...this.state(),[unit.key]:{...current,lastSeenAt:now.toISOString(),totalAttempts:current.totalAttempts+1,totalFailures:current.totalFailures+Number(!success)}};
    this.storage.set('kana-study.vocabulary-progress.v1',next,{strict:true});this.state.set(next);
  }
}
