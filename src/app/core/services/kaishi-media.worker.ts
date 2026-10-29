import { ZipReader, BlobReader, Uint8ArrayWriter } from '@zip.js/zip.js';
import { KAISHI_MEDIA_MANIFEST } from '../../data/kaishi-media.manifest';
import { KAISHI_PACKAGE, KaishiMediaError, KaishiMediaLink, KaishiResource, KaishiReference } from '../models/kaishi-media.model';
import { decodeKaishiResource, verifyKaishiPackage, validateKaishiInventory } from './kaishi-media-parser';
import { KaishiMediaStore } from './kaishi-media-store';
const scope=globalThis as unknown as {onmessage:(event:MessageEvent<{id:string;file:File}>)=>void;postMessage:(message:unknown)=>void;close:()=>void};
scope.onmessage=event=>{const {id,file}=event.data;void (navigator.locks?navigator.locks.request('kaishi-media:'+id,()=>install(id,file)).catch(()=>install(id,file)):install(id,file));};
async function install(id:string,file:File):Promise<void>{
  const store=new KaishiMediaStore(),zip=new ZipReader(new BlobReader(file),{useWebWorkers:false});let published=false;
  try{
    await verifyKaishiPackage(file);
    const entries=await zip.getEntries();validateKaishiInventory(entries);
    const links:readonly KaishiMediaLink[]=KAISHI_MEDIA_MANIFEST;
    const resources=new Map<string,{ref:KaishiReference}>();
    for(const link of links)for(const kind of ['wordAudio','sentenceAudio','picture'] as const){const ref=link[kind];if(ref)resources.set(ref[0],{ref});}
    if(resources.size!==KAISHI_PACKAGE.resources||Array.from(resources.values()).reduce((s,r)=>s+r.ref[1],0)!==KAISHI_PACKAGE.unpackedBytes)throw new KaishiMediaError('format');
    await store.stage(id,links);const byName=new Map(entries.map(e=>[e.filename,e]));let count=0,batch:KaishiResource[]=[];
    scope.postMessage({phase:'installing',count:0});
    for(const [name,{ref}]of resources){
      const entry=byName.get(name);if(!entry||entry.directory||!entry.getData)throw new KaishiMediaError('format');
      const data=await entry.getData(new Uint8ArrayWriter(),{checkSignature:true,useWebWorkers:false});
      batch.push({id:name,blob:await decodeKaishiResource(data,ref,ref[3])});
      if(batch.length===16||count+batch.length===resources.size){await store.put(id,batch);count+=batch.length;batch=[];scope.postMessage({phase:'installing',count});}
    }
    const previous=await store.activate(id);published=true;scope.postMessage({phase:'installed',count});
    if(previous&&previous!==id)await store.discard(previous).catch(()=>{});
  }catch(error){
    if(!published)await store.discard(id).catch(()=>{});
    scope.postMessage({phase:'error',code:error instanceof KaishiMediaError?error.code:(error as {name?:string})?.name==='QuotaExceededError'?'quota':'storage'});
  }finally{await zip.close().catch(()=>{});store.close();scope.close();}
}
