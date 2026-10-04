import {ChangeDetectionStrategy,Component,computed,inject,signal,viewChild} from '@angular/core';
import {ActivatedRoute,RouterLink} from '@angular/router';
import {VocabularyEntry,VocabularyStudyCategory,VOCABULARY_CATEGORIES} from '../../core/models/vocabulary.model';
import {VocabularyWritingSession} from '../../core/services/vocabulary-writing-session';
import {TranslationService} from '../../core/services/translation.service';
import {VOCABULARY_N5} from '../../data/vocabulary-n5.generated';
import {WordWritingPractice} from '../../shared/components/word-writing-practice/word-writing-practice';
import {WeaknessService} from '../../core/services/weakness.service';

@Component({selector:'app-vocabulary-writing-page',imports:[RouterLink,WordWritingPractice],templateUrl:'./vocabulary-writing.page.html',styleUrls:['../writing/kana-writing.page.scss','./vocabulary-writing.page.scss'],changeDetection:ChangeDetectionStrategy.OnPush})
export class VocabularyWritingPage {
  readonly i18n=inject(TranslationService);private readonly route=inject(ActivatedRoute);
  private readonly weaknesses=inject(WeaknessService);readonly weakMode=signal(false);
  readonly categories=VOCABULARY_CATEGORIES.filter(c=>VOCABULARY_N5.some(e=>e.enabled&&e.studyCategory===c));
  readonly selected=signal<readonly VocabularyStudyCategory[]>([...this.categories]);
  readonly withReading=signal(true);readonly withGuide=signal(true);
  readonly pool=computed(()=>VOCABULARY_N5.filter(e=>e.enabled&&this.selected().includes(e.studyCategory)));
  readonly session=signal<VocabularyWritingSession|null>(null);readonly current=signal<VocabularyEntry|null>(null);
  readonly individual=signal<VocabularyEntry|null>(null);readonly resolved=signal(0);readonly revealed=signal(false);readonly wordFinished=signal(false);
  readonly practice=viewChild(WordWritingPractice);
  constructor(){this.weakMode.set(this.route.snapshot.queryParamMap.get('weak')==='1');if(this.weakMode()){this.start();return;}const id=this.route.snapshot.queryParamMap.get('entry');if(id)this.individual.set(VOCABULARY_N5.find(e=>e.id===id)??null);}
  toggle(category:VocabularyStudyCategory):void{this.selected.update(c=>c.includes(category)?c.filter(x=>x!==category):[...c,category]);}
  start():void{const pool=this.weakMode()?this.weaknesses.items('vocabulary',VOCABULARY_N5.filter(e=>e.enabled),10):this.pool();if(!pool.length&&!this.weakMode())return;const session=new VocabularyWritingSession(pool,this.weakMode()?this.categories:this.selected());this.session.set(session);this.current.set(session.current);this.resolved.set(0);this.revealed.set(false);this.wordFinished.set(false);}
  answer(correct:boolean):void{
    if(!this.revealed()||!this.wordFinished())return;const session=this.session();if(!session)return;
    if(!session.current)return;
    this.weaknesses.record('vocabulary',session.current.id,correct);
    session.answer(correct);this.practice()?.restart();this.current.set(session.current);this.resolved.set(session.resolved);this.revealed.set(false);this.wordFinished.set(false);
  }
  configure():void{if(this.weakMode()){this.start();return;}this.session.set(null);this.current.set(null);}
}
