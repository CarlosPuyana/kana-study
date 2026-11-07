import {ChangeDetectionStrategy,Component,DestroyRef,computed,effect,inject,signal,untracked} from '@angular/core';
import {TranslationService} from '../../../core/services/translation.service';
import * as studyCopy from '../../../../assets/i18n/deck-study.generated';
import {VocabularyStatsReader} from '../../../core/services/vocabulary-stats-reader';
import {VocabularySettingsService} from '../../../core/services/vocabulary-settings.service';
import {vocabularyStudyUnits} from '../../../core/services/vocabulary-selection';
import {vocabularyOverview} from '../../../core/services/vocabulary-statistics';
import {VOCABULARY_N5} from '../../../data/vocabulary-n5.generated';
import {AttemptActivity} from '../../../core/models/attempt-event.model';
import {objectiveAccuracy} from '../../../core/services/attempt-analytics';
import {AttemptHistoryChart} from '../../../shared/components/attempt-history-chart/attempt-history-chart';
import {VocabularyForecast} from './vocabulary-forecast';
@Component({selector:'app-vocabulary-statistics',imports:[AttemptHistoryChart,VocabularyForecast],templateUrl:'./vocabulary-statistics.html',styleUrl:'./vocabulary-statistics.scss',changeDetection:ChangeDetectionStrategy.OnPush})
export class VocabularyStatistics {
 readonly i18n=inject(TranslationService);readonly reader=inject(VocabularyStatsReader);private readonly settings=inject(VocabularySettingsService);
 readonly local=signal(this.reader.snapshot());readonly now=signal(new Date());readonly period=signal<7|30|90>(7);readonly activity=signal<AttemptActivity|''>('learn');readonly firstOnly=signal(false);
 readonly result=signal<Awaited<ReturnType<VocabularyStatsReader['evolution']>>|null>(null);readonly error=signal(false);readonly loading=signal(false);readonly refresh=signal(0);private generation=0;
 readonly overview=computed(()=>vocabularyOverview(vocabularyStudyUnits(VOCABULARY_N5,this.settings.selection()),this.local().progress,this.local().events,this.now()));
 readonly history=computed(()=>this.firstOnly()?this.result()?.first:this.result()?.all);readonly accuracy=computed(()=>this.history()?objectiveAccuracy(this.history()!.total):null);
 readonly states=['new','learning','review','relearning'] as const;
 constructor(){this.i18n.useStudyCopy(studyCopy);effect(()=>{const period=this.period(),activity=this.activity();this.refresh();this.reader.workspace.active();this.reader.workspace.activationRevision();this.reader.workspace.dataRevision();this.reader.repository.revision();untracked(()=>{const generation=++this.generation;this.result.set(null);this.error.set(false);this.loading.set(true);this.local.set(this.reader.snapshot());this.now.set(new Date());void this.reader.evolution(period,activity,this.now()).then(data=>{if(generation===this.generation)this.result.set(data);}).catch(()=>{if(generation===this.generation)this.error.set(true);}).finally(()=>{if(generation===this.generation)this.loading.set(false);});});});inject(DestroyRef).onDestroy(()=>this.generation++);}
 reload(){this.refresh.update(n=>n+1);}
 setPeriod(e:Event){const n=Number((e.target as HTMLSelectElement).value);if(n===7||n===30||n===90)this.period.set(n);}
 setActivity(e:Event){const v=(e.target as HTMLSelectElement).value;if(['','learn','writing','listening'].includes(v))this.activity.set(v as AttemptActivity|'');}
 percent(n:number|null){return n===null?this.i18n.t('statsV2.noData'):new Intl.NumberFormat(this.i18n.language(),{maximumFractionDigits:1}).format(n)+'%';}
}
