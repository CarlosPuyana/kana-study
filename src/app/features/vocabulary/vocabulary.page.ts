import { ChangeDetectionStrategy,Component,inject,signal } from '@angular/core';
import { ActivatedRoute,Router,RouterLink } from '@angular/router';
import { RushConfiguration } from '../../core/models/rush.model';
import { buildVocabularyRushUnits,vocabularyRushConfiguration } from '../../core/services/rush-builders';
import { RushSettingsService } from '../../core/services/rush-settings.service';
import { TranslationService } from '../../core/services/translation.service';
import { VocabularyMedalService } from '../../core/services/vocabulary-medal.service';
import { VocabularyProgressService } from '../../core/services/vocabulary-progress.service';
import { VocabularySettingsService } from '../../core/services/vocabulary-settings.service';
import { VOCABULARY_CATEGORIES } from '../../core/models/vocabulary.model';
import { VOCABULARY_N5 } from '../../data/vocabulary-n5.generated';
import { MedalBadge } from '../../shared/components/medal-badge/medal-badge';
import { ProgressBar } from '../../shared/components/progress-bar/progress-bar';
import { ProgressCircle } from '../../shared/components/progress-circle/progress-circle';
import { RushConfigDialog,RushConfigOption } from '../../shared/components/rush-config-dialog/rush-config-dialog';
import { SelectionCard } from '../../shared/components/selection-card/selection-card';
import { VocabularyStartPanel } from './components/vocabulary-start-panel/vocabulary-start-panel';
@Component({selector:'app-vocabulary-page',imports:[RouterLink,VocabularyStartPanel,MedalBadge,ProgressBar,ProgressCircle,SelectionCard,RushConfigDialog],templateUrl:'./vocabulary.page.html',styleUrl:'./vocabulary.page.scss',changeDetection:ChangeDetectionStrategy.OnPush})
export class VocabularyPage{
  readonly progress=inject(VocabularyProgressService);readonly medals=inject(VocabularyMedalService);readonly i18n=inject(TranslationService);readonly showStartPanel=signal(false);readonly showRushPanel=signal(false);readonly rushConfig=signal<RushConfiguration|null>(null);
  readonly rushContent:readonly RushConfigOption[]=VOCABULARY_CATEGORIES.map(id=>({id,labelKey:`vocabulary.category.${id}`}));
  readonly rushTypes:readonly RushConfigOption[]=['japanese-to-meaning','meaning-to-japanese','japanese-to-reading','reading-to-japanese'].map(id=>({id,labelKey:`vocabulary.questionType.${id}`}));
  readonly countRushUnits=(config:RushConfiguration)=>buildVocabularyRushUnits(VOCABULARY_N5,config).length;
  private readonly rushSettings=inject(RushSettingsService);private readonly settings=inject(VocabularySettingsService);private readonly router=inject(Router);private readonly route=inject(ActivatedRoute);
  constructor(){if(this.route.snapshot.queryParamMap.get('rush')==='1')queueMicrotask(()=>this.openRush())}
  openRush(){this.rushConfig.set(this.rushSettings.getOrInitialize('vocabulary',vocabularyRushConfiguration(this.settings.selection())));this.showRushPanel.set(true)}
  startRush(config:RushConfiguration){this.rushSettings.save('vocabulary',config);this.showRushPanel.set(false);void this.router.navigateByUrl('/vocabulary/rush')}
}
