import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { TranslationService } from '../../../core/services/translation.service';
import type { deckLearningSummary } from '../../../core/services/deck-learning-presentation';

@Component({
  selector: 'app-deck-learning-summary',
  templateUrl: './deck-learning-summary.html',
  styleUrl: './deck-learning-summary.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckLearningSummary {
  readonly data = input.required<ReturnType<typeof deckLearningSummary>>();
  readonly reinforceCount = input.required<number>();
  readonly i18n = inject(TranslationService);
  readonly maximum = computed(() => Math.max(1, ...this.data().future.map(d => d.count)));
  readonly total = computed(() => this.data().new + this.data().learning + this.data().review);
  percent(count: number): number { return this.total() ? count / this.total() * 100 : 0; }
}
