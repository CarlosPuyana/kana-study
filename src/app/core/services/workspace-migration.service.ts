import { inject, Injectable } from '@angular/core';
import { WorkspaceService } from './workspace.service';
import { makeOutboxItem, SyncOutboxService } from './sync-outbox.service';

@Injectable({ providedIn: 'root' })
export class WorkspaceMigrationService {
  private readonly workspace = inject(WorkspaceService);
  private readonly outbox = inject(SyncOutboxService);

  async copyGuestToUser(userId: string): Promise<void> {
    this.workspace.copyGuestLocalStorageToUser(userId);
    if (typeof indexedDB === 'undefined') return;
    const deck = await copyDatabase('kana-study-decks', this.workspace.databaseName('kana-study-decks', `user:${userId}`), [
      { name: 'card-progress', keyPath: ['deckId', 'entryId'], indexes: [['deckId', 'deckId'], ['due', 'due'], ['state', 'state']] },
      { name: 'review-events', keyPath: 'id', indexes: [['deckId', 'deckId'], ['entryId', 'entryId'], ['reviewedAt', 'reviewedAt'], ['deckId-reviewedAt', ['deckId', 'reviewedAt']]] },
      { name: 'daily-state', keyPath: ['deckId', 'localDate'], indexes: [] },
    ]);
    const rush = await copyDatabase('kana-study-rush', this.workspace.databaseName('kana-study-rush', `user:${userId}`), [
      { name: 'sessions', keyPath: 'id', indexes: [['module', 'module'], ['startedAt', 'startedAt'], ['localDay', 'localDay']] },
      { name: 'coverage', keyPath: ['module', 'contentId'], indexes: [['module', 'module']] },
    ]);
    const workspace = `user:${userId}` as const;
    for (const item of deck['card-progress'] ?? []) await this.queue(workspace, 'deck-card-progress', `${item.deckId}:${item.entryId}`, item);
    for (const item of deck['review-events'] ?? []) await this.queue(workspace, 'deck-review-event', item.id, item);
    for (const item of deck['daily-state'] ?? []) await this.queue(workspace, 'deck-daily-state', `${item.deckId}:${item.localDate}`, item);
    for (const item of rush['sessions'] ?? []) await this.queue(workspace, 'rush-session', item.id, item);
    for (const item of rush['coverage'] ?? []) await this.queue(workspace, 'rush-coverage', `${item.module}:${item.contentId}`, item);
  }

  async hasGuestData(): Promise<boolean> {
    if (this.workspace.hasGuestProgress()) return true;
    if (typeof indexedDB === 'undefined') return false;
    return await databaseHasAny('kana-study-decks', ['card-progress', 'review-events', 'daily-state'])
      || await databaseHasAny('kana-study-rush', ['sessions', 'coverage']);
  }

  private async queue(workspace: `user:${string}`, type: Parameters<typeof makeOutboxItem>[1], key: string, payload: unknown): Promise<void> {
    const item = makeOutboxItem(workspace, type, key, payload); if (item) await this.outbox.enqueue(item);
  }
}

interface StoreSchema { readonly name: string; readonly keyPath: string | string[]; readonly indexes: readonly (readonly [string, string | string[]])[]; }
async function copyDatabase(sourceName: string, targetName: string, schemas: readonly StoreSchema[]): Promise<Record<string, any[]>> {
  const source = await openExisting(sourceName, schemas);
  const target = await openExisting(targetName, schemas);
  const copied: Record<string, any[]> = {};
  for (const schema of schemas) {
    const values = await idbRequest<any[]>(source.transaction(schema.name).objectStore(schema.name).getAll());
    copied[schema.name] = values;
    if (!values.length) continue;
    const transaction = target.transaction(schema.name, 'readwrite');
    const store = transaction.objectStore(schema.name);
    for (const value of values) store.put(value);
    await done(transaction);
  }
  source.close(); target.close();
  return copied;
}
function openExisting(name: string, schemas: readonly StoreSchema[]): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const opening = indexedDB.open(name, 1);
    opening.onerror = () => reject(opening.error);
    opening.onupgradeneeded = () => {
      const db = opening.result;
      for (const schema of schemas) if (!db.objectStoreNames.contains(schema.name)) {
        const store = db.createObjectStore(schema.name, { keyPath: schema.keyPath });
        for (const [index, path] of schema.indexes) store.createIndex(index, path);
      }
    };
    opening.onsuccess = () => resolve(opening.result);
  });
}
function idbRequest<T>(request: IDBRequest<T>): Promise<T> { return new Promise((resolve, reject) => { request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); }); }
function done(transaction: IDBTransaction): Promise<void> { return new Promise((resolve, reject) => { transaction.oncomplete = () => resolve(); transaction.onerror = () => reject(transaction.error); transaction.onabort = () => reject(transaction.error); }); }
async function databaseHasAny(name: string, stores: readonly string[]): Promise<boolean> {
  const db = await openForInspection(name);
  if (!db) return false;
  for (const store of stores) if (await idbRequest(db.transaction(store).objectStore(store).count()) > 0) { db.close(); return true; }
  db.close(); return false;
}
function openForInspection(name: string): Promise<IDBDatabase | null> {
  return new Promise(resolve => {
    const opening = indexedDB.open(name);
    let created = false;
    opening.onupgradeneeded = () => { created = true; opening.transaction?.abort(); };
    opening.onerror = () => { if (created) indexedDB.deleteDatabase(name); resolve(null); };
    opening.onsuccess = () => resolve(opening.result);
  });
}
