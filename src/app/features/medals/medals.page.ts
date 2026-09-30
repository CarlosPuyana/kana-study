import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MedalProgress, MedalState } from '../../core/models/medal.model';
import { medalCompletionRatio } from '../../core/services/medal-rules';
import { MedalService } from '../../core/services/medal.service';
import { TranslationService } from '../../core/services/translation.service';
import { MedalBadge } from '../../shared/components/medal-badge/medal-badge';

@Component({
  selector: 'app-medals-page',
  imports: [MedalBadge],
  templateUrl: './medals.page.html',
  styleUrl: './medals.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'selected.set(null)' },
})
export class MedalsPage {
  readonly medals = inject(MedalService);
  readonly i18n = inject(TranslationService);
  private readonly location = inject(Location);
  private readonly router = inject(Router);
  readonly selected = signal<MedalState | null>(null);

  back(): void {
    const state = this.location.getState() as { navigationId?: number } | null;
    if ((state?.navigationId ?? 0) > 1) this.location.back();
    else void this.router.navigateByUrl('/');
  }

  percent(progress: MedalProgress): number {
    return Math.round(medalCompletionRatio(progress) * 100);
  }

  formattedDate(iso: string): string {
    const locale = { es: 'es-ES', en: 'en-US', ca: 'ca-ES' }[this.i18n.language()];
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(iso));
  }
}
