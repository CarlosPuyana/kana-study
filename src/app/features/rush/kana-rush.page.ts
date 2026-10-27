import {runStudyShortcut,studyKeyboardAvailable} from '../../shared/keyboard/study-shortcuts';
import { LearningWritingPrompt } from '../../shared/components/learning-writing-prompt/learning-writing-prompt';
import { StudyTimer } from '../../shared/components/study-timer/study-timer';
import { formatStudyTime } from '../../core/services/card-study-time';
import { ChangeDetectionStrategy,Component,OnDestroy,OnInit,inject,viewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { buildKanaRushUnits,kanaRushConfiguration } from '../../core/services/rush-builders';
import { RushSessionService } from '../../core/services/rush-session.service';
import { RushSettingsService } from '../../core/services/rush-settings.service';
import { SettingsService } from '../../core/services/settings.service';
import { TranslationService } from '../../core/services/translation.service';
import { ALL_KANA } from '../../data/kana';
import { MedalBadge } from '../../shared/components/medal-badge/medal-badge';
@Component({selector:'app-kana-rush-page',imports:[StudyTimer,RouterLink,MedalBadge,LearningWritingPrompt],templateUrl:'./kana-rush.page.html',styleUrls:['./rush-session.scss','./kana-rush-keyboard.scss'],changeDetection:ChangeDetectionStrategy.OnPush,host:{'(document:keydown)':'key($event)'}})
export class KanaRushPage implements OnInit,OnDestroy{
  private readonly writingPrompt=viewChild(LearningWritingPrompt);
  /** Completed-card count distinguishes repeated occurrences of the same unit. */
  writingKey(): string {
    return `${this.rush.session()?.id}:${this.rush.session()?.cardsCompleted}:${this.rush.currentUnit()?.key}`;
  }
  readonly rush=inject(RushSessionService);readonly i18n=inject(TranslationService);private readonly settings=inject(SettingsService);private readonly rushSettings=inject(RushSettingsService);private readonly router=inject(Router);async ngOnInit(){const c=this.rushSettings.getOrInitialize('kana',kanaRushConfiguration(this.settings.selection()));await this.rush.start('kana',buildKanaRushUnits(ALL_KANA,c))}ngOnDestroy(){void this.rush.checkpoint()}kana(){return ALL_KANA.find(item=>item.id===this.rush.currentUnit()?.contentId)??null}key(event: KeyboardEvent) {
    if(this.rush.loading() || this.rush.saving() || this.rush.error() || !this.rush.session() || this.rush.summary() ||
      this.rush.medals.newlyUnlocked().length || this.writingPrompt()?.keyboardBusy())return;
    if(event.key==='Enter' && studyKeyboardAvailable(event)) {
      event.preventDefault();this.rush.revealed()?void this.rush.next():this.rush.reveal();return;
    }
    runStudyShortcut(event,this.rush.revealed()?null:()=>this.rush.reveal(),[]);
  }
  async exit(){if(this.rush.saving()||this.rush.loading())return;const summary=await this.rush.finish();if(!summary&&!this.rush.error())void this.router.navigateByUrl('/')}home(){this.rush.clear();void this.router.navigateByUrl('/')}another(){this.rush.clear();void this.router.navigateByUrl('/?rush=1')}format(n:number){return formatStudyTime(n)}}
