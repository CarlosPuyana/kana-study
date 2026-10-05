import { Injectable, inject, signal } from '@angular/core';
import { CompletedSessionSummary } from '../models/learning-session.model';
import { StorageService } from './storage.service';

const COMPLETED_SESSIONS_KEY = 'kana-study.completed-sessions.v1';
function readSessions(storage:StorageService):readonly CompletedSessionSummary[] {
  const stored=storage.get<unknown>(COMPLETED_SESSIONS_KEY,[]);
  return Array.isArray(stored)?stored.filter((item):item is CompletedSessionSummary=>!!item&&typeof item==='object')
    .map(item=>({...item,module:item.module??'kana'})):[];
}

@Injectable({ providedIn: 'root' })
export class SessionHistoryService {
  private readonly storage = inject(StorageService);
  private readonly state = signal<readonly CompletedSessionSummary[]>(
    readSessions(this.storage),
  );
  readonly sessions = this.state.asReadonly();

  record(summary: CompletedSessionSummary): void {
    if (this.state().some(item => item.sessionId === summary.sessionId)) return;
    this.state.update(items => [...items, summary]);
    this.storage.set(COMPLETED_SESSIONS_KEY, this.state());
  }

  mergeFromCloud(summaries: readonly CompletedSessionSummary[]): void {
    const merged = new Map(this.state().map(item => [item.sessionId, item]));
    for (const summary of summaries) if (!merged.has(summary.sessionId)) merged.set(summary.sessionId, summary);
    this.state.set([...merged.values()]);
  }

  reset(): void {
    this.state.set([]);
    this.storage.remove(COMPLETED_SESSIONS_KEY);
  }
}
