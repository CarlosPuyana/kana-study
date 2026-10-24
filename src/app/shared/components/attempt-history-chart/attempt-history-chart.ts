import {ChangeDetectionStrategy,Component,computed,input,inject} from '@angular/core';
import {DailyAttempts,objectiveAccuracy} from '../../../core/services/attempt-analytics';
import {TranslationService} from '../../../core/services/translation.service';
@Component({selector:'app-attempt-history-chart',templateUrl:'./attempt-history-chart.html',styleUrl:'./attempt-history-chart.scss',changeDetection:ChangeDetectionStrategy.OnPush})
export class AttemptHistoryChart {
  readonly days=input.required<readonly DailyAttempts[]>();readonly accuracy=input(false);readonly i18n=inject(TranslationService);
  readonly accuracyOf=objectiveAccuracy;
  readonly bars=computed(()=>{const days=this.days(),maximum=Math.max(1,...days.map(d=>d.attempts)),width=600/Math.max(1,days.length);
    return days.map((d,index)=>({x:index*width+width*.1,y:150-d.attempts/maximum*140,height:d.attempts/maximum*140,width:width*.8,day:d.day,count:d.attempts}));});
  readonly line=computed(()=>{let pen=false,path='';for(const [index,day] of this.days().entries()){
    const value=objectiveAccuracy(day);if(value===null){pen=false;continue;}const x=(index+.5)*600/this.days().length,y=150-value*1.4;path+=`${pen?'L':'M'}${x},${y} `;pen=true;}return path;});
  readonly points=computed(()=>this.days().flatMap((d,index)=>{const value=objectiveAccuracy(d);return value===null?[]:[{day:d.day,x:(index+.5)*600/this.days().length,y:150-value*1.4}];}));
  percentage(value:number|null):string{return value===null?this.i18n.t('statsV2.noData'):new Intl.NumberFormat(this.i18n.language(),{maximumFractionDigits:1}).format(value)+'%';}
}
