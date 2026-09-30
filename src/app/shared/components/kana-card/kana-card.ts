import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Kana } from '../../../core/models/kana.model';
import { TranslationService } from '../../../core/services/translation.service';

@Component({
  selector: 'app-kana-card',
  templateUrl: './kana-card.html',
  styleUrl: './kana-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KanaCard {
  readonly kana = input.required<Kana>();
  readonly i18n = inject(TranslationService);
}
