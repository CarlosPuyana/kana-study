import { Injectable } from '@angular/core';
import { RushAggregateStats, RushCoverage, RushSession } from '../models/rush.model';

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
  private database: Promise<IDBDatabase> | null = null;

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
    const db = await this.open();
    await asPromise(db.transaction(SESSIONS, 'readwrite').objectStore(SESSIONS).add(session));
  }

  async saveProgress(session: RushSession, contentId?: string): Promise<void> {
    const db = await this.open();
    const transaction = db.transaction([SESSIONS, COVERAGE], 'readwrite');
    transaction.objectStore(SESSIONS).put(session);
    if (contentId) {
      const coverage: RushCoverage = { module: session.module, contentId, firstSeenAt: Date.now() };
      const store = transaction.objectStore(COVERAGE);
      const existing = await asPromise<RushCoverage | undefined>(store.get([session.module, contentId]));
      if (!existing) store.add(coverage);
    }
    await transactionDone(transaction);
  }

  finishSession(session: RushSession): Promise<void> { return this.saveProgress(session); }

  async discardSession(id: string): Promise<void> {
    const db = await this.open();
    await asPromise(db.transaction(SESSIONS, 'readwrite').objectStore(SESSIONS).delete(id));
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

  private open(): Promise<IDBDatabase> {
    if (this.database) return this.database;
    this.database = new Promise((resolve, reject) => {
      const open = indexedDB.open(DB_NAME, DB_VERSION);
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
    return this.database;
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
