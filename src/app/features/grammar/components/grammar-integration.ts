import {ChangeDetectionStrategy,Component,computed,effect,inject,input,untracked} from '@angular/core';
import {RouterLink} from '@angular/router';
import {TranslationService} from '../../../core/services/translation.service';
import {GrammarV2ProgressService} from '../../../core/services/grammar-v2-progress.service';
import {GRAMMAR_V2_INTEGRATION} from '../../../data/grammar/grammar-n5-v2.generated';
import {GrammarExerciseComponent} from './grammar-exercise';
import {GrammarPracticeSession} from '../services/grammar-practice-session';

@Component({selector:'app-grammar-integration',imports:[RouterLink,GrammarExerciseComponent],providers:[GrammarPracticeSession],changeDetection:ChangeDetectionStrategy.OnPush,template:`
  <section class="topic-content integration-content">
    <a class="secondary-link" routerLink="/grammar/n5/11">← {{i18n.t('grammar.v2.integration.title')}}</a>
    <h2>{{i18n.t(section()?.titleKey??(activityId()==='00'?'grammar.v2.integration.intro':'grammar.v2.integration.title'))}}</h2>
    <p>{{i18n.t('grammar.v2.integration.progress',{completed:completed(),total:8})}}</p>
    <progress [value]="completed()" max="8" [attr.aria-label]="i18n.t('grammar.progressState.completion')"></progress>
    @if(progress.coreCompleted()){<p role="status">{{i18n.t('grammar.v2.integration.n5Complete')}}</p>}
    @if(activityId()==='00'){
      <section class="lesson-note"><p>{{i18n.t('grammar.v2.integration.method')}}</p><p>{{i18n.t('grammar.v2.integration.valid')}}</p></section>
      <a class="primary-link" routerLink="/grammar/n5/11/01">{{i18n.t('grammar.v2.integration.next')}}</a>
    } @else if(section();as section){
      <p>{{i18n.t(section.bodyKey)}}</p><p>{{i18n.t('grammar.v2.integration.solved',{solved:solved(),total:section.exercises.length})}}</p>
      @if(session.stage()==='intro'){
        @if(solved()>0&&solved()<section.exercises.length){<button class="primary-link button-link" (click)="start(true)">{{i18n.t('grammar.v2.retry')}}</button>}
        <button class="primary-link button-link" (click)="start()">{{i18n.t('grammar.start')}}</button>
      } @else if(session.stage()==='question'){
        <p class="lesson-exercise-count" aria-live="polite">{{i18n.t('grammar.exerciseStep',{current:session.index()+1,total:session.total()})}}</p>
        @if(session.current();as exercise){<app-grammar-exercise [exercise]="exercise" [practice]="true" [last]="session.index()===session.total()-1" (answered)="answer($event)" (continued)="session.next()"/>}
      } @else {
        <p role="status">{{i18n.t('grammar.v2.integration.'+(progress.integrationStatus(section.id)==='completed'?'activityComplete':'pending'))}}</p>
        @if(solved()<section.exercises.length){<button class="primary-link button-link" (click)="start(true)">{{i18n.t('grammar.v2.retry')}}</button>}
        <button class="secondary-link button-link" (click)="start()">{{i18n.t('grammar.retry')}}</button>
        <a class="primary-link" [routerLink]="nextPath()">{{i18n.t('grammar.v2.integration.next')}}</a>
      }
    } @else {
      <p>{{i18n.t('grammar.v2.integration.goal')}}</p><p>{{i18n.t('grammar.v2.integration.pending')}}</p>
      <nav class="lesson-grid" [attr.aria-label]="i18n.t('grammar.v2.integration.title')">
        <a class="lesson-note" routerLink="/grammar/n5/11/00">{{i18n.t('grammar.v2.integration.intro')}} · {{i18n.t('grammar.progressState.'+progress.integrationStatus('00'))}}</a>
        @for(section of sections;track section.id){<a class="lesson-note" [routerLink]="['/grammar/n5/11',section.id]"><strong>{{i18n.t(section.titleKey)}}</strong><p>{{i18n.t('grammar.progressState.'+progress.integrationStatus(section.id))}}</p><p>{{i18n.t('grammar.v2.integration.solved',{solved:solvedFor(section.id),total:section.exercises.length})}}</p></a>}
      </nav>
      <a class="primary-link" [routerLink]="progress.integrationContinuePath()">{{i18n.t('grammar.continue')}}</a>
    }
  </section>
`,styles:[`:host{display:block;min-width:0}.integration-content{max-width:1100px}.integration-content progress{width:100%;accent-color:var(--primary)}.integration-content nav{margin-block:1rem}.integration-content nav a{color:var(--text-primary);text-decoration:none;overflow-wrap:anywhere}.integration-content button,.integration-content>a{margin-block:.5rem;margin-inline-end:.5rem}.integration-content a:focus-visible,.integration-content button:focus-visible{outline:2px solid var(--primary);outline-offset:3px}`]})
export class GrammarIntegrationComponent {
  readonly activityId=input<string|null>(null);readonly sections=GRAMMAR_V2_INTEGRATION;
  readonly section=computed(()=>this.sections.find(s=>s.id===this.activityId())??null);
  readonly progress=inject(GrammarV2ProgressService);readonly i18n=inject(TranslationService);readonly session=inject(GrammarPracticeSession);
  readonly completed=computed(()=>Number(this.progress.integrationStatus('00')==='completed')+this.sections.filter(s=>s.track==='core'&&this.progress.integrationStatus(s.id)==='completed').length);
  readonly solved=computed(()=>this.solvedFor(this.section()?.id??''));
  readonly nextPath=computed(()=>{const id=this.section()?.id;if(!id||id==='07'||id==='bridge')return '/grammar/review';return `/grammar/n5/11/${String(Number(id)+1).padStart(2,'0')}`;});
  constructor(){effect(()=>{const id=this.activityId(),section=this.section();untracked(()=>{if(id)this.progress.openIntegration(id);this.session.reset(section?.exercises??[]);});});}
  solvedFor(id:string):number{return this.sections.find(s=>s.id===id)?.exercises.filter(e=>this.progress.state().integration?.activities[id]?.answers[e.id]?.solved).length??0;}
  start(pending=false):void {
    const section=this.section();if(!section)return;const answered=this.progress.state().integration?.activities[section.id]?.answers??{};
    this.session.reset(pending?section.exercises.filter(e=>!answered[e.id]?.solved):section.exercises);this.session.start();
  }
  answer(correct:boolean):void {
    if(this.session.stage()!=='question'||this.session.checked())return;
    const exercise=this.session.current();this.session.answer(correct);
    if(exercise&&this.section())this.progress.recordIntegration(this.section()!.id,exercise.id,correct);
  }
}
