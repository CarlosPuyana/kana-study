import { afterRenderEffect, Component, computed, DestroyRef, ElementRef, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { State } from 'ts-fsrs';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { StudyTimer } from '../../shared/components/study-timer/study-timer';
import { TranslationService } from '../../core/services/translation.service';
import { MangaStudySavedRepository } from '../../core/services/manga-study-saved.repository';
import { MangaFsrsService } from '../../core/services/manga-fsrs.service';
import { MangaFsrsSessionService } from '../../core/services/manga-fsrs-session.service';
import { mangaFsrsQueue } from '../../core/services/manga-fsrs-scheduler';

@Component({selector:'app-manga-fsrs-page', imports:[RouterLink, PageHeader, StudyTimer],
  providers:[MangaFsrsSessionService], styleUrl:'./manga-review.scss', template:`
  <main><app-page-header titleKey="manga.fsrs.title" backRoute="/manga/study" />
    <section class="panel">
    @if(session.state()==='intro'){
      <h2 tabindex="-1">{{i18n.t('manga.fsrs.title')}}</h2>
      <p>{{i18n.t('manga.fsrs.help')}}</p>
      <button role="switch" [attr.aria-checked]="fsrs.enabled()" (click)="toggle()">{{i18n.t('manga.fsrs.enabled')}}</button>
      @if(toggleError()){<p role="alert">{{i18n.t('manga.review.persistError')}}</p>}
      @if(saved.loading()){<p role="status">{{i18n.t('common.loading')}}</p>}
      @if(saved.failed()){<p role="alert">{{i18n.t('manga.saved.error')}}</p><button (click)="saved.reload()">{{i18n.t('manga.catalog.retry')}}</button>}
      @if(fsrs.enabled()){
        <dl><dt>{{i18n.t('manga.fsrs.due')}}</dt><dd>{{due()}}</dd>
          <dt>{{i18n.t('manga.fsrs.new')}}</dt><dd>{{fresh()}}</dd>
          <dt>{{i18n.t('manga.fsrs.next')}}</dt><dd>{{nextLabel()}}</dd></dl>
        @if(fsrs.ineligible()){<p>{{i18n.t('manga.fsrs.ineligible',{count:fsrs.ineligible()})}}</p>}
        <p>{{i18n.t('manga.fsrs.limit')}}</p>
        @if(!queue().length && !saved.loading()){<p role="status">{{i18n.t('manga.fsrs.empty')}}</p>}
        <button class="primary" [disabled]="saved.loading()||saved.failed()||!queue().length" (click)="session.start()">{{i18n.t('manga.fsrs.start')}}</button>
      }
      <p><a routerLink="/manga/study/review">{{i18n.t('manga.fsrs.free')}}</a></p>
    }@else{
      <app-study-timer [clock]="session.clock" [result]="session.revealed()||session.state()==='results'" />
      @if(session.error()){<p role="alert">{{i18n.t('manga.review.persistError')}}</p><button data-retry [disabled]="session.busy()" (click)="session.retry()">{{i18n.t('manga.catalog.retry')}}</button>}
      @if(session.state()==='question'){
        @if(session.current();as row){
          <h2 tabindex="-1" lang="ja">{{row.item.expression}}</h2>
          @if(row.context;as context){<blockquote lang="ja">{{context.before}}<mark>{{context.surface}}</mark>{{context.after}}</blockquote>}
          @if(!session.revealed()){<button data-reveal (click)="session.reveal()">{{i18n.t('manga.review.reveal')}}</button>}
          @else{
            @if(row.reading){<p class="answer" lang="ja">{{row.reading}}</p>}
            @if(row.meaning){<p class="answer">{{row.meaning}}</p>}
            <div class="actions">
              <button data-rating="again" [disabled]="session.busy()||session.error()" (click)="session.rate('again')">{{i18n.t('manga.fsrs.again')}}</button>
              <button data-rating="good" [disabled]="session.busy()||session.error()" (click)="session.rate('good')">{{i18n.t('manga.fsrs.good')}}</button>
            </div>
          }
        }
      }@else{
        <h2 tabindex="-1">{{i18n.t('manga.fsrs.results')}}</h2>
        <div class="actions"><button (click)="session.abandon()">{{i18n.t('manga.review.back')}}</button><a routerLink="/manga/study/review">{{i18n.t('manga.fsrs.free')}}</a></div>
      }
    }
    </section>
  </main>`})
export class MangaFsrsPage {
  readonly fsrs = inject(MangaFsrsService);
  readonly session = inject(MangaFsrsSessionService);
  readonly saved = inject(MangaStudySavedRepository);
  readonly i18n = inject(TranslationService);
  readonly toggleError = signal(false);
  private readonly now = signal(Date.now());
  readonly due = computed(() => this.fsrs.cards().filter(row => row.card.state !== State.New && row.card.due <= this.now()).length);
  readonly fresh = computed(() => this.fsrs.cards().filter(row => row.card.state === State.New).length);
  readonly queue = computed(() => mangaFsrsQueue(this.fsrs.cards(), this.now()));
  readonly nextLabel = computed(() => {
    const dates = this.fsrs.cards().filter(row => row.card.state !== State.New && row.card.due > this.now()).map(row => row.card.due);
    return dates.length ? new Intl.DateTimeFormat(this.i18n.language(), {dateStyle:'medium',timeStyle:'short'}).format(Math.min(...dates)) : this.i18n.t('manga.fsrs.none');
  });
  constructor() {
    const element = inject<ElementRef<HTMLElement>>(ElementRef);
    const timer = setInterval(() => this.now.set(Date.now()), 1000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
    let initial = true;
    afterRenderEffect(() => {
      const state = this.session.state(), revealed = this.session.revealed(), error = this.session.error();this.session.index();
      if (initial) {initial = false;return;}
      element.nativeElement.querySelector<HTMLElement>(error ? '[data-retry]' : state === 'question' ? revealed ? '[data-rating="again"]' : '[data-reveal]' : 'h2')?.focus({preventScroll:true});
    });
  }
  toggle(): void {
    try {this.fsrs.setEnabled(!this.fsrs.enabled());this.toggleError.set(false);}
    catch {this.toggleError.set(true);}
  }
}
