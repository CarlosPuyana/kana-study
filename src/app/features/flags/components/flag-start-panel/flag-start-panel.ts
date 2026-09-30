import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FlagProgressService } from '../../../../core/services/flag-progress.service';
import { FlagSessionService } from '../../../../core/services/flag-session.service';
import { TranslationService } from '../../../../core/services/translation.service';

@Component({
  selector: 'app-flag-start-panel',
  imports: [RouterLink],
  templateUrl: './flag-start-panel.html',
  styleUrl: './flag-start-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlagStartPanel {
  readonly progress = inject(FlagProgressService);
  readonly i18n = inject(TranslationService);
  readonly closed = output<void>();
  private readonly session = inject(FlagSessionService);
  private readonly router = inject(Router);

  start(): void {
    if (this.session.start()) void this.router.navigateByUrl('/flags/play');
  }
}
