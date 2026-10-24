import type {CustomTransferChunkDescriptorV2,CustomTransferRecordV2,CustomTransferRequestV2} from '../models/custom-transfer-v2.model';
import {customSyncJsonBytes,validateCustomRemoteOperation,validServerRevision} from './custom-deck-sync-contract';
import {requireValid} from './custom-deck-validation';

export const CUSTOM_TRANSFER_V2_LIMITS={requestBytes:524288,changes:64,chunks:128,transferBytes:8388608,ownerBytes:67108864,ownerTransfers:32,ownerReceipts:8192,cards:1000} as const;
/** PostgreSQL jsonb text for receipt request hashes, separate from immutable chunk text. */
export function transferRequestJsonbTextV2(value:unknown):string{
 if(value===null||typeof value==='boolean'||typeof value==='string'){customSyncJsonBytes(value);return JSON.stringify(value);}
 if(typeof value==='number'){
  customSyncJsonBytes(value);const s=JSON.stringify(value);if(!s.includes('e'))return s;
  const [m,e]=s.split('e'),negative=m.startsWith('-'),a=negative?m.slice(1):m,d=a.replace('.',''),p=(a.indexOf('.')<0?a.length:a.indexOf('.'))+Number(e);
  return (negative?'-':'')+(p<=0?'0.'+'0'.repeat(-p)+d:p>=d.length?d+'0'.repeat(p-d.length):d.slice(0,p)+'.'+d.slice(p));
 }
 if(Array.isArray(value))return '['+value.map(transferRequestJsonbTextV2).join(', ')+']';
 requireValid(!!value&&typeof value==='object');const bytes=(s:string)=>new TextEncoder().encode(s);
 const compare=(a:string,b:string)=>{const x=bytes(a),y=bytes(b);if(x.length!==y.length)return x.length-y.length;for(let i=0;i<x.length;i++)if(x[i]!==y[i])return x[i]-y[i];return 0;};
 return '{'+Object.keys(value).sort(compare).map(k=>JSON.stringify(k)+': '+transferRequestJsonbTextV2((value as Record<string,unknown>)[k])).join(', ')+'}';
}
/** Exact text is the immutable hash boundary. Never canonicalize/replay an FSRS snapshot to hash it. */
export async function customTransferTextHashV2(body:string):Promise<string>{
 // Shared encoder rejects NUL and unpaired surrogates before TextEncoder can replace them.
 customSyncJsonBytes(body);
 const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(body));
 return Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('');
}
export async function prepareCustomTransferChunkV2(records:CustomTransferRecordV2[],index:number):Promise<{body:string;descriptor:CustomTransferChunkDescriptorV2}>{
 requireValid(Number.isInteger(index)&&index>=0&&index<CUSTOM_TRANSFER_V2_LIMITS.chunks&&records.length>0&&records.length<=64);
 let changes=0;
 for(const record of records){
  if(record.type==='operation'){await validateCustomRemoteOperation(record.value);changes+=record.value.changes.length;}
  else {requireValid(record.type==='ancestor'&&record.value.kind==='review-event');await validateCustomRemoteOperation({schemaVersion:1,operationId:'ancestor-preflight',action:'import-history',changes:[record.value]});changes++;}
 }
 requireValid(changes<=64);const body=JSON.stringify(records),bytes=new TextEncoder().encode(body).length;
 requireValid(bytes<=CUSTOM_TRANSFER_V2_LIMITS.requestBytes);
 return {body,descriptor:{index,bytes,sha256:await customTransferTextHashV2(body)}};
}
/** Envelope bytes include escaping the chunk body. Server performs authoritative semantic validation. */
export function assertCustomTransferEnvelopeV2(op:CustomTransferRequestV2):void{
 requireValid(op.schemaVersion===2&&validServerRevision(op.expectedRevision)&&op.operationId.length>0&&op.transferId.length>0);
 requireValid(new TextEncoder().encode(op.operationId).length<=128&&new TextEncoder().encode(op.transferId).length<=128);
 requireValid(customSyncJsonBytes(op)<=CUSTOM_TRANSFER_V2_LIMITS.requestBytes);
}
