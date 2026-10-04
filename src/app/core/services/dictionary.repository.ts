import { Injectable } from '@angular/core';
import { DictionaryMetadata, DictionaryTerm } from '../models/dictionary.model';
const request = <T>(req: IDBRequest<T>): Promise<T> => new Promise((resolve,reject) => { req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error); });
export function dictionaryLock<T>(action: () => Promise<T>): Promise<T> { return navigator.locks?.request ? navigator.locks.request('kana-study-dictionary-install',action) : action(); }
@Injectable({providedIn:'root'})
export class DictionaryRepository {
  private database?: Promise<IDBDatabase>;
  readonly activeImports = new Set<string>();
  private open(): Promise<IDBDatabase> {
    return this.database ??= new Promise((resolve,reject)=>{
      const req=indexedDB.open('kana-study-dictionary',1);
      req.onupgradeneeded=()=>{
        req.result.createObjectStore('metadata',{keyPath:'id'});
        const terms=req.result.createObjectStore('terms',{keyPath:'id'});
        terms.createIndex('expression',['dictionaryId','expression']);terms.createIndex('reading',['dictionaryId','reading']);terms.createIndex('dictionaryId','dictionaryId');
      };
      req.onsuccess=()=>resolve(req.result);req.onerror=()=>{this.database=undefined;reject(req.error);};req.onblocked=()=>{this.database=undefined;reject(new Error('Database blocked'));};
    });
  }
  async ready(): Promise<DictionaryMetadata | undefined> {
    const db=await this.open();const metadata=await request(db.transaction('metadata').objectStore('metadata').get('active')) as DictionaryMetadata | undefined;
    return metadata?.status==='ready' ? metadata : undefined;
  }
  private async write(stores:string[], action:(tx:IDBTransaction)=>void):Promise<void> {
    const db=await this.open();await new Promise<void>((resolve,reject)=>{const tx=db.transaction(stores,'readwrite');tx.oncomplete=()=>resolve();tx.onerror=tx.onabort=()=>reject(tx.error);action(tx);});
  }
  async stage(metadata:DictionaryMetadata):Promise<void> { await this.write(['metadata'],tx=>tx.objectStore('metadata').put(metadata)); }
  async add(terms:DictionaryTerm[]):Promise<void> { await this.write(['terms'],tx=>{for(const term of terms) tx.objectStore('terms').put(term);}); }
  async publish(metadata:DictionaryMetadata):Promise<void> {
    const previous=await this.ready();
    await this.write(['metadata'],tx=>{
      const store=tx.objectStore('metadata');
      if(previous) store.put({...previous,id:previous.dictionaryId,status:'installing',updatedAt:'1970-01-01T00:00:00Z'});
      store.put({...metadata,id:'active',status:'ready'});store.delete(metadata.id);
    });
    if(previous) await this.discard(previous.dictionaryId).catch(()=>undefined);
  }
  async discard(dictionaryId:string):Promise<void> {
    const db=await this.open();
    while(true) {
      const keys=await request(db.transaction('terms').objectStore('terms').index('dictionaryId').getAllKeys(IDBKeyRange.only(dictionaryId),1000));
      if(!keys.length) break;
      await this.write(['terms'],tx=>{for(const key of keys)tx.objectStore('terms').delete(key);});
    }
    await this.write(['metadata'],tx=>tx.objectStore('metadata').delete(dictionaryId));
  }
  async cleanup():Promise<void> {
    await dictionaryLock(async()=>{
      const db=await this.open();const rows=await request(db.transaction('metadata').objectStore('metadata').getAll()) as DictionaryMetadata[];
      for(const row of rows) if(row.id!=='active' && !this.activeImports.has(row.dictionaryId) && (typeof navigator.locks?.request === 'function' || Date.now()-Date.parse(row.updatedAt)>300_000)) await this.discard(row.dictionaryId);
    });
  }
  async find(dictionaryId:string, query:string, field:'expression'|'reading'):Promise<DictionaryTerm[]> {
    const db=await this.open();return request(db.transaction('terms').objectStore('terms').index(field).getAll(IDBKeyRange.only([dictionaryId,query]),32));
  }
}
