import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { JapaneseSentenceSegment } from '../../../../core/models/japanese-word-deck-entry.model';

@Component({
  selector: 'app-deck-sentence-text',
  templateUrl: './deck-sentence-text.html',
  styleUrl: './deck-sentence-text.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckSentenceText {
  readonly segments = input.required<readonly JapaneseSentenceSegment[]>();
  readonly showFurigana = input(true);
}
