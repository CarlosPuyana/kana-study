import {ChangeDetectionStrategy,Component,DestroyRef,computed,effect,inject,signal,untracked} from '@angular/core';
import {RouterLink} from '@angular/router';
import {TranslationService} from '../../core/services/translation.service';
import {KanjiStatisticsReader} from '../../core/services/kanji-statistics-reader';
import {kanjiCatalogOverview,kanjiSessionActivity} from '../../core/services/kanji-statistics';
import {objectiveAccuracy} from '../../core/services/attempt-analytics';
import {PageHeader} from '../../shared/components/page-header/page-header';
import {ProgressBar} from '../../shared/components/progress-bar/progress-bar';
import {AttemptHistoryChart} from '../../shared/components/attempt-history-chart/attempt-history-chart';
import {KanjiAvailabilityNotice} from '../kanji/components/kanji-availability-notice';
import * as copy from '../../../assets/i18n/deck-study.generated';

@Component({selector:'app-kanji-stats-page',imports:[RouterLink,PageHeader,ProgressBar,AttemptHistoryChart,KanjiAvailabilityNotice],
  templateUrl:'./kanji-stats.page.html',styleUrl:'./kanji-stats.page.scss',changeDetection:ChangeDetectionStrategy.OnPush})
export class KanjiStatsPage {
  readonly i18n=inject(TranslationService);
  readonly reader=inject(KanjiStatisticsReader);
  readonly period=signal<7|30|90>(30);
  readonly reload=signal(0);
  readonly loading=signal(false);
  readonly error=signal(false);
  private readonly result=signal<Awaited<ReturnType<KanjiStatisticsReader['load']>>|null>(null);
  private readonly requestedTime=signal(0);
  private generation=0;
  readonly overview=computed(()=>kanjiCatalogOverview(this.reader.progress.allProgress()));
  readonly now=computed(()=>new Date(Math.max(this.reader.progress.availabilityTime()??Date.now(),this.requestedTime())));
  readonly activity=computed(()=>kanjiSessionActivity(this.reader.sessions.sessions(),this.period(),this.now()));
  readonly history=computed(()=>{
    const r=this.result();return r?.owner===this.reader.workspace.active()&&r.epoch===this.reader.workspace.activationRevision()?r.value:null;
  });
  readonly accuracy=computed(()=>this.history()?objectiveAccuracy(this.history()!.measured):null);
  readonly accuracyOf=objectiveAccuracy;
  constructor(){
    this.i18n.useStudyCopy(copy);
    effect(()=>{
      const period=this.period(),now=this.now();this.reload();this.reader.workspace.activationRevision();
      this.reader.workspace.dataRevision();this.reader.repository.revision();this.reader.progress.reviewEvents();
      untracked(()=>{
        const generation=++this.generation;this.result.set(null);this.error.set(false);this.loading.set(true);
        void this.reader.load(period,now).then(r=>{if(generation===this.generation)this.result.set(r);})
          .catch(()=>{if(generation===this.generation)this.error.set(true);})
          .finally(()=>{if(generation===this.generation)this.loading.set(false);});
      });
    });
    inject(DestroyRef).onDestroy(()=>this.generation++);
  }
  setPeriod(e:Event){const n=Number((e.target as HTMLSelectElement).value);if(n===7||n===30||n===90)this.period.set(n);}
  refresh(){this.requestedTime.set(Date.now());this.reload.update(n=>n+1);}
  percent(n:number|null){return n===null?this.i18n.t('statsV2.noData'):new Intl.NumberFormat(this.i18n.language(),{maximumFractionDigits:1}).format(n)+'%';}
  duration(n:number|null){if(n===null)return this.i18n.t('statsV2.noData');const s=Math.floor(n);return `${Math.floor(s/3600)}:${String(Math.floor(s/60)%60).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;}
  date(at:string){return new Intl.DateTimeFormat(this.i18n.language(),{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/Madrid'}).format(new Date(at));}
}
