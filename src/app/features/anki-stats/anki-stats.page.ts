import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DeckStudyStatistics } from '../../core/models/deck-study.model';
import { DeckStudyService } from '../../core/services/deck-study.service';
import { TranslationService } from '../../core/services/translation.service';
import { findStudyDeck } from '../../data/study-decks';

@Component({ selector: 'app-anki-stats-page', imports: [RouterLink], templateUrl: './anki-stats.page.html', styleUrl: './anki-stats.page.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class AnkiStatsPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly study = inject(DeckStudyService);
  readonly i18n = inject(TranslationService);
  readonly deck = findStudyDeck(this.route.snapshot.paramMap.get('deckId'));
  readonly stats = signal<DeckStudyStatistics | null>(null);
  readonly error = signal(false);

  ngOnInit(): void {
    if (!this.deck) return;
    void this.study.statistics(this.deck, this.deck.cardCount)
      .then(stats => this.stats.set(stats))
      .catch(() => this.error.set(true));
  }

  percentage(value: number | null): string { return value === null ? '—' : `${Math.round(value * 100)}%`; }
}
