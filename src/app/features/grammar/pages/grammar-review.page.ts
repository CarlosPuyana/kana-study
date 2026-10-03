import { ChangeDetectionStrategy, Component, effect, inject, untracked, ViewEncapsulation } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GrammarProgressService } from '../../../core/services/grammar-progress.service';
import { TranslationService } from '../../../core/services/translation.service';
import { GrammarExerciseComponent } from '../components/grammar-exercise';
import { GrammarPracticeSession } from '../services/grammar-practice-session';

@Component({selector: 'app-grammar-review', imports: [RouterLink, GrammarExerciseComponent], providers: [GrammarPracticeSession],
  styleUrls: ['./grammar-roadmap.scss', './grammar-lesson.scss', './grammar-practice.scss', './grammar.page.scss'], encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush, template: `
  <div class="grammar-shell"><div class="practice-app">
    <header class="practice-topbar"><a class="practice-back" routerLink="/grammar" [attr.aria-label]="i18n.t('grammar.roadmap')">←</a><h1>{{i18n.t('grammar.progressState.review')}}</h1></header>
    <main class="practice-main">
      @if(!session.total()){
        <section class="practice-intro"><p>{{i18n.t('grammar.progressState.noDifficulties')}}</p><a class="primary-link" routerLink="/grammar">{{i18n.t('grammar.roadmap')}}</a></section>
      } @else if(session.stage()==='intro'){
        <section class="practice-intro"><h2>{{i18n.t('grammar.progressState.review')}}</h2><p>{{i18n.t('grammar.progressState.reviewDescription',{total:session.total()})}}</p><button class="practice-start" (click)="session.start()">{{i18n.t('grammar.start')}}</button></section>
      } @else if(session.stage()==='question'){
        <p class="lesson-exercise-count" aria-live="polite">{{i18n.t('grammar.exerciseStep',{current:session.index()+1,total:session.total()})}}</p>
        @if(session.current();as exercise){<app-grammar-exercise [exercise]="exercise" [practice]="true" [last]="session.index()===session.total()-1" (answered)="answer($event)" (continued)="next()"/>}
      } @else {
        <section class="practice-results"><h2>{{i18n.t('grammar.completed')}}</h2><p>{{session.score()}} / {{session.total()}}</p><p>{{i18n.t('grammar.progressState.reviewRemaining',{count:progress.difficulties().length})}}</p><div class="results-actions">@if(progress.difficulties().length){<button class="secondary-link button-link" (click)="reset()">{{i18n.t('grammar.progressState.review')}}</button>}<a class="primary-link" routerLink="/grammar">{{i18n.t('grammar.roadmap')}}</a></div></section>
      }
    </main>
  </div></div>`})
export class GrammarReviewPage {
  readonly progress = inject(GrammarProgressService);
  readonly session = inject(GrammarPracticeSession);
  readonly i18n = inject(TranslationService);
  constructor() {
    this.reset();
    effect(() => {
      if (this.session.stage() !== 'intro') return;
      const exercises = this.progress.buildReview();
      untracked(() => this.session.reset(exercises));
    });
  }
  reset(): void { this.session.reset(this.progress.buildReview()); }
  answer(correct: boolean): void {
    if (this.session.checked()) return;
    const exercise = this.session.current(); this.session.answer(correct);
    if (!correct && exercise?.conceptId) this.progress.flagDifficulty(exercise.conceptId, exercise.id);
  }
  next(): void {
    const wasQuestion = this.session.stage() === 'question'; this.session.next();
    if (wasQuestion && this.session.stage() === 'results') this.progress.finishReview(this.session.roundExercises().map((exercise, index) => ({conceptId: exercise.conceptId!, exerciseId: exercise.id, correct: this.session.answers()[index]})));
    window.scrollTo({top: 0});
  }
}
