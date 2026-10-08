import { computed, inject, Injectable, signal } from '@angular/core';
import { MangaReviewEvent, MANGA_REVIEW_EVENTS_KEY } from '../models/manga-review.model';
import { StorageService } from './storage.service';
import { WorkspaceService } from './workspace.service';
import { makeOutboxItem, SyncOutboxService } from './sync-outbox.service';
import { CompletedSessionSummary } from '../models/learning-session.model';

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
  /** Recover a local commit whose outbox enqueue was interrupted or failed.
   * Immutable IDs make this conservative replay safe; never clear offline data. */
  async recover(): Promise<void> {
    const workspace = this.workspace.active();
    if (workspace === 'guest') return;
    const sessions = this.storage.get<CompletedSessionSummary[]>('kana-study.completed-sessions.v1', []);
    const events = this.events();
    if (!events.length && !sessions.some(session => session.module === 'manga')) return;
    const queued = await this.outbox.pending(workspace);
    if (workspace !== this.workspace.active()) throw new Error('Workspace changed');
    for (const [key, values] of [[MANGA_REVIEW_EVENTS_KEY, this.events()], ['kana-study.completed-sessions.v1', sessions.filter(s => s.module === 'manga')]] as const) {
      if (!values.length || queued.some(item => item.entityType === 'local-storage' && item.entityKey === key)) continue;
      // Upload the full session list if replay is needed, preserving other modules.
      const item = makeOutboxItem(workspace, 'local-storage', key, key === MANGA_REVIEW_EVENTS_KEY ? values : sessions);
      if (item) await this.outbox.enqueue(item);
    }
  }
}
