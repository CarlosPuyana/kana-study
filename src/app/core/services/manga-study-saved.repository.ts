import {computed, effect, inject, Injectable, signal, untracked} from '@angular/core';
import {LocalWorkspaceId} from '../models/account.model';
import {MangaStudySavedItem} from '../models/manga-study-saved.model';
import {WorkspaceService} from './workspace.service';

const request = <T>(req: IDBRequest<T>): Promise<T> => new Promise((resolve, reject) => {
  req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error);
});

@Injectable({providedIn:'root'})
export class MangaStudySavedRepository {
  private readonly workspace = inject(WorkspaceService);
  private readonly databases = new Map<string, Promise<IDBDatabase>>();
  private generation = 0;
  readonly items = signal<readonly MangaStudySavedItem[]>([]);
  readonly loading = signal(true);
  readonly failed = signal(false);
  readonly count = computed(() => this.items().length);
  constructor() {
    effect(() => {
      const workspace = this.workspace.active();
      untracked(() => {this.items.set([]); void this.reload(workspace);});
    });
  }
  private open(workspace: LocalWorkspaceId): Promise<IDBDatabase> {
    const name = this.workspace.databaseName('kana-study-manga-study', workspace);
    let pending = this.databases.get(name);
    if (!pending) {
      pending = new Promise((resolve, reject) => {
        const req = indexedDB.open(name, 1);
        req.onupgradeneeded = () => req.result.createObjectStore('saved-items', {keyPath:'id'});
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => {this.databases.delete(name); reject(req.error);};
        req.onblocked = () => {this.databases.delete(name); reject(new Error('IndexedDB blocked'));};
      });
      this.databases.set(name, pending);
      void pending.catch(()=>{if(this.databases.get(name)===pending)this.databases.delete(name);});
    }
    return pending;
  }
  async list(workspace = this.workspace.active()): Promise<MangaStudySavedItem[]> {
    const db = await this.open(workspace);
    const items = await request<MangaStudySavedItem[]>(db.transaction('saved-items').objectStore('saved-items').getAll());
    return items.sort((a,b) => b.createdAt-a.createdAt || a.id.localeCompare(b.id));
  }
  async get(id: string, workspace = this.workspace.active()): Promise<MangaStudySavedItem|undefined> {
    const db = await this.open(workspace);
    return request(db.transaction('saved-items').objectStore('saved-items').get(id));
  }
  async exists(id: string, workspace = this.workspace.active()): Promise<boolean> {return !!await this.get(id, workspace);}
  async reload(workspace = this.workspace.active()): Promise<void> {
    if (workspace !== this.workspace.active()) return;
    const generation = ++this.generation;
    this.loading.set(true); this.failed.set(false);
    try {const items = await this.list(workspace); if (generation === this.generation && workspace === this.workspace.active()) this.items.set(items);}
    catch {if (generation === this.generation && workspace === this.workspace.active()) this.failed.set(true);}
    finally {if (generation === this.generation && workspace === this.workspace.active()) this.loading.set(false);}
  }
  async save(item: MangaStudySavedItem, workspace = this.workspace.active()): Promise<MangaStudySavedItem> {
    if (item.schemaVersion !== 1 || !item.id || !item.expression || !item.source.volumeId || !Number.isInteger(item.source.pageNumber) || item.source.pageNumber < 1 || !Number.isFinite(item.createdAt)) throw new Error('Invalid saved item');
    const db = await this.open(workspace);
    const saved = await new Promise<MangaStudySavedItem>((resolve,reject) => {
      const tx = db.transaction('saved-items','readwrite'), store = tx.objectStore('saved-items');
      let value = item;
      // The read and add share one serialized transaction: concurrent saves cannot duplicate.
      const req = store.get(item.id);
      req.onsuccess = () => {if (req.result) value = req.result; else store.add(item);};
      tx.oncomplete = () => resolve(value); tx.onerror = tx.onabort = () => reject(tx.error ?? new Error('IndexedDB write failed'));
    });
    await this.reload(workspace); return saved;
  }
  async remove(id: string, workspace = this.workspace.active()): Promise<void> {await this.mutate(store => store.delete(id),workspace);}
  async clear(workspace = this.workspace.active()): Promise<void> {await this.mutate(store => store.clear(),workspace);}
  private async mutate(operation: (store:IDBObjectStore)=>void,workspace:LocalWorkspaceId):Promise<void> {
    const db = await this.open(workspace);
    await new Promise<void>((resolve,reject) => {const tx=db.transaction('saved-items','readwrite'); tx.oncomplete=()=>resolve(); tx.onerror=tx.onabort=()=>reject(tx.error ?? new Error('IndexedDB write failed')); operation(tx.objectStore('saved-items'));});
    await this.reload(workspace);
  }
}
