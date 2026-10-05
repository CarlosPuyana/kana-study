import {PageHeader} from '../../shared/components/page-header/page-header';
import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { DeckStudyCounts } from '../../core/models/deck-study.model';
import { DeckStudyService, DECK_NEW_LIMIT_STEP } from '../../core/services/deck-study.service';
import { TranslationService } from '../../core/services/translation.service';
import { JAPANESE_1500_INDEX } from '../../data/japanese-1500.index.generated';
import { STUDY_DECKS } from '../../data/study-decks';
import { DeckCard } from './components/deck-card/deck-card';
import { getLocalStudyDayKey } from '../../core/services/deck-study-time';

@Component({
  selector: 'app-anki-page', imports:[PageHeader,  DeckCard], templateUrl: './anki.page.html',
  styleUrl: './anki.page.scss', changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(window:focus)': 'refresh()', '(document:visibilitychange)': 'refresh()' },
})
export class AnkiPage implements OnInit, OnDestroy {
  private readonly study = inject(DeckStudyService);
  readonly i18n = inject(TranslationService);
  readonly decks = STUDY_DECKS;
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
    this.loading.set(true); this.error.set(false);
    try {
      const values = await Promise.all(this.decks.map(async deck => [
        deck.id, await this.study.snapshot(deck, deck.id === 'japanese-1500' ? JAPANESE_1500_INDEX : []),
      ] as const));
      this.counts.set(Object.fromEntries(values));
    } catch { this.error.set(true); }
    finally { this.loading.set(false); }
  }
}
