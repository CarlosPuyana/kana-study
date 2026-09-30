import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LearningMode } from '../../../../core/models/learning-session.model';
import { KanjiProgressService } from '../../../../core/services/kanji-progress.service';
import { KanjiSessionService } from '../../../../core/services/kanji-session.service';
import { TranslationService } from '../../../../core/services/translation.service';
@Component({selector:'app-kanji-start-panel',imports:[RouterLink],templateUrl:'./kanji-start-panel.html',styleUrl:'./kanji-start-panel.scss',changeDetection:ChangeDetectionStrategy.OnPush})
export class KanjiStartPanel { readonly progress=inject(KanjiProgressService);readonly i18n=inject(TranslationService);readonly closed=output<void>();private readonly session=inject(KanjiSessionService);private readonly router=inject(Router);start(mode:LearningMode){if(this.session.start(mode))void this.router.navigateByUrl('/kanji/play');} }
