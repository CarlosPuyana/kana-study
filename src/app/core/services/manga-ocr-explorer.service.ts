import { inject, Injectable } from '@angular/core';
import { WorkspaceService } from './workspace.service';
import { MangaOcrSourceService, OcrSource } from './manga-ocr-source.service';
import { explorationCounts, findLiteralOcr, OCR_SEARCH_LIMITS, ocrDigest, OcrExploration, OcrExploredPage, OcrTextMatch } from './manga-ocr-text';

@Injectable({providedIn:'root'})
export class MangaOcrExplorerService {
  private readonly workspace=inject(WorkspaceService);
  private readonly source=inject(MangaOcrSourceService);
  async scan(volumeId:string,query:string,signal:AbortSignal,publish:(r:OcrExploration)=>void=()=>{},previousFingerprint?:string):Promise<OcrExploration>{
    if(!query.length||query.length>OCR_SEARCH_LIMITS.queryUnits)throw Error('invalid-query');
    const owner=this.workspace.active(),epoch=this.workspace.activationRevision();
    const guard=()=>{if(owner!==this.workspace.active()||epoch!==this.workspace.activationRevision())throw Error('workspace-changed');if(signal.aborted)throw Error('cancelled');};
    let result:OcrExploration={volumeId,query,fingerprint:null,status:'scanning',pages:[],totalPages:0,matches:[],reason:null,logicalImageBytesRead:0};
    const emit=()=>{guard();publish(result);};
    const pages:OcrExploredPage[]=[],matches:OcrTextMatch[]=[];let totalBytes=0;
    const read=async(source:OcrSource,index:number)=>{
      guard();const row=await source.read(index);guard();
      result={...result,logicalImageBytesRead:result.logicalImageBytesRead+(row?.imageBytes??0)};
      const text=row?.ocr?JSON.stringify(row.ocr):null;
      if(text&&new TextEncoder().encode(text).byteLength>OCR_SEARCH_LIMITS.pageBytes)throw Error('limit');
      const fingerprint=await ocrDigest(text??(row?'no-ocr':'missing-page'));guard();return {row,text,fingerprint};
    };
    try{
      guard();const source=await this.source.open(volumeId,owner,signal);guard();
      if(!source)return {...result,status:'deleted'};
      if(!Number.isSafeInteger(source.pageCount)||source.pageCount<1)throw Error('invalid-ocr');
      result={...result,totalPages:source.pageCount};emit();
      for(let index=0;index<Math.min(source.pageCount,OCR_SEARCH_LIMITS.pages);index++){
        guard();
        try{
          const {row,text,fingerprint}=await read(source,index);guard();
          totalBytes+=text?new TextEncoder().encode(text).byteLength:0;
          if(totalBytes>OCR_SEARCH_LIMITS.totalBytes)throw Error('limit');
          if(!row||!row.ocr)pages.push({pageIndex:index,state:row?'no-ocr':'missing-page',fingerprint});
          else{
            const found=findLiteralOcr(row.ocr,query,OCR_SEARCH_LIMITS.matches-matches.length);
            matches.push(...found.matches.map(m=>({...m,volumeId,pageIndex:index,pageFingerprint:fingerprint})));
            pages.push({pageIndex:index,state:found.limited?'limit':found.hasText?'examined':'no-ocr',fingerprint});
            if(found.limited){result={...result,reason:'limit'};break;}
          }
        }catch(error){guard();const reason=error instanceof Error&&error.message==='limit'?'limit':error instanceof Error&&error.message==='invalid-ocr'?'invalid-ocr':'read-error';
          pages.push({pageIndex:index,state:reason,fingerprint:null});if(reason==='limit'){result={...result,reason};break;}}
        result={...result,pages:[...pages],matches:[...matches]};emit();
      }
      result={...result,pages:[...pages],matches:[...matches],status:'verifying'};emit();
      // Re-read only this volume sequentially. Metadata alone cannot detect an OCR-only edit.
      const current=await this.source.open(volumeId,owner,signal);guard();
      if(!current)return {...result,status:'deleted',matches:[],fingerprint:null};
      if(current.stamp!==source.stamp)return {...result,status:'changed',reason:'source-changed'};
      for(const p of pages.filter(p=>p.fingerprint!==null)){
        try{const check=await read(current,p.pageIndex);guard();if(check.fingerprint!==p.fingerprint)return {...result,status:'changed',reason:'source-changed'};}
        catch(error){guard();return {...result,status:'failed',reason:error instanceof Error&&error.message==='limit'?'limit':'read-error'};}
      }
      const fingerprint=await ocrDigest(JSON.stringify([volumeId,source.stamp,pages.map(p=>[p.pageIndex,p.state,p.fingerprint])]));guard();
      const counts=explorationCounts(result),partial=counts.pending>0||counts.errors>0||pages.some(p=>p.state==='missing-page');
      result={...result,fingerprint,status:partial?'partial':counts.examined===0?'no-ocr':'complete',
        reason:result.reason??(counts.errors?pages.some(p=>p.state==='read-error')?'read-error':'invalid-ocr':counts.pending?'limit':null)};
      if(previousFingerprint&&previousFingerprint!==fingerprint)result={...result,status:'changed',reason:'source-changed'};
      return result;
    }catch(error){
      if(owner!==this.workspace.active()||epoch!==this.workspace.activationRevision())throw Error('workspace-changed');
      return {...result,pages:[...pages],matches:[...matches],status:signal.aborted?'cancelled':'failed',reason:signal.aborted?null:error instanceof Error&&['ocrLimit','limit'].includes(error.message)?'limit':error instanceof Error&&error.message==='invalid-ocr'?'invalid-ocr':'read-error'};
    }
  }
}
