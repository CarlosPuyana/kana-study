import {PageHeader} from '../../shared/components/page-header/page-header';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FlagProgressService } from '../../core/services/flag-progress.service';
import { FlagMedalService } from '../../core/services/flag-medal.service';
import { TranslationService } from '../../core/services/translation.service';
import { MedalBadge } from '../../shared/components/medal-badge/medal-badge';
import { ProgressBar } from '../../shared/components/progress-bar/progress-bar';
import { ProgressCircle } from '../../shared/components/progress-circle/progress-circle';
import { SelectionCard } from '../../shared/components/selection-card/selection-card';
import { FlagStartPanel } from './components/flag-start-panel/flag-start-panel';

@Component({
  selector: 'app-flags-page',
  imports:[PageHeader,RouterLink,  FlagStartPanel, MedalBadge, ProgressBar, ProgressCircle, SelectionCard],
  templateUrl: './flags.page.html',
  styleUrl: './flags.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlagsPage {
  readonly progress = inject(FlagProgressService);
  readonly medals = inject(FlagMedalService);
  readonly i18n = inject(TranslationService);
  readonly showStartPanel = signal(false);
}
