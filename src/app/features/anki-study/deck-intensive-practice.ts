import { ChangeDetectionStrategy, Component, ElementRef, afterRenderEffect, computed, inject, input, output, signal, viewChild } from '@angular/core';
import { DeckStudyEntryView, isCustomEntry } from '../../core/models/deck-catalog.model';
import { DeckIntensiveSession } from '../../core/services/deck-intensive-session';
import { entryMeaning } from '../../core/services/deck-route-resource';
import { deckContentLanguage } from '../../core/services/deck-content-language';
import { TranslationService } from '../../core/services/translation.service';
import * as copy from '../../../assets/i18n/deck-study.generated';
import { DeckSentenceText } from '../anki-cards/components/deck-sentence-text/deck-sentence-text';
import { KaishiCardMedia } from '../../shared/components/kaishi-card-media/kaishi-card-media';

@Component({selector:'app-deck-intensive-practice',imports:[DeckSentenceText,KaishiCardMedia],
 templateUrl:'./deck-intensive-practice.html',styleUrl:'./deck-intensive-practice.scss',
 host:{'(document:keydown)':'handleKey($event)'},changeDetection:ChangeDetectionStrategy.OnPush})
export class DeckIntensivePractice {
 readonly entries=input.required<readonly DeckStudyEntryView[]>();readonly builtinMedia=input(false);readonly closed=output<void>();
 readonly i18n=inject(TranslationService);readonly isCustom=isCustomEntry;
 private readonly revision=signal(0);
 private engine?:DeckIntensiveSession;private sessionKey='';
 session():DeckIntensiveSession {
  this.revision();const ids=this.entries().map(e=>e.id),key=ids.join('\0');
  if(!this.engine||key!==this.sessionKey){this.sessionKey=key;this.engine=new DeckIntensiveSession(ids);}
  return this.engine;
 }
 readonly current=computed(()=>this.entries().find(e=>e.id===this.session().current)??null);
 readonly revealed=signal(false);
 // A fresh key per appearance, including last -> first with the same entryId.
 readonly appearance=signal({});
 private readonly cardMedia=viewChild(KaishiCardMedia);
 private readonly primary=viewChild<ElementRef<HTMLButtonElement>>('primary');
 private readonly focusRequest=signal(1);private focused=0;
 constructor(){
  this.i18n.useStudyCopy?.(copy);
  afterRenderEffect(()=>{const request=this.focusRequest(),target=this.primary();
   if(request!==this.focused&&target){this.focused=request;target.nativeElement.focus({preventScroll:true});}
  });
 }
 meaning(card:DeckStudyEntryView):string{return entryMeaning(card,this.i18n.language());}
 showReading(card:DeckStudyEntryView):boolean{return card.reading.normalize('NFKC').trim()!==card.word.normalize('NFKC').trim();}
 sentenceMeaning(card:DeckStudyEntryView):string{return isCustomEntry(card)?'':card.sentenceMeaning[deckContentLanguage(this.i18n.language())];}
 advance():void {
  if(!this.current())return;
  if(!this.revealed()){this.revealed.set(true);return;}
  this.cardMedia()?.cancelAutomatic();this.revealed.set(false);this.session().next();this.appearance.set({});this.revision.update(n=>n+1);this.focusRequest.update(n=>n+1);
 }
 exit():void{this.cardMedia()?.cancelAutomatic();this.closed.emit();}
 handleKey(event:KeyboardEvent):void {
  if(event.code!=='Space'||event.isComposing||event.ctrlKey||event.altKey||event.metaKey||event.shiftKey)return;
  if(event.composedPath().some(node=>node instanceof Element&&node.matches('button,a,input,textarea,select,summary,[contenteditable]:not([contenteditable=false]),[role=button],[role=slider],[role=checkbox]')))return;
  if(!this.current())return;
  event.preventDefault();if(!event.repeat)this.advance();
 }
}
