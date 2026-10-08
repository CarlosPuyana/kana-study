import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DailyStudyActivity, DailyStudyDuration } from '../../core/models/daily-study.model';
import { DailyStudyPlannerService } from '../../core/services/daily-study-planner.service';
import { TranslationService } from '../../core/services/translation.service';
import { WorkspaceService } from '../../core/services/workspace.service';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { LearningStartPanel } from '../../shared/components/learning-start-panel/learning-start-panel';
import { KanjiStartPanel } from '../kanji/components/kanji-start-panel/kanji-start-panel';
import { VocabularyStartPanel } from '../vocabulary/components/vocabulary-start-panel/vocabulary-start-panel';
import { ModalFocusDirective } from '../../shared/directives/modal-focus.directive';

@Component({selector:'app-daily-page',imports:[RouterLink,PageHeader,LearningStartPanel,KanjiStartPanel,VocabularyStartPanel,ModalFocusDirective],providers:[DailyStudyPlannerService],templateUrl:'./daily.page.html',styleUrl:'./daily.page.scss',changeDetection:ChangeDetectionStrategy.OnPush})
export class DailyPage {
  readonly planner=inject(DailyStudyPlannerService);
  readonly i18n=inject(TranslationService);
  readonly durations:readonly DailyStudyDuration[]=[5,15,30];
  readonly panel=signal<DailyStudyActivity['panel']|null>(null);
  readonly date=computed(()=>new Intl.DateTimeFormat(this.i18n.language(),{timeZone:'Europe/Madrid',dateStyle:'full'}).format(new Date(this.planner.now())));
  constructor(){const workspace=inject(WorkspaceService);effect(()=>{workspace.active();this.panel.set(null);});}
  open(activity:DailyStudyActivity):void {
    // Recheck the projection: a completion or pull may have changed eligibility.
    const current=[...this.planner.plan().recommended,...this.planner.plan().available].find(a=>a.id===activity.id);
    if(current?.panel)this.panel.set(current.panel);
  }
  detail(activity:DailyStudyActivity):string {
    if(!activity.detail)return '';
    return this.i18n.t(activity.detail==='writing'?'writing.title':activity.detail==='listening'?'listening.skill':activity.module==='grammar'?`grammar.weakness.type.${activity.detail}`:`${activity.module==='kana'?'questionTypes':activity.module+'.questionType'}.${activity.detail}`);
  }
}
