import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProgressService } from '../../core/services/progress.service';
import { MedalService } from '../../core/services/medal.service';
import { TranslationService } from '../../core/services/translation.service';
import { AppHeader } from '../../shared/components/app-header/app-header';
import { MedalBadge } from '../../shared/components/medal-badge/medal-badge';
import { ProgressBar } from '../../shared/components/progress-bar/progress-bar';
import { ProgressCircle } from '../../shared/components/progress-circle/progress-circle';
import { SelectionCard } from '../../shared/components/selection-card/selection-card';
import { LearningStartPanel } from '../../shared/components/learning-start-panel/learning-start-panel';
import { KanaRushLauncher } from '../rush/kana-rush-launcher';
import { DailyLearningService } from '../../core/services/daily-learning.service';

@Component({
  selector: 'app-home-page',
  imports: [
    RouterLink,
    AppHeader,
    MedalBadge,
    ProgressBar,
    ProgressCircle,
    SelectionCard,
    LearningStartPanel,
    KanaRushLauncher,
  ],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  readonly progress = inject(ProgressService);
  readonly medals = inject(MedalService);
  readonly i18n = inject(TranslationService);
  readonly daily = inject(DailyLearningService);
  readonly showLearningPanel = signal(false);
  readonly showRushPanel = signal(false);
  private readonly route = inject(ActivatedRoute);

  constructor() { if (this.route.snapshot.queryParamMap.get('rush') === '1') queueMicrotask(() => this.openRush()); }
  openRush(): void { this.showRushPanel.set(true); }
}
