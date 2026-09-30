import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StudyDeck } from '../../../../core/models/deck.model';
import { DeckStudyCounts } from '../../../../core/models/deck-study.model';
import { TranslationService } from '../../../../core/services/translation.service';

@Component({ selector: 'app-deck-card', imports: [RouterLink], templateUrl: './deck-card.html', styleUrl: './deck-card.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class DeckCard {
  readonly deck = input.required<StudyDeck>();
  readonly stats = input.required<DeckStudyCounts>();
  readonly newTodayAdjustment = output<number>();
  readonly i18n = inject(TranslationService);
}
