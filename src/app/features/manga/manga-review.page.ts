import { afterRenderEffect, Component, computed, ElementRef, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { StudyTimer } from '../../shared/components/study-timer/study-timer';
import { TranslationService } from '../../core/services/translation.service';
import { MangaStudySavedRepository } from '../../core/services/manga-study-saved.repository';
import { MangaReviewHistoryService } from '../../core/services/manga-review-history.service';
import { MangaReviewSessionService } from '../../core/services/manga-review-session.service';
import { generateMangaReview } from '../../core/services/manga-review-generator';
import { MangaReviewMode } from '../../core/models/manga-review.model';

@Component({selector: 'app-manga-review-page', imports: [RouterLink, PageHeader, StudyTimer],
  providers: [MangaReviewSessionService], styleUrl: './manga-review.scss', template: `
  <main><app-page-header titleKey="manga.review.title" backRoute="/manga/study" />
  @if(session.state()==='intro'){
    <section class="panel"><h2 tabindex="-1">{{i18n.t('manga.review.configure')}}</h2>
      @if(saved.loading()){<p role="status">{{i18n.t('common.loading')}}</p>}
      @if(saved.failed()){<p role="alert">{{i18n.t('manga.saved.error')}}</p><button (click)="saved.reload()">{{i18n.t('manga.catalog.retry')}}</button>}
      <p>{{i18n.t('manga.review.available',{count:eligible().length})}}</p>
      @if(!eligible().length && !saved.loading()){
        <p>{{i18n.t(saved.items().length?'manga.review.noData':'manga.saved.emptyHelp')}}</p><a routerLink="/manga">{{i18n.t('manga.saved.back')}}</a>
      }
      <fieldset><legend>{{i18n.t('manga.review.count')}}</legend><div class="actions">
        @for(value of counts; track value){<button [attr.aria-pressed]="count()===value" (click)="count.set(value)">{{value==='all'?i18n.t('manga.review.all'):value}}</button>}
      </div></fieldset>
      <fieldset><legend>{{i18n.t('manga.review.mode')}}</legend><div class="actions">
        @for(value of modes;track value){<button [attr.aria-pressed]="mode()===value" (click)="mode.set(value)">{{i18n.t('manga.review.'+value)}}</button>}
      </div></fieldset><p>{{i18n.t('manga.review.selected',{count:selectedCount()})}}</p>
      <p>{{i18n.t('manga.review.contextHelp')}}</p>
      <button class="primary" [disabled]="saved.loading()||saved.failed()||!selectedCount()" (click)="start()">{{i18n.t('manga.review.start')}}</button>
    </section>
  }@else{
    <section class="panel">
    <app-study-timer [clock]="session.clock" [result]="session.state()!=='question'" />
    @if(session.error()){<p role="alert">{{i18n.t('manga.review.persistError')}}</p>
      <button data-retry [disabled]="session.busy()" (click)="session.state()==='question'?session.retryAnswer():session.next()">{{i18n.t('manga.catalog.retry')}}</button>}
    @if(session.state()==='question'||session.state()==='feedback'){
      <p>{{i18n.t('manga.review.counter',{current:session.index()+1,total:session.questions().length})}}</p>
      <progress [value]="session.index()+(session.state()==='feedback'?1:0)" [max]="session.questions().length" [attr.aria-label]="i18n.t('manga.review.progress')"></progress>
      @if(session.current();as q){
        <h2 tabindex="-1">{{i18n.t('manga.review.question.'+q.type)}}</h2>
        @if(q.context;as context){<blockquote lang="ja">{{context.before}}<mark>{{context.surface}}</mark>{{context.after}}</blockquote>
          <p>{{i18n.t('manga.review.dictionaryForm')}}: <span lang="ja">{{q.item.expression}}</span></p>
          <small>{{i18n.t('manga.review.lexicalContext')}}</small>
        }@else{<p class="prompt" [attr.lang]="q.type==='expression'?null:'ja'">{{q.prompt}}</p>}
        @if(q.originalMeaning && q.type!=='reading'){<small>{{i18n.t('manga.review.originalMeaning')}}</small>}
        @if(session.state()==='question'){
          @if(q.options.length){<div class="options">
            @for(option of q.options;track option){<button [disabled]="session.busy()||session.error()" (click)="session.answer(option===q.answer)">{{option}}</button>}
          </div>}@else{
            <p>{{i18n.t('manga.review.selfHelp')}}</p>
            @if(!session.revealed()){<button [disabled]="session.busy()||session.error()" (click)="session.reveal()">{{i18n.t('manga.review.reveal')}}</button>}
            @else{<p class="answer">{{q.answer}}</p><div class="actions">
              <button data-recall [disabled]="session.busy()||session.error()" (click)="session.answer(true)">{{i18n.t('manga.review.remembered')}}</button>
              <button [disabled]="session.busy()||session.error()" (click)="session.answer(false)">{{i18n.t('manga.review.forgot')}}</button>
            </div>}
          }
        }@else{
          <p role="status">{{i18n.t(session.correct()?'manga.review.correct':'manga.review.incorrect')}}</p>
          <p class="answer">{{q.answer}}</p>
          <button data-continue class="primary" [disabled]="session.busy()||session.error()" (click)="session.next()">{{i18n.t('manga.review.continue')}}</button>
        }
      }
    }@else if(session.result();as result){
      <h2 tabindex="-1">{{i18n.t('manga.review.results')}}</h2>
      <p class="score">{{result.accuracy}}%</p><p>{{i18n.t('manga.review.firstRound',{correct:result.firstCorrect,total:result.uniqueWords})}}</p>
      <dl><dt>{{i18n.t('manga.review.words')}}</dt><dd>{{result.uniqueWords}}</dd>
        <dt>{{i18n.t('manga.review.errors')}}</dt><dd>{{result.initialErrors}}</dd>
        <dt>{{i18n.t('manga.review.recovered')}}</dt><dd>{{result.recovered}}</dd>
        <dt>{{i18n.t('manga.review.remaining')}}</dt><dd>{{result.remainingErrors}}</dd>
        <dt>{{i18n.t('manga.review.appearances')}}</dt><dd>{{result.appearances}}</dd></dl>
      <div class="actions"><button (click)="session.abandon()">{{i18n.t('manga.review.repeat')}}</button><a routerLink="/manga/study">{{i18n.t('manga.review.back')}}</a></div>
    }
    </section>
  }
  </main>`})
export class MangaReviewPage {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly i18n = inject(TranslationService);
  readonly saved = inject(MangaStudySavedRepository);
  readonly history = inject(MangaReviewHistoryService);
  readonly session = inject(MangaReviewSessionService);
  readonly counts = [5, 10, 'all'] as const;
  readonly modes: readonly MangaReviewMode[] = ['mixed', 'contextual'];
  readonly count = signal<5 | 10 | 'all'>(5);
  readonly mode = signal<MangaReviewMode>('mixed');
  readonly eligible = computed(() => generateMangaReview({items:this.saved.items(),language:this.i18n.language(),mode:this.mode(),count:'all',history:this.history.events(),seed:0}));
  readonly selectedCount = computed(() => this.count()==='all'?this.eligible().length:Math.min(Number(this.count()),this.eligible().length));
  constructor() {
    let initial = true;
    afterRenderEffect(() => {
      const state = this.session.state(), revealed = this.session.revealed(), error = this.session.error();this.session.index();
      if (initial && state === 'intro') {initial = false;return;}
      initial = false;
      const selector = error ? '[data-retry]' : state === 'feedback' ? '[data-continue]' : state === 'question' && revealed ? '[data-recall]' : 'h2';
      this.element.nativeElement.querySelector<HTMLElement>(selector)?.focus({preventScroll:true});
    });
  }
  start(): void { this.session.start(generateMangaReview({items:this.saved.items(),language:this.i18n.language(),mode:this.mode(),count:this.count(),history:this.history.events(),seed:crypto.getRandomValues(new Uint32Array(1))[0]})); }
}
