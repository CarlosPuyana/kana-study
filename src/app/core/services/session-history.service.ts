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

  reset(): void {
    this.state.set([]);
    this.storage.remove(COMPLETED_SESSIONS_KEY);
  }
}
