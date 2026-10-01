import { Injectable, inject, signal } from '@angular/core';
import { CompletedSessionSummary } from '../models/learning-session.model';
import { StorageService } from './storage.service';

const COMPLETED_SESSIONS_KEY = 'kana-study.completed-sessions.v1';

@Injectable({ providedIn: 'root' })
export class SessionHistoryService {
  private readonly storage = inject(StorageService);
  private readonly state = signal<readonly CompletedSessionSummary[]>(
    this.storage.get<readonly CompletedSessionSummary[]>(COMPLETED_SESSIONS_KEY, [])
      .map(item => ({ ...item, module: item.module ?? 'kana' })),
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
