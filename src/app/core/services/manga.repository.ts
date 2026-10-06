import { Injectable, inject } from '@angular/core';
import { WorkspaceService } from './workspace.service';
import { MangaPage, MangaProgress, MangaVolume } from '../models/manga.model';
import { LocalWorkspaceId } from '../models/account.model';
import { withMangaLock } from './manga-lock';
interface MangaProvisioningState {id:string;provisionedAt?:string;deletedAt?:string}
const request = <T>(req: IDBRequest<T>): Promise<T> => new Promise((resolve, reject) => { req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); });
@Injectable({ providedIn: 'root' })
export class MangaRepository {
  private readonly workspace = inject(WorkspaceService);
  private readonly databases = new Map<string, Promise<IDBDatabase>>();
  private open(workspace: LocalWorkspaceId): Promise<IDBDatabase> {
    const name = this.workspace.databaseName('kana-study-manga', workspace);
    let pending = this.databases.get(name);
    if (!pending) {
      pending = new Promise((resolve, reject) => {
        let blocked=false;
        const req = indexedDB.open(name, 2);
        req.onupgradeneeded = () => {
          if (!req.result.objectStoreNames.contains('volumes')) {
          req.result.createObjectStore('volumes', { keyPath: 'id' });
          req.result.createObjectStore('pages', { keyPath: ['volumeId', 'pageIndex'] }).createIndex('volumeId', 'volumeId');
          req.result.createObjectStore('reading-progress', { keyPath: 'volumeId' });
          }
          if (!req.result.objectStoreNames.contains('provisioning')) req.result.createObjectStore('provisioning', {keyPath:'id'});
        };
        req.onblocked = () => {blocked=true;this.databases.delete(name);reject(new Error('IndexedDB upgrade blocked by another tab'));};
        req.onsuccess = () => {const db=req.result;if(blocked){db.close();return;} db.onversionchange=()=>{db.close();this.databases.delete(name);}; resolve(db);}; req.onerror = () => { this.databases.delete(name); reject(req.error); };
      }); this.databases.set(name, pending);
    }
    return pending;
  }
  async volumes(workspace = this.workspace.active()): Promise<MangaVolume[]> { const db = await this.open(workspace); return (await request(db.transaction('volumes').objectStore('volumes').getAll()) as MangaVolume[]).filter(v => v.complete); }
  async volume(id: string, workspace = this.workspace.active()): Promise<MangaVolume | undefined> { const db = await this.open(workspace); return request(db.transaction('volumes').objectStore('volumes').get(id)); }
  async page(id: string, index: number, workspace = this.workspace.active()): Promise<MangaPage | undefined> { const db = await this.open(workspace); return request(db.transaction('pages').objectStore('pages').get([id, index])); }
  async progress(id: string, workspace = this.workspace.active()): Promise<MangaProgress | undefined> { const db = await this.open(workspace); return request(db.transaction('reading-progress').objectStore('reading-progress').get(id)); }
  async provisioningState(id:string,workspace=this.workspace.active()):Promise<MangaProvisioningState|undefined>{
    const db=await this.open(workspace);
    return request(db.transaction('provisioning').objectStore('provisioning').get(id));
  }
  async provisioned(id: string, workspace = this.workspace.active()): Promise<boolean> {
    const state=await this.provisioningState(id,workspace);
    return !!state?.deletedAt || !!(await this.volume(id,workspace))?.complete;
  }
  /** Commit the finished volume and its independent provisioning marker together. */
  async completeBuiltin(volume: MangaVolume, workspace = this.workspace.active()): Promise<void> {
    const db=await this.open(workspace);
    await new Promise<void>((resolve,reject)=>{
      const tx=db.transaction(['volumes','provisioning'],'readwrite');
      tx.oncomplete=()=>resolve();tx.onerror=tx.onabort=()=>reject(tx.error);
      tx.objectStore('volumes').put({...volume,complete:true});
      tx.objectStore('provisioning').put({id:volume.id,provisionedAt:new Date().toISOString()});
    });
  }
  async put(store: 'volumes' | 'pages' | 'reading-progress', value: MangaVolume | MangaPage | MangaProgress, workspace = this.workspace.active()): Promise<void> {
    const db = await this.open(workspace);
    await new Promise<void>((resolve, reject) => { const tx = db.transaction(store, 'readwrite'); tx.oncomplete = () => resolve(); tx.onerror = tx.onabort = () => reject(tx.error); tx.objectStore(store).put(value); });
  }
  async delete(id: string, workspace = this.workspace.active(), voluntary = true): Promise<void> {
    const db = await this.open(workspace);
    await new Promise<void>((resolve, reject) => {
      const tombstone=voluntary && id.startsWith('builtin:');
      const tx = db.transaction(['volumes', 'pages', 'reading-progress',...(tombstone?['provisioning']:[])], 'readwrite');
      tx.oncomplete = () => resolve(); tx.onerror = tx.onabort = () => reject(tx.error);
      tx.objectStore('volumes').delete(id); tx.objectStore('reading-progress').delete(id);
      if(tombstone){const store=tx.objectStore('provisioning'),previous=store.get(id);previous.onsuccess=()=>store.put({...previous.result,id,deletedAt:new Date().toISOString()});}
      const cursor = tx.objectStore('pages').index('volumeId').openCursor(IDBKeyRange.only(id));
      cursor.onsuccess = () => { const row = cursor.result; if (row) { row.delete(); row.continue(); } };
    });
  }
  async cleanup(workspace = this.workspace.active(), activeIds: ReadonlySet<string> = new Set()): Promise<boolean> {
    return withMangaLock(workspace, async () => {
    const db = await this.open(workspace);
    const partial = (await request(db.transaction('volumes').objectStore('volumes').getAll()) as MangaVolume[]).filter(v => !v.complete && !activeIds.has(v.id) && (navigator.locks?.request || Date.now() - Date.parse(v.updatedAt) > 300_000));
    for (const volume of partial) await this.delete(volume.id, workspace, false);
    return partial.length > 0;
    });
  }
}
