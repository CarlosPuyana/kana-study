import {ChangeDetectionStrategy,Component,DestroyRef,computed,effect,inject,signal,untracked} from '@angular/core';
import {ATTEMPT_ACTIVITIES,ATTEMPT_MODULES,AttemptActivity,AttemptModule} from '../../core/models/attempt-event.model';
import {AttemptEventRepository} from '../../core/services/attempt-event.repository';
import {AttemptRecordingService} from '../../core/services/attempt-recording.service';
import {AttemptHistory,historicalAccumulator,objectiveAccuracy} from '../../core/services/attempt-analytics';
import {WorkspaceService} from '../../core/services/workspace.service';
import {TranslationService} from '../../core/services/translation.service';
import {AttemptHistoryChart} from '../../shared/components/attempt-history-chart/attempt-history-chart';
@Component({selector:'app-historical-stats',imports:[AttemptHistoryChart],templateUrl:'./historical-stats.html',styleUrl:'./historical-stats.scss',changeDetection:ChangeDetectionStrategy.OnPush})
export class HistoricalStats {
  readonly i18n=inject(TranslationService);readonly repository=inject(AttemptEventRepository);private readonly recorder=inject(AttemptRecordingService);private readonly workspace=inject(WorkspaceService);
  readonly periods=[7,30,90] as const;readonly modules=ATTEMPT_MODULES;readonly skills=ATTEMPT_ACTIVITIES;
  readonly period=signal<7|30|90>(7);readonly module=signal<AttemptModule|''>('');readonly skill=signal<AttemptActivity|''>('');
  readonly history=signal<AttemptHistory|null>(null);readonly loading=signal(false);readonly error=signal(false);
  private readonly refresh=signal(0);private generation=0;
  readonly accuracy=computed(()=>this.history()?objectiveAccuracy(this.history()!.total):null);
  constructor(){effect(()=>{
    const count=this.period(),module=this.module(),activity=this.skill(),workspace=this.workspace.active();this.repository.revision();this.workspace.dataRevision();this.refresh();
    untracked(()=>{const generation=++this.generation;this.loading.set(true);this.error.set(false);this.history.set(null);
      const accumulator=historicalAccumulator(count);
      void this.repository.scan({from:accumulator.from,to:accumulator.to,...(module?{module}:{}),...(activity?{activity}:{})},e=>accumulator.accept(e),workspace)
        .then(()=>{if(generation===this.generation)this.history.set(accumulator.finish());})
        .catch(()=>{if(generation===this.generation)this.error.set(true);})
        .finally(()=>{if(generation===this.generation)this.loading.set(false);});
    });
  });inject(DestroyRef).onDestroy(()=>this.generation++);}
  async retry():Promise<void>{await this.recorder.retry();this.refresh.update(n=>n+1);}
  setPeriod(event:Event):void{const n=Number((event.target as HTMLSelectElement).value);if(n===7||n===30||n===90)this.period.set(n);}
  setModule(event:Event):void{const value=(event.target as HTMLSelectElement).value;if(value===''||this.modules.includes(value as AttemptModule))this.module.set(value as AttemptModule|'');}
  setSkill(event:Event):void{const value=(event.target as HTMLSelectElement).value;if(value===''||this.skills.includes(value as AttemptActivity))this.skill.set(value as AttemptActivity|'');}
  moduleLabel(module:AttemptModule):string{return this.i18n.t(module==='kana'?'weaknesses.kana':module+'.title');}
  skillLabel(skill:AttemptActivity):string{return this.i18n.t(skill==='learn'?'weaknesses.learn':skill==='writing'?'writing.title':'listening.skill');}
  percentage(value:number|null):string{return value===null?this.i18n.t('statsV2.noData'):new Intl.NumberFormat(this.i18n.language(),{maximumFractionDigits:1}).format(value)+'%';}
  readonly accuracyOf=objectiveAccuracy;
  delta(value:number|null):string{return value===null?this.i18n.t('statsV2.insufficient'):new Intl.NumberFormat(this.i18n.language(),{maximumFractionDigits:1,signDisplay:'always'}).format(value)+' '+this.i18n.t('statsV2.points');}
}
