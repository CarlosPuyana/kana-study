import { mergeRushSession } from './sync-merge';
import { LocalWorkspaceId } from '../models/account.model';
import { DestroyRef, inject, Injectable } from '@angular/core';
import { RushAggregateStats, RushCoverage, RushSession } from '../models/rush.model';
import { makeOutboxItem, SyncOutboxService } from './sync-outbox.service';
import { WorkspaceService } from './workspace.service';

const DB_NAME = 'kana-study-rush';
const DB_VERSION = 1;
const SESSIONS = 'sessions';
const COVERAGE = 'coverage';

export abstract class RushRepository {
  abstract markOpenSessionsInterrupted(): Promise<void>;
  abstract createSession(session: RushSession): Promise<void>;
  abstract saveProgress(session: RushSession, contentId?: string): Promise<void>;
  abstract finishSession(session: RushSession): Promise<void>;
  abstract discardSession(id: string): Promise<void>;
  abstract getStats(): Promise<RushAggregateStats>;
}

@Injectable({ providedIn: 'root' })
export class LocalRushRepository extends RushRepository {
  private readonly workspace = inject(WorkspaceService);
  private readonly outbox = inject(SyncOutboxService);
  private readonly databases = new Map<string, Promise<IDBDatabase>>();

  constructor() { super(); inject(DestroyRef).onDestroy(() => { for (const db of this.databases.values()) void db.then(value => value.close()).catch(() => undefined); }); }

  async markOpenSessionsInterrupted(): Promise<void> {
    const db = await this.open();
    const sessions = await asPromise<RushSession[]>(db.transaction(SESSIONS).objectStore(SESSIONS).getAll());
    const open = sessions.filter(session => session.endedAt === null && !session.interrupted);
    if (!open.length) return;
    const transaction = db.transaction(SESSIONS, 'readwrite');
    for (const session of open) transaction.objectStore(SESSIONS).put({ ...session, interrupted: true });
    await transactionDone(transaction);
  }

  async createSession(session: RushSession): Promise<void> {
    const workspace = this.workspace.active();
    const db = await this.open(workspace);
    const transaction = db.transaction(SESSIONS, 'readwrite');
    transaction.objectStore(SESSIONS).add(session); await transactionDone(transaction);
    await this.enqueue(workspace, 'rush-session', session.id, session);
  }

  async saveProgress(session: RushSession, contentId?: string): Promise<void> {
    const workspace = this.workspace.active();
    const db = await this.open(workspace);
    const transaction = db.transaction([SESSIONS, COVERAGE], 'readwrite');
    transaction.objectStore(SESSIONS).put(session);
    if (contentId) {
      const coverage: RushCoverage = { module: session.module, contentId, firstSeenAt: Date.now() };
      const store = transaction.objectStore(COVERAGE);
      const existing = await asPromise<RushCoverage | undefined>(store.get([session.module, contentId]));
      if (!existing) store.add(coverage);
    }
    await transactionDone(transaction);
    await this.enqueue(workspace, 'rush-session', session.id, session);
    if (contentId) await this.enqueue(workspace, 'rush-coverage', `${session.module}:${contentId}`, {
      module: session.module, contentId, firstSeenAt: Date.now(),
    });
  }

  finishSession(session: RushSession): Promise<void> { return this.saveProgress(session); }

  async discardSession(id: string): Promise<void> {
    const workspace = this.workspace.active();
    const db = await this.open(workspace);
    const transaction = db.transaction(SESSIONS, 'readwrite');
    transaction.objectStore(SESSIONS).delete(id); await transactionDone(transaction);
    await this.enqueue(workspace, 'rush-session', id, null, 'delete');
  }

  async getStats(): Promise<RushAggregateStats> {
    const db = await this.open();
    const transaction = db.transaction([SESSIONS, COVERAGE]);
    const [sessions, coverage] = await Promise.all([
      asPromise<RushSession[]>(transaction.objectStore(SESSIONS).getAll()),
      asPromise<RushCoverage[]>(transaction.objectStore(COVERAGE).getAll()),
    ]);
    return { sessions, coverage };
  }

  async mergeFromCloud(input: RushAggregateStats): Promise<void> {
    const db = await this.open();
    const transaction = db.transaction([SESSIONS, COVERAGE], 'readwrite');
    const sessionStore = transaction.objectStore(SESSIONS);
    for (const session of input.sessions) {
      const local = await asPromise<RushSession | undefined>(sessionStore.get(session.id));
      sessionStore.put(mergeRushSession(local, session));
    }
    const coverageStore = transaction.objectStore(COVERAGE);
    for (const remote of input.coverage) {
      const local = await asPromise<RushCoverage | undefined>(coverageStore.get([remote.module, remote.contentId]));
      coverageStore.put(!local || remote.firstSeenAt < local.firstSeenAt ? remote : local);
    }
    await transactionDone(transaction);
  }

  private open(workspace = this.workspace.active()): Promise<IDBDatabase> {
    const name = this.workspace.databaseName(DB_NAME, workspace);
    const current = this.databases.get(name);
    if (current) return current;
    const database = new Promise<IDBDatabase>((resolve, reject) => {
      const open = indexedDB.open(name, DB_VERSION);
      open.onerror = () => reject(open.error ?? new Error('Unable to open RUSH storage'));
      open.onsuccess = () => resolve(open.result);
      open.onupgradeneeded = () => {
        const db = open.result;
        const sessions = db.createObjectStore(SESSIONS, { keyPath: 'id' });
        sessions.createIndex('module', 'module');
        sessions.createIndex('startedAt', 'startedAt');
        sessions.createIndex('localDay', 'localDay');
        const coverage = db.createObjectStore(COVERAGE, { keyPath: ['module', 'contentId'] });
        coverage.createIndex('module', 'module');
      };
    });
    this.databases.set(name, database);
    return database;
  }

  private async enqueue(workspace: LocalWorkspaceId, type: 'rush-session' | 'rush-coverage', key: string, payload: unknown, operation: 'upsert' | 'delete' = 'upsert'): Promise<void> {
    const item = makeOutboxItem(workspace, type, key, payload, operation);
    if (item) await this.outbox.enqueue(item);
  }
}

function asPromise<T = undefined>(value: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    value.onsuccess = () => resolve(value.result);
    value.onerror = () => reject(value.error ?? new Error('RUSH storage request failed'));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('RUSH storage transaction failed'));
    transaction.onabort = () => reject(transaction.error ?? new Error('RUSH storage transaction aborted'));
  });
}
