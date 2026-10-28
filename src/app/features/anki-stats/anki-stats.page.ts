import {LocalDeckNotice} from '../../shared/components/local-deck-notice/local-deck-notice';
import { ChangeDetectionStrategy, Component, effect, inject, untracked, OnInit, OnDestroy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DeckStudyStatistics } from '../../core/models/deck-study.model';
import { DeckStudyService } from '../../core/services/deck-study.service';
import { TranslationService } from '../../core/services/translation.service';
import { createDeckRouteResource } from '../../core/services/deck-route-resource';

@Component({ selector: 'app-anki-stats-page', imports: [LocalDeckNotice,RouterLink], templateUrl: './anki-stats.page.html', styleUrl: './anki-stats.page.scss', changeDetection: ChangeDetectionStrategy.OnPush,
  host:{'(window:focus)':'refresh()', '(document:visibilitychange)':'refresh()'} })
export class AnkiStatsPage implements OnInit,OnDestroy {
  private generation=0;
  private timer?:ReturnType<typeof setInterval>;
  refresh():void {if(!document.hidden)void this.ngOnInit();}
  ngOnDestroy():void {++this.generation;clearInterval(this.timer);}
  private readonly study = inject(DeckStudyService);
  readonly i18n = inject(TranslationService);
  readonly resource = createDeckRouteResource();
  get deck() { return this.resource.deck; }
  title(): string { return this.resource.title(this.i18n); }
  readonly stats = signal<DeckStudyStatistics | null>(null);
  readonly error = signal(false);

  constructor(){effect(()=>{this.resource.state();this.resource.catalog.owner();untracked(()=>{this.stats.set(null);void this.ngOnInit();});});}

  async ngOnInit(): Promise<void> {
    if(!this.timer)this.timer=setInterval(()=>{const due=this.stats()?.nextRefreshAt;if(!this.error()&&due!=null&&due<=Date.now())this.refresh();},1000);
    const generation=++this.generation;
    const owner=this.resource.catalog.owner();
    await this.resource.ready();
    if (!this.deck) { this.error.set(this.resource.state().status === 'error'); return; }
    const state=this.resource.state();
    try { const value=await this.study.statistics(this.deck, this.deck.cardCount);if(generation===this.generation&&owner===this.resource.catalog.owner()&&state===this.resource.state()){this.stats.set(value);this.error.set(false);} }
    catch { if(generation===this.generation)this.error.set(true); }
  }

  percentage(value: number | null): string { return value === null ? '—' : `${Math.round(value * 100)}%`; }
}
