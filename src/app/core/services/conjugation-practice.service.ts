import {ConjugationSelectionService} from './conjugation-selection.service';
import {computed,inject,Injectable,linkedSignal,signal} from '@angular/core';
import {ConjugationPractice,ConjugationStatsBucket} from '../models/conjugation-practice.model';
import {ConjugationPracticeIntent} from '../models/conjugations.model';
import {practiceQuestions} from './conjugation-questions';
import {validateConjugationAnswer} from './conjugation-answer-validator';
import {ConjugationStatsService} from './conjugation-stats.service';
import {WorkspaceService} from './workspace.service';
import {createStudyClock} from './study-clock';

/** Page-scoped; leaving or switching workspace discards the current round, not its saved counters. */
@Injectable()
export class ConjugationPracticeService {
  private readonly selection=inject(ConjugationSelectionService);
  readonly stats=inject(ConjugationStatsService);
  readonly clock=createStudyClock();
  private pendingTimeMs:number|null=null;
  private readonly workspace=inject(WorkspaceService);
  private readonly state=linkedSignal<ConjugationPractice|null>(()=>{this.workspace.activationRevision();return null;});
  readonly session=computed(()=>{const s=this.state();return s&&s.intent.categoryIds.every(id=>this.selection.isUnlocked(id))?s:null;});
  readonly question=computed(()=>{const s=this.session();return s&&!s.complete?s.questions[s.index]:null;});
  readonly saveError=signal(false);
  readonly bucket=computed<ConjugationStatsBucket>(()=>{const s=this.state();return s?.intent.mode==='single'?s.intent.categoryIds[0] as ConjugationStatsBucket:'mixed';});
  start(intent:ConjugationPracticeIntent):boolean {
    if(!intent.categoryIds.every(id=>this.selection.isUnlocked(id))){this.state.set(null);return false;}
    const old=this.state(),questions=practiceQuestions(intent,Math.random,old?.questions[old.index]?.id);
    this.clock.reset();this.pendingTimeMs=null;
    this.saveError.set(false);if(!questions.length){this.state.set(null);return false;}
    this.state.set({intent:{mode:intent.mode,categoryIds:[...intent.categoryIds],...(intent.adjectiveTypes?{adjectiveTypes:{...intent.adjectiveTypes}}:{})},questions,epoch:this.workspace.activationRevision(),index:0,streak:0,correct:0,feedback:null,complete:false});this.clock.startAppearance();return true;
  }
  answer(value:string,unknown=false):boolean {
    const s=this.state(),q=this.question();if(s&&!s.intent.categoryIds.every(id=>this.selection.isUnlocked(id))){this.state.set(null);return false;}if(!s||!q||s.feedback||s.complete||(!unknown&&!value.trim()))return false;
    const correct=!unknown&&validateConjugationAnswer(value,q.answers),streak=correct?s.streak+1:0;
    // Freeze on the first submission, including a failed-save retry. No feedback/wait credit.
    if(this.pendingTimeMs===null){this.clock.pause();this.pendingTimeMs=this.clock.appearanceMilliseconds();}
    try{this.stats.record(this.bucket(),correct,streak,this.pendingTimeMs/1000);}catch{this.saveError.set(true);return false;}
    this.clock.commitAppearance();this.pendingTimeMs=null;
    this.saveError.set(false);this.state.set({...s,streak,correct:s.correct+(correct?1:0),feedback:unknown?'unknown':correct?'correct':'wrong'});return true;
  }
  next():boolean {const s=this.state();if(s&&!s.intent.categoryIds.every(id=>this.selection.isUnlocked(id))){this.state.set(null);return false;}if(!s?.feedback||s.complete)return false;const complete=s.index+1===s.questions.length;this.state.set(complete?{...s,complete:true}:{...s,index:s.index+1,feedback:null});if(!complete)this.clock.startAppearance();return true;}
}
