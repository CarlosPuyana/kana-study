import { KAISHI_PACKAGE, KaishiInstallation, KaishiMediaKind, KaishiMediaLink, KaishiResource, KaishiMediaError, KAISHI_RESOURCE_LIMIT } from '../models/kaishi-media.model';
export const KAISHI_MEDIA_DATABASE = 'kana-study-kaishi-media-v1';
const META='meta', RESOURCES='resources', LINKS='links';
const done=(tx:IDBTransaction)=>new Promise<void>((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error??new Error('Transaction aborted'));tx.onerror=()=>{};});
const request=<T>(r:IDBRequest<T>)=>new Promise<T>((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
/** Device-wide immutable package content only. Never opens a progress/workspace database. */
export class KaishiMediaStore {
  private connection?:Promise<IDBDatabase>;
  constructor(private readonly factory:IDBFactory=globalThis.indexedDB){}
  close():void {void this.connection?.then(db=>db.close()).catch(()=>{});this.connection=undefined;}
  private open():Promise<IDBDatabase>{
    return this.connection??=new Promise((resolve,reject)=>{
      if(!this.factory){reject(new KaishiMediaError('storage'));return;}
      const r=this.factory.open(KAISHI_MEDIA_DATABASE,1);
      r.onupgradeneeded=()=>{const db=r.result;db.createObjectStore(META,{keyPath:'id'});for(const name of [RESOURCES,LINKS]){const s=db.createObjectStore(name,{keyPath:['generation','id']});s.createIndex('generation','generation');}};
      let rejected=false;r.onblocked=()=>{rejected=true;reject(new KaishiMediaError('storage'));};r.onerror=()=>{this.connection=undefined;reject(r.error);};
      r.onsuccess=()=>{const db=r.result;if(rejected){db.close();this.connection=undefined;return;}db.onversionchange=()=>{db.close();this.connection=undefined;};resolve(db);};
    });
  }
  private async run<T>(names:string[],mode:IDBTransactionMode,action:(tx:IDBTransaction)=>Promise<T>):Promise<T>{
    const db=await this.open(),tx=db.transaction(names,mode),completion=done(tx);
    try{const result=await action(tx);await completion;return result;}catch(error){try{tx.abort();}catch{}await completion.catch(()=>{});throw error;}
  }
  async active():Promise<KaishiInstallation|null>{return this.run([META],'readonly',async tx=>{
    const meta=tx.objectStore(META),pointer=await request(meta.get('active')) as {generation:string}|undefined;
    if(!pointer)return null;const value=await request(meta.get(pointer.generation)) as KaishiInstallation|undefined;
    return value?.phase==='ready'?value:null;
  });}
  async stage(id:string,links:readonly KaishiMediaLink[]):Promise<void>{
    if(!/^[a-f0-9-]{36}$/.test(id)||links.length!==KAISHI_PACKAGE.links||new Set(links.map(l=>l.id)).size!==links.length)throw new KaishiMediaError('format');
    await this.run([META,LINKS],'readwrite',async tx=>{tx.objectStore(META).add({id,phase:'installing',count:0,bytes:0,installedAt:Date.now()});for(const link of links)tx.objectStore(LINKS).add({...link,generation:id});});
  }
  async put(id:string,resources:readonly KaishiResource[]):Promise<void>{
    if(resources.length>16||resources.some(r=>!/^\d{1,4}$/.test(r.id)||!r.blob.size||r.blob.size>KAISHI_RESOURCE_LIMIT||!['audio/mpeg','image/webp','image/png','image/jpeg'].includes(r.blob.type)))throw new KaishiMediaError('resource');
    await this.run([META,RESOURCES],'readwrite',async tx=>{
      const meta=tx.objectStore(META),stage=await request(meta.get(id)) as KaishiInstallation|undefined;
      if(stage?.phase!=='installing')throw new KaishiMediaError('storage');
      const count=stage.count+resources.length,bytes=stage.bytes+resources.reduce((sum,r)=>sum+r.blob.size,0);
      if(count>KAISHI_PACKAGE.resources||bytes>KAISHI_PACKAGE.unpackedBytes)throw new KaishiMediaError('resource');
      for(const resource of resources)tx.objectStore(RESOURCES).add({...resource,generation:id});meta.put({...stage,count,bytes});
    });
  }
  async activate(id:string):Promise<string|undefined>{return this.run([META],'readwrite',async tx=>{
    const meta=tx.objectStore(META),stage=await request(meta.get(id)) as KaishiInstallation|undefined;
    if(stage?.phase!=='installing'||stage.count!==KAISHI_PACKAGE.resources||stage.bytes!==KAISHI_PACKAGE.unpackedBytes)throw new KaishiMediaError('resource');
    const old=await request(meta.get('active')) as {generation:string}|undefined;
    meta.put({...stage,phase:'ready',installedAt:Date.now()});meta.put({id:'active',generation:id});return old?.generation;
  });}
  async resource(entryId:string,kind:KaishiMediaKind):Promise<Blob|null>{return this.run([META,LINKS,RESOURCES],'readonly',async tx=>{
    const pointer=await request(tx.objectStore(META).get('active')) as {generation:string}|undefined;if(!pointer)return null;
    const link=await request(tx.objectStore(LINKS).get([pointer.generation,entryId])) as KaishiMediaLink|undefined;
    const ref=link?.[kind];if(!ref)return null;
    const resource=await request(tx.objectStore(RESOURCES).get([pointer.generation,ref[0]])) as KaishiResource|undefined;
    return resource?.blob??null;
  });}
  async discard(id:string,removeActive=false):Promise<void>{await this.run([META,LINKS,RESOURCES],'readwrite',async tx=>{
    const meta=tx.objectStore(META),pointer=await request(meta.get('active')) as {generation:string}|undefined;
    if(pointer?.generation===id){if(!removeActive)return;meta.delete('active');}
    meta.delete(id);
    await Promise.all([LINKS,RESOURCES].map(name=>new Promise<void>((resolve,reject)=>{
      const cursor=tx.objectStore(name).index('generation').openCursor(IDBKeyRange.only(id));cursor.onerror=()=>reject(cursor.error);
      cursor.onsuccess=()=>{const row=cursor.result;if(!row){resolve();return;}row.delete();row.continue();};
    })));
  });}
}
