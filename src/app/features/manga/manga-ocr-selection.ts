import { OcrLookupPoint } from '../../core/models/dictionary.model';
import { MokuroPage } from '../../core/models/manga.model';

function endpoint(host:HTMLElement,node:Node,offset:number,end:boolean):{line:HTMLElement;offset:number}|null {
  if(!host.contains(node))return null;
  let element=node instanceof Element?node:node.parentElement;
  if(element===host){const child=node.childNodes[end?Math.max(0,offset-1):offset];element=child instanceof Element?child:child?.parentElement??null;node=child??node;offset=end?(node.textContent?.length??0):0;}
  const line=element?.closest<HTMLElement>('.ocr-line');if(!line || !host.contains(line))return null;
  const range=document.createRange();range.selectNodeContents(line);
  try{range.setEnd(node,offset);}catch{return null;}
  return {line,offset:range.toString().length};
}
/** DOM endpoints determine OCR identity and offsets; coordinates only place the popup. */
export function ocrSelectionPoint(host:HTMLElement,page:MokuroPage,selection:Selection|null,x=0,y=0):OcrLookupPoint|null {
  if(!selection || selection.isCollapsed || selection.rangeCount!==1)return null;
  const range=selection.getRangeAt(0);
  const start=endpoint(host,range.startContainer,range.startOffset,false),end=endpoint(host,range.endContainer,range.endOffset,true);
  if(!start || !end)return null;
  const blockIndex=Number(start.line.dataset['blockIndex']),endBlockIndex=Number(end.line.dataset['blockIndex']);
  const lineIndex=Number(start.line.dataset['lineIndex']),endLineIndex=Number(end.line.dataset['lineIndex']);
  const block=page.blocks[blockIndex],last=page.blocks[endBlockIndex];
  if(!block || !last || !Number.isInteger(lineIndex) || !Number.isInteger(endLineIndex) || !block.lines[lineIndex] || !last.lines[endLineIndex])return null;
  let selectedText:string;
  if(blockIndex===endBlockIndex){
    if(lineIndex>endLineIndex)return null;
    selectedText=block.lines.slice(lineIndex,endLineIndex+1).map((text,index)=>text.slice(index===0?start.offset:0,index===endLineIndex-lineIndex?end.offset:undefined)).join('\n').trim();
  }else selectedText=selection.toString().replace(/\r\n?/g,'\n').trim();
  if(!selectedText || !/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(selectedText))return null;
  const startOffset=block.lines.slice(0,lineIndex).reduce((sum,text)=>sum+text.length+1,0)+start.offset;
  const endOffset=last.lines.slice(0,endLineIndex).reduce((sum,text)=>sum+text.length+1,0)+end.offset;
  return {mode:'selection',text:block.lines.join('\n'),selectedText,offset:startOffset,startOffset,endOffset,blockIndex,lineIndex,endBlockIndex,endLineIndex,x,y,
    previousText:page.blocks[blockIndex-1]?.lines.join('\n'),nextText:page.blocks[endBlockIndex+1]?.lines.join('\n')};
}
