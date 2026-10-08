import { MedalUnlock } from '../models/medal.model';
import { RushSession } from '../models/rush.model';
export { mergeGrammarProgress } from './grammar-progress-state';

export function unionById<T>(local: readonly T[], remote: readonly T[], id: (item: T) => string): T[] {
  const merged = new Map<string, T>();
  for (const item of [...remote, ...local]) merged.set(id(item), item);
  return [...merged.values()];
}

export function mergeMedalUnlocks(local: readonly MedalUnlock[], remote: readonly MedalUnlock[]): MedalUnlock[] {
  const merged = new Map<string, MedalUnlock>();
  for (const item of [...local, ...remote]) {
    if (!item || typeof item.medalId !== 'string' || !item.medalId || !Number.isFinite(Date.parse(item.unlockedAt))) continue;
    const current = merged.get(item.medalId);
    if (!current || Date.parse(item.unlockedAt) < Date.parse(current.unlockedAt)) merged.set(item.medalId, item);
  }
  return [...merged.values()];
}

export function mergeCoverage<T extends { readonly contentId: string; readonly firstSeenAt: number }>(
  local: readonly T[], remote: readonly T[],
): T[] {
  const merged = new Map<string, T>();
  for (const item of [...local, ...remote]) {
    const current = merged.get(item.contentId);
    if (!current || item.firstSeenAt < current.firstSeenAt) merged.set(item.contentId, item);
  }
  return [...merged.values()];
}

export function mergeProgressSnapshots<T extends { readonly lastSeenAt: string }>(
  local: Record<string, T>, remote: Record<string, T>,
): Record<string, T> {
  const result = { ...remote };
  const reviewedAt = (progress: T): number => {
    const fsrs = (progress as T & {fsrs?: {lastReview?: string | null}}).fsrs;
    return Date.parse(fsrs?.lastReview ?? progress.lastSeenAt) || 0;
  };
  for (const [key, value] of Object.entries(local)) {
    const other = result[key];
    if (!other) { result[key] = value; continue; }
    const merged = {...(reviewedAt(value) > reviewedAt(other) ? value : other)};
    // Practice activity is independent of scheduling. Snapshot counters use max,
    // while review events are unioned separately by ID; retries never add time/counts.
    for (const field of ['totalAttempts', 'totalFirstTrySuccesses', 'totalFailures'] as const) {
      const a = (value as Record<string, unknown>)[field], b = (other as Record<string, unknown>)[field];
      if (typeof a === 'number' && typeof b === 'number') (merged as Record<string, unknown>)[field] = Math.max(a,b);
    }
    result[key] = merged;
  }
  return result;
}

export function mergeIntroducedIds(local: readonly string[], remote: readonly string[]): string[] {
  return [...new Set([...remote, ...local])];
}

export function lastWriteWins<T>(local: T, localUpdatedAt: string, remote: T, remoteUpdatedAt: string): T {
  return localUpdatedAt >= remoteUpdatedAt ? local : remote;
}

/** Same stable session ID: counters are snapshots, never additive. */
export function mergeRushSession(local: RushSession | undefined, remote: RushSession): RushSession {
  if (!local) return remote;
  const newest = (local.endedAt ?? 0) > (remote.endedAt ?? 0) ? local : remote;
  return {...newest, endedAt: Math.max(local.endedAt ?? 0, remote.endedAt ?? 0) || null,
    activeSeconds: Math.max(local.activeSeconds || 0, remote.activeSeconds || 0),
    cardsCompleted: Math.max(local.cardsCompleted || 0, remote.cardsCompleted || 0),
    uniqueContentsSeen: Math.max(local.uniqueContentsSeen || 0, remote.uniqueContentsSeen || 0),
    cyclesCompleted: Math.max(local.cyclesCompleted || 0, remote.cyclesCompleted || 0)};
}
