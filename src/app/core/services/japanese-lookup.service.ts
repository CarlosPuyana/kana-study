import { Injectable, inject } from '@angular/core';
import { DictionaryLookup } from '../models/dictionary.model';
import { DictionaryRepository } from './dictionary.repository';
const japanese=/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}ー]/u;
export function japaneseCandidates(text:string,offset:number):string[] {
  if(offset<0 || offset>=text.length)return [];
  // Work in Unicode code points while the browser caret uses UTF-16 offsets.
  const chars=Array.from(text);let cursor=0,point=-1;
  chars.forEach((char,i)=>{if(offset>=cursor && offset<cursor+char.length)point=i;cursor+=char.length;});
  if(point<0 || !japanese.test(chars[point]))return [];
  let left=point,right=point+1;while(left>0 && japanese.test(chars[left-1]))left--;while(right<chars.length && japanese.test(chars[right]))right++;
  const candidates=new Set<string>();
  for(let length=1;length<=Math.min(16,right-left);length++) {
    const starts=length<=6 ? [point-Math.floor(length/2),point,point-length+1] : [point-Math.floor(length/2)];
    for(const start of starts)if(start>=left && start+length<=right && start<=point && start+length>point)candidates.add(chars.slice(start,start+length).join(''));
  }
  return [...candidates].slice(0,32).sort((a,b)=>Array.from(b).length-Array.from(a).length);
}
export function japaneseSegment(text:string,offset:number):string {
  if(typeof Intl.Segmenter==='function') {
    const segments=new Intl.Segmenter('ja',{granularity:'word'}).segment(text);
    for(const segment of segments)if(offset>=segment.index && offset<segment.index+segment.segment.length && japanese.test(segment.segment))return segment.segment;
  }
  return '';
}
@Injectable({providedIn:'root'})
export class JapaneseLookupService {
  private readonly repository=inject(DictionaryRepository);
  constructor(){void this.repository.cleanup().catch(()=>undefined);}
  async lookup(text:string,offset:number):Promise<DictionaryLookup> {
    const metadata=await this.repository.ready();const segment=japaneseSegment(text,offset);const candidates=japaneseCandidates(text,offset);
    const result:DictionaryLookup={installed:!!metadata,query:segment || candidates.at(-1) || '',terms:[]};if(!metadata)return result;
    const queries=[...new Set([segment,...candidates].filter(Boolean))].slice(0,32);
    for(const query of queries) {
      const expression=await this.repository.find(metadata.dictionaryId,query,'expression');
      const terms=expression.length ? expression : await this.repository.find(metadata.dictionaryId,query,'reading');
      if(terms.length)return {...result,query,terms};
    }
    return result;
  }
}
