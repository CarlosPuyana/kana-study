import {KanjiAvailabilityNotice} from '../kanji-availability-notice';
import {KanjiAvailabilityService} from '../../../../core/services/kanji-availability.service';
import {WorkspaceService} from '../../../../core/services/workspace.service';
import {ModalFocusDirective} from '../../../../shared/directives/modal-focus.directive';
import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LearningMode } from '../../../../core/models/learning-session.model';
import { KanjiProgressService } from '../../../../core/services/kanji-progress.service';
import { KanjiSessionService } from '../../../../core/services/kanji-session.service';
import { TranslationService } from '../../../../core/services/translation.service';
import { DailyLearningService } from '../../../../core/services/daily-learning.service';
import { SyncService } from '../../../../core/services/sync.service';
@Component({selector:'app-kanji-start-panel',imports:[KanjiAvailabilityNotice,RouterLink,ModalFocusDirective],templateUrl:'./kanji-start-panel.html',styleUrl:'./kanji-start-panel.scss',changeDetection:ChangeDetectionStrategy.OnPush})
export class KanjiStartPanel {
  readonly availability=inject(KanjiAvailabilityService); readonly starting=signal(false);private readonly workspace=inject(WorkspaceService); readonly daily=inject(DailyLearningService);readonly progress=inject(KanjiProgressService);readonly i18n=inject(TranslationService);readonly closed=output<void>();readonly session=inject(KanjiSessionService);private readonly router=inject(Router);private readonly sync=inject(SyncService);async start(mode:LearningMode){if(this.starting())return;const epoch=this.workspace.activationRevision();this.starting.set(true);try{if(!await this.session.recover()||epoch!==this.workspace.activationRevision())return;if(this.sync.available())await this.sync.syncNow();if(epoch!==this.workspace.activationRevision())return;if(this.session.start(mode))void this.router.navigateByUrl('/kanji/play');}finally{this.starting.set(false);}} }
