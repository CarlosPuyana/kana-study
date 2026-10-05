import { ChangeDetectionStrategy, Component, effect, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslationService } from '../../../core/services/translation.service';
import { GrammarProgressService } from '../../../core/services/grammar-progress.service';
import { GrammarPractice } from '../models/grammar.model';
import { GrammarPracticeSession } from '../services/grammar-practice-session';
import { GrammarExerciseComponent } from './grammar-exercise';

@Component({selector:'app-grammar-practice',imports:[RouterLink,GrammarExerciseComponent],providers:[GrammarPracticeSession],changeDetection:ChangeDetectionStrategy.OnPush,template:`
  <div class="practice-app">
    <header class="practice-topbar"><a class="practice-back" [routerLink]="['/grammar/n5',practice().topicId]" [attr.aria-label]="i18n.t('common.back')">←</a><div class="practice-top-title"><span>{{i18n.t('grammar.topic',{number:practice().topicId})}}</span><strong>{{i18n.t('grammar.practice')}}</strong></div><div class="practice-progress-area"><span>{{session.stage()==='intro'?0:session.stage()==='results'?session.total():session.index()+1}} / {{session.total()}}</span><div class="practice-progress-track"><div [style.width.%]="session.stage()==='intro'||!session.total()?0:(session.index()+1)/session.total()*100"></div></div></div></header>
    <main class="practice-main">
      @if(session.reviewing()){<p class="error-review-mode" role="status">{{i18n.t('grammar.reviewingErrors')}}</p>}
      @if(session.stage()==='intro'){
        <section class="practice-intro"><div class="practice-intro-icon">{{practice().icon}}</div><span class="eyebrow">{{i18n.t(practice().intro.eyebrowKey)}}</span><h1>{{i18n.t(practice().intro.titleKey)}}</h1><p [innerHTML]="i18n.t(practice().intro.bodyKey)"></p><div class="practice-intro-grid">@for(stat of practice().stats;track $index){<div><span>{{stat.value}}</span><small>{{i18n.t(stat.labelKey)}}</small></div>}</div><div class="practice-philosophy">@for(key of practice().philosophyKeys;track key){<div>{{i18n.t(key==='grammar.n5.practice.memory'?'grammar.interactive.history':key)}}</div>}</div><button class="practice-start" (click)="start()">{{i18n.t('grammar.start')}}</button></section>
      } @else if(session.stage()==='question'){
        <section class="practice-question-shell">@if(session.current();as exercise){<app-grammar-exercise [exercise]="exercise" [practice]="true" [last]="session.index()===session.total()-1" (answered)="answer($event)" (continued)="next()"/>}<aside class="practice-tip-card"><div class="practice-tip-icon">💡</div><h3>{{i18n.t(practice().tip.titleKey)}}</h3><p [innerHTML]="i18n.t(practice().tip.bodyKey)"></p></aside></section>
      } @else {
        <section class="practice-results"><div class="results-icon">🏁</div><span class="eyebrow">{{i18n.t(practice().resultEyebrowKey)}}</span><h1>{{i18n.t('grammar.completed')}}</h1><div class="results-score" [style.--score]="session.score()/session.total()*100+'%'"><span>{{session.score()}}</span><small>/ {{session.total()}}</small></div><p>{{i18n.t('grammar.interactive.result',{correct:session.score(),total:session.total(),percent:session.percent(),errors:session.total()-session.score()})}}</p><p>{{i18n.t('grammar.interactive.practicedTopics',{topics:session.topicIds().join(', ')||practice().topicId})}}</p><p>{{i18n.t(session.resultKey(),{number:practice().topicId})}}</p><div class="results-breakdown">@for(area of practice().areas;track area.titleKey){<div class="result-area"><span class="result-area-icon">{{area.symbol}}</span><div><strong>{{i18n.t(area.titleKey)}}</strong><p>{{i18n.t(area.bodyKey)}}</p></div></div>}</div><section class="practice-errors"><h2>{{i18n.t('grammar.errorSummary')}}</h2>@if(session.errorConcepts().length){<ul>@for(error of session.errorConcepts();track error.id){<li>{{i18n.t(error.errorCategoryKey??error.topicKey)}}</li>}</ul><button class="primary-link button-link" (click)="session.reviewErrors()">{{i18n.t('grammar.reviewErrors')}}</button>}@else{<p>{{i18n.t('grammar.noErrors')}}</p>}</section><div class="results-actions"><button class="secondary-link button-link" (click)="start()">{{i18n.t('grammar.retry')}}</button><a class="secondary-link" routerLink="/grammar">{{i18n.t('grammar.roadmap')}}</a><a class="primary-link" [routerLink]="practice().nextPath">{{i18n.t(practice().nextLabelKey)}}</a></div></section>
      }
    </main>
  </div>
`})
export class GrammarPracticeComponent {
  readonly progress=inject(GrammarProgressService);
  private attemptedAt='';
  readonly practice=input.required<GrammarPractice>();readonly session=inject(GrammarPracticeSession);readonly i18n=inject(TranslationService);
  constructor(){effect(()=>this.session.reset(this.practice().exercises));}
  start():void{this.attemptedAt=new Date().toISOString();this.session.start();}
  answer(correct:boolean):void{
    if(this.session.checked())return;
    const exercise=this.session.current();this.session.answer(correct);
    if(!correct&&exercise)this.progress.flagDifficulty(exercise.conceptId??exercise.id,exercise.id);
  }
  next():void{
    const wasQuestion=this.session.stage()==='question';this.session.next();
    if(wasQuestion&&this.session.stage()==='results'){
      if(this.session.reviewing())this.progress.finishReview(this.session.roundExercises().map((exercise,index)=>({conceptId:exercise.conceptId??exercise.id,exerciseId:exercise.id,correct:this.session.answers()[index]})));
      else if(!this.practice().exercises.every(e=>e.lessonId&&e.lessonId===this.practice().exercises[0]?.lessonId))this.progress.recordPractice(this.practice().topicId,this.session.score(),this.session.total(),this.session.errorConcepts().map(exercise=>exercise.conceptId??exercise.id),this.attemptedAt);
    }
    window.scrollTo({top:0,behavior:'smooth'});
  }
}
