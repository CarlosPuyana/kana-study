/** Map a browser UTF-16 caret to lesson text without furigana annotations. */
export function japaneseTextCaret(region:HTMLElement,node:Node,offset:number):{text:string;offset:number}|null {
  const walker=document.createTreeWalker(region,NodeFilter.SHOW_TEXT,{acceptNode:text=>
    text.parentElement?.closest('rt,rp')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});
  const nodes:Node[]=[];while(walker.nextNode())nodes.push(walker.currentNode);
  if(node.parentElement?.closest('rt,rp')){
    const ruby=node.parentElement.closest('ruby');
    const base=nodes.find(text=>ruby?.contains(text));if(!base)return null;node=base;offset=0;
  }
  let start=0,caret:number|null=null;
  for(const text of nodes){const value=text.textContent??'';if(text===node)caret=start+Math.min(offset,Math.max(0,value.length-1));start+=value.length;}
  return caret===null?null:{text:nodes.map(text=>text.textContent??'').join(''),offset:caret};
}
