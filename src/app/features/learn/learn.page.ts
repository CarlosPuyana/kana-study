import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { StudyRating } from '../../core/models/progress.model';
import { LearningSessionService } from '../../core/services/learning-session.service';
import { TranslationService } from '../../core/services/translation.service';
import { MedalBadge } from '../../shared/components/medal-badge/medal-badge';

@Component({
  selector: 'app-learn-page',
  imports: [MedalBadge],
  templateUrl: './learn.page.html',
  styleUrl: './learn.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LearnPage {
  readonly learning = inject(LearningSessionService);
  readonly i18n = inject(TranslationService);
  private readonly router = inject(Router);
  readonly showExitConfirmation = signal(false);

  requestExit(): void {
    const session = this.learning.session();
    if (!session || session.attempts === 0 || session.completedAt) this.confirmExit();
    else this.showExitConfirmation.set(true);
  }

  confirmExit(): void {
    this.showExitConfirmation.set(false);
    this.learning.clear();
    void this.router.navigateByUrl('/');
  }

  rate(rating: StudyRating): void {
    this.learning.rate(rating);
  }

  anotherRound(): void {
    if (!this.learning.restart()) void this.router.navigateByUrl('/');
  }
}
