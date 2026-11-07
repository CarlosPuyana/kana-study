import {ChangeDetectionStrategy,Component,computed,inject,input,output,signal} from '@angular/core';
import {TranslationService} from '../../../core/services/translation.service';
import {VocabularyLearningSession} from '../../../core/models/vocabulary-session.model';
import {VocabularyStatsReader} from '../../../core/services/vocabulary-stats-reader';
import {vocabularyLessonStatistics} from '../../../core/services/vocabulary-statistics';
import {VocabularyForecast} from './vocabulary-forecast';
import {VOCABULARY_N5} from '../../../data/vocabulary-n5.generated';
import {RouterLink} from '@angular/router';
@Component({selector:'app-vocabulary-lesson-summary',imports:[VocabularyForecast,RouterLink],templateUrl:'./vocabulary-lesson-summary.html',styleUrl:'./vocabulary-statistics.scss',changeDetection:ChangeDetectionStrategy.OnPush})
export class VocabularyLessonSummary {
 readonly inspected=output<void>();readonly session=input.required<VocabularyLearningSession>();readonly i18n=inject(TranslationService);private readonly reader=inject(VocabularyStatsReader);
 readonly revision=signal(0);
 readonly snapshot=computed(()=>{this.session();this.revision();this.reader.repository.revision();return this.reader.snapshot();});
 refreshSnapshot(){this.revision.update(n=>n+1);}
 readonly data=computed(()=>vocabularyLessonStatistics(this.session(),this.snapshot().lessons.find(l=>l.session.id===this.session().id),this.snapshot().events,new Date()));
 readonly ratings=['again','hard','good'] as const;
 entry(id:string){return VOCABULARY_N5.find(e=>e.id===id);}
}
