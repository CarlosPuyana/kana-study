import { computed, Injectable, inject, signal } from '@angular/core';
import { CompletedSessionSummary } from '../models/learning-session.model';
import { StorageService } from './storage.service';
import { WorkspaceService } from './workspace.service';

const COMPLETED_SESSIONS_KEY = 'kana-study.completed-sessions.v1';
function readSessions(storage:StorageService):readonly CompletedSessionSummary[] {
  const stored=storage.get<unknown>(COMPLETED_SESSIONS_KEY,[]);
  return Array.isArray(stored)?stored.filter((item):item is CompletedSessionSummary=>!!item&&typeof item==='object')
    .map(item=>({...item,module:item.module??'kana'})):[];
}

@Injectable({ providedIn: 'root' })
export class SessionHistoryService {
  private readonly storage = inject(StorageService);
  private readonly workspace = inject(WorkspaceService);
  private readonly revision = signal(0);
  readonly sessions = computed(() => {
    this.workspace.active(); this.workspace.dataRevision(); this.storage.cloudRevision(); this.revision();
    return readSessions(this.storage);
  });

  record(summary: CompletedSessionSummary, options: {strict?: boolean} = {}): void {
    if (this.sessions().some(item => item.sessionId === summary.sessionId)) return;
    this.storage.set(COMPLETED_SESSIONS_KEY, [...this.sessions(), summary], options);
    this.revision.update(value => value + 1);
  }

  mergeFromCloud(summaries: readonly CompletedSessionSummary[]): void {
    const merged = new Map(this.sessions().map(item => [item.sessionId, item]));
    for (const summary of summaries) if (!merged.has(summary.sessionId)) merged.set(summary.sessionId, summary);
    this.storage.setFromCloud(COMPLETED_SESSIONS_KEY, [...merged.values()]);
  }

  reset(): void {
    this.storage.remove(COMPLETED_SESSIONS_KEY);
    this.revision.update(value => value + 1);
  }
}
