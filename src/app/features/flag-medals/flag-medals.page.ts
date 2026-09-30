import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MedalProgress, MedalState } from '../../core/models/medal.model';
import { medalCompletionRatio } from '../../core/services/medal-rules';
import { FlagMedalService } from '../../core/services/flag-medal.service';
import { TranslationService } from '../../core/services/translation.service';
import { MedalBadge } from '../../shared/components/medal-badge/medal-badge';

@Component({ selector: 'app-flag-medals-page', imports: [MedalBadge], templateUrl: './flag-medals.page.html', styleUrl: './flag-medals.page.scss', changeDetection: ChangeDetectionStrategy.OnPush, host: { '(document:keydown.escape)': 'selected.set(null)' } })
export class FlagMedalsPage {
  readonly medals = inject(FlagMedalService); readonly i18n = inject(TranslationService); readonly selected = signal<MedalState|null>(null); private readonly location = inject(Location);
  back():void{this.location.back()} percent(progress:MedalProgress){return Math.round(medalCompletionRatio(progress)*100)}
  formattedDate(iso:string){const locale={es:'es-ES',en:'en-US',ca:'ca-ES'}[this.i18n.language()];return new Intl.DateTimeFormat(locale,{dateStyle:'medium'}).format(new Date(iso))}
}
