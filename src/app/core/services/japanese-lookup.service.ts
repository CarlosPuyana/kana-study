import { Injectable, inject } from '@angular/core';
import { DictionaryLookup } from '../models/dictionary.model';
import { DictionaryRepository } from './dictionary.repository';
import { DictionaryTerm } from '../models/dictionary.model';
import { deinflect, Deinflection, inflectedReading, matchesInflectionRules } from './japanese-deinflection.service';
const japanese=/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}ー]/u;
function rankedTerms(terms:DictionaryTerm[]):DictionaryTerm[] {
  const unique=new Map<string,DictionaryTerm>();
  for(const term of [...terms].sort((a,b)=>b.score-a.score || a.sequence-b.sequence)) {
    const key=JSON.stringify([term.expression,term.reading,term.glossaries]);if(!unique.has(key))unique.set(key,term);
  }
  return [...unique.values()].slice(0,8);
}
async function matchingInflections(surface:string,find:(query:string)=>Promise<DictionaryTerm[]>) {
  const matches:{term:DictionaryTerm;candidate:Deinflection}[]=[];
  for(const candidate of deinflect(surface))for(const term of await find(candidate.base)) {
    if(matchesInflectionRules(term.rules,candidate))matches.push({term,candidate});
  }
  // Written irregular rules carry more evidence than a generic kana suffix.
  const specificity=(candidate:Deinflection)=>candidate.steps.reduce((sum,step)=>sum+(step.from.match(/\p{Script=Han}/gu)?.length??0),0);
  matches.sort((a,b)=>specificity(b.candidate)-specificity(a.candidate) || a.candidate.depth-b.candidate.depth || b.term.score-a.term.score || a.term.sequence-b.term.sequence || a.term.expression.localeCompare(b.term.expression) || a.term.reading.localeCompare(b.term.reading));
  const unique=new Map<string,typeof matches[number]>();
  for(const match of matches){const key=JSON.stringify([match.term.expression,match.term.reading,match.term.glossaries]);if(!unique.has(key))unique.set(key,match);}
  const values=[...unique.values()],expressions=new Set<string>();
  const representatives=values.filter(match=>{if(expressions.has(match.term.expression))return false;expressions.add(match.term.expression);return true;});
  const ranked=[...representatives,...values.filter(match=>!representatives.includes(match))].slice(0,8);return ranked.length?{candidate:ranked[0].candidate,terms:ranked.map(match=>match.term)}:null;
}
interface CaretSpan {text:string;start:number;end:number;strong:boolean}
export function japaneseCaretSpans(text:string,offset:number):CaretSpan[] {
  const points=Array.from(text),positions:number[]=[];let position=0;
  for(const point of points){positions.push(position);position+=point.length;}positions.push(position);
  const caret=points.findIndex((point,index)=>offset>=positions[index] && offset<positions[index+1]);
  if(caret<0 || !japanese.test(points[caret]))return [];
  let left=caret,right=caret+1;while(left>0 && japanese.test(points[left-1]))left--;while(right<points.length && japanese.test(points[right]))right++;
  const boundaries=new Set([positions[left],positions[right]]);
  if(typeof Intl.Segmenter==='function')for(const part of new Intl.Segmenter('ja',{granularity:'word'}).segment(text)){boundaries.add(part.index);boundaries.add(part.index+part.segment.length);}
  const spans:CaretSpan[]=[];
  for(let start=Math.max(left,caret-15);start<=caret;start++)for(let end=caret+1;end<=Math.min(right,start+16);end++) {
    spans.push({text:text.slice(positions[start],positions[end]),start:positions[start],end:positions[end],strong:boundaries.has(positions[start])&&boundaries.has(positions[end])});
  }
  return spans.sort((a,b)=>Number(b.strong)-Number(a.strong) || b.text.length-a.text.length || a.start-b.start);
}
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
  if(!japaneseCandidates(text,offset).length)return '';
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
  lookupAt(text:string,offset:number):Promise<DictionaryLookup> {return this.lookup(text,offset);}
  async lookupSelection(selectedText:string):Promise<DictionaryLookup> {
    const requestedText=selectedText.trim();const metadata=await this.repository.ready();
    const result:DictionaryLookup={installed:!!metadata,mode:'selection',requestedText,selectedText:requestedText,surface:requestedText,query:requestedText,terms:[]};
    if(!metadata || !japanese.test(requestedText))return result;
    const find=async(query:string)=>{
      const rows=await this.repository.find(metadata.dictionaryId,query,'expression');
      return rows.length?rows:this.repository.find(metadata.dictionaryId,query,'reading');
    };
    let query=requestedText,candidate:Deinflection|undefined,terms=await find(query);
    if(!terms.length){const matches=await matchingInflections(requestedText,find);if(matches){candidate=matches.candidate;query=candidate.base;terms=matches.terms;}}
    if(!terms.length)return result;
    terms=candidate?terms:rankedTerms(terms);const principal=terms[0];
    return {...result,query,matchedQuery:query,terms,principal,alternatives:terms.slice(1),baseForm:candidate?.base,reading:principal.reading,surfaceReading:candidate?inflectedReading(principal.reading,candidate):principal.reading,reasons:candidate?.reasons??[]};
  }
  async lookup(text:string,offset:number):Promise<DictionaryLookup> {
    const metadata=await this.repository.ready();const segment=japaneseSegment(text,offset);const candidates=japaneseCandidates(text,offset);const spans=japaneseCaretSpans(text,offset);
    const result:DictionaryLookup={installed:!!metadata,query:segment || candidates.at(-1) || '',terms:[]};if(!metadata || !candidates.length)return result;
    let start=offset,end=offset;while(start>0 && japanese.test(text[start-1]))start--;while(end<text.length && japanese.test(text[end]))end++;
    const span=text.slice(start,end);const whole=Array.from(span).length<=32?span:'';
    const cache=new Map<string,DictionaryTerm[]>();
    const find=async(query:string):Promise<DictionaryTerm[]>=>{
      if(cache.has(query))return cache.get(query)!;
      if(cache.size>=384)return [];
      const expression=await this.repository.find(metadata.dictionaryId,query,'expression');
      const terms=expression.length?expression:await this.repository.find(metadata.dictionaryId,query,'reading');cache.set(query,terms);return terms;
    };
    const answer=(surface:string,query:string,terms:DictionaryTerm[],candidate?:Deinflection):DictionaryLookup=>{
      const ranked=candidate?terms:rankedTerms(terms),principal=ranked[0];
      return {...result,mode:'caret',surface,query,matchedQuery:query,terms:ranked,principal,alternatives:ranked.slice(1),baseForm:candidate?.base,reading:principal.reading,surfaceReading:candidate?inflectedReading(principal.reading,candidate):principal.reading,reasons:candidate?.reasons??[]};
    };
    if(whole){const terms=await find(whole);if(terms.length)return answer(whole,whole,terms);}
    // A dictionary-validated complete inflected word is more reliable than a
    // Segmenter fragment such as 食, なか or た inside 食べなかった.
    const complete=await matchingInflections(whole,find);
    if(complete)return answer(whole,complete.candidate.base,complete.terms,complete.candidate);
    type Evidence={span:CaretSpan;terms:DictionaryTerm[];candidate?:Deinflection;category:number};
    const matches:Evidence[]=[];
    // Reserve all exact spans before bounded morphological queries consume the cache.
    for(const span of spans){const terms=rankedTerms(await find(span.text));if(terms.length)matches.push({span,terms,category:Array.from(span.text).length===1?6:span.strong?1:3});}
    for(const span of spans){const inflected=await matchingInflections(span.text,find);if(inflected)matches.push({span,...inflected,category:inflected.candidate.reasons.every(reason=>reason==='imperative')?4:2});}
    const encloses=(outer:CaretSpan,inner:CaretSpan)=>outer.start<=inner.start && outer.end>=inner.end && outer.text.length>inner.text.length;
    for(const match of matches) {
      // A validated continuation of the same surface marks a shorter analysis as
      // incomplete, rather than using raw length as a universal ranking rule.
      if(matches.some(outer=>outer.candidate && outer.category===2 && (
        (encloses(outer.span,match.span) && (!match.candidate || outer.span.start===match.span.start || outer.span.end===match.span.end)) ||
        // Segmenter may join the last inflected kana to a following particle (たん).
        // Such a crossing boundary is weaker than the POS-validated word itself.
        (!match.candidate && outer.span.start<match.span.start && outer.span.end>match.span.start && outer.span.end<match.span.end)
      )))match.category=match.candidate?4:5;
    }
    matches.sort((a,b)=>a.category-b.category || (a.candidate?.depth??0)-(b.candidate?.depth??0) || b.terms[0].score-a.terms[0].score || a.terms[0].sequence-b.terms[0].sequence || Math.abs((a.span.start+a.span.end)/2-offset)-Math.abs((b.span.start+b.span.end)/2-offset) || b.span.text.length-a.span.text.length || a.span.start-b.span.start);
    if(matches.length){const match=matches[0];return answer(match.span.text,match.candidate?.base??match.span.text,match.terms,match.candidate);}
    return result;
  }
}
