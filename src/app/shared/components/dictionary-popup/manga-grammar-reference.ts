import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DictionaryLookup, OcrLookupPoint } from '../../../core/models/dictionary.model';
import { TranslationService } from '../../../core/services/translation.service';
import { WorkspaceService } from '../../../core/services/workspace.service';
import { mangaGrammarCatalog, mangaGrammarLinks, matchMangaGrammar, searchMangaGrammar } from '../../../core/services/manga-grammar-matcher';
import * as grammarCopy from '../../../../assets/i18n/grammar.generated';
import { safeReturnUrl } from '../../../core/services/return-navigation';

@Component({selector:'app-manga-grammar-reference',imports:[RouterLink],styleUrl:'./manga-grammar-reference.scss',template:`
    <h2>{{t('manga.grammar.title')}}</h2>
    <p class="original" lang="ja">{{original()}}</p>
    @if(lookup()?.baseForm){<small>{{t('manga.assist.base')}}: <span lang="ja">{{lookup()?.baseForm}}</span></small>}
    @if(analysis().state!=='ready'){<p role="status">{{t('manga.grammar.'+analysis().state)}}</p>}
    @if(!verified()){<p role="status">{{t('manga.grammar.noMatch')}}</p>}
    <p class="hint">{{t('manga.grammar.scope')}}</p>
    @for(match of analysis().matches;track match.concept.id){
      <button class="result" (click)="choose(match.concept.id)"><strong>{{t(match.concept.titleKey)}}</strong>
        <span>{{t(match.confidence==='verified'?'manga.grammar.verified':'manga.grammar.possible')}}</span>
        <span>{{t(match.concept.summaryKey)}}</span></button>
    }
    <label>{{t('manga.grammar.search')}}<input type="search" maxlength="1200" [value]="query()" (input)="search($event)" /></label>
    <p class="hint">{{t('manga.grammar.manual')}}</p>
    @if(query().trim()&&!results().length){<p>{{t('manga.grammar.noLessons')}}</p>}
    @for(concept of results();track concept.id){<button class="result" (click)="choose(concept.id)"><strong>{{t(concept.titleKey)}}</strong><span>{{t(concept.summaryKey)}}</span></button>}
    @if(chosen();as concept){
      <article class="reference" aria-live="polite">
        <h3>{{t(concept.titleKey)}}</h3><p>{{t(concept.summaryKey)}}</p>
        @if(evidence();as evidence){<p>{{t(evidence.reasonKey)}}</p>
          @if(evidence.confidence==='verified'){<blockquote lang="ja">{{evidence.evidence}}</blockquote>}
        }
        <h4>{{t('grammar.v2.idea')}}</h4><p>{{t(concept.lesson.ideaKey)}}</p>
        <h4>{{t('grammar.v2.formation')}}</h4>
        @for(row of concept.lesson.formation;track $index){<p class="pattern" lang="ja">{{row.pattern}}</p>}
        <h4>{{t('manga.grammar.examples')}}</h4>
        @for(example of concept.lesson.examples.slice(0,2);track $index){<p class="pattern" lang="ja">{{example.japanese}}</p><p>{{t(example.meaningKey)}}</p>}
        @if(links();as links){<div class="actions"><a [routerLink]="links.lesson" [queryParams]="{return:returnUrl()}">{{t('manga.grammar.lesson')}}</a>
          @if(links.practice){<a [routerLink]="links.practice" [queryParams]="{lesson:links.lessonId,return:returnUrl()}">{{t('manga.grammar.practice')}}</a>}
          @else{<p>{{t('manga.grammar.noExercises')}}</p>}
        </div>}
      </article>
    }
`})
export class MangaGrammarReference {
  readonly i18n=inject(TranslationService);
  private readonly workspace=inject(WorkspaceService);
  readonly point=input<OcrLookupPoint|null>(null);
  readonly lookup=input<DictionaryLookup|null>(null);
  readonly returnTo=input('/manga');
  readonly query=signal('');private readonly selectedId=signal<string|null>(null);
  readonly original=computed(()=>this.point()?.mode==='selection'?this.point()!.selectedText??this.point()!.text
    :this.lookup()?.surface||this.lookup()?.query||this.point()?.text||'');
  readonly analysis=computed(()=>{
    const point=this.point(),lookup=this.lookup(),selected=this.original();
    const start=point?.mode==='selection'?point.startOffset:point?.offset;
    return matchMangaGrammar({selectedText:selected,surface:lookup?.surface,baseForm:lookup?.baseForm,dictionary:lookup??undefined,
      contextText:point?.text,start,end:point?.mode==='selection'?point.endOffset:start===undefined?undefined:start+selected.length});
  });
  readonly verified=computed(()=>this.analysis().matches.some(match=>match.confidence==='verified'));
  readonly results=computed(()=>searchMangaGrammar(this.query(),key=>this.t(key)));
  readonly chosen=computed(()=>mangaGrammarCatalog.find(concept=>concept.id===this.selectedId())??null);
  readonly evidence=computed(()=>this.analysis().matches.find(match=>match.concept.id===this.selectedId()));
  readonly links=computed(()=>this.selectedId()?mangaGrammarLinks(this.selectedId()!):null);
  readonly returnUrl=computed(()=>safeReturnUrl(this.returnTo(),'/manga'));
  constructor(){this.i18n.useBundledGrammar(grammarCopy);effect(()=>{this.point();this.lookup();this.returnTo();this.workspace.active();this.query.set('');this.selectedId.set(null);});}
  t(key:string):string{return this.i18n.t(key);}
  choose(id:string):void{this.selectedId.set(id);}
  search(event:Event):void{this.query.set((event.target as HTMLInputElement).value);this.selectedId.set(null);}
}
