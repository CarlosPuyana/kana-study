import { Injectable, signal } from '@angular/core';
import { LocalWorkspaceId } from '../models/account.model';

const ACTIVE_KEY = 'kana-study.workspace.active.v1';
const LEGACY_MARKER = 'kana-study.workspace.legacy-guest.v1';
const IMPORT_PREFIX = 'kana-study.workspace.import-decision.v1.';
const USER_PREFIX = 'kana-study.workspace.';

export const WORKSPACE_LOCAL_KEYS = [
  'kana-study.settings.v1',
  'kana-study.study-progress.v2',
  'kana-study.review-events.v1',
  'kana-study.completed-sessions.v1',
  'kana-study.medal-unlocks.v1',
  'kana-study.flags-progress.v1',
  'kana-study.flags-review-events.v1',
  'kana-study.flags-selection.v1',
  'kana-study.kanji-progress.v1',
  'kana-study.kanji-review-events.v1',
  'kana-study.kanji-selection.v1',
  'kana-study.vocabulary-progress.v1',
  'kana-study.vocabulary-review-events.v1',
  'kana-study.vocabulary-selection.v1',
  'kana-study.deck-settings.v1',
  'kana-study.rush.kana-settings.v1',
  'kana-study.rush.kanji-settings.v1',
  'kana-study.rush.vocabulary-settings.v1',
  'kana-study.rush.medal-unlocks.v1',
] as const;

@Injectable({ providedIn: 'root' })
export class WorkspaceService {
  private readonly state = signal<LocalWorkspaceId>(readActiveWorkspace());
  readonly active = this.state.asReadonly();

  constructor() {
    // Existing unscoped data is the canonical Guest workspace. Keeping it in place
    // makes the migration atomic, reversible and idempotent.
    try { if (!localStorage.getItem(LEGACY_MARKER)) localStorage.setItem(LEGACY_MARKER, 'mapped'); } catch { /* local mode still works */ }
  }

  activate(workspace: LocalWorkspaceId): boolean {
    if (workspace === this.state()) return false;
    this.state.set(workspace);
    try { localStorage.setItem(ACTIVE_KEY, workspace); } catch { /* memory-only fallback */ }
    return true;
  }

  activateGuest(): boolean { return this.activate('guest'); }
  activateUser(userId: string): boolean { return this.activate(`user:${userId}`); }
  userId(): string | null { return this.state().startsWith('user:') ? this.state().slice(5) : null; }

  storageKey(key: string, workspace = this.state()): string {
    return workspace === 'guest' ? key : `${USER_PREFIX}${workspace.slice(5)}.${key}`;
  }

  databaseName(base: string, workspace = this.state()): string {
    return workspace === 'guest' ? base : `${base}--${workspace.slice(5).replace(/[^a-z0-9-]/gi, '_')}`;
  }

  hasGuestProgress(): boolean {
    const meaningful = WORKSPACE_LOCAL_KEYS.filter(key => !key.includes('settings') && !key.includes('selection'));
    try { return meaningful.some(key => hasMeaningfulValue(localStorage.getItem(key))); } catch { return false; }
  }

  importDecision(userId: string): 'merge' | 'account' | null {
    try {
      const value = localStorage.getItem(`${IMPORT_PREFIX}${userId}`);
      return value === 'merge' || value === 'account' ? value : null;
    } catch { return null; }
  }

  markImportDecision(userId: string, decision: 'merge' | 'account'): void {
    try { localStorage.setItem(`${IMPORT_PREFIX}${userId}`, decision); } catch { /* no-op */ }
  }

  copyGuestLocalStorageToUser(userId: string): void {
    for (const key of WORKSPACE_LOCAL_KEYS) {
      try {
        const source = localStorage.getItem(key);
        const target = this.storageKey(key, `user:${userId}`);
        if (source !== null && localStorage.getItem(target) === null) localStorage.setItem(target, source);
      } catch { /* preserve Guest data if storage is unavailable/full */ }
    }
  }
}

function readActiveWorkspace(): LocalWorkspaceId {
  try {
    const value = localStorage.getItem(ACTIVE_KEY);
    return value === 'guest' || value?.startsWith('user:') ? value as LocalWorkspaceId : 'guest';
  } catch { return 'guest'; }
}

function hasMeaningfulValue(raw: string | null): boolean {
  if (!raw) return false;
  try {
    const value = JSON.parse(raw) as unknown;
    return Array.isArray(value) ? value.length > 0 : typeof value === 'object' && value !== null && Object.keys(value).length > 0;
  } catch { return false; }
}
