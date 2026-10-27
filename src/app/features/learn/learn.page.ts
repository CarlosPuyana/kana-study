import {runStudyShortcut} from '../../shared/keyboard/study-shortcuts';
import {ModalFocusDirective} from '../../shared/directives/modal-focus.directive';
import {LearningWritingPrompt} from '../../shared/components/learning-writing-prompt/learning-writing-prompt';
import { StudyTimer } from '../../shared/components/study-timer/study-timer';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { StudyRating } from '../../core/models/progress.model';
import { LearningSessionService } from '../../core/services/learning-session.service';
import { TranslationService } from '../../core/services/translation.service';
import { MedalBadge } from '../../shared/components/medal-badge/medal-badge';
import { DailyLearningService } from '../../core/services/daily-learning.service';

@Component({
  selector: 'app-learn-page',
  imports: [StudyTimer, MedalBadge, LearningWritingPrompt, ModalFocusDirective],
  templateUrl: './learn.page.html',
  styleUrl: './learn.page.scss',
  host: {'(document:keydown)':'handleKey($event)'},
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LearnPage {
  private readonly writingPrompt=viewChild(LearningWritingPrompt);
  handleKey(event:KeyboardEvent):void {
    if(!this.learning.session() || this.learning.completed() || !this.learning.currentKana() ||
      this.showExitConfirmation() || this.learning.newlyUnlockedMedals().length || this.writingPrompt()?.keyboardBusy())return;
    if(this.learning.session()!.mode==='self-assessment') {
      runStudyShortcut(event,this.learning.revealed()?null:()=>this.learning.reveal(),
        this.learning.revealed()?(['again','hard','good'] as const).map(rating=>()=>this.rate(rating)):[]);
    } else if(this.writingOptionsVisible() && !this.learning.feedback()) {
      runStudyShortcut(event,null,this.learning.options().map(option=>()=>this.learning.answerQuick(option)));
    }
  }
  readonly drawingOptionsKey=signal('');
  writingKey():string {return `${this.learning.session()?.id}:${this.learning.currentUnit()?.key}:${this.learning.currentItem()?.appearances}`;}
  writingOptionsVisible():boolean {return this.learning.currentUnit()?.questionType!=='romaji-to-kana' || this.drawingOptionsKey()===this.writingKey();}

  constructor(){inject(DestroyRef).onDestroy(()=>this.learning.clear());}

  readonly learning = inject(LearningSessionService);
  readonly i18n = inject(TranslationService);
  readonly daily = inject(DailyLearningService);
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
