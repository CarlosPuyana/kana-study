import {MangaStudySavedRepository} from '../../../core/services/manga-study-saved.repository';
import { NgTemplateOutlet } from '@angular/common';
import {WorkspaceService} from '../../../core/services/workspace.service';
import { Component, computed, effect, ElementRef, HostListener, OnDestroy, afterNextRender, afterRenderEffect, inject, input, output, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslationService } from '../../../core/services/translation.service';
import { DictionaryLookup, OcrLookupPoint } from '../../../core/models/dictionary.model';
import { MangaContextService } from '../../../core/services/manga-context.service';
import {MangaStudyIntegrationService} from '../../../core/services/manga-study-integration.service';
import {JapaneseAudioService} from '../../../core/services/japanese-audio.service';
import {MangaStudyMatch} from '../../../core/models/manga-study.model';
import {safeReturnUrl} from '../../../core/services/return-navigation';
import { MangaContextLocation, MangaContextMode, MangaStudyExplanation, MangaTranslationResult } from '../../../core/models/manga-context.model';
import { MangaGrammarReference } from './manga-grammar-reference';
import { MangaDeckReview } from '../../../features/manga/manga-deck-review';
import { MANGA_DECK_ASSISTED_ENABLED } from '../../../core/services/manga-deck-gate';
import { CUSTOM_DECKS_ENABLED } from '../../../core/services/custom-deck.repository';
@Component({
  selector:'app-dictionary-popup',imports:[RouterLink,MangaGrammarReference,MangaDeckReview,NgTemplateOutlet],styleUrl:'./dictionary-popup.scss',
  template:`<div class="backdrop" (click)="closed.emit()"></div>
    <section #dialog class="dictionary-sheet" [class.quick-add]="quickMode()" role="dialog" aria-modal="true" [attr.aria-label]="i18n.t(quickMode()?'manga.deck.title':'dictionary.title')" [style.left.px]="left()" [style.top.px]="top()" (pointerdown)="$event.stopPropagation()" (click)="$event.stopPropagation()">
      <button #close class="close" [attr.aria-label]="i18n.t('common.close')" (click)="closed.emit()">×</button>
      <nav class="tabs" [attr.aria-label]="i18n.t('manga.assist.tabs')">
        <button [attr.aria-pressed]="tab()==='word'" (click)="tab.set('word')">{{i18n.t('manga.assist.word')}}</button>
        <button [attr.aria-pressed]="tab()==='context'" (click)="tab.set('context')">{{i18n.t('manga.assist.context')}}</button>
        <button [attr.aria-pressed]="tab()==='grammar'" (click)="tab.set('grammar')">{{i18n.t('manga.grammar.title')}}</button>
      </nav>
      @if(isSelection()){<small [hidden]="quickMode()">{{i18n.t('manga.assist.selectedText')}}</small><p class="ocr-context selected-text" [hidden]="quickMode()">{{selectedText()}}</p>}
      @if(quickMode() && context();as point){
        <div [hidden]="tab()!=='word'">
          <app-manga-deck-review [point]="point" [lookup]="result()" [location]="location()" [volumeTitle]="volumeTitle()" [savedItemId]="isSaved()?savedCandidate()?.id:undefined" (saved)="completeCard()" (cancelled)="closeQuickAdd()" />
        </div>
      }
      @if(tab()==='word'){
        <ng-template #dictionaryContent>
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
          <a class="dictionary-source" routerLink="/manga">{{i18n.t('dictionary.title')}}</a>
          @if(studyMatch().vocabulary || studyMatch().kanji.length || savedCandidate() || canAdd()){
            <section class="study-integration" aria-labelledby="manga-study-title">
              <h3 id="manga-study-title">{{i18n.t('manga.study.title')}}</h3>
              @if(canAdd()){<button #addToDeck class="add-to-deck" (click)="openQuickAdd()">＋ {{i18n.t('manga.deck.addAction')}}</button>}
              @if(savedCandidate()){
                <div class="saved-actions">
                  @if(isSaved()){<span role="status">✓ {{i18n.t('manga.saved.saved')}}</span><button [disabled]="saving()" (click)="confirmRemove.set(true)">{{i18n.t('manga.saved.remove')}}</button>}
                  @else{<button [disabled]="saving() || saved.loading() || saved.failed()" (click)="saveWord()">＋ {{i18n.t('manga.saved.save')}}</button>}
                  @if(confirmRemove() && isSaved()){<div role="group" [attr.aria-label]="i18n.t('manga.saved.confirm')"><p>{{i18n.t('manga.saved.confirm')}}</p><button [disabled]="saving()" (click)="removeWord()">{{i18n.t('manga.saved.remove')}}</button><button (click)="confirmRemove.set(false)">{{i18n.t('common.cancel')}}</button></div>}
                  @if(saveError() || saved.failed()){<p role="alert">{{i18n.t('manga.saved.error')}}</p><button (click)="saved.reload()">{{i18n.t('manga.catalog.retry')}}</button>}
                </div>
              }
              @if(studyMatch().vocabulary;as entry){
                <article class="study-vocabulary">
                  <h4>✓ {{i18n.t('manga.study.vocabularyLevel',{level:entry.jlptApproxLevel})}}</h4>
                  <strong lang="ja">{{entry.primaryWrittenForm}}</strong><span lang="ja"> · {{entry.primaryReading}}</span>
                  <p>{{entry.quizMeaning[i18n.language()]}}</p>
                  <div class="study-actions">
                    <a routerLink="/vocabulary/all" [queryParams]="{entry:entry.id,return:studyReturn()}">{{i18n.t('manga.study.viewVocabulary')}}</a>
                    @if(studyMatch().writingAvailable){<a routerLink="/vocabulary/writing" [queryParams]="{entry:entry.id,return:studyReturn()}">✍ {{i18n.t('vocabularyWriting.practice')}}</a>}
                    @if(studyMatch().audioAvailable){<button type="button" [attr.aria-busy]="audioRequested() && audio.state()==='loading'" (click)="listen()">🎧 {{i18n.t('manga.study.listen')}}</button>}
                  </div>
                  @if(audioRequested() && audio.state()==='error'){<p role="alert">{{i18n.t('manga.study.audioError')}}</p>}
                  @if(audioRequested() && audio.state()==='blocked'){<p role="status">{{i18n.t('manga.study.audioBlocked')}}</p>}
                </article>
              }
              @if(studyMatch().kanji.length){
                <h4>{{i18n.t('kanji.title')}}</h4>
                @for(entry of studyMatch().kanji;track entry.id){
                  <article class="study-kanji"><strong lang="ja">{{entry.character}}</strong>
                    <div class="study-actions">
                      <a routerLink="/kanji/all" [queryParams]="{selected:entry.character,return:studyReturn()}" [attr.aria-label]="i18n.t('manga.study.viewKanjiNamed',{kanji:entry.character})">{{i18n.t('manga.study.viewKanji')}}</a>
                      <a routerLink="/kanji/writing" [queryParams]="{entry:entry.id,return:studyReturn()}">✍ {{i18n.t('manga.study.writeKanji',{kanji:entry.character})}}</a>
                    </div>
                  </article>
                }
              }
            </section>
          }
        }
        </ng-template>
        @if(!quickMode()){
          <ng-container [ngTemplateOutlet]="dictionaryContent" />
          @if(canAdd() && !result().terms.length){<section class="study-integration"><h3>{{i18n.t('manga.study.title')}}</h3><button #addToDeck class="add-to-deck" (click)="openQuickAdd()">＋ {{i18n.t('manga.deck.addAction')}}</button></section>}
        }
      } @else if(tab()==='context') {
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
      } @else {
        <app-manga-grammar-reference [point]="context()" [lookup]="loading()||failed()?null:result()" [returnTo]="studyReturn()" />
      }
    </section>`,
})
export class DictionaryPopup implements OnDestroy {
  readonly cardAdded=output<void>();
  private addedCard=false;
  completeCard():void{this.addedCard=true;this.cardAdded.emit();}
  readonly canAdd=computed(()=>this.assistedEnabled()&&this.customEnabled()&&!this.loading()&&!this.failed()&&!!this.context());
  private readonly requestedCard=signal<string|null>(null);
  private readonly cardScope=computed(()=>JSON.stringify([this.context(),this.location(),this.workspace.activationRevision()]));
  readonly quickMode=computed(()=>this.canAdd()&&this.requestedCard()===this.cardScope());
  private readonly addToDeck=viewChild<ElementRef<HTMLButtonElement>>('addToDeck');
  private readonly restoreDictionaryFocus=signal(false);
  openQuickAdd():void{if(this.canAdd()){this.requestedCard.set(this.cardScope());this.tab.set('word');}}
  closeQuickAdd():void{this.requestedCard.set(null);this.restoreDictionaryFocus.set(true);}
  readonly assistedEnabled=inject(MANGA_DECK_ASSISTED_ENABLED);
  readonly customEnabled=inject(CUSTOM_DECKS_ENABLED);
  readonly i18n=inject(TranslationService);readonly assistant=inject(MangaContextService);
  private readonly integration=inject(MangaStudyIntegrationService);readonly audio=inject(JapaneseAudioService);
  readonly studyMatch=computed<MangaStudyMatch>(()=>this.loading()||this.failed()?{kanji:[],audioAvailable:false,writingAvailable:false}:this.integration.match(this.result()));
  readonly studyReturn=computed(()=>safeReturnUrl(this.location().volumeId?'/manga/read/'+encodeURIComponent(this.location().volumeId)+'?page='+(this.location().pageIndex+1):'/manga','/manga'));
  readonly saved=inject(MangaStudySavedRepository);private readonly workspace=inject(WorkspaceService);
  readonly volumeTitle=input('');
  readonly saving=signal(false);readonly saveError=signal(false);readonly confirmRemove=signal(false);
  readonly savedCandidate=computed(()=>this.loading()||this.failed()?undefined:this.integration.snapshot(this.result(),{volumeId:this.location().volumeId,pageNumber:this.location().pageIndex+1,volumeTitle:this.volumeTitle()},this.context()?.text));
  readonly isSaved=computed(()=>this.saved.items().some(item=>item.id===this.savedCandidate()?.id));
  async saveWord():Promise<void>{const item=this.savedCandidate();if(!item||this.saving())return;this.saving.set(true);this.saveError.set(false);try{await this.saved.save(item);}catch{this.saveError.set(true);}finally{this.saving.set(false);}}
  async removeWord():Promise<void>{const item=this.savedCandidate();if(!item||this.saving())return;this.saving.set(true);this.saveError.set(false);try{await this.saved.remove(item.id);this.confirmRemove.set(false);}catch{this.saveError.set(true);}finally{this.saving.set(false);}}
  readonly audioRequested=signal(false);private playingEntry:string|null=null;
  readonly result=input.required<DictionaryLookup>();readonly loading=input(false);readonly failed=input(false);readonly x=input(0);readonly y=input(0);readonly closed=output<void>();
  readonly context=input<OcrLookupPoint|null>(null);readonly location=input<MangaContextLocation>({volumeId:'',pageIndex:0,blockIndex:0});
  readonly tab=signal<'word'|'context'|'grammar'>('word');readonly busy=signal(false);readonly contextError=signal(false);
  readonly selectionLimitError=signal(false);
  readonly translation=signal<MangaTranslationResult|null>(null);readonly study=signal<MangaStudyExplanation|null>(null);
  private controller:AbortController|null=null;private readonly previousFocus=document.activeElement;
  private readonly close=viewChild<ElementRef<HTMLButtonElement>>('close');private readonly dialog=viewChild<ElementRef<HTMLElement>>('dialog');
  constructor(){
    effect(()=>{if(this.loading()||this.failed()||this.requestedCard()!==this.cardScope())this.requestedCard.set(null);});
    effect(()=>{this.savedCandidate();this.workspace.active();this.confirmRemove.set(false);this.saveError.set(false);});
    afterNextRender(()=>this.close()?.nativeElement.focus());
    afterRenderEffect(()=>{if(this.restoreDictionaryFocus()&&!this.quickMode()&&this.addToDeck()){this.addToDeck()!.nativeElement.focus();this.restoreDictionaryFocus.set(false);}});
    effect(()=>{const entryId=this.studyMatch().vocabulary?.id;if(this.playingEntry && entryId!==this.playingEntry){this.audio.stop();this.playingEntry=null;this.audioRequested.set(false);}});
  }
  async listen():Promise<void>{const entry=this.studyMatch().vocabulary;if(!entry||!this.studyMatch().audioAvailable||this.audio.state()==='loading')return;this.playingEntry=entry.id;this.audioRequested.set(true);await this.audio.play(entry.id);}
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
  top():number{return Math.max(8,Math.min(this.y()+12,window.innerHeight-(this.quickMode()?Math.min(560,window.innerHeight*.85):Math.min(440,window.innerHeight*.65))-8));}
  private focusable(control:HTMLElement):boolean{
    if(control.closest('[hidden]'))return false;
    for(let parent=control.parentElement;parent&&parent!==this.dialog()?.nativeElement;parent=parent.parentElement){
      if(parent.tagName==='DETAILS'&&!parent.hasAttribute('open')&&parent.querySelector('summary')!==control)return false;
    }
    return true;
  }
  @HostListener('document:keydown',['$event']) key(event:KeyboardEvent):void {
    if(event.key==='Escape'){event.preventDefault();event.stopPropagation();this.closed.emit();}
    if(event.key==='Tab'){const controls=Array.from(this.dialog()?.nativeElement.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],summary,input:not(:disabled),select:not(:disabled),textarea:not(:disabled)')??[]).filter(control=>this.focusable(control));const first=controls[0],last=controls.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}
  }
  ngOnDestroy():void{this.cancel();if(this.audioRequested())this.audio.stop();if(!this.addedCard&&this.previousFocus instanceof HTMLElement && this.previousFocus.isConnected)this.previousFocus.focus();}
}
