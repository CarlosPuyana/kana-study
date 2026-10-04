import { MedalUnlock } from '../models/medal.model';
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
  for (const [key, value] of Object.entries(local)) {
    const other = result[key];
    if (!other || value.lastSeenAt >= other.lastSeenAt) result[key] = value;
  }
  return result;
}

export function mergeIntroducedIds(local: readonly string[], remote: readonly string[]): string[] {
  return [...new Set([...remote, ...local])];
}

export function lastWriteWins<T>(local: T, localUpdatedAt: string, remote: T, remoteUpdatedAt: string): T {
  return localUpdatedAt >= remoteUpdatedAt ? local : remote;
}
