export type LocalWorkspaceId = 'guest' | `user:${string}`;

export interface UserProfile {
  readonly id: string;
  readonly username: string;
  readonly displayName: string;
  readonly bio: string | null;
  readonly avatarSeed: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type SyncStatus = 'guest' | 'synced' | 'syncing' | 'pending' | 'offline' | 'error';

export type SyncEntityType =
  | 'local-storage'
  | 'deck-card-progress'
  | 'deck-review-event'
  | 'deck-daily-state'
  | 'rush-session'
  | 'rush-coverage';

export interface SyncOutboxItem {
  readonly id: string;
  readonly workspace: LocalWorkspaceId;
  readonly userId: string;
  readonly entityType: SyncEntityType;
  readonly entityKey: string;
  readonly operation: 'upsert' | 'delete';
  readonly createdAt: string;
  readonly attempts: number;
  readonly payload: unknown;
  readonly version: 1;
  readonly revision: string;
}

export interface SyncMeta {
  readonly workspace: LocalWorkspaceId;
  readonly table: string;
  readonly lastPulledAt: string | null;
  readonly lastSyncedAt: string | null;
}
