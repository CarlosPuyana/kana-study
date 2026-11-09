import {computed,inject,Injectable,linkedSignal,signal} from '@angular/core';
import {AdjectivePractice,ConjugationStatsBucket} from '../models/conjugation-practice.model';
import {ConjugationPracticeIntent} from '../models/conjugations.model';
import {adjectiveQuestions} from './conjugation-questions';
import {validateConjugationAnswer} from './conjugation-answer-validator';
import {ConjugationStatsService} from './conjugation-stats.service';
import {WorkspaceService} from './workspace.service';

/** Page-scoped; leaving or switching workspace discards the current round, not its saved counters. */
@Injectable()
export class ConjugationPracticeService {
  readonly stats=inject(ConjugationStatsService);
  private readonly workspace=inject(WorkspaceService);
  private readonly state=linkedSignal<AdjectivePractice|null>(()=>{this.workspace.activationRevision();return null;});
  readonly session=this.state.asReadonly();
  readonly question=computed(()=>{const s=this.state();return s&&!s.complete?s.questions[s.index]:null;});
  readonly saveError=signal(false);
  readonly bucket=computed<ConjugationStatsBucket>(()=>{const s=this.state();return s?.intent.mode==='single'?s.intent.categoryIds[0] as ConjugationStatsBucket:'mixed';});
  start(intent:ConjugationPracticeIntent):boolean {
    const old=this.state(),questions=adjectiveQuestions(intent,Math.random,old?.questions[old.index]?.id);
    this.saveError.set(false);if(!questions.length){this.state.set(null);return false;}
    this.state.set({intent:{mode:intent.mode,categoryIds:[...intent.categoryIds]},questions,epoch:this.workspace.activationRevision(),index:0,streak:0,correct:0,feedback:null,complete:false});return true;
  }
  answer(value:string,unknown=false):boolean {
    const s=this.state(),q=this.question();if(!s||!q||s.feedback||s.complete||(!unknown&&!value.trim()))return false;
    const correct=!unknown&&validateConjugationAnswer(value,q.answers),streak=correct?s.streak+1:0;
    try{this.stats.record(this.bucket(),correct,streak);}catch{this.saveError.set(true);return false;}
    this.saveError.set(false);this.state.set({...s,streak,correct:s.correct+(correct?1:0),feedback:unknown?'unknown':correct?'correct':'wrong'});return true;
  }
  next():boolean {const s=this.state();if(!s?.feedback||s.complete)return false;this.state.set(s.index+1===s.questions.length?{...s,complete:true}:{...s,index:s.index+1,feedback:null});return true;}
}
