import { computed, inject, Injectable, signal } from '@angular/core';
import { MangaReviewEvent, MANGA_REVIEW_EVENTS_KEY } from '../models/manga-review.model';
import { StorageService } from './storage.service';
import { WorkspaceService } from './workspace.service';
import { makeOutboxItem, SyncOutboxService } from './sync-outbox.service';
import { CompletedSessionSummary } from '../models/learning-session.model';
import { LocalWorkspaceId } from '../models/account.model';

export interface MangaReviewConfirmed {
  readonly workspace: LocalWorkspaceId;
  readonly eventIds: ReadonlySet<string>;
  readonly sessionIds: ReadonlySet<string>;
}

/** Immutable attempts are separate from saved words. Time lives only in sessions. */
@Injectable({providedIn: 'root'})
export class MangaReviewHistoryService {
  private readonly storage = inject(StorageService);
  private readonly workspace = inject(WorkspaceService);
  private readonly outbox = inject(SyncOutboxService);
  private readonly revision = signal(0);
  readonly events = computed(() => {
    this.workspace.active(); this.workspace.dataRevision(); this.storage.cloudRevision(); this.revision();
    return this.storage.get<readonly MangaReviewEvent[]>(MANGA_REVIEW_EVENTS_KEY, []);
  });
  async record(event: MangaReviewEvent, workspace = this.workspace.active()): Promise<void> {
    if (workspace !== this.workspace.active()) throw new Error('Workspace changed');
    const existing = this.events();
    const events = existing.some(item => item.id === event.id) ? existing : [...existing, event];
    this.storage.set(MANGA_REVIEW_EVENTS_KEY, events, {strict: true, localOnly: true});
    this.revision.update(value => value + 1);
    const item = makeOutboxItem(workspace, 'local-storage', MANGA_REVIEW_EVENTS_KEY, events);
    if (item) await this.outbox.enqueue(item);
  }
  /** A full pull proves which immutable IDs already exist remotely. Recover only
   * absent IDs after ACK cleanup; downloaded history is never new local work. */
  async recover(confirmed: MangaReviewConfirmed): Promise<void> {
    const workspace = confirmed.workspace;
    if (workspace !== this.workspace.active()) throw new Error('Workspace changed');
    if (workspace === 'guest') return;
    for (const key of [MANGA_REVIEW_EVENTS_KEY, 'kana-study.completed-sessions.v1']) {
      const queued = await this.outbox.pending(workspace);
      if (workspace !== this.workspace.active()) throw new Error('Workspace changed');
      // Preserve any newer category revision. Still-absent interrupted writes
      // will be recovered after that pending operation is acknowledged.
      if (queued.some(item => item.entityType === 'local-storage' && item.entityKey === key)) continue;
      const missing = key === MANGA_REVIEW_EVENTS_KEY
        ? this.events().filter(event => !confirmed.eventIds.has(event.id))
        : this.storage.get<CompletedSessionSummary[]>(key, []).filter(session => session.module === 'manga' && !confirmed.sessionIds.has(session.sessionId));
      if (!missing.length) continue;
      const item = makeOutboxItem(workspace, 'local-storage', key, missing);
      // Atomic absence check protects writes arriving while IndexedDB opens.
      if (item) await this.outbox.enqueueIfAbsent(item);
    }
  }
}
