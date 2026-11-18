import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { TranslationService } from '../../../core/services/translation.service';

/** Presentational round totals; the session owns every answer and action. */
@Component({selector:'app-phrase-recall-summary',templateUrl:'./phrase-recall-summary.html',styleUrl:'./phrase-recall-summary.scss',changeDetection:ChangeDetectionStrategy.OnPush})
export class PhraseRecallSummary {
  readonly i18n=inject(TranslationService);
  readonly round=input.required<number>();
  readonly total=input.required<number>();
  readonly correct=input.required<number>();
  readonly failed=input.required<number>();
  readonly percent=input.required<number>();
  readonly canUndo=input.required<boolean>();
  readonly repeatFailed=output<void>();
  readonly finish=output<void>();
  readonly undo=output<void>();
}
