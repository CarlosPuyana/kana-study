import { MokuroPage } from '../models/manga.model';

export const OCR_SEARCH_LIMITS={pages:2000,matches:500,pageBytes:2*1024*1024,totalBytes:16*1024*1024,queryUnits:256,lineUnits:4000} as const;
export interface OcrTextMatch {
  readonly volumeId:string;readonly pageIndex:number;readonly blockIndex:number;readonly lineIndex:number;
  readonly fragment:string;readonly start:number;readonly end:number;readonly found:string;readonly pageFingerprint:string;
}
export type OcrPageState='pending'|'examined'|'no-ocr'|'missing-page'|'invalid-ocr'|'read-error'|'limit';
export interface OcrExploredPage {readonly pageIndex:number;readonly state:OcrPageState;readonly fingerprint:string|null;}
export type OcrExplorationStatus='scanning'|'verifying'|'complete'|'partial'|'cancelled'|'failed'|'no-ocr'|'deleted'|'changed'|'stale';
export interface OcrExploration {
  readonly volumeId:string;readonly query:string;readonly fingerprint:string|null;readonly status:OcrExplorationStatus;
  readonly pages:readonly OcrExploredPage[];readonly totalPages:number;readonly matches:readonly OcrTextMatch[];
  readonly reason:'limit'|'read-error'|'invalid-ocr'|'source-changed'|null;readonly logicalImageBytesRead:number;
}
export async function ocrDigest(text:string):Promise<string>{
  const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));
  return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
}
/** Strict literal UTF-16 search. Includes overlapping substrings, never joins OCR lines. */
export function findLiteralOcr(page:MokuroPage,query:string,limit:number=OCR_SEARCH_LIMITS.matches):{
  matches:Omit<OcrTextMatch,'volumeId'|'pageIndex'|'pageFingerprint'>[];limited:boolean;hasText:boolean;
}{
  if(!query.length||query.length>OCR_SEARCH_LIMITS.queryUnits||!page||!Array.isArray(page.blocks)||
    !page.blocks.every(b=>b&&Array.isArray(b.lines)&&b.lines.every(l=>typeof l==='string')))throw Error('invalid-ocr');
  const matches:Omit<OcrTextMatch,'volumeId'|'pageIndex'|'pageFingerprint'>[]=[];let hasText=false;
  for(const [blockIndex,block] of page.blocks.entries())for(const [lineIndex,fragment] of block.lines.entries()){
    if(fragment.length>OCR_SEARCH_LIMITS.lineUnits)throw Error('limit');
    if(fragment.length)hasText=true;
    let start=fragment.indexOf(query);
    while(start!==-1){
      if(matches.length>=limit)return {matches,limited:true,hasText};
      matches.push({blockIndex,lineIndex,fragment,start,end:start+query.length,found:fragment.slice(start,start+query.length)});
      start=fragment.indexOf(query,start+1);
    }
  }
  return {matches,limited:false,hasText};
}
export function explorationCounts(result:OcrExploration){
  const examined=result.pages.filter(p=>p.state==='examined').length;
  const withoutOcr=result.pages.filter(p=>p.state==='no-ocr'||p.state==='missing-page').length;
  const errors=result.pages.filter(p=>p.state==='invalid-ocr'||p.state==='read-error'||p.state==='limit').length;
  return {examined,withoutOcr,errors,pending:Math.max(0,result.totalPages-examined-withoutOcr-errors)};
}
