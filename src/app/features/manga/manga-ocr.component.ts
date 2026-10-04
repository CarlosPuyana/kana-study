import { Component, ElementRef, HostListener, OnDestroy, inject, input, output } from '@angular/core';
import { MokuroPage } from '../../core/models/manga.model';
import { OcrLookupPoint } from '../../core/models/dictionary.model';
import { ocrSelectionPoint } from './manga-ocr-selection';
@Component({
  selector: 'app-manga-ocr',
  template: `@for (block of page().blocks; track $index; let blockIndex = $index) {
    @for (line of block.lines; track $index; let index = $index) {
      <span class="ocr-line" [attr.data-block-index]="blockIndex" [attr.data-line-index]="index" (pointerdown)="pointerStart($event)" (click)="lookupClick($event,blockIndex,index)" [class.visible]="visible()" [style.left.%]="bounds(block.lines_coords[index], 0) / page().img_width * 100"
        [style.top.%]="bounds(block.lines_coords[index], 1) / page().img_height * 100"
        [style.width.%]="extent(block.lines_coords[index], 0) / page().img_width * 100"
        [style.height.%]="extent(block.lines_coords[index], 1) / page().img_height * 100"
        [style.writing-mode]="block.vertical ? 'vertical-rl' : 'horizontal-tb'"
        [style.font-size.cqw]="block.font_size / page().img_width * 100">{{ line }}</span>
    }
  }`,
  styles: [`:host { position:absolute; inset:0; pointer-events:none; } .ocr-line { position:absolute; color:transparent; white-space:pre; line-height:1; pointer-events:auto; user-select:text; cursor:text; font-family:serif; } .visible { color:var(--text-primary); background:var(--surface); outline:1px solid var(--accent); } .ocr-line::selection { color:var(--text-primary); background:var(--primary-soft); }`],
})
export class MangaOcrComponent implements OnDestroy {
  private readonly host=inject<ElementRef<HTMLElement>>(ElementRef);
  readonly page = input.required<MokuroPage>();
  readonly visible = input(false);
  readonly wordClicked = output<OcrLookupPoint>();
  private pointer: {x:number;y:number} | null = null;
  private selecting=false;private dragged=false;private releasedSelection=false;private captured:OcrLookupPoint|null=null;private selectionTimer:ReturnType<typeof setTimeout>|undefined;
  private lastSelection='';private anchor={x:0,y:0};
  pointerStart(event:PointerEvent):void {
    clearTimeout(this.selectionTimer);this.captured=null;this.lastSelection='';this.dragged=false;this.releasedSelection=false;
    this.pointer=event.isPrimary && event.button===0?{x:event.clientX,y:event.clientY}:null;this.selecting=!!this.pointer;this.anchor={x:event.clientX,y:event.clientY};
  }
  @HostListener('document:pointermove',['$event']) pointerMove(event:PointerEvent):void {if(this.pointer && Math.hypot(event.clientX-this.pointer.x,event.clientY-this.pointer.y)>8)this.dragged=true;}
  @HostListener('document:pointerup',['$event']) pointerEnd(event:PointerEvent):void {
    if(!this.selecting)return;this.selecting=false;this.anchor={x:event.clientX,y:event.clientY};
    this.captured=this.readSelection();this.releasedSelection=!!this.captured;if(this.captured)this.scheduleSelection(180);
  }
  @HostListener('document:pointercancel') pointerCancel():void {this.selecting=false;this.pointer=null;this.captured=this.readSelection();this.releasedSelection=!!this.captured;if(this.captured)this.scheduleSelection(650);}
  @HostListener('document:selectionchange') selectionChanged():void {
    const point=this.readSelection();if(point){this.captured=point;if(!this.selecting)this.scheduleSelection(650);}
    else if(!this.releasedSelection){this.captured=null;clearTimeout(this.selectionTimer);}
    // Keep only a pointerup snapshot through a subsequent caret collapse.
  }
  private readSelection():OcrLookupPoint|null {return ocrSelectionPoint(this.host.nativeElement,this.page(),window.getSelection(),this.anchor.x,this.anchor.y);}
  private scheduleSelection(delay:number):void {clearTimeout(this.selectionTimer);this.selectionTimer=setTimeout(()=>{if(!this.selecting)this.emitSelection();},delay);}
  private emitSelection():boolean {
    const point=this.captured??this.readSelection();if(!point)return false;
    const key=JSON.stringify([point.selectedText,point.blockIndex,point.lineIndex,point.startOffset,point.endBlockIndex,point.endOffset]);
    if(key!==this.lastSelection){this.lastSelection=key;this.wordClicked.emit(point);}this.releasedSelection=false;return true;
  }
  lookupClick(event:MouseEvent,blockIndex:number,lineIndex:number):void {
    event.stopPropagation();const start=this.pointer;this.pointer=null;
    if(this.emitSelection()){clearTimeout(this.selectionTimer);return;}
    if(!start || this.dragged || Math.hypot(event.clientX-start.x,event.clientY-start.y)>8 || !window.getSelection()?.isCollapsed)return;
    const element=event.currentTarget as HTMLElement;
    type CaretDocument = Document & {caretPositionFromPoint?:(x:number,y:number)=>{offsetNode:Node;offset:number}|null;caretRangeFromPoint?:(x:number,y:number)=>Range|null};
    const doc=document as CaretDocument;const position=doc.caretPositionFromPoint?.(event.clientX,event.clientY);const fallback=position?null:doc.caretRangeFromPoint?.(event.clientX,event.clientY);
    const node=position?.offsetNode ?? fallback?.startContainer;const caretOffset=position?.offset ?? fallback?.startOffset;
    if(!node || caretOffset===undefined || !element.contains(node))return;
    const range=document.createRange();range.selectNodeContents(element);range.setEnd(node,caretOffset);
    const block=this.page().blocks[blockIndex];const line=block.lines[lineIndex];
    if(!line.length)return;
    const offset=block.lines.slice(0,lineIndex).reduce((sum,text)=>sum+text.length+1,0)+Math.min(range.toString().length,line.length-1);
    const text=block.lines.join('\n');if(!/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(String.fromCodePoint(text.codePointAt(offset)!)))return;
    const blocks=this.page().blocks;
    this.wordClicked.emit({mode:'caret',text,offset,x:event.clientX,y:event.clientY,blockIndex,lineIndex,selectedText:text,
      previousText:blocks[blockIndex-1]?.lines.join('\n'),nextText:blocks[blockIndex+1]?.lines.join('\n')});
  }
  bounds(points: number[][], axis: number): number { return Math.min(...points.map(p => p[axis])); }
  extent(points: number[][], axis: number): number { return Math.max(...points.map(p => p[axis])) - this.bounds(points, axis); }
  ngOnDestroy():void {clearTimeout(this.selectionTimer);}
}
