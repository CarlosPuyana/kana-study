import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LearningMode } from '../../../core/models/learning-session.model';
import { LearningSessionService } from '../../../core/services/learning-session.service';
import { ProgressService } from '../../../core/services/progress.service';
import { TranslationService } from '../../../core/services/translation.service';
import { DailyLearningService } from '../../../core/services/daily-learning.service';
import { SyncService } from '../../../core/services/sync.service';

@Component({
  selector: 'app-learning-start-panel',
  imports: [RouterLink],
  templateUrl: './learning-start-panel.html',
  styleUrl: './learning-start-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'closed.emit()' },
})
export class LearningStartPanel {
  readonly closed = output<void>();
  readonly progress = inject(ProgressService);
  readonly i18n = inject(TranslationService);
  readonly daily = inject(DailyLearningService);
  private readonly learning = inject(LearningSessionService);
  private readonly router = inject(Router);
  private readonly sync = inject(SyncService);

  async start(mode: LearningMode): Promise<void> {
    if (this.sync.available()) await this.sync.syncNow();
    if (this.learning.start(mode)) void this.router.navigateByUrl('/learn');
  }
}
