import {LocalWorkspaceId} from '../models/account.model';
import {AttemptEvent} from '../models/attempt-event.model';
import {ATTEMPT_DATABASE} from './attempt-event.repository';

/** Kanji-only tombstone. Immutable insert retries cannot resurrect a revoked attempt.
 * It deliberately is not a valid AttemptEvent, so existing shared readers omit it.
 */
export async function retractKanjiAttempt(event:AttemptEvent,owner:LocalWorkspaceId):Promise<void>{
  const db=await new Promise<IDBDatabase>((resolve,reject)=>{
    let blocked=false;
    const request=indexedDB.open(ATTEMPT_DATABASE,1);
    request.onupgradeneeded=()=>{const store=request.result.createObjectStore('events',{keyPath:['workspace','id']});
      store.createIndex('date',['workspace','occurredAt']);store.createIndex('module',['workspace','module','occurredAt']);
      store.createIndex('activity',['workspace','activity','occurredAt']);store.createIndex('moduleActivity',['workspace','module','activity','occurredAt']);};
    request.onerror=()=>reject(request.error);request.onblocked=()=>{blocked=true;reject(Error('Attempt database blocked'));};
    request.onsuccess=()=>{if(blocked){request.result.close();return;}request.result.onversionchange=()=>request.result.close();resolve(request.result);};
  });
  try{await new Promise<void>((resolve,reject)=>{
    const tx=db.transaction('events','readwrite'),store=tx.objectStore('events');
    tx.oncomplete=()=>resolve();tx.onabort=tx.onerror=()=>reject(tx.error??Error('Attempt retraction conflict'));
    const get=store.get([owner,event.id]);get.onsuccess=()=>{
      const row=get.result;if(row){const {workspace,...stored}=row;
        const canonical=(value:unknown):string=>JSON.stringify(value,(_key,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
        if(canonical(row.kanjiRetraction??stored)!==canonical(event)){tx.abort();return;}}
      store.put({workspace:owner,id:event.id,occurredAt:event.occurredAt,module:'kanji',activity:'learn',kanjiRetraction:event});
    };
  });}finally{db.close();}
}
