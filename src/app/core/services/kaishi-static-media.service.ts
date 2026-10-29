import {Injectable,signal} from '@angular/core';
import {KAISHI_STATIC_ROOT,KAISHI_STATIC_VERSION,KaishiStaticCard,KaishiStaticCatalog,KaishiStaticKind,KaishiStaticResource,kaishiResourceAllowed} from '../models/kaishi-static-media.model';
const hex=(b:ArrayBuffer)=>Array.from(new Uint8Array(b),n=>n.toString(16).padStart(2,'0')).join('');
export async function kaishiCardKey(id:string):Promise<string>{return hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(id)));}
export function parseKaishiCatalog(raw:unknown):KaishiStaticCatalog{
 const c=raw as KaishiStaticCatalog;
 if(!c||c.schemaVersion!==1||c.version!==KAISHI_STATIC_VERSION||!['blocked','ready'].includes(c.publication)||!['kaishi','test'].includes(c.dataset))throw new Error('Invalid media catalog');return c;
}
export function parseKaishiCard(raw:unknown,id:string,catalog:KaishiStaticCatalog):KaishiStaticCard{
 const c=raw as KaishiStaticCard;if(!c||c.schemaVersion!==1||c.version!==catalog.version||c.entryId!==id||!c.resources||typeof c.resources!=='object'||Array.isArray(c.resources))throw new Error('Invalid media card');
 for(const [key,r]of Object.entries(c.resources)){
  if(!['wordAudio','sentenceAudio','picture'].includes(key)||!kaishiResourceAllowed(id,key as KaishiStaticKind)||!r||!Number.isSafeInteger(r.bytes)||r.bytes<1||r.bytes>524288)throw new Error('Invalid media reference');
  const extension=/^resources\/[a-f0-9]{40}\.(mp3|webp|png|jpg|wav)$/.exec(r.path)?.[1];
  const mime:Record<string,string>={mp3:'audio/mpeg',webp:'image/webp',png:'image/png',jpg:'image/jpeg',wav:'audio/wav'};
  if(!extension||mime[extension]!==r.type||(key==='picture'?!r.type.startsWith('image/'):r.type!=='audio/mpeg'&&!(catalog.dataset==='test'&&r.type==='audio/wav')))throw new Error('Invalid media type');
 }return c;
}
@Injectable({providedIn:'root'})
export class KaishiStaticMediaService {
 readonly publication=signal<'unknown'|'blocked'|'ready'>('unknown');
 private catalogRequest?:Promise<KaishiStaticCatalog>;
 private root():URL{return new URL(KAISHI_STATIC_ROOT,document.baseURI);}
 private async json(path:string,signal?:AbortSignal,retry=false):Promise<unknown>{
  const response=await fetch(new URL(path,this.root()),{signal,cache:retry?'reload':'default',credentials:'same-origin',redirect:'error'});
  if(!response.ok)throw new Error('Media metadata unavailable');
  if(Number(response.headers.get('content-length')??0)>16384)throw new Error('Media metadata too large');
  const text=await response.text();if(text.length>16384)throw new Error('Media metadata too large');return JSON.parse(text) as unknown;
 }
 catalog(retry=false):Promise<KaishiStaticCatalog>{
  if(retry)this.catalogRequest=undefined;
  return this.catalogRequest??=this.json('catalog.json',undefined,retry).then(raw=>{const value=parseKaishiCatalog(raw);this.publication.set(value.publication);return value;}).catch(error=>{this.catalogRequest=undefined;throw error;});
 }
 async card(id:string,signal:AbortSignal,retry=false):Promise<{catalog:KaishiStaticCatalog;card:KaishiStaticCard|null}>{
  const catalog=await this.catalog(retry);signal.throwIfAborted();if(catalog.publication==='blocked')return {catalog,card:null};
  const key=await kaishiCardKey(id);signal.throwIfAborted();
  const raw=await this.json(`cards/${key}.json`,signal,retry);signal.throwIfAborted();return {catalog,card:parseKaishiCard(raw,id,catalog)};
 }
 async resource(ref:KaishiStaticResource,signal:AbortSignal,retry=false):Promise<Blob>{
  const response=await fetch(new URL(ref.path,this.root()),{signal,cache:retry?'reload':'default',credentials:'same-origin',redirect:'error'});
  if(!response.ok)throw new Error('Media unavailable');
  const size=response.headers.get('content-length');if(size!=null&&!response.headers.get('content-encoding')&&Number(size)!==ref.bytes){await response.body?.cancel().catch(()=>{});throw new Error('Media size mismatch');}
  const reader=response.body?.getReader();if(!reader)throw new Error('Missing media body');
  const output=new Uint8Array(ref.bytes);let offset=0;
  try{while(true){const {value,done}=await reader.read();if(done)break;if(offset+value.length>output.length)throw new Error('Media limit');output.set(value,offset);offset+=value.length;}}
  finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
  signal.throwIfAborted();if(offset!==ref.bytes||hex(await crypto.subtle.digest('SHA-1',output))!==ref.path.split('/')[1].split('.')[0])throw new Error('Media integrity mismatch');
  return new Blob([output],{type:ref.type});
 }
}
