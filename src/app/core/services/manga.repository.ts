import { Injectable, inject } from '@angular/core';
import { WorkspaceService } from './workspace.service';
import { MangaPage, MangaProgress, MangaVolume } from '../models/manga.model';
import { LocalWorkspaceId } from '../models/account.model';
import { withMangaLock } from './manga-lock';
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
        const req = indexedDB.open(name, 1);
        req.onupgradeneeded = () => {
          req.result.createObjectStore('volumes', { keyPath: 'id' });
          req.result.createObjectStore('pages', { keyPath: ['volumeId', 'pageIndex'] }).createIndex('volumeId', 'volumeId');
          req.result.createObjectStore('reading-progress', { keyPath: 'volumeId' });
        };
        req.onblocked = () => reject(new Error('IndexedDB blocked'));
        req.onsuccess = () => resolve(req.result); req.onerror = () => { this.databases.delete(name); reject(req.error); };
      }); this.databases.set(name, pending);
    }
    return pending;
  }
  async volumes(workspace = this.workspace.active()): Promise<MangaVolume[]> { const db = await this.open(workspace); return (await request(db.transaction('volumes').objectStore('volumes').getAll()) as MangaVolume[]).filter(v => v.complete); }
  async volume(id: string, workspace = this.workspace.active()): Promise<MangaVolume | undefined> { const db = await this.open(workspace); return request(db.transaction('volumes').objectStore('volumes').get(id)); }
  async page(id: string, index: number, workspace = this.workspace.active()): Promise<MangaPage | undefined> { const db = await this.open(workspace); return request(db.transaction('pages').objectStore('pages').get([id, index])); }
  async progress(id: string, workspace = this.workspace.active()): Promise<MangaProgress | undefined> { const db = await this.open(workspace); return request(db.transaction('reading-progress').objectStore('reading-progress').get(id)); }
  async put(store: 'volumes' | 'pages' | 'reading-progress', value: MangaVolume | MangaPage | MangaProgress, workspace = this.workspace.active()): Promise<void> {
    const db = await this.open(workspace);
    await new Promise<void>((resolve, reject) => { const tx = db.transaction(store, 'readwrite'); tx.oncomplete = () => resolve(); tx.onerror = tx.onabort = () => reject(tx.error); tx.objectStore(store).put(value); });
  }
  async delete(id: string, workspace = this.workspace.active()): Promise<void> {
    const db = await this.open(workspace);
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(['volumes', 'pages', 'reading-progress'], 'readwrite');
      tx.oncomplete = () => resolve(); tx.onerror = tx.onabort = () => reject(tx.error);
      tx.objectStore('volumes').delete(id); tx.objectStore('reading-progress').delete(id);
      const cursor = tx.objectStore('pages').index('volumeId').openCursor(IDBKeyRange.only(id));
      cursor.onsuccess = () => { const row = cursor.result; if (row) { row.delete(); row.continue(); } };
    });
  }
  async cleanup(workspace = this.workspace.active(), activeIds: ReadonlySet<string> = new Set()): Promise<boolean> {
    return withMangaLock(workspace, async () => {
    const db = await this.open(workspace);
    const partial = (await request(db.transaction('volumes').objectStore('volumes').getAll()) as MangaVolume[]).filter(v => !v.complete && !activeIds.has(v.id) && (navigator.locks?.request || Date.now() - Date.parse(v.updatedAt) > 300_000));
    for (const volume of partial) await this.delete(volume.id, workspace);
    return partial.length > 0;
    });
  }
}
