import { inject, Injectable, signal } from '@angular/core';
import { LeaderboardEntry } from '../models/leaderboard.model';
import { SupabaseClientService } from './supabase-client.service';

export function mapLeaderboard(value: unknown): LeaderboardEntry[] {
  if (!Array.isArray(value)) throw new Error('Invalid leaderboard');
  const number = (value: unknown): number | null => {
    if (typeof value !== 'number' && (typeof value !== 'string' || !/^\d+$/u.test(value))) return null;
    const result = Number(value);
    return Number.isSafeInteger(result) && result >= 0 ? result : null;
  };
  return value.flatMap((item: unknown) => {
    if (!item || typeof item !== 'object') return [];
    const row = item as Record<string, unknown>;
    const position = number(row['position']), studySeconds = number(row['study_seconds']), medalCount = number(row['medal_count']);
    if (position === null || position < 1 || studySeconds === null || medalCount === null
      || typeof row['username'] !== 'string' || !/^[A-Za-z0-9_-]{3,24}$/u.test(row['username'])
      || typeof row['display_name'] !== 'string' || !row['display_name'].trim() || row['display_name'].length > 80
      || typeof row['is_current_user'] !== 'boolean') return [];
    return [{ position, username: row['username'], displayName: row['display_name'], studySeconds, medalCount, isCurrentUser: row['is_current_user'] }];
  });
}

@Injectable({providedIn: 'root'})
export class LeaderboardService {
  private readonly supabase = inject(SupabaseClientService);
  readonly entries = signal<readonly LeaderboardEntry[]>([]);
  readonly status = signal<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  private pending: Promise<void> | null = null;
  load(force = false): Promise<void> {
    if (this.pending) return this.pending;
    if (!force && this.status() === 'loaded') return Promise.resolve();
    this.status.set('loading');
    this.pending = this.fetch().finally(() => { this.pending = null; });
    return this.pending;
  }
  private async fetch(): Promise<void> {
    try {
      const client = await this.supabase.getClient();
      if (!client) throw new Error('Unavailable');
      const {data, error} = await client.rpc('get_leaderboard_v1');
      if (error) throw error;
      this.entries.set(mapLeaderboard(data)); this.status.set('loaded');
    } catch { this.status.set('error'); } // Retain the last valid ranking on refresh failure.
  }
}
