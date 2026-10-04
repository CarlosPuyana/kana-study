import { Component, ElementRef, HostListener, OnDestroy, afterNextRender, inject, input, output, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslationService } from '../../../core/services/translation.service';
import { DictionaryLookup, OcrLookupPoint } from '../../../core/models/dictionary.model';
import { MangaContextService } from '../../../core/services/manga-context.service';
import { MangaContextLocation, MangaContextMode, MangaStudyExplanation, MangaTranslationResult } from '../../../core/models/manga-context.model';
@Component({
  selector:'app-dictionary-popup',imports:[RouterLink],styleUrl:'./dictionary-popup.scss',
  template:`<div class="backdrop" (click)="closed.emit()"></div>
    <section #dialog class="dictionary-sheet" role="dialog" aria-modal="true" [attr.aria-label]="i18n.t('dictionary.title')" [style.left.px]="left()" [style.top.px]="top()" (pointerdown)="$event.stopPropagation()" (click)="$event.stopPropagation()">
      <button #close class="close" [attr.aria-label]="i18n.t('common.close')" (click)="closed.emit()">×</button>
      <nav class="tabs" [attr.aria-label]="i18n.t('manga.assist.tabs')">
        <button [attr.aria-pressed]="tab()==='word'" (click)="tab.set('word')">{{i18n.t('manga.assist.word')}}</button>
        <button [attr.aria-pressed]="tab()==='context'" (click)="tab.set('context')">{{i18n.t('manga.assist.context')}}</button>
      </nav>
      @if(isSelection()){<small>{{i18n.t('manga.assist.selectedText')}}</small><p class="ocr-context selected-text">{{selectedText()}}</p>}
      @if(tab()==='word'){
        @if (loading()) { <p role="status">{{i18n.t('common.loading')}}</p> }
        @else if (failed()) { <p role="alert">{{i18n.t('dictionary.lookupError')}}</p> }
        @else if (!result().installed) { <p>{{i18n.t('dictionary.missing')}}</p><a routerLink="/manga">{{i18n.t('dictionary.library')}}</a> }
        @else if (!result().terms.length) { <p>{{isSelection()?i18n.t('manga.assist.noSingleEntry'):i18n.t('dictionary.noResults',{term:result().query})}}</p> }
        @else {
          <article><h2>{{isSelection()?result().terms[0].expression:result().surface || result().terms[0].expression}}</h2>
          @if(result().surfaceReading || (!result().baseForm && result().terms[0].reading!==result().terms[0].expression)){<p class="reading">{{result().surfaceReading || result().terms[0].reading}}</p>}
          @if(result().baseForm){<div class="base"><small>{{i18n.t('manga.assist.base')}}</small><strong>{{result().baseForm}}</strong><span>{{result().reading}}</span></div>
            <p class="reasons">@for(reason of result().reasons;track $index){<span>{{i18n.t('manga.reason.'+reason)}}</span>}</p>}
          <ul>@for(glossary of result().terms[0].glossaries.slice(0,4);track $index){<li>{{glossary}}</li>}</ul></article>
          @if(moreMeanings().length || result().terms[0].glossaries.length>4){
            <details><summary>{{i18n.t('manga.assist.more')}}</summary>
              <ul>@for(glossary of result().terms[0].glossaries.slice(4);track $index){<li>{{glossary}}</li>}</ul>
              @for(term of moreMeanings();track term.id){<article><h3>{{term.expression}} · {{term.reading}}</h3><ul>@for(glossary of term.glossaries;track $index){<li>{{glossary}}</li>}</ul></article>}
            </details>
          }
          @if(interpretations().length){<details><summary>{{i18n.t('manga.assist.interpretations')}}</summary>@for(term of interpretations();track term.id){<article><h3>{{term.expression}} · {{term.reading}}</h3><ul>@for(glossary of term.glossaries;track $index){<li>{{glossary}}</li>}</ul></article>}</details>}
        }
      } @else {
        <h2>{{i18n.t('manga.assist.inContext')}}</h2>
        <p class="ocr-context">{{highlight().before}}<mark>{{highlight().selected}}</mark>{{highlight().after}}</p>
        <div class="context-actions"><button [disabled]="!assistant.available || !context() || busy()" (click)="ask('translate')">✨ {{i18n.t('manga.assist.translate')}}</button></div>
        @if(!assistant.available){<p class="hint">{{i18n.t('manga.assist.unavailable')}}</p>}
        @else{<p class="hint">{{i18n.t('manga.assist.privacy')}}</p>}
        @if(busy()){<p role="status">{{i18n.t('common.loading')}}</p><button (click)="cancel()">{{i18n.t('common.cancel')}}</button>}
        @if(contextError()){<p role="alert">{{i18n.t('manga.assist.error')}}</p>}
        @if(selectionLimitError()){<p role="alert">{{i18n.t('manga.assist.selectionLimit')}}</p>}
        @if(translation();as value){<p>{{value.natural}}</p>@if(value.literal){<p><strong>{{i18n.t('manga.assist.literal')}}:</strong> {{value.literal}}</p>}@for(note of value.notes;track $index){<p>{{note}}</p>}}
        @if(study();as value){<p>{{value.natural}}</p>@for(note of value.notes;track $index){<p class="study-note">{{note}}</p>}<h3>{{i18n.t('manga.assist.vocabulary')}}</h3><ul>@for(word of value.vocabulary;track $index){<li><strong>{{word.expression}}</strong> {{word.reading}} @if(word.baseForm){· {{word.baseForm}}} — {{word.meaning}}</li>}</ul><h3>{{i18n.t('manga.assist.grammar')}}</h3><ul>@for(item of value.grammar;track $index){<li><strong>{{item.expression}}</strong> — {{item.explanation}}</li>}</ul>}
      }
    </section>`,
})
export class DictionaryPopup implements OnDestroy {
  readonly i18n=inject(TranslationService);readonly assistant=inject(MangaContextService);
  readonly result=input.required<DictionaryLookup>();readonly loading=input(false);readonly failed=input(false);readonly x=input(0);readonly y=input(0);readonly closed=output<void>();
  readonly context=input<OcrLookupPoint|null>(null);readonly location=input<MangaContextLocation>({volumeId:'',pageIndex:0,blockIndex:0});
  readonly tab=signal<'word'|'context'>('word');readonly busy=signal(false);readonly contextError=signal(false);
  readonly selectionLimitError=signal(false);
  readonly translation=signal<MangaTranslationResult|null>(null);readonly study=signal<MangaStudyExplanation|null>(null);
  private controller:AbortController|null=null;private readonly previousFocus=document.activeElement;
  private readonly close=viewChild<ElementRef<HTMLButtonElement>>('close');private readonly dialog=viewChild<ElementRef<HTMLElement>>('dialog');
  constructor(){afterNextRender(()=>this.close()?.nativeElement.focus());}
  isSelection():boolean {const point=this.context();return point?point.mode==='selection':this.result().mode==='selection';}
  selectedText():string {return this.context()?.selectedText??this.result().requestedText??this.result().selectedText??this.result().surface??this.result().query;}
  interpretations(){return this.result().terms.slice(1).filter(term=>!!this.result().baseForm && term.expression!==this.result().terms[0]?.expression);}
  moreMeanings(){return this.result().terms.slice(1).filter(term=>!this.result().baseForm || term.expression===this.result().terms[0]?.expression);}
  highlight():{before:string;selected:string;after:string}{
    if(this.isSelection())return {before:'',selected:this.selectedText(),after:''};
    const point=this.context(),text=point?.selectedText??point?.text??'';const surface=this.result().surface??this.result().query;
    const index=surface?text.indexOf(surface,Math.max(0,(point?.offset??0)-surface.length+1)):-1;
    return index<0?{before:text,selected:'',after:''}:{before:text.slice(0,index),selected:surface,after:text.slice(index+surface.length)};
  }
  async ask(mode:MangaContextMode):Promise<void>{
    // Study is internal/experimental and is not published in Manga Assistant V1.
    if(mode!=='translate')return;
    const point=this.context();if(!point || !this.assistant.available || this.busy())return;
    this.selectionLimitError.set(false);
    // Respect explicit text: refuse an oversized request rather than silently truncating it.
    if(point.mode==='selection' && (point.selectedText??point.text).length>1200){this.selectionLimitError.set(true);return;}
    this.cancel();const controller=new AbortController();this.controller=controller;this.busy.set(true);this.contextError.set(false);this.translation.set(null);this.study.set(null);
    try{const result=await this.assistant.request(mode,{selectedText:point.mode==='selection'?(point.selectedText??point.text):point.text,contextText:point.mode==='selection' && (point.endBlockIndex===undefined || point.endBlockIndex===point.blockIndex)?point.text:undefined,selectedExpression:!this.loading()&&!this.failed()&&this.result().terms.length?(this.result().surface??this.result().query):undefined,previousText:point.previousText,nextText:point.nextText,targetLanguage:this.i18n.language()},this.location(),controller.signal);
      if(!controller.signal.aborted){if(mode==='translate')this.translation.set(result as MangaTranslationResult);else this.study.set(result as MangaStudyExplanation);}
    }catch{if(!controller.signal.aborted)this.contextError.set(true);}finally{if(this.controller===controller){this.busy.set(false);this.controller=null;}}
  }
  cancel():void{this.controller?.abort();this.controller=null;this.busy.set(false);}
  left():number{return Math.max(8,Math.min(this.x()+10,window.innerWidth-388));}
  top():number{return Math.max(8,Math.min(this.y()+12,window.innerHeight-Math.min(440,window.innerHeight*.65)-8));}
  @HostListener('document:keydown',['$event']) key(event:KeyboardEvent):void {
    if(event.key==='Escape'){event.preventDefault();event.stopPropagation();this.closed.emit();}
    if(event.key==='Tab'){const controls=Array.from(this.dialog()?.nativeElement.querySelectorAll<HTMLElement>('button:not(:disabled),a,summary')??[]);const first=controls[0],last=controls.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}
  }
  ngOnDestroy():void{this.cancel();if(this.previousFocus instanceof HTMLElement && this.previousFocus.isConnected)this.previousFocus.focus();}
}
