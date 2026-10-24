import { ChangeDetectionStrategy, Component, effect, inject, untracked, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DeckStudyStatistics } from '../../core/models/deck-study.model';
import { DeckStudyService } from '../../core/services/deck-study.service';
import { TranslationService } from '../../core/services/translation.service';
import { createDeckRouteResource } from '../../core/services/deck-route-resource';

@Component({ selector: 'app-anki-stats-page', imports: [RouterLink], templateUrl: './anki-stats.page.html', styleUrl: './anki-stats.page.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class AnkiStatsPage implements OnInit {
  private readonly study = inject(DeckStudyService);
  readonly i18n = inject(TranslationService);
  readonly resource = createDeckRouteResource();
  get deck() { return this.resource.deck; }
  title(): string { return this.resource.title(this.i18n); }
  readonly stats = signal<DeckStudyStatistics | null>(null);
  readonly error = signal(false);

  constructor(){effect(()=>{this.resource.state();this.resource.catalog.owner();untracked(()=>{this.stats.set(null);void this.ngOnInit();});});}

  async ngOnInit(): Promise<void> {
    const owner=this.resource.catalog.owner();
    await this.resource.ready();
    if (!this.deck) { this.error.set(this.resource.state().status === 'error'); return; }
    const state=this.resource.state();
    try { const value=await this.study.statistics(this.deck, this.deck.cardCount);if(owner===this.resource.catalog.owner()&&state===this.resource.state())this.stats.set(value); }
    catch { this.error.set(true); }
  }

  percentage(value: number | null): string { return value === null ? '—' : `${Math.round(value * 100)}%`; }
}
