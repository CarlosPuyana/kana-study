import {ChangeDetectionStrategy,Component,computed,effect,inject,input,signal} from '@angular/core';
import {TranslationService} from '../../../core/services/translation.service';
import {intendedVocabularyWords,vocabularyMeanings,LocalVocabularyWord} from '../../../core/services/japanese-local-vocabulary';
import {GrammarLessonPrerequisites} from '../models/grammar.model';
import {grammarReferenceMeaning} from '../data/grammar-vocabulary-reference';

@Component({selector:'app-grammar-intended-vocabulary',changeDetection:ChangeDetectionStrategy.OnPush,
  template:`<p>{{i18n.t('grammar.dictionary.hint')}}</p><ul class="vocabulary-list">@for(word of visible();track word.raw){<li>
    <button class="word" type="button" lang="ja" data-dictionary-word><strong>{{word.expression}}</strong></button>
    @if(word.reading){<small lang="ja">{{word.reading}}</small>}
    <span>{{meaning(word) || i18n.t('grammar.vocabularyUnavailable')}}</span>
  </li>}</ul>
  @if(words().length>8){<button class="toggle" type="button" [attr.aria-expanded]="expanded()" (click)="expanded.set(!expanded())">{{i18n.t(expanded()?'grammar.vocabularyLess':'grammar.vocabularyAll',{count:words().length})}}</button>}`,
  styles:`:host{display:block;min-width:0}.vocabulary-list{list-style:none;margin:.8rem 0;padding:0;display:grid;gap:.6rem;grid-template-columns:repeat(auto-fit,minmax(min(100%,9rem),1fr))}
  li{display:flex;flex-direction:column;gap:.25rem;padding:.65rem;border:1px solid var(--border);border-radius:.65rem;min-width:0;overflow-wrap:anywhere}
  strong{font-size:1.2rem;color:var(--text-primary)}small,span{color:var(--text-secondary)}
  button{min-height:44px;border:1px solid var(--border);border-radius:.5rem;background:var(--surface);color:var(--text-primary);padding:.5rem;font:inherit;cursor:pointer}
  .word{text-align:start;border:0;padding:0;background:transparent;text-decoration:underline;text-decoration-color:var(--border);text-underline-offset:.25rem}
  :focus-visible{outline:2px solid var(--accent);outline-offset:3px}`})
export class GrammarIntendedVocabulary {
  readonly prerequisites=input.required<GrammarLessonPrerequisites>();readonly i18n=inject(TranslationService);
  readonly expanded=signal(false);readonly words=computed(()=>intendedVocabularyWords(this.prerequisites().intendedVocabulary));
  readonly visible=computed(()=>this.expanded()?this.words():this.words().slice(0,8));
  constructor(){effect(()=>{this.prerequisites();this.expanded.set(false);});}
  meaning(word:LocalVocabularyWord):string {
    const meanings=vocabularyMeanings(word,this.i18n.language());if(meanings.length)return meanings.slice(0,3).join('; ');
    const inline=this.prerequisites().inlineExplanations?.filter(e=>e.term===word.expression && (!word.reading || e.reading===word.reading))??[];
    return inline.length===1?this.i18n.t(inline[0].meaningKey):grammarReferenceMeaning(word,this.i18n.language());
  }
}
