import { StudyTimer } from '../../shared/components/study-timer/study-timer';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FlagQuestionType } from '../../core/models/country.model';
import { FlagProgressService } from '../../core/services/flag-progress.service';
import { FlagSessionService } from '../../core/services/flag-session.service';
import { TranslationService } from '../../core/services/translation.service';
import { CountryFlag } from '../../shared/components/country-flag/country-flag';
import { MedalBadge } from '../../shared/components/medal-badge/medal-badge';

@Component({ selector: 'app-flags-play-page', imports: [StudyTimer, CountryFlag, MedalBadge], templateUrl: './flags-play.page.html', styleUrl: './flags-play.page.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class FlagsPlayPage {
  constructor(){inject(DestroyRef).onDestroy(()=>this.learning.clear());}

  readonly learning = inject(FlagSessionService);
  readonly progress = inject(FlagProgressService);
  readonly i18n = inject(TranslationService);
  readonly showExit = signal(false);
  private readonly router = inject(Router);

  options() { return this.learning.options(this.i18n.language()); }
  promptKey(type: FlagQuestionType): string { return `flags.prompt.${type}`; }
  promptValue(): string {
    const country = this.learning.currentCountry(); const type = this.learning.currentUnit()?.questionType;
    if (!country || !type || type === 'flag-to-country') return '';
    return type === 'capital-to-country' ? country.capitals[0][this.i18n.language()] : country.names[this.i18n.language()];
  }
  statusKey(): string {
    const unit = this.learning.currentUnit(); if (!unit) return 'home.new';
    const stored = this.progress.get(unit.key); if (!stored) return 'home.new';
    return stored.fsrs.state === 'review' ? 'home.memorized' : 'home.pending';
  }
  requestExit(): void { const session = this.learning.session(); if (!session || session.attempts === 0 || session.completedAt) this.exit(); else this.showExit.set(true); }
  exit(): void { this.learning.clear(); void this.router.navigateByUrl('/flags'); }
  anotherRound(): void { if (!this.learning.restart()) void this.router.navigateByUrl('/flags'); }
  duration():string{return this.learning.clock?.label()??'00:00';}
}
