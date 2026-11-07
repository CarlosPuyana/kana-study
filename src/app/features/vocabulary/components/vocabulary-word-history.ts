import {ChangeDetectionStrategy,Component,DestroyRef,computed,effect,inject,input,signal,untracked} from '@angular/core';
import {VocabularyEntry,VocabularyQuestionType,VOCABULARY_QUESTION_TYPES} from '../../../core/models/vocabulary.model';
import {VocabularyStatsReader,AttemptCursor} from '../../../core/services/vocabulary-stats-reader';
import {vocabularyDirectionHistory,vocabularyAttemptKind} from '../../../core/services/vocabulary-statistics';
import {isReadingQuestionEligible} from '../../../core/services/vocabulary-selection';
import {TranslationService} from '../../../core/services/translation.service';
import * as studyCopy from '../../../../assets/i18n/deck-study.generated';
@Component({selector:'app-vocabulary-word-history',templateUrl:'./vocabulary-word-history.html',styleUrl:'./vocabulary-statistics.scss',changeDetection:ChangeDetectionStrategy.OnPush})
export class VocabularyWordHistory {
 readonly entry=input.required<VocabularyEntry>();readonly i18n=inject(TranslationService);private readonly reader=inject(VocabularyStatsReader);
 readonly local=signal(this.reader.snapshot());readonly direction=signal<VocabularyQuestionType>('japanese-to-meaning');readonly offset=signal(0);readonly loading=signal(false);readonly error=signal(false);readonly pageIndex=signal(0);
 readonly practice=signal<Awaited<ReturnType<VocabularyStatsReader['attempts']>>|null>(null);private cursors:(AttemptCursor|null)[]=[null];private generation=0;
 readonly types=computed(()=>VOCABULARY_QUESTION_TYPES.filter(t=>!t.includes('reading')||isReadingQuestionEligible(this.entry())));
 readonly current=computed(()=>this.local().progress[`vocab:${this.entry().id}:${this.direction()}`]??null);
 readonly history=computed(()=>vocabularyDirectionHistory(this.local().events,this.entry().id,this.direction()));readonly rows=computed(()=>this.history().slice(this.offset(),this.offset()+20));
 readonly maximum=computed(()=>Math.max(1,...this.rows().map(r=>r.after===null?0:Math.log1p(r.after/60000))));
 readonly partial=computed(()=>this.local().invalid||(this.current()?.fsrs.reps??0)>this.history().length);
 constructor(){this.i18n.useStudyCopy(studyCopy);effect(()=>{this.entry().id;this.reader.workspace.active();this.reader.workspace.activationRevision();this.reader.workspace.dataRevision();this.reader.repository.revision();untracked(()=>this.reload());});inject(DestroyRef).onDestroy(()=>this.generation++);}
 reload(){this.local.set(this.reader.snapshot());this.offset.set(0);this.cursors=[null];this.loadPractice(0);}
 changeDirection(e:Event){const type=(e.target as HTMLSelectElement).value as VocabularyQuestionType;if(this.types().includes(type)){this.direction.set(type);this.reload();}}
 loadPractice(index:number){const generation=++this.generation;this.loading.set(true);this.error.set(false);this.practice.set(null);void this.reader.attempts(this.entry().id,this.direction(),this.cursors[index]??null,new Date()).then(data=>{if(generation===this.generation){this.practice.set(data);this.pageIndex.set(index);if(data.next)this.cursors[index+1]=data.next;}}).catch(()=>{if(generation===this.generation)this.error.set(true);}).finally(()=>{if(generation===this.generation)this.loading.set(false);});}
 nextPractice(){if(this.practice()?.next)this.loadPractice(this.pageIndex()+1);}previousPractice(){if(this.pageIndex()>0)this.loadPractice(this.pageIndex()-1);}
 kind(event:import('../../../core/models/attempt-event.model').AttemptEvent){return vocabularyAttemptKind(event,this.local().events,this.local().lessons);}
 rating(rating:string){return this.i18n.t(rating==='again'?'learn.no':rating==='hard'?'learn.almost':'learn.yes');}
 date(iso:string|null|undefined){return iso&&Number.isFinite(Date.parse(iso))?new Intl.DateTimeFormat(this.i18n.language(),{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/Madrid'}).format(new Date(iso)):this.i18n.t('statsV2.noData');}
 interval(ms:number|null){if(ms===null)return this.i18n.t('statsV2.noData');const minutes=Math.floor(ms/60000),days=Math.floor(minutes/1440),hours=Math.floor(minutes%1440/60),rest=minutes%60,seconds=Math.floor(ms%60000/1000),remaining=ms%1000;const whole=([[days,'days'],[hours,'hours'],[rest,'minutes']] as const).filter(([n])=>n>0).map(([count,unit])=>this.i18n.t('anki.interval.'+unit,{count}));if(seconds)whole.push(this.i18n.t('vocabulary.daily.stats.seconds',{count:seconds}));if(remaining||!whole.length)whole.push(this.i18n.t('vocabulary.daily.stats.milliseconds',{count:remaining}));return whole.join(' · ');}
 height(ms:number|null){return ms===null?0:Math.log1p(ms/60000)/this.maximum()*100;}
}
