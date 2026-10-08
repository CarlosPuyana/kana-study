import { DestroyRef, inject, Injectable } from '@angular/core';
import { LocalWorkspaceId, SyncMeta, SyncOutboxItem } from '../models/account.model';

const DB_NAME = 'kana-study-sync';
const DB_VERSION = 1;
const OUTBOX = 'outbox';
const SYNC_META = 'sync-meta';
const WORKSPACE_META = 'workspace-meta';

@Injectable({ providedIn: 'root' })
export class SyncOutboxService {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private readonly memory = new Map<string, SyncOutboxItem>();
  private readonly writes = new Set<Promise<void>>();
  private readonly metadata = new Map<string, SyncMeta>();

  constructor() { inject(DestroyRef).onDestroy(() => { void this.dbPromise?.then(db => db.close()).catch(() => undefined); }); }

  enqueue(item: SyncOutboxItem): Promise<void> {
    const write = this.persist(item);
    this.writes.add(write);
    void write.finally(() => this.writes.delete(write)).catch(() => undefined);
    return write;
  }

  private async persist(item: SyncOutboxItem): Promise<void> {
    if (!hasIndexedDb()) this.memory.set(item.id, item);
    else {
      const db = await this.database();
      const transaction = db.transaction(OUTBOX, 'readwrite');
      transaction.objectStore(OUTBOX).put(item);
      await transactionDone(transaction);
    }
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('kana-study:sync-pending'));
  }

  /** Recovery may add missing work, but cannot overwrite a concurrent revision. */
  enqueueIfAbsent(item: SyncOutboxItem): Promise<boolean> {
    const operation = this.persistIfAbsent(item);
    const write = operation.then(() => undefined);
    this.writes.add(write);
    void write.finally(() => this.writes.delete(write)).catch(() => undefined);
    return operation;
  }

  private async persistIfAbsent(item: SyncOutboxItem): Promise<boolean> {
    if (!hasIndexedDb()) {
      if (this.memory.has(item.id)) return false;
      this.memory.set(item.id, item);
    } else {
      const db = await this.database(), transaction = db.transaction(OUTBOX, 'readwrite');
      const done = transactionDone(transaction);
      void done.catch(() => undefined);
      const store = transaction.objectStore(OUTBOX);
      const existing = await request<SyncOutboxItem | undefined>(store.get(item.id));
      if (!existing) store.put(item);
      await done;
      if (existing) return false;
    }
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('kana-study:sync-pending'));
    return true;
  }

  async pending(workspace: LocalWorkspaceId): Promise<SyncOutboxItem[]> {
    while (this.writes.size) await Promise.all([...this.writes]);
    if (!hasIndexedDb()) return [...this.memory.values()].filter(item => item.workspace === workspace);
    const db = await this.database();
    return request(db.transaction(OUTBOX).objectStore(OUTBOX).index('workspace').getAll(workspace));
  }

  async remove(ids: readonly string[]): Promise<void> {
    if (!hasIndexedDb()) { for (const id of ids) this.memory.delete(id); return; }
    const db = await this.database();
    const transaction = db.transaction(OUTBOX, 'readwrite');
    for (const id of ids) transaction.objectStore(OUTBOX).delete(id);
    await transactionDone(transaction);
  }

  async removeProcessed(items: readonly SyncOutboxItem[]): Promise<void> {
    if (!hasIndexedDb()) {
      for (const item of items) if (this.memory.get(item.id)?.revision === item.revision) this.memory.delete(item.id);
      return;
    }
    const db = await this.database();
    const transaction = db.transaction(OUTBOX, 'readwrite');
    const store = transaction.objectStore(OUTBOX);
    for (const item of items) {
      const current = await request<SyncOutboxItem | undefined>(store.get(item.id));
      if (current?.revision === item.revision) store.delete(item.id);
    }
    await transactionDone(transaction);
  }

  async markAttempt(items: readonly SyncOutboxItem[]): Promise<void> {
    if (!hasIndexedDb()) {
      for (const item of items) if (this.memory.get(item.id)?.revision === item.revision) this.memory.set(item.id, {...item, attempts: item.attempts + 1});
      return;
    }
    const db = await this.database();
    const transaction = db.transaction(OUTBOX, 'readwrite'), store = transaction.objectStore(OUTBOX);
    for (const item of items) {
      const current = await request<SyncOutboxItem | undefined>(store.get(item.id));
      if (current?.revision === item.revision) store.put({...current, attempts: current.attempts + 1});
    }
    await transactionDone(transaction);
  }

  async count(workspace: LocalWorkspaceId): Promise<number> {
    return (await this.pending(workspace)).length;
  }

  async getMeta(workspace: LocalWorkspaceId, table: string): Promise<SyncMeta | null> {
    if (!hasIndexedDb()) return this.metadata.get(`${workspace}:${table}`) ?? null;
    const db = await this.database();
    return (await request<SyncMeta | undefined>(db.transaction(SYNC_META).objectStore(SYNC_META).get([workspace, table]))) ?? null;
  }

  async putMeta(meta: SyncMeta): Promise<void> {
    if (!hasIndexedDb()) { this.metadata.set(`${meta.workspace}:${meta.table}`, meta); return; }
    const db = await this.database();
    const transaction = db.transaction(SYNC_META, 'readwrite');
    transaction.objectStore(SYNC_META).put(meta); await transactionDone(transaction);
  }

  async markLegacyGuestMapped(): Promise<void> {
    if (!hasIndexedDb()) return;
    const db = await this.database();
    await request(db.transaction(WORKSPACE_META, 'readwrite').objectStore(WORKSPACE_META).put({
      workspace: 'guest', legacyMapped: true, migratedAt: new Date().toISOString(), version: 1,
    }));
  }

  private database(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;
    this.dbPromise = new Promise((resolve, reject) => {
      const opening = indexedDB.open(DB_NAME, DB_VERSION);
      opening.onerror = () => reject(opening.error ?? new Error('Unable to open sync storage'));
      opening.onblocked = () => reject(new Error('Sync storage upgrade is blocked'));
      opening.onupgradeneeded = () => {
        const db = opening.result;
        if (!db.objectStoreNames.contains(OUTBOX)) {
          const store = db.createObjectStore(OUTBOX, { keyPath: 'id' });
          store.createIndex('workspace', 'workspace');
          store.createIndex('createdAt', 'createdAt');
        }
        if (!db.objectStoreNames.contains(SYNC_META)) db.createObjectStore(SYNC_META, { keyPath: ['workspace', 'table'] });
        if (!db.objectStoreNames.contains(WORKSPACE_META)) db.createObjectStore(WORKSPACE_META, { keyPath: 'workspace' });
      };
      opening.onsuccess = () => resolve(opening.result);
    });
    return this.dbPromise;
  }
}

export function makeOutboxItem(
  workspace: LocalWorkspaceId,
  entityType: SyncOutboxItem['entityType'],
  entityKey: string,
  payload: unknown,
  operation: SyncOutboxItem['operation'] = 'upsert',
): SyncOutboxItem | null {
  if (!workspace.startsWith('user:')) return null;
  const userId = workspace.slice(5);
  return {
    id: `${workspace}:${entityType}:${entityKey}`,
    workspace, userId, entityType, entityKey, operation,
    createdAt: new Date().toISOString(), attempts: 0, payload, version: 1,
    revision: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
  };
}

function hasIndexedDb(): boolean { return typeof indexedDB !== 'undefined'; }
function request<T>(value: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    value.onsuccess = () => resolve(value.result);
    value.onerror = () => reject(value.error ?? new Error('IndexedDB request failed'));
  });
}
function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed'));
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction aborted'));
  });
}
