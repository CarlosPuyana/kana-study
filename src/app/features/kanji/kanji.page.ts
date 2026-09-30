import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RushConfiguration } from '../../core/models/rush.model';
import { buildKanjiRushUnits, kanjiRushConfiguration } from '../../core/services/rush-builders';
import { KanjiMedalService } from '../../core/services/kanji-medal.service';
import { KanjiProgressService } from '../../core/services/kanji-progress.service';
import { KanjiSettingsService } from '../../core/services/kanji-settings.service';
import { RushSettingsService } from '../../core/services/rush-settings.service';
import { TranslationService } from '../../core/services/translation.service';
import { DailyLearningService } from '../../core/services/daily-learning.service';
import { KANJI_N5 } from '../../data/kanji-n5.generated';
import { MedalBadge } from '../../shared/components/medal-badge/medal-badge';
import { ProgressBar } from '../../shared/components/progress-bar/progress-bar';
import { ProgressCircle } from '../../shared/components/progress-circle/progress-circle';
import { RushConfigDialog, RushConfigOption } from '../../shared/components/rush-config-dialog/rush-config-dialog';
import { SelectionCard } from '../../shared/components/selection-card/selection-card';
import { KanjiStartPanel } from './components/kanji-start-panel/kanji-start-panel';

@Component({selector:'app-kanji-page',imports:[RouterLink,KanjiStartPanel,MedalBadge,ProgressBar,ProgressCircle,SelectionCard,RushConfigDialog],templateUrl:'./kanji.page.html',styleUrl:'./kanji.page.scss',changeDetection:ChangeDetectionStrategy.OnPush})
export class KanjiPage {
  readonly daily=inject(DailyLearningService);readonly progress=inject(KanjiProgressService);readonly medals=inject(KanjiMedalService);readonly i18n=inject(TranslationService);
  readonly showStartPanel=signal(false);readonly showRushPanel=signal(false);readonly rushConfig=signal<RushConfiguration|null>(null);
  readonly rushContent:readonly RushConfigOption[]=[{id:'N5',labelKey:'kanji.level.N5'}];
  readonly rushTypes:readonly RushConfigOption[]=[{id:'kanji-to-meaning',labelKey:'kanji.questionType.kanji-to-meaning'},{id:'meaning-to-kanji',labelKey:'kanji.questionType.meaning-to-kanji'}];
  readonly countRushUnits=(config:RushConfiguration)=>buildKanjiRushUnits(KANJI_N5,config).length;
  private readonly rushSettings=inject(RushSettingsService);private readonly settings=inject(KanjiSettingsService);private readonly router=inject(Router);private readonly route=inject(ActivatedRoute);
  constructor(){if(this.route.snapshot.queryParamMap.get('rush')==='1')queueMicrotask(()=>this.openRush())}
  openRush(){this.rushConfig.set(this.rushSettings.getOrInitialize('kanji',kanjiRushConfiguration(this.settings.selection())));this.showRushPanel.set(true)}
  startRush(config:RushConfiguration){this.rushSettings.save('kanji',config);this.showRushPanel.set(false);void this.router.navigateByUrl('/kanji/rush')}
}
