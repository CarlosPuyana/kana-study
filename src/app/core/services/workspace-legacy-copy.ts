import type {Injector} from '@angular/core';
import type {WorkspaceService} from './workspace.service';
import {makeOutboxItem,SyncOutboxService} from './sync-outbox.service';
import {AttemptEventRepository} from './attempt-event.repository';
import {MangaStudySavedRepository} from './manga-study-saved.repository';

/** Existing legacy copy policy, loaded only for an explicit merge. No custom store is copied. */
export async function copyGuestToUser(userId:string,workspaces:WorkspaceService,injector:Injector){
 const outbox=injector.get(SyncOutboxService),attempts=injector.get(AttemptEventRepository),manga=injector.get(MangaStudySavedRepository);
 const queue=async(workspace:`user:${string}`,type:Parameters<typeof makeOutboxItem>[1],key:string,payload:unknown)=>{const item=makeOutboxItem(workspace,type,key,payload);if(item)await outbox.enqueue(item);};

    workspaces.copyGuestLocalStorageToUser(userId);
    if (typeof indexedDB === 'undefined') return;
    const deck = await copyDatabase('kana-study-decks', workspaces.databaseName('kana-study-decks', `user:${userId}`), [
      { name: 'card-progress', keyPath: ['deckId', 'entryId'], indexes: [['deckId', 'deckId'], ['due', 'due'], ['state', 'state']] },
      { name: 'review-events', keyPath: 'id', indexes: [['deckId', 'deckId'], ['entryId', 'entryId'], ['reviewedAt', 'reviewedAt'], ['deckId-reviewedAt', ['deckId', 'reviewedAt']]] },
      { name: 'daily-state', keyPath: ['deckId', 'localDate'], indexes: [] },
    ]);
    const rush = await copyDatabase('kana-study-rush', workspaces.databaseName('kana-study-rush', `user:${userId}`), [
      { name: 'sessions', keyPath: 'id', indexes: [['module', 'module'], ['startedAt', 'startedAt'], ['localDay', 'localDay']] },
      { name: 'coverage', keyPath: ['module', 'contentId'], indexes: [['module', 'module']] },
    ]);
    await attempts.copyGuestToUser(userId);
    const workspace = `user:${userId}` as const;
    for(const item of await manga.list('guest'))await manga.save(item,workspace,'import');
    for (const item of deck['card-progress'] ?? []) await queue(workspace, 'deck-card-progress', `${item.deckId}:${item.entryId}`, item);
    for (const item of deck['review-events'] ?? []) await queue(workspace, 'deck-review-event', item.id, item);
    for (const item of deck['daily-state'] ?? []) await queue(workspace, 'deck-daily-state', `${item.deckId}:${item.localDate}`, item);
    for (const item of rush['sessions'] ?? []) await queue(workspace, 'rush-session', item.id, item);
    for (const item of rush['coverage'] ?? []) await queue(workspace, 'rush-coverage', `${item.module}:${item.contentId}`, item);
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
