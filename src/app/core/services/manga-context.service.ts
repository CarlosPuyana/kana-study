import { DOCUMENT } from '@angular/common';
import { Injectable, InjectionToken, inject, signal } from '@angular/core';
import { MangaContextLocation, MangaContextMode, MangaStudyExplanation, MangaTranslationRequest, MangaTranslationResult } from '../models/manga-context.model';

// Public configuration only. No deployed endpoint is assumed and no credentials are sent.
export const MANGA_ASSISTANT_ENDPOINT = new InjectionToken<string | null>('MANGA_ASSISTANT_ENDPOINT', {
  providedIn: 'root', factory: () => inject(DOCUMENT).querySelector<HTMLMetaElement>('meta[name="kana-study-manga-assistant"]')?.content || null,
});
type ContextResult = MangaTranslationResult | MangaStudyExplanation;
const CACHE_KEY='kana-study-manga-context-v1';
function text(value:unknown):value is string { return typeof value==='string' && value.length>0 && value.length<=6000; }
function optionalText(value:unknown):boolean {return value===undefined || text(value);}
export function validMangaContext(value:unknown,mode:MangaContextMode):value is ContextResult {
  if(!value || typeof value!=='object')return false;
  const result=value as Record<string,unknown>;if(!text(result['natural']))return false;
  if(mode==='translate')return optionalText(result['literal']) && (result['notes']===undefined || (Array.isArray(result['notes']) && result['notes'].length<=20 && result['notes'].every(text)));
  return Array.isArray(result['vocabulary']) && result['vocabulary'].length<=40 && result['vocabulary'].every(row=>row && text(row.expression) && text(row.meaning) && optionalText(row.reading) && optionalText(row.baseForm)) && Array.isArray(result['grammar']) && result['grammar'].length<=20 && result['grammar'].every(row=>row && text(row.expression) && text(row.explanation));
}
export function limitedMangaRequest(request:MangaTranslationRequest):MangaTranslationRequest {
  return {selectedText:request.selectedText.slice(0,1200),contextText:request.contextText?.slice(0,1200),selectedExpression:request.selectedExpression?.slice(0,100),previousText:request.previousText?.slice(0,300),nextText:request.nextText?.slice(0,300),targetLanguage:request.targetLanguage};
}
@Injectable({providedIn:'root'})
export class MangaContextService {
  private readonly configuredEndpoint=inject(MANGA_ASSISTANT_ENDPOINT);
  readonly endpoint=this.safeEndpoint();readonly available=!!this.endpoint;
  readonly loading=signal(false);readonly error=signal(false);private pending=0;
  private safeEndpoint():string|null {
    if(!this.configuredEndpoint)return null;
    try {const url=new URL(this.configuredEndpoint,document.baseURI);return !url.username && !url.password && (url.protocol==='https:' || (url.protocol==='http:' && url.origin===location.origin))?url.href:null;}catch{return null;}
  }
  async request(mode:MangaContextMode,request:MangaTranslationRequest,location:MangaContextLocation,signal:AbortSignal):Promise<ContextResult> {
    signal.throwIfAborted();if(!this.endpoint)throw new Error('unavailable');
    const bounded=limitedMangaRequest(request);
    const key=JSON.stringify({schemaVersion:1,endpoint:this.endpoint,...location,mode,...bounded,sourceText:request.selectedText,sourceContextText:request.contextText});
    let cache:{key:string;value:ContextResult}[]=[];
    try{const saved:unknown=JSON.parse(localStorage.getItem(CACHE_KEY)??'[]');if(Array.isArray(saved))cache=saved.filter(row=>row && typeof row.key==='string' && row.key.length<8000).slice(-20);}catch{/* Cache is optional. */}
    const hit=cache.find(row=>row.key===key && validMangaContext(row.value,mode));if(hit)return hit.value;
    this.pending++;this.loading.set(true);this.error.set(false);
    try {
      const response=await fetch(this.endpoint,{method:'POST',credentials:'omit',headers:{'Content-Type':'application/json'},body:JSON.stringify({schemaVersion:1,mode,request:bounded}),signal});
      if(!response.ok)throw new Error('http');
      // Bound response memory independently of a potentially missing Content-Length.
      const reader=response.body?.getReader();let raw='';
      if(reader){const decoder=new TextDecoder();let size=0;try{while(true){const chunk=await reader.read();if(chunk.done)break;size+=chunk.value.byteLength;if(size>100_000){await reader.cancel();throw new Error('response-too-large');}raw+=decoder.decode(chunk.value,{stream:true});}raw+=decoder.decode();}finally{reader.releaseLock();}}
      else {raw=await response.text();if(raw.length>100_000)throw new Error('response-too-large');}
      const result:unknown=JSON.parse(raw);signal.throwIfAborted();if(!validMangaContext(result,mode))throw new Error('invalid');
      try{localStorage.setItem(CACHE_KEY,JSON.stringify([...cache.filter(row=>row.key!==key),{key,value:result}].slice(-20)));}catch{/* Quota/private browsing must not prevent assistance. */}
      return result;
    }catch(error){if(!signal.aborted)this.error.set(true);throw error;}
    finally {this.pending--;this.loading.set(this.pending>0);}
  }
}
