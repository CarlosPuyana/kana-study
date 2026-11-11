import {KanjiUndoStore} from './kanji-undo-store';
import {KanjiRoundRepository,KanjiRoundSnapshot} from './kanji-round.repository';
import {getSpainDayKey} from './daily-learning.service';
import {computed,effect,inject,Injectable,signal,untracked} from '@angular/core';
import {createStudyClock} from './study-clock';
import {KANJI_QUESTION_TYPES,KanjiStudyUnit} from '../models/kanji.model';
import {KANJI_N5} from '../../data/kanji-n5.generated';
import {AppLanguage} from '../models/country.model';
import {KanjiLearningSession,KanjiSessionFeedback} from '../models/kanji-session.model';
import {LearningMode,SessionItem} from '../models/learning-session.model';
import {MedalState} from '../models/medal.model';
import {StudyRating} from '../models/progress.model';
import {LocalWorkspaceId} from '../models/account.model';
import {buildKanjiOptions,kanjiMeaning} from './kanji-options';
import {KanjiProgressService} from './kanji-progress.service';
import {KanjiMedalService} from './kanji-medal.service';
import {DailyLearningService} from './daily-learning.service';
import {WorkspaceService} from './workspace.service';
import {KanjiAnswerIntent,KanjiAnswerStore} from './kanji-answer-store';

interface State {readonly owner:LocalWorkspaceId;readonly epoch:number;readonly practice:boolean;readonly session:KanjiLearningSession;readonly queue:readonly string[];readonly queueIndex:number;readonly revealed:boolean;readonly feedback:KanjiSessionFeedback|null;}
export const KANJI_MAX_APPEARANCES=4;
const AGAIN_GAP=2,HARD_GAP=4;
@Injectable({providedIn:'root'})
export class KanjiSessionService {
  readonly clock=createStudyClock();
  private readonly workspace=inject(WorkspaceService);
  private readonly rounds=inject(KanjiRoundRepository);
  private readonly undoStore=inject(KanjiUndoStore);private undoRequested=false;
  readonly canUndo=computed(()=>{const s=this.activeState();return !!s&&!s.practice&&!s.session.completedAt&&!this.error()&&!this.saving()&&this.undoStore.eligible(s.session.id);});
  private readonly store=inject(KanjiAnswerStore);
  private readonly progress=inject(KanjiProgressService);
  private readonly medals=inject(KanjiMedalService);
  private readonly dailyLearning=inject(DailyLearningService);
  private readonly state=signal<State|null>(null);
  private readonly medalState=signal<readonly MedalState[]>([]);
  private pending:{intent:KanjiAnswerIntent;rating:StudyRating;source:'objective'|'self';selectedId?:string}|null=null;
  private choice:{rating:StudyRating;source:'objective'|'self';selectedId?:string;at:string}|null=null;
  private generation=0;
  private transitionPending=false;
  readonly saving=signal(false);
  readonly error=signal(false);
  private readonly activeState=computed(()=>{const s=this.state();return s&&s.owner===this.workspace.active()&&s.epoch===this.workspace.activationRevision()?s:null;});
  readonly isPractice=computed(()=>this.activeState()?.practice??false);
  readonly session=computed(()=>this.activeState()?.session??null);
  readonly newlyUnlockedMedals=computed(()=>this.activeState()?this.medalState():[]);
  readonly currentUnit=computed(()=>{const s=this.activeState();return s&&!s.session.completedAt?s.session.units.find(u=>u.key===s.queue[s.queueIndex])??null:null;});
  readonly currentKanji=computed(()=>{const u=this.currentUnit();return u?KANJI_N5.find(k=>k.id===u.kanjiId)??null:null;});
  readonly currentItem=computed(()=>{const u=this.currentUnit();return u?this.session()?.items.find(i=>i.studyKey===u.key)??null:null;});
  readonly feedback=computed(()=>this.activeState()?.feedback??null);
  readonly revealed=computed(()=>this.activeState()?.revealed??false);
  readonly completed=computed(()=>Boolean(this.session()?.completedAt));
  readonly resolvedCount=computed(()=>this.session()?.items.filter(i=>i.resolved).length??0);
  readonly progressPercent=computed(()=>this.session()?.sessionSize?this.resolvedCount()/this.session()!.sessionSize*100:0);
  readonly firstTrySuccessCount=computed(()=>this.session()?.items.filter(i=>i.initialRating==='good').length??0);
  readonly firstTryPercentage=computed(()=>this.session()?.sessionSize?Math.round(this.firstTrySuccessCount()/this.session()!.sessionSize*100):0);
  constructor(){effect(()=>{const owner=this.workspace.active(),epoch=this.workspace.activationRevision();untracked(()=>{const s=this.state();if(s&&(s.owner!==owner||s.epoch!==epoch))this.clear();});});}
  private valid():boolean {if(this.activeState())return true;this.clear();return false;}
  async recover():Promise<boolean>{if(this.undoStore.pending())return true;const epoch=this.workspace.activationRevision();try{await this.store.recover();if(epoch!==this.workspace.activationRevision())return false;this.error.set(false);return true;}catch{if(epoch===this.workspace.activationRevision())this.error.set(true);return false;}}
  resume(){try{const saved=this.rounds.active();if(!saved&&this.undoStore.pending()){this.error.set(true);return false;}return saved?this.start(saved.session.mode):false;}catch{this.error.set(true);return false;}}
  start(mode:LearningMode){this.dailyLearning.refresh();if(this.dailyLearning.isCompletedToday('kanji'))return false;try{const saved=this.rounds.active();if(saved){this.clear();this.clock.restoreCommitted(saved.durationSeconds);this.state.set({...saved,practice:false,epoch:this.workspace.activationRevision()});this.transitionPending=saved.advancePending;if(this.undoStore.pending()){this.undoRequested=true;this.error.set(true);}else if(saved.advancePending)this.advance();return true;}}catch{this.error.set(true);return false;}return this.initialize(this.progress.buildRound(),mode,false);}
  startPractice(units:readonly KanjiStudyUnit[],mode:LearningMode='quick-practice'){
    const valid=units.filter(u=>KANJI_N5.some(e=>e.id===u.kanjiId&&e.enabled)&&KANJI_QUESTION_TYPES.includes(u.questionType));
    const unique=[...new Map(valid.map(u=>[u.kanjiId+':'+u.questionType,{...u,key:'kanji:'+u.kanjiId+':'+u.questionType}])).values()];
    return this.initialize(unique,mode,true);
  }
  private initialize(units:readonly KanjiStudyUnit[],mode:LearningMode,practice:boolean){
    if(this.saving()||this.undoStore.busy()||this.undoStore.pending())return false;
    try{if(this.store.hasPending()){this.error.set(true);return false;}}catch{this.error.set(true);return false;}
    if(!units.length)return false;this.clear();
    const session:KanjiLearningSession={id:crypto.randomUUID(),startedAt:new Date().toISOString(),completedAt:null,mode,sessionSize:units.length,units,items:units.map(u=>this.newItem(u)),attempts:0};
    this.state.set({owner:this.workspace.active(),epoch:this.workspace.activationRevision(),session,practice,queue:units.map(u=>u.key),queueIndex:0,revealed:false,feedback:null});this.markAppearance();try{this.persistRound();return true;}catch{this.state.set(null);this.error.set(true);return false;}
  }
  options(language:AppLanguage){const u=this.currentUnit(),s=this.session();return u&&s?buildKanjiOptions(u,KANJI_N5,language,s.id+':'+u.key):[];}
  meaning(language:AppLanguage){const k=this.currentKanji();return k?kanjiMeaning(k,language):'';}
  async answerQuick(id:string){
    if(this.undoRequested||!this.valid()||this.saving()||this.transitionPending||this.feedback()||this.completed())return;
    const u=this.currentUnit(),generation=this.generation;if(!u)return;
    if(await this.register(id===u.kanjiId?'good':'again','objective',id)&&generation===this.generation&&this.valid())
      this.patch({feedback:{correct:id===u.kanjiId,selectedId:id,correctId:u.kanjiId}});
  }
  continueQuick(){if(this.undoRequested||!this.valid()||this.saving()||!this.feedback())return;if(!this.transitionPending){if(!this.feedback()!.correct&&!this.currentItem()?.resolved)this.enqueue('again');this.transitionPending=true;}this.advance();}
  reveal(){if(this.valid()&&!this.saving()&&!this.error()){this.patch({revealed:true});try{this.persistRound();}catch{this.error.set(true);}}}
  async rate(rating:StudyRating){
    if(this.undoRequested||!this.valid()||this.saving()||this.transitionPending||!this.revealed()||this.completed())return;
    const generation=this.generation;
    if(await this.register(rating,'self')&&generation===this.generation&&this.valid()){if(rating!=='good'&&!this.currentItem()?.resolved)this.enqueue(rating);this.transitionPending=true;this.advance();}
  }
  async undo(){const s=this.activeState();if(!s||s.practice||this.saving()||(!this.undoRequested&&!this.canUndo()))return;const generation=this.generation;this.undoRequested=true;this.saving.set(true);this.clock.pause();try{const restored=await this.undoStore.undo(s.session.id);if(generation!==this.generation||!this.valid())return;this.state.set({...restored,practice:false,epoch:s.epoch});this.clock.restoreCommitted(restored.durationSeconds);this.clock.startAppearance();this.choice=null;this.pending=null;this.transitionPending=false;this.undoRequested=false;this.error.set(false);}catch{if(generation===this.generation&&this.activeState())this.error.set(true);}finally{if(generation===this.generation)this.saving.set(false);}}
  async retry(){
    if(this.undoRequested){await this.undo();return;}
    if(this.saving()||!this.valid())return;
    if(this.transitionPending){this.advance();return;}
    if(this.error()&&!this.choice){try{this.persistRound();this.error.set(false);}catch{this.error.set(true);}return;}
    const p=this.choice;if(!p)return;
    if(p.source==='self')await this.rate(p.rating);else await this.answerQuick(p.selectedId!);
  }
  restart(mode=this.session()?.mode??'quick-practice'){return this.isPractice()?this.startPractice(this.session()!.units,mode):this.start(mode);}
  clear(){++this.generation;this.clock.reset();this.clock.detach();this.state.set(null);this.medalState.set([]);this.pending=null;this.choice=null;this.transitionPending=false;this.undoRequested=false;this.saving.set(false);this.error.set(false);}
  dismissNextMedal(){this.medalState.update(v=>v.slice(1));}
  private async register(rating:StudyRating,source:'objective'|'self',selectedId?:string):Promise<boolean>{
    const s=this.activeState(),u=this.currentUnit();if(!s||!u)return false;
    const generation=this.generation,first=this.currentItem()?.initialRating===null;
    const choice=this.choice??{rating,source,selectedId,at:new Date().toISOString()};
    if(choice.rating!==rating||choice.source!==source||choice.selectedId!==selectedId)return false;
    this.choice=choice;
    this.saving.set(true);this.clock.pause();
    try{
      if(!this.pending){
        const items=s.session.items.map(item=>item.studyKey!==u.key?item:{...item,attempts:item.attempts+1,initialRating:item.initialRating??rating,resolved:item.resolved||rating==='good'||item.appearances>=KANJI_MAX_APPEARANCES,needsPractice:item.needsPractice||rating!=='good'});
        const roundBefore=this.rounds.active()??undefined;
        const queue=[...s.queue];if(source==='self'&&rating!=='good'&&!items.find(i=>i.studyKey===u.key)!.resolved)queue.splice(Math.min(s.queueIndex+1+(rating==='again'?AGAIN_GAP:HARD_GAP),queue.length),0,u.key);
        const roundAfter=roundBefore?{...roundBefore,queue,durationSeconds:this.clock.committedSeconds+this.clock.appearanceMilliseconds()/1000,session:{...s.session,items,attempts:s.session.attempts+1},revealed:s.revealed,feedback:source==='objective'?{correct:rating==='good',selectedId:selectedId!,correctId:u.kanjiId}:null,advancePending:source==='self'}:undefined;
        const intent=this.store.prepare({roundBefore:s.practice?undefined:roundBefore,roundAfter:s.practice?undefined:roundAfter,rating,unit:u,progress:s.practice?'none':first?'review':'practice',attempt:{version:1,id:s.session.id+':kanji:learn:'+(s.session.attempts+1)+':'+crypto.randomUUID(),
          occurredAt:choice.at,module:'kanji',activity:'learn',itemId:u.kanjiId,questionType:u.questionType,sessionId:s.session.id,firstAttempt:first,
          result:source==='objective'?{source,correct:rating==='good'}:{source,rating}}});
        this.pending={intent,rating,source,selectedId};
      }
      const p=this.pending;if(p.rating!==rating||p.source!==source||p.selectedId!==selectedId)return false;
      await this.store.commit(p.intent,s.epoch);
      if(generation!==this.generation||!this.valid())return false;
      const resolved=rating==='good';
      const items=s.session.items.map(item=>item.studyKey!==u.key?item:{...item,attempts:item.attempts+1,initialRating:item.initialRating??rating,
        resolved:item.resolved||resolved||(!resolved&&item.appearances>=KANJI_MAX_APPEARANCES),needsPractice:item.needsPractice||rating!=='good'});
      this.state.set({...s,session:{...s.session,items,attempts:s.session.attempts+1}});this.pending=null;this.choice=null;this.error.set(false);this.clock.resume();return true;
    }catch{if(generation===this.generation&&this.activeState())this.error.set(true);return false;}
    finally{if(generation===this.generation)this.saving.set(false);}
  }
  private enqueue(rating:Exclude<StudyRating,'good'>){const s=this.activeState(),u=this.currentUnit();if(!s||!u)return;const gap=rating==='again'?AGAIN_GAP:HARD_GAP,at=Math.min(s.queueIndex+1+gap,s.queue.length);this.patch({queue:[...s.queue.slice(0,at),u.key,...s.queue.slice(at)]});}
  private advance(){
    const s=this.activeState();if(!s||s.session.completedAt)return;this.clock.commitAppearance();const next=s.queueIndex+1;
    if(next>=s.queue.length){
      const now=new Date(),session={...s.session,completedAt:now.toISOString()};
      try{if(!s.practice)this.store.finish({module:'kanji',sessionId:session.id,completedAt:session.completedAt,mode:session.mode,exercisesCompleted:session.sessionSize,
        firstTrySuccesses:session.items.filter(i=>i.initialRating==='good').length,attempts:session.attempts,needsPracticeCount:session.items.filter(i=>i.needsPractice).length,
        durationSeconds:this.clock.committedSeconds,questionTypes:[...new Set(session.units.map(u=>u.questionType))],kanjiIds:[...new Set(session.units.map(u=>u.kanjiId))]},s.owner,s.epoch);if(!s.practice)this.rounds.close(session.id,s.epoch);}
      catch{this.error.set(true);return;}
      this.state.set({...s,session,feedback:null,revealed:false});this.transitionPending=false;this.error.set(false);
      if(!s.practice){this.dailyLearning.refresh(now);this.medalState.set(this.medals.evaluateUnlocks(now));}return;
    }
    this.state.set({...s,queueIndex:next,feedback:null,revealed:false});this.transitionPending=false;this.error.set(false);this.markAppearance();try{this.persistRound();}catch{this.state.set(s);this.transitionPending=true;this.error.set(true);}
  }
  private markAppearance(){const s=this.activeState(),u=this.currentUnit();if(!s||!u)return;this.clock.startAppearance();this.state.set({...s,session:{...s.session,items:s.session.items.map(i=>i.studyKey===u.key?{...i,appearances:i.appearances+1}:i)}});}
  private persistRound(){const s=this.activeState();if(s&&!s.practice&&!s.session.completedAt)this.rounds.save({version:1,owner:s.owner,day:getSpainDayKey(new Date(s.session.startedAt)),session:s.session,queue:s.queue,queueIndex:s.queueIndex,revealed:s.revealed,feedback:s.feedback,durationSeconds:this.clock.committedSeconds,advancePending:this.transitionPending},s.epoch);}
  private patch(p:Partial<State>){this.state.update(s=>s?{...s,...p}:null);}
  private newItem(u:KanjiStudyUnit):SessionItem{return{studyKey:u.key,attempts:0,appearances:0,initialRating:null,resolved:false,needsPractice:false};}
}
