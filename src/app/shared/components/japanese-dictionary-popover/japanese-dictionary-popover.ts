import {afterRenderEffect,ChangeDetectionStrategy,Component,DestroyRef,effect,ElementRef,inject,input,signal,viewChild} from '@angular/core';
import {RouterLink} from '@angular/router';
import {DictionaryLookup} from '../../../core/models/dictionary.model';
import {JapaneseLookupService,JAPANESE_LOOKUP_IMPORT_MAINTENANCE} from '../../../core/services/japanese-lookup.service';
import {localVocabularyLookup,vocabularyMeanings} from '../../../core/services/japanese-local-vocabulary';
import {TranslationService} from '../../../core/services/translation.service';
import {WorkspaceService} from '../../../core/services/workspace.service';
import {japaneseTextCaret} from './japanese-text-caret';

const ignored='button:not([data-dictionary-word]),a,input,textarea,select,[contenteditable]:not([contenteditable="false"]),app-grammar-exercise,app-grammar-practice,app-grammar-integration,[data-dictionary-ignore]';
const japanese=/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}ー]/u;
@Component({selector:'app-japanese-dictionary-popover',imports:[RouterLink],
  providers:[JapaneseLookupService,{provide:JAPANESE_LOOKUP_IMPORT_MAINTENANCE,useValue:false}],
  templateUrl:'./japanese-dictionary-popover.html',styleUrl:'./japanese-dictionary-popover.scss',
  changeDetection:ChangeDetectionStrategy.OnPush,
  host:{'(click)':'clicked($event)','(keydown)':'key($event)','(document:selectionchange)':'selected()',
    '(document:click)':'outside($event)','(document:keydown)':'escape($event)','(window:resize)':'close(false)',
    '(document:scroll)':'scrolled($event)'}})
export class JapaneseDictionaryPopover {
  readonly context=input.required<string>();readonly i18n=inject(TranslationService);
  private readonly host=inject<ElementRef<HTMLElement>>(ElementRef);private readonly lookup=inject(JapaneseLookupService);
  private readonly workspace=inject(WorkspaceService);readonly result=signal<DictionaryLookup|null>(null);
  readonly open=signal(false);readonly loading=signal(false);readonly failed=signal(false);
  readonly left=signal(12);readonly top=signal(12);readonly keyboardFocus=signal(false);
  private readonly panel=viewChild<ElementRef<HTMLElement>>('panel');private readonly closeButton=viewChild<ElementRef<HTMLButtonElement>>('closeButton');
  private generation=0;private previous:HTMLElement|null=null;private selectionRange:Range|null=null;
  private anchor:HTMLElement|null=null;
  constructor(){
    effect(()=>{this.context();this.workspace.active();this.close(false);});
    afterRenderEffect(()=>{if(this.open() && this.keyboardFocus() && this.closeButton()){this.closeButton()!.nativeElement.focus();this.keyboardFocus.set(false);}});
    inject(DestroyRef).onDestroy(()=>this.generation++);
  }
  private region(node:Node|null):HTMLElement|null {
    const element=node instanceof Element?node:node?.parentElement;
    if(!element || element.closest(ignored) || this.panel()?.nativeElement.contains(element))return null;
    const region=element.closest<HTMLElement>('[lang="ja"]');
    return region && this.host.nativeElement.contains(region)?region:null;
  }
  clicked(event:MouseEvent):void {
    if(!getSelection()?.isCollapsed)return;
    this.selectionRange=null;
    const region=this.region(event.target as Node);if(!region)return;
    if(region.hasAttribute('data-dictionary-word')){
      const text=region.textContent?.trim()??'';
      if(japanese.test(text))this.query(()=>this.lookup.lookupSelection(text),region,false,event.clientX,event.clientY);
      return;
    }
    // Both native caret APIs are supported, including Safari's Range API.
    const doc=document as Document & {caretPositionFromPoint?:(x:number,y:number)=>{offsetNode:Node;offset:number}|null;caretRangeFromPoint?:(x:number,y:number)=>Range|null};
    const position=doc.caretPositionFromPoint?.(event.clientX,event.clientY),range=position?null:doc.caretRangeFromPoint?.(event.clientX,event.clientY);
    const node=position?.offsetNode??range?.startContainer,offset=position?.offset??range?.startOffset;
    if(node?.nodeType!==Node.TEXT_NODE || offset===undefined || this.region(node)!==region)return;
    const caret=japaneseTextCaret(region,node,offset);
    if(!caret || !japanese.test(caret.text[caret.offset]??''))return;
    this.query(()=>this.lookup.lookupAt(caret.text,caret.offset),region,false,event.clientX,event.clientY);
  }
  selected():void {
    const selection=getSelection();if(!selection || selection.isCollapsed || !selection.rangeCount){this.selectionRange=null;return;}
    const range=selection.getRangeAt(0),region=this.region(range.startContainer);
    if(!region || this.region(range.endContainer)!==region)return;
    const text=selection.toString().trim();if(!japanese.test(text) || /[A-Za-zÀ-ÿ]/u.test(text) || text.length>200)return;
    const previous=this.selectionRange;
    if(previous && previous.startContainer===range.startContainer && previous.startOffset===range.startOffset && previous.endContainer===range.endContainer && previous.endOffset===range.endOffset)return;
    this.selectionRange=range.cloneRange();
    this.query(()=>this.lookup.lookupSelection(text),region,false);
  }
  key(event:KeyboardEvent):void {
    if(event.defaultPrevented)return;
    const region=this.region(event.target as Node);if(!region)return;
    if(event.key!=='Enter' && !(event.key===' ' && region.hasAttribute('data-dictionary-word')))return;
    const text=region.textContent?.trim()??'';if(!japanese.test(text))return;
    event.preventDefault();this.query(()=>this.lookup.lookupSelection(text),region,true);
  }
  private query(request:()=>Promise<DictionaryLookup>,anchor:HTMLElement,keyboard:boolean,x?:number,y?:number):void {
    const generation=++this.generation,context=this.context(),workspace=this.workspace.active();
    const current=()=>generation===this.generation && context===this.context() && workspace===this.workspace.active();
    this.anchor=anchor;
    this.previous=document.activeElement instanceof HTMLElement?document.activeElement:anchor;
    const rect=anchor.getBoundingClientRect(),width=Math.min(320,window.innerWidth-24);
    this.left.set(Math.max(12,Math.min(x??rect.left,window.innerWidth-width-12)));
    this.top.set(Math.max(12,Math.min((y??rect.bottom)+8,window.innerHeight-Math.min(380,window.innerHeight-24)-12)));
    this.result.set(null);this.failed.set(false);this.loading.set(true);this.open.set(true);this.keyboardFocus.set(keyboard);
    void request().then(result=>{if(current()){this.result.set(result);this.loading.set(false);}})
      .catch(()=>{if(current()){this.failed.set(true);this.loading.set(false);}});
  }
  fallback(){return localVocabularyLookup(this.result()?.query??'');}
  fallbackMeanings(){return vocabularyMeanings(this.fallback(),this.i18n.language()).slice(0,3);}
  close(restore=true):void {
    ++this.generation;this.open.set(false);this.loading.set(false);this.result.set(null);
    if(restore && this.previous?.isConnected)this.previous.focus();this.previous=null;this.anchor=null;
  }
  outside(event:MouseEvent):void {if(this.open() && event.target instanceof Node && !this.panel()?.nativeElement.contains(event.target) && !this.region(event.target))this.close(false);}
  escape(event:KeyboardEvent):void {if(this.open() && event.key==='Escape'){event.preventDefault();this.close();}}
  scrolled(event:Event):void {
    if(!this.open() || !this.anchor || event.target instanceof Node && this.panel()?.nativeElement.contains(event.target))return;
    const rect=this.anchor.getBoundingClientRect();
    if(rect.bottom<=0 || rect.top>=window.innerHeight){this.close(false);return;}
    this.left.set(Math.max(12,Math.min(rect.left,window.innerWidth-Math.min(320,window.innerWidth-24)-12)));
    this.top.set(Math.max(12,Math.min(rect.bottom+8,window.innerHeight-Math.min(380,window.innerHeight-24)-12)));
  }
}
