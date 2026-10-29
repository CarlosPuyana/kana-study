import {StudyPrimaryAction} from '../../shared/keyboard/study-primary-action';
import {rushStudyActions} from './rush-study-actions';
import { LearningWritingPrompt } from '../../shared/components/learning-writing-prompt/learning-writing-prompt';
import { StudyTimer } from '../../shared/components/study-timer/study-timer';
import { formatStudyTime } from '../../core/services/card-study-time';
import { ChangeDetectionStrategy,Component,OnDestroy,OnInit,inject,viewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { KanjiQuestionType } from '../../core/models/kanji.model';
import { buildKanjiRushUnits,kanjiRushConfiguration } from '../../core/services/rush-builders';
import { KanjiSettingsService } from '../../core/services/kanji-settings.service';
import { RushSessionService } from '../../core/services/rush-session.service';
import { RushSettingsService } from '../../core/services/rush-settings.service';
import { TranslationService } from '../../core/services/translation.service';
import { KANJI_N5 } from '../../data/kanji-n5.generated';
import { MedalBadge } from '../../shared/components/medal-badge/medal-badge';
@Component({selector:'app-kanji-rush-page',imports:[StudyPrimaryAction,StudyTimer,RouterLink,MedalBadge,LearningWritingPrompt],templateUrl:'./kanji-rush.page.html',styleUrl:'./rush-session.scss',changeDetection:ChangeDetectionStrategy.OnPush,host:{'(document:keydown)':'key($event)'}})
export class KanjiRushPage implements OnInit,OnDestroy{
  private readonly writingPrompt=viewChild(LearningWritingPrompt);
  /** Completed-card count distinguishes repeated occurrences of the same unit. */
  writingKey(): string {
    return `${this.rush.session()?.id}:${this.rush.session()?.cardsCompleted}:${this.rush.currentUnit()?.key}`;
  }
  readonly rush=inject(RushSessionService);readonly actions=rushStudyActions(this.rush,()=>this.writingPrompt()?.keyboardBusy()??false,()=>!!this.kanji());readonly i18n=inject(TranslationService);private readonly settings=inject(KanjiSettingsService);private readonly rushSettings=inject(RushSettingsService);private readonly router=inject(Router);async ngOnInit(){const c=this.rushSettings.getOrInitialize('kanji',kanjiRushConfiguration(this.settings.selection()));await this.rush.start('kanji',buildKanjiRushUnits(KANJI_N5,c))}ngOnDestroy(){void this.rush.checkpoint()}kanji(){return KANJI_N5.find(item=>item.id===this.rush.currentUnit()?.contentId)??null}meaning(){const item=this.kanji();return item?.meanings[this.i18n.language()].join(', ')??''}promptKey(type:string){return`kanji.questionType.${type as KanjiQuestionType}`}key(event:KeyboardEvent):void{this.actions.key(event);}
  async exit(){if(this.rush.saving()||this.rush.loading())return;const summary=await this.rush.finish();if(!summary&&!this.rush.error())void this.router.navigateByUrl('/kanji')}home(){this.rush.clear();void this.router.navigateByUrl('/kanji')}another(){this.rush.clear();void this.router.navigateByUrl('/kanji?rush=1')}format(n:number){return formatStudyTime(n)}}
