import {LocalDeckNotice} from '../../shared/components/local-deck-notice/local-deck-notice';
import {PageHeader} from '../../shared/components/page-header/page-header';
import { ChangeDetectionStrategy, Component, effect, inject, untracked, OnDestroy, OnInit, signal } from '@angular/core';
import { DeckStudyCounts } from '../../core/models/deck-study.model';
import { DeckStudyService, DECK_NEW_LIMIT_STEP } from '../../core/services/deck-study.service';
import { TranslationService } from '../../core/services/translation.service';
import { DeckCatalogService } from '../../core/services/deck-catalog.service';
import { DeckCard } from './components/deck-card/deck-card';
import { getLocalStudyDayKey } from '../../core/services/deck-study-time';

@Component({
  selector: 'app-anki-page', imports:[PageHeader, DeckCard,LocalDeckNotice], templateUrl: './anki.page.html',
  styleUrl: './anki.page.scss', changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(window:focus)': 'refresh()', '(document:visibilitychange)': 'refresh()' },
})
export class AnkiPage implements OnInit, OnDestroy {
  private readonly study = inject(DeckStudyService);
  readonly i18n = inject(TranslationService);
  readonly catalog = inject(DeckCatalogService);
  get decks() { return this.catalog.items(); }
  private generation=0;
  constructor(){effect(()=>{this.catalog.epoch();this.catalog.items();this.catalog.revision();this.catalog.repository.progressRevision();untracked(()=>{void this.refresh();});});}
  readonly counts = signal<Record<string, DeckStudyCounts>>({});
  readonly loading = signal(true);
  readonly error = signal(false);

  private day = getLocalStudyDayKey(new Date());
  private timer?: ReturnType<typeof setInterval>;
  ngOnInit(): void {
    void this.refresh();
    this.timer = setInterval(() => {
      const day = getLocalStudyDayKey(new Date());
      if (day !== this.day) { this.day = day; void this.refresh(); }
    }, 1000);
  }
  ngOnDestroy(): void { if (this.timer) clearInterval(this.timer); }

  async adjustNewToday(deckId: string, direction: number): Promise<void> {
    const deck = this.decks.find(item => item.id === deckId);
    if (!deck) return;
    try {
      await this.study.adjustTodayNewLimit(deck, direction * DECK_NEW_LIMIT_STEP);
      await this.refresh();
    } catch { this.error.set(true); }
  }

  async refresh(): Promise<void> {
    const owner=this.catalog.owner(),epoch=this.catalog.epoch(),generation=++this.generation;
    const current=()=>owner===this.catalog.owner()&&epoch===this.catalog.epoch()&&generation===this.generation;
    this.loading.set(true); this.error.set(false);
    try {
      await this.catalog.refresh();
      if(this.catalog.error())throw this.catalog.error();
      const values = await Promise.all(this.decks.map(async deck => [
        deck.id, await this.study.snapshot(deck, await this.catalog.index(deck.id)),
      ] as const));
      if(current())this.counts.set(Object.fromEntries(values));
    } catch { if(current())this.error.set(true); }
    finally { if(current())this.loading.set(false); }
  }
}
