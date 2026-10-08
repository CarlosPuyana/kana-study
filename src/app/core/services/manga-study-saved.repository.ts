import {computed, DestroyRef, effect, inject, Injectable, signal, untracked} from '@angular/core';
import {LocalWorkspaceId} from '../models/account.model';
import {MangaSavedChange, MangaSavedRemoteRow, MangaSavedSyncState, MangaStudySavedItem, validateMangaSavedItem} from '../models/manga-study-saved.model';
import {WorkspaceService} from './workspace.service';
import {makeOutboxItem, SyncOutboxService} from './sync-outbox.service';

const ITEMS='saved-items', STATE='sync-state', META='sync-meta';
const request = <T>(req: IDBRequest<T>): Promise<T> => new Promise((resolve, reject) => {
  req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error);
});

@Injectable({providedIn:'root'})
export class MangaStudySavedRepository {
  private readonly workspace=inject(WorkspaceService);
  private readonly outbox=inject(SyncOutboxService);
  private readonly databases=new Map<string,Promise<IDBDatabase>>();
  private generation=0;
  private readonly recoveries=new Map<LocalWorkspaceId,Promise<void>>();
  readonly items=signal<readonly MangaStudySavedItem[]>([]);
  readonly loading=signal(true);
  readonly failed=signal(false);
  readonly count=computed(()=>this.items().length);
  constructor() {
    inject(DestroyRef).onDestroy(()=>{++this.generation;for(const db of this.databases.values())void db.then(value=>value.close()).catch(()=>undefined);});
    effect(()=>{const workspace=this.workspace.active();untracked(()=>{this.items.set([]);void this.reload(workspace);});});
  }
  private open(workspace:LocalWorkspaceId):Promise<IDBDatabase> {
    const name=this.workspace.databaseName('kana-study-manga-study',workspace);
    let pending=this.databases.get(name);
    if(!pending) {
      let blocked=false;
      pending=new Promise((resolve,reject)=>{
        let rejected=false;
        const req=indexedDB.open(name,2);
        req.onupgradeneeded=()=>{
          const db=req.result;
          if(!db.objectStoreNames.contains(ITEMS))db.createObjectStore(ITEMS,{keyPath:'id'});
          if(!db.objectStoreNames.contains(STATE))db.createObjectStore(STATE,{keyPath:'id'});
          if(!db.objectStoreNames.contains(META))db.createObjectStore(META,{keyPath:'id'});
        };
        req.onsuccess=()=>{if(rejected){req.result.close();if(this.databases.get(name)===pending)this.databases.delete(name);return;}req.result.onversionchange=()=>req.result.close();resolve(req.result);};
        req.onerror=()=>{rejected=true;reject(req.error);};
        req.onblocked=()=>{blocked=true;rejected=true;reject(new Error('IndexedDB blocked'));};
      });
      this.databases.set(name,pending);
      // Reuse the rejection while the original upgrade is blocked. New open requests
      // would queue behind it without emitting their own blocked event.
      void pending.catch(()=>{if(!blocked&&this.databases.get(name)===pending)this.databases.delete(name);});
    }
    return pending;
  }
  private async transaction<T>(workspace:LocalWorkspaceId, action:(tx:IDBTransaction)=>Promise<T>):Promise<T> {
    const db=await this.open(workspace),tx=db.transaction([ITEMS,STATE,META],'readwrite');
    const done=new Promise<void>((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onerror=tx.onabort=()=>reject(tx.error??new Error('IndexedDB write failed'));});
    void done.catch(()=>undefined);
    try{const result=await action(tx);await done;return result;}
    catch(error){try{tx.abort();}catch{/* already completed */}throw error;}
  }
  async list(workspace=this.workspace.active()):Promise<MangaStudySavedItem[]> {
    const db=await this.open(workspace);
    const items=await request<MangaStudySavedItem[]>(db.transaction(ITEMS).objectStore(ITEMS).getAll());
    return items.sort((a,b)=>b.createdAt-a.createdAt||a.id.localeCompare(b.id));
  }
  async get(id:string,workspace=this.workspace.active()):Promise<MangaStudySavedItem|undefined> {
    const db=await this.open(workspace);return request(db.transaction(ITEMS).objectStore(ITEMS).get(id));
  }
  async exists(id:string,workspace=this.workspace.active()):Promise<boolean>{return !!await this.get(id,workspace);}
  async reload(workspace=this.workspace.active()):Promise<void> {
    if(workspace!==this.workspace.active())return;
    const generation=++this.generation;this.loading.set(true);this.failed.set(false);
    try{const items=await this.list(workspace);if(generation===this.generation&&workspace===this.workspace.active())this.items.set(items);}
    catch{if(generation===this.generation&&workspace===this.workspace.active())this.failed.set(true);}
    finally{if(generation===this.generation&&workspace===this.workspace.active())this.loading.set(false);}
  }
  async save(input:MangaStudySavedItem,workspace=this.workspace.active(),kind:MangaSavedChange['kind']='explicit'):Promise<MangaStudySavedItem> {
    const item=validateMangaSavedItem(input);
    const saved=await this.transaction(workspace,async tx=>{
      const store=tx.objectStore(ITEMS),existing=await request<MangaStudySavedItem|undefined>(store.get(item.id));
      if(existing)return existing; // First context remains intact; duplicates are not new intentions.
      store.add(item);if(workspace!=='guest')await this.change(tx,item.id,item,kind);return item;
    });
    await this.finishChange(workspace);return saved;
  }
  private async change(tx:IDBTransaction,id:string,item:MangaStudySavedItem|null,kind:MangaSavedChange['kind']='explicit'):Promise<void> {
    const store=tx.objectStore(STATE),state=await request<MangaSavedSyncState|undefined>(store.get(id));
    store.put({id,revision:state?.revision??0,pending:{token:crypto.randomUUID(),baseRevision:state?.revision??0,kind,item}} satisfies MangaSavedSyncState);
  }
  async remove(id:string,workspace=this.workspace.active()):Promise<void> {
    await this.transaction(workspace,async tx=>{tx.objectStore(ITEMS).delete(id);if(workspace!=='guest')await this.change(tx,id,null);});
    await this.finishChange(workspace);
  }
  async clear(workspace=this.workspace.active()):Promise<void> {
    await this.transaction(workspace,async tx=>{
      const store=tx.objectStore(ITEMS),items=await request<MangaStudySavedItem[]>(store.getAll());
      for(const item of items){store.delete(item.id);if(workspace!=='guest')await this.change(tx,item.id,null);}
    });
    await this.finishChange(workspace);
  }
  private async finishChange(workspace:LocalWorkspaceId):Promise<void> {
    await this.reload(workspace);
    // The journal is already committed, even if the separate outbox fails next.
    if(workspace!=='guest')window.dispatchEvent(new Event('kana-study:sync-pending'));
    await this.recoverPending(workspace);
  }
  async pending(workspace=this.workspace.active()):Promise<MangaSavedSyncState[]> {
    if(workspace==='guest')return [];
    const db=await this.open(workspace);
    return (await request<MangaSavedSyncState[]>(db.transaction(STATE).objectStore(STATE).getAll())).filter(s=>s.pending);
  }
  /** Only the atomic local change journal is recovered, never confirmed cache snapshots. */
  recoverPending(workspace=this.workspace.active()):Promise<void> {
    if(workspace==='guest')return Promise.resolve();
    const recovery=(this.recoveries.get(workspace)??Promise.resolve()).catch(()=>undefined).then(async()=>{
      const queued=await this.outbox.pending(workspace);
      for(const state of await this.pending(workspace)) {
        const change=state.pending!;
        if(queued.some(item=>item.entityType==='manga-saved-item'&&item.entityKey===state.id&&item.revision===change.token))continue;
        const item=makeOutboxItem(workspace,'manga-saved-item',state.id,change,change.item?'upsert':'delete')!;
        await this.outbox.enqueue({...item,revision:change.token});
      }
    });
    this.recoveries.set(workspace,recovery);return recovery;
  }
  async bootstrap(rows:readonly MangaSavedRemoteRow[],workspace:LocalWorkspaceId):Promise<void> {
    await this.transaction(workspace,async tx=>{
      const meta=tx.objectStore(META);if(await request(meta.get('bootstrap-v1')))return;
      const remote=new Set(rows.map(row=>row.item_id)),store=tx.objectStore(STATE);
      for(const item of await request<MangaStudySavedItem[]>(tx.objectStore(ITEMS).getAll())) {
        if(!remote.has(item.id)&&!await request(store.get(item.id)))await this.change(tx,item.id,validateMangaSavedItem(item),'bootstrap');
      }
      meta.put({id:'bootstrap-v1',complete:true});
    });
  }
  async mergeFromCloud(rows:readonly MangaSavedRemoteRow[],workspace:LocalWorkspaceId,confirmed:ReadonlyMap<string,string>=new Map()):Promise<void> {
    const valid=rows.map(row=>{
      if(!row||typeof row.item_id!=='string'||!Number.isSafeInteger(Number(row.revision))||Number(row.revision)<1||(!row.deleted_at&&!row.payload))throw new Error('Invalid Manga sync row');
      const payload=row.payload?validateMangaSavedItem(row.payload):null;
      if(payload&&payload.id!==row.item_id)throw new Error('Manga identity mismatch');
      return {...row,payload,revision:Number(row.revision)};
    });
    await this.transaction(workspace,async tx=>{
      const store=tx.objectStore(STATE),items=tx.objectStore(ITEMS);
      for(const row of valid){
        const state=await request<MangaSavedSyncState|undefined>(store.get(row.item_id));
        if((state?.revision??0)>row.revision)continue;
        let pending=state?.pending;
        const token=confirmed.get(row.item_id);
        if(pending?.token===token)pending=undefined;
        else if(pending&&token&&row.last_operation===token)pending={...pending,baseRevision:row.revision};
        store.put({id:row.item_id,revision:row.revision,...(pending?{pending}:{})} satisfies MangaSavedSyncState);
        if(!pending){if(row.deleted_at)items.delete(row.item_id);else items.put(row.payload!);}
      }
    });
    await this.reload(workspace);
  }
}
