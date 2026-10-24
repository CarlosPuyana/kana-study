import {Injectable,inject,signal} from '@angular/core';
import {LocalWorkspaceId} from '../models/account.model';
import {AttemptEvent,AttemptModule,AttemptActivity,validAttemptEvent} from '../models/attempt-event.model';
import {WorkspaceService} from './workspace.service';
export const ATTEMPT_DATABASE='kana-study-attempts-v1';
export interface AttemptQuery {readonly from:string;readonly to:string;readonly module?:AttemptModule;readonly activity?:AttemptActivity;}
@Injectable({providedIn:'root'})
export class AttemptEventRepository {
  private readonly workspace=inject(WorkspaceService);
  readonly revision=signal(0); readonly writeError=signal(false);
  private open():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{
    let blocked=false;const r=indexedDB.open(ATTEMPT_DATABASE,1);
    r.onupgradeneeded=()=>{const store=r.result.createObjectStore('events',{keyPath:['workspace','id']});
      store.createIndex('date',['workspace','occurredAt']);store.createIndex('module',['workspace','module','occurredAt']);
      store.createIndex('activity',['workspace','activity','occurredAt']);store.createIndex('moduleActivity',['workspace','module','activity','occurredAt']);};
    r.onerror=()=>reject(r.error);r.onblocked=()=>{blocked=true;reject(Error('Attempt database blocked'));};
    r.onsuccess=()=>{if(blocked){r.result.close();return;}r.result.onversionchange=()=>r.result.close();resolve(r.result);};
  });}
  async insert(event:AttemptEvent,workspace:LocalWorkspaceId=this.workspace.active()):Promise<boolean>{
    if(!validAttemptEvent(event))return false;
    let db:IDBDatabase|undefined;
    try{db=await this.open();let added=false;
      await new Promise<void>((resolve,reject)=>{const tx=db!.transaction('events','readwrite'),store=tx.objectStore('events');
        tx.oncomplete=()=>resolve();tx.onerror=tx.onabort=()=>reject(tx.error);
        const get=store.get([workspace,event.id]);get.onsuccess=()=>{if(get.result)return;added=true;store.add({version:1,id:event.id,occurredAt:event.occurredAt,module:event.module,activity:event.activity,itemId:event.itemId,
          ...(event.sessionId?{sessionId:event.sessionId}:{}),...(event.questionType?{questionType:event.questionType}:{}),
          ...(event.firstAttempt!==undefined?{firstAttempt:event.firstAttempt}:{}),result:event.result.source==='objective'?{source:'objective',correct:event.result.correct}:{source:'self',rating:event.result.rating},workspace});};
      });
      if(added)this.revision.update(n=>n+1);return true;
    }catch{this.writeError.set(true);return false;}finally{db?.close();}
  }
  /** Cursor reduction keeps memory proportional to the aggregate, never history size. */
  async scan(query:AttemptQuery,visit:(event:AttemptEvent)=>void|boolean,workspace:LocalWorkspaceId=this.workspace.active()):Promise<void>{
    let db:IDBDatabase|undefined;
    try{db=await this.open();await new Promise<void>((resolve,reject)=>{
      const tx=db!.transaction('events'),store=tx.objectStore('events');
      const prefix:unknown[]=[workspace];let index='date';
      if(query.module){prefix.push(query.module);index='module';}if(query.activity){prefix.push(query.activity);index=query.module?'moduleActivity':'activity';}
      const range=IDBKeyRange.bound([...prefix,query.from] as IDBValidKey,[...prefix,query.to] as IDBValidKey);
      const cursor=store.index(index).openCursor(range);tx.oncomplete=()=>resolve();tx.onerror=tx.onabort=()=>reject(tx.error);
      cursor.onsuccess=()=>{const c=cursor.result;if(!c)return;try{if(c.value.workspace===workspace&&validAttemptEvent(c.value)&&visit(c.value)===false)return;c.continue();}catch{tx.abort();}};
    });}finally{db?.close();}
  }
  /** Explicit Guest import preserves immutable event IDs and existing account events. */
  async copyGuestToUser(userId:string):Promise<void>{
    // Page by ID, closing each transaction before the target writes.
    let db:IDBDatabase|undefined;
    try{db=await this.open();let after:string|null=null;
      for(;;){const page=await new Promise<AttemptEvent[]>((resolve,reject)=>{
        const values:AttemptEvent[]=[],tx=db!.transaction('events');
        const r=tx.objectStore('events').openCursor(IDBKeyRange.bound(['guest',after??''],['guest',[]],after!==null));
        tx.onerror=tx.onabort=()=>reject(tx.error);tx.oncomplete=()=>resolve(values);
        r.onsuccess=()=>{const c=r.result;if(!c)return;if(validAttemptEvent(c.value))values.push(c.value);after=c.value.id;if(values.length<100)c.continue();};
      });if(!page.length)break;for(const event of page)if(!await this.insert(event,`user:${userId}`))throw Error('Attempt history import failed');if(page.length<100)break;}
    }catch(error){this.writeError.set(true);throw error;}finally{db?.close();}
  }
  async hasGuestData():Promise<boolean>{let found=false;try{await this.scan({from:'0000-01-01T00:00:00.000Z',to:'9999-12-31T23:59:59.999Z'},()=>{found=true;return false;},'guest');}catch{/* no storage */}return found;}
}
