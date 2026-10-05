import {grammarQuestionLabelKey,grammarWeaknessTitleKey} from '../grammar/services/grammar-weakness';
import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {RouterLink} from '@angular/router';
import {LearningAnalyticsService} from '../../core/services/learning-analytics.service';
import {LearningDirection, LearningRecommendation} from '../../core/models/learning-analytics.model';
import {WeaknessActivity, WeaknessModule} from '../../core/models/weakness.model';
import {TranslationService} from '../../core/services/translation.service';

@Component({selector:'app-stats-page',imports:[RouterLink],templateUrl:'./stats.page.html',styleUrl:'./stats.page.scss',changeDetection:ChangeDetectionStrategy.OnPush})
export class StatsPage {
  readonly analytics=inject(LearningAnalyticsService);
  readonly i18n=inject(TranslationService);
  constructor(){this.analytics.refresh();}
  moduleLabel(module:WeaknessModule):string{return this.i18n.t(module==='kana'?'weaknesses.kana':`${module}.title`);}
  skillLabel(activity:WeaknessActivity):string{return this.i18n.t(activity==='learn'?'weaknesses.learn':activity==='writing'?'writing.title':'listening.skill');}
  skillIcon(activity:WeaknessActivity):string{return activity==='learn'?'📚':activity==='writing'?'✍':'🎧';}
  grammarTitle(itemId:string):string{return this.i18n.t(grammarWeaknessTitleKey(itemId)??'grammar.title');}
  directionLabel(direction:LearningDirection):string {
    if(direction.module==='grammar')return this.i18n.t(grammarQuestionLabelKey(direction.questionType));
    return this.i18n.t(`${direction.module==='kana'?'questionTypes':direction.module+'.questionType'}.${direction.questionType}`);
  }
  percent(value:number|null):string {
    return value===null?this.i18n.t('stats.insufficient'):new Intl.NumberFormat(this.i18n.language(),{maximumFractionDigits:1}).format(value)+'%';
  }
  duration(seconds:number):string {
    const rounded=Math.floor(seconds);
    return `${Math.floor(rounded/3600)}:${String(Math.floor(rounded/60)%60).padStart(2,'0')}:${String(rounded%60).padStart(2,'0')}`;
  }
  recommendation(item:LearningRecommendation):string {
    return this.i18n.t(item.key,{skill:item.activity?this.skillLabel(item.activity):'',direction:item.direction?this.directionLabel(item.direction):''});
  }
}
