import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DeckStudyCounts } from '../../core/models/deck-study.model';
import { DeckStudyService, DECK_NEW_LIMIT_STEP } from '../../core/services/deck-study.service';
import { TranslationService } from '../../core/services/translation.service';
import { JAPANESE_1500_INDEX } from '../../data/japanese-1500.index.generated';
import { STUDY_DECKS } from '../../data/study-decks';
import { DeckCard } from './components/deck-card/deck-card';

@Component({
  selector: 'app-anki-page', imports: [RouterLink, DeckCard], templateUrl: './anki.page.html',
  styleUrl: './anki.page.scss', changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnkiPage implements OnInit {
  private readonly study = inject(DeckStudyService);
  readonly i18n = inject(TranslationService);
  readonly decks = STUDY_DECKS;
  readonly counts = signal<Record<string, DeckStudyCounts>>({});
  readonly loading = signal(true);
  readonly error = signal(false);

  ngOnInit(): void { void this.refresh(); }

  async adjustNewToday(deckId: string, direction: number): Promise<void> {
    const deck = this.decks.find(item => item.id === deckId);
    if (!deck) return;
    try {
      await this.study.adjustTodayNewLimit(deck, direction * DECK_NEW_LIMIT_STEP);
      await this.refresh();
    } catch { this.error.set(true); }
  }

  private async refresh(): Promise<void> {
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
