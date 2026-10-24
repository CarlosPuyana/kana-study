import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StudyDeck } from '../../../../core/models/deck.model';
import { CatalogDeck } from '../../../../core/models/deck-catalog.model';
import { deckTitle } from '../../../../core/services/deck-catalog.service';
import { DeckStudyCounts } from '../../../../core/models/deck-study.model';
import { TranslationService } from '../../../../core/services/translation.service';

@Component({ selector: 'app-deck-card', imports: [RouterLink], templateUrl: './deck-card.html', styleUrl: './deck-card.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class DeckCard {
  readonly deck = input.required<StudyDeck | CatalogDeck>();
  readonly stats = input.required<DeckStudyCounts>();
  title(): string { const deck=this.deck(); return 'displayName' in deck ? deckTitle(deck,this.i18n) : this.i18n.t(deck.nameKey); }
  readonly available = computed(() => !this.stats().completedToday &&
    this.stats().newAvailable + this.stats().learningDue + this.stats().reviewDue > 0);
  readonly statusKey = computed(() => this.stats().completedToday ? 'anki.daily.completedNotice' : 'anki.daily.unavailable');
  readonly newTodayAdjustment = output<number>();
  readonly i18n = inject(TranslationService);
}
