import { Component, input, output } from '@angular/core';
import { MokuroPage } from '../../core/models/manga.model';
import { OcrLookupPoint } from '../../core/models/dictionary.model';
@Component({
  selector: 'app-manga-ocr',
  template: `@for (block of page().blocks; track $index; let blockIndex = $index) {
    @for (line of block.lines; track $index; let index = $index) {
      <span class="ocr-line" (pointerdown)="pointerStart($event)" (click)="lookupClick($event,blockIndex,index)" [class.visible]="visible()" [style.left.%]="bounds(block.lines_coords[index], 0) / page().img_width * 100"
        [style.top.%]="bounds(block.lines_coords[index], 1) / page().img_height * 100"
        [style.width.%]="extent(block.lines_coords[index], 0) / page().img_width * 100"
        [style.height.%]="extent(block.lines_coords[index], 1) / page().img_height * 100"
        [style.writing-mode]="block.vertical ? 'vertical-rl' : 'horizontal-tb'"
        [style.font-size.cqw]="block.font_size / page().img_width * 100">{{ line }}</span>
    }
  }`,
  styles: [`:host { position:absolute; inset:0; pointer-events:none; } .ocr-line { position:absolute; color:transparent; white-space:pre; line-height:1; pointer-events:auto; user-select:text; cursor:text; font-family:serif; } .visible { color:var(--text-primary); background:var(--surface); outline:1px solid var(--accent); } .ocr-line::selection { color:var(--text-primary); background:var(--primary-soft); }`],
})
export class MangaOcrComponent {
  readonly page = input.required<MokuroPage>();
  readonly visible = input(false);
  readonly wordClicked = output<OcrLookupPoint>();
  private pointer: {x:number;y:number} | null = null;
  pointerStart(event:PointerEvent):void { this.pointer = event.isPrimary && event.button===0 ? {x:event.clientX,y:event.clientY} : null; }
  lookupClick(event:MouseEvent,blockIndex:number,lineIndex:number):void {
    event.stopPropagation();const start=this.pointer;this.pointer=null;
    if(!start || Math.hypot(event.clientX-start.x,event.clientY-start.y)>8 || !window.getSelection()?.isCollapsed)return;
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
    this.wordClicked.emit({text,offset,x:event.clientX,y:event.clientY});
  }
  bounds(points: number[][], axis: number): number { return Math.min(...points.map(p => p[axis])); }
  extent(points: number[][], axis: number): number { return Math.max(...points.map(p => p[axis])) - this.bounds(points, axis); }
}
