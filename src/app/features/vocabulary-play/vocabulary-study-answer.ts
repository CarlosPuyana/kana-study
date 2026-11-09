import {ChangeDetectionStrategy,Component,inject,input} from '@angular/core';
import {VocabularyEntry,VocabularyQuestionType} from '../../core/models/vocabulary.model';
import {TranslationService} from '../../core/services/translation.service';
import {vocabularyReadingVariants} from '../../core/services/vocabulary-form-readings';
import {vocabularyRomaji} from '../../core/services/vocabulary-romaji';
import {FuriganaText} from '../../shared/components/furigana-text/furigana-text';

/** Presentation only: accepted answers and scheduling stay in the session service. */
@Component({selector:'app-vocabulary-study-answer',imports:[FuriganaText],changeDetection:ChangeDetectionStrategy.OnPush,
 template:`@let word=entry();
 @switch(direction()){
  @case('japanese-to-meaning'){<h2>{{word.quizMeaning[i18n.language()]}}</h2>}
  @case('meaning-to-japanese'){<app-furigana-text class="japanese" [segments]="word.furigana"/>}
  @case('japanese-to-reading'){<h2 lang="ja">{{word.primaryReading}}</h2>}
  @case('reading-to-japanese'){<h2 class="japanese" lang="ja">{{word.primaryWrittenForm}}</h2>}
 }
 @if(direction()!=='japanese-to-meaning' && variants(word).length){<p class="reading-variants" lang="ja">{{variants(word).join(' · ')}}</p>}
 @if(direction()==='japanese-to-reading'){<p class="gloss">{{word.quizMeaning[i18n.language()]}}</p>}
 <details><summary>{{i18n.t('vocabulary.compact.details')}}</summary>
  @if(romaji(word);as latin){<small class="romaji" lang="ja-Latn">{{latin}}</small>}
  <p>{{i18n.t('vocabulary.pos.'+word.partOfSpeech[0])}}</p>
  @if(word.writtenForms.length>1){<p lang="ja">{{word.writtenForms.join(' · ')}}</p>}
  @if(word.examples[0];as example){<article class="example"><strong lang="ja">{{example.japanese}}</strong><span lang="ja">{{example.reading}}</span><p>{{example.translations[i18n.language()]}}</p></article>}
 </details>`,
 styles:`:host{display:grid;gap:.4rem;width:100%;min-width:0;text-align:center;overflow-wrap:anywhere}h2,p{margin:0}h2{font-size:clamp(1.35rem,3vw,1.8rem);line-height:1.35}.japanese{font-size:clamp(1.8rem,4vw,2.5rem);line-height:1.5}.reading-variants,.gloss,.romaji{font-size:.9rem;color:var(--text-secondary)}details{font-size:.875rem;color:var(--text-secondary)}summary{cursor:pointer;min-height:44px;align-content:center}summary:focus-visible{outline:3px solid var(--accent);outline-offset:2px}details[open]{display:grid;gap:.4rem}.example{display:grid;gap:.25rem;padding:.5rem;background:var(--surface-raised);border-radius:.6rem}.example strong{color:var(--text-primary)}.romaji{display:block}`})
export class VocabularyStudyAnswer{
 readonly entry=input.required<VocabularyEntry>();readonly direction=input.required<VocabularyQuestionType>();readonly i18n=inject(TranslationService);
 readonly variants=vocabularyReadingVariants;readonly romaji=vocabularyRomaji;
}
