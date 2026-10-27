import {Injectable,inject} from '@angular/core';
import {WorkspaceService} from './workspace.service';
import {CUSTOM_DECKS_ENABLED,CUSTOM_DECK_SYNC_ENABLED,CUSTOM_REMOTE_UPLOAD_APPROVED} from './custom-deck-gates';
import {CUSTOM_DECK_IDB,CUSTOM_DECK_DATABASE,CUSTOM_DECK_DATABASE_VERSION,CustomDeckRepository} from './custom-deck.repository';
import {BACKUP_STORES,BACKUP_MAX_BYTES,BACKUP_MAX_ROWS,BACKUP_MAX_ROW_BYTES,BackupRecords,DeckBackup,DeckBackupError,check,encodeBackup,decodeBackup,emptyBackupRecords} from './deck-backup-contract';
import {canonical} from './custom-deck-validation';

/** Lazy, local-only adapter for the existing v3 stores. No schema change or remote dependency. */
@Injectable({providedIn:'root'})
export class DeckBackupService {
 private readonly factory=inject(CUSTOM_DECK_IDB);private readonly workspace=inject(WorkspaceService);
 private readonly enabled=inject(CUSTOM_DECKS_ENABLED);private readonly cloud=inject(CUSTOM_DECK_SYNC_ENABLED);private readonly approved=inject(CUSTOM_REMOTE_UPLOAD_APPROVED);
 private readonly repo=inject(CustomDeckRepository);
 private guard(signal:AbortSignal){const epoch=this.workspace.activationRevision();check(this.workspace.active()==='guest','owner');return ()=>{signal.throwIfAborted();check(this.workspace.active()==='guest'&&this.workspace.activationRevision()===epoch,'owner');check(this.enabled()&&!this.cloud()&&!this.approved,'coordination');};}
 private open():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{
  const r=this.factory.open(CUSTOM_DECK_DATABASE,CUSTOM_DECK_DATABASE_VERSION);let rejected=false;
  r.onupgradeneeded=()=>{for(const s of BACKUP_STORES)if(!r.result.objectStoreNames.contains(s)){const store=r.result.createObjectStore(s,{keyPath:['workspace','key']});store.createIndex('workspace','workspace');if(s==='cards'){store.createIndex('deck',['workspace','value.deckId']);store.createIndex('lexical',['workspace','value.deckId','value.lexicalIdentity.key','value.direction'],{unique:true});}}};
  r.onblocked=()=>{rejected=true;reject(new DeckBackupError('blocked'));};r.onerror=()=>reject(r.error);
  r.onsuccess=()=>{const db=r.result;db.onversionchange=()=>db.close();if(rejected)db.close();else resolve(db);};
 });}
 private async snapshot(guard:()=>void,signal:AbortSignal):Promise<BackupRecords>{
  guard();const db=await this.open();try{return await new Promise<BackupRecords>((resolve,reject)=>{
   const records=emptyBackupRecords(),tx=db.transaction([...BACKUP_STORES],'readonly');let error:unknown;let bytes=0,count=0;
   const abort=()=>{try{tx.abort();}catch{/* Already settled. */}};signal.addEventListener('abort',abort,{once:true});
   tx.oncomplete=()=>{signal.removeEventListener('abort',abort);try{guard();resolve(records);}catch(e){reject(e);}};tx.onabort=()=>{signal.removeEventListener('abort',abort);reject(error??tx.error??new DeckBackupError('cancelled'));};tx.onerror=()=>{};
   for(const s of BACKUP_STORES){const r=tx.objectStore(s).index('workspace').openCursor('guest');r.onsuccess=()=>{try{guard();const cursor=r.result;if(!cursor)return;const value=cursor.value;
    // writeDailyState may persist this optional field as undefined; its JSON meaning is absent.
    // Match guestInventory's existing finite JSON representation, without inventing a timestamp.
    if(s==='daily'&&value.value?.completedAt===undefined)delete value.value.completedAt;
    const size=new TextEncoder().encode(JSON.stringify(value)).length;bytes+=size;check(++count<=BACKUP_MAX_ROWS&&size<=BACKUP_MAX_ROW_BYTES&&bytes<=BACKUP_MAX_BYTES,'limit');records[s].push(value);cursor.continue();}catch(e){error=e;abort();}};}
  });}finally{db.close();}
 }
 async export(signal:AbortSignal):Promise<string>{const guard=this.guard(signal);guard();const records=await this.snapshot(guard,signal);const raw=await encodeBackup(records);guard();return raw;}
 async preview(file:Blob,signal:AbortSignal):Promise<{raw:string;backup:DeckBackup}>{const guard=this.guard(signal);guard();check(file.size<=BACKUP_MAX_BYTES,'limit');const raw=await file.text();guard();const backup=await decodeBackup(raw);guard();return {raw,backup};}
 async restore(raw:string,confirmed:boolean,signal:AbortSignal):Promise<void>{
  const guard=this.guard(signal);guard();check(confirmed,'confirmation');const backup=await decodeBackup(raw);guard();const db=await this.open();
  try{await new Promise<void>((resolve,reject)=>{
   const tx=db.transaction([...BACKUP_STORES],'readwrite');let error:unknown;let pending=BACKUP_STORES.length;
   const abort=()=>{try{tx.abort();}catch{/* Commit is terminal. */}};signal.addEventListener('abort',abort,{once:true});
   tx.oncomplete=()=>{signal.removeEventListener('abort',abort);resolve();};tx.onabort=()=>{signal.removeEventListener('abort',abort);reject(error??tx.error??new DeckBackupError('cancelled'));};tx.onerror=()=>{};
   // Check emptiness INSIDE the same write transaction; another tab cannot win between check and put.
   for(const s of BACKUP_STORES){const request=tx.objectStore(s).index('workspace').count('guest');request.onsuccess=()=>{try{guard();check(request.result===0,'nonempty');if(--pending)return;
     for(const store of BACKUP_STORES)for(const row of backup.records[store]){guard();const put=tx.objectStore(store).add(row);put.onsuccess=()=>{try{guard();}catch(e){error=e;abort();}};}
     for(const store of BACKUP_STORES){const read=tx.objectStore(store).index('workspace').getAll('guest');read.onsuccess=()=>{try{guard();const sorted=(rows:typeof read.result)=>[...rows].sort((a,b)=>a.key<b.key?-1:a.key>b.key?1:0);check(canonical(read.result)===canonical(sorted(backup.records[store])),'verify');}catch(e){error=e;abort();}};}
    }catch(e){error=e;abort();}};}
  });}finally{db.close();}
  // Read-back verification ran after all puts inside the transaction; success follows its commit.
  // No remote ACK, receipt, event or namespace is synthesized.
  this.repo.catalogRevision.update(n=>n+1);this.repo.progressRevision.update(n=>n+1);this.repo.journalRevision.update(n=>n+1);
  if(typeof BroadcastChannel!=='undefined'){const c=new BroadcastChannel('kana-study-custom-decks-revision-v1');c.postMessage({workspace:'guest'});c.close();}
 }
}
