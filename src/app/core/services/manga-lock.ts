import { LocalWorkspaceId } from '../models/account.model';
export function withMangaLock<T>(workspace: LocalWorkspaceId, operation: () => Promise<T>): Promise<T> {
  return navigator.locks?.request ? navigator.locks.request(`kana-study-manga-import:${workspace}`, operation) : operation();
}
