import { inject, Injectable, signal } from '@angular/core';
import { makeOutboxItem, SyncOutboxService } from './sync-outbox.service';
import { WorkspaceService } from './workspace.service';

@Injectable({ providedIn: 'root' })
export class StorageService {
  readonly cloudRevision = signal(0);
  readonly persistenceFailed = signal(false);
  dismissPersistenceError(): void { this.persistenceFailed.set(false); }
  private readonly workspace = inject(WorkspaceService);
  private readonly outbox = inject(SyncOutboxService);

  get<T>(key: string, fallback: T): T {
    try {
      const value = localStorage.getItem(this.workspace.storageKey(key));
      return value === null ? fallback : (JSON.parse(value) as T);
    } catch {
      return fallback;
    }
  }

  set<T>(key: string, value: T, options: {localOnly?: boolean; silent?: boolean} = {}): void {
    try {
      localStorage.setItem(this.workspace.storageKey(key), JSON.stringify(value));
      if (!options.localOnly) this.enqueue(key, value, 'upsert');
    } catch {
      if (!options.silent) this.persistenceFailed.set(true);
    }
  }

  remove(key: string): void {
    try {
      localStorage.removeItem(this.workspace.storageKey(key));
      this.enqueue(key, null, 'delete');
    } catch {
      this.persistenceFailed.set(true);
    }
  }

  setFromCloud<T>(key: string, value: T): void {
    try { localStorage.setItem(this.workspace.storageKey(key), JSON.stringify(value)); } catch { /* local mode remains usable */ }
    this.cloudRevision.update(value => value + 1);
  }

  rawKey(key: string): string { return this.workspace.storageKey(key); }

  private enqueue(key: string, value: unknown, operation: 'upsert' | 'delete'): void {
    const item = makeOutboxItem(this.workspace.active(), 'local-storage', key, value, operation);
    if (item) void this.outbox.enqueue(item).catch(() => undefined);
  }
}
