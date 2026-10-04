import {Injectable, computed, effect, inject, signal} from '@angular/core';
import {WeaknessModule, WeaknessRecord} from '../models/weakness.model';
import {StorageService} from './storage.service';

export const WEAKNESSES_KEY = 'kana-study.weaknesses.v1';
const modules: readonly WeaknessModule[] = ['kana', 'vocabulary', 'kanji'];
function valid(value: unknown): value is WeaknessRecord {
  if (!value || typeof value !== 'object') return false;
  const r = value as WeaknessRecord;
  return modules.includes(r.module) && r.activity === 'writing' && typeof r.itemId === 'string' && !!r.itemId
    && [r.attempts,r.failures,r.consecutiveCorrect,r.score].every(n => Number.isInteger(n) && n >= 0)
    && r.attempts > 0 && r.failures <= r.attempts && r.consecutiveCorrect <= r.attempts
    && r.score <= 10 && typeof r.lastAttemptAt === 'string' && Number.isFinite(Date.parse(r.lastAttemptAt));
}
function key(record: Pick<WeaknessRecord,'module'|'activity'|'itemId'>): string {
  return JSON.stringify([record.module,record.activity,record.itemId]);
}

@Injectable({providedIn:'root'})
export class WeaknessService {
  private readonly storage = inject(StorageService);
  private readonly state = signal<readonly WeaknessRecord[]>(this.read());
  readonly records = this.state.asReadonly();
  readonly weak = computed(() => this.state().filter(r => r.score >= 3).sort((a,b) =>
    b.score-a.score || b.failures/b.attempts-a.failures/a.attempts
    || Date.parse(b.lastAttemptAt)-Date.parse(a.lastAttemptAt)));
  constructor() {
    // Storage keys follow the active local workspace; no cloud data is written.
    effect(() => {this.storage.rawKey(WEAKNESSES_KEY); this.storage.cloudRevision(); this.state.set(this.read());});
  }
  record(module: WeaknessModule, itemId: string, correct: boolean): void {
    if (!itemId) return;
    const identity = {module,activity:'writing' as const,itemId};
    const previous = this.state().find(r => key(r) === key(identity));
    const next: WeaknessRecord = {
      ...identity, attempts:(previous?.attempts ?? 0)+1,
      failures:(previous?.failures ?? 0)+(correct ? 0 : 1),
      consecutiveCorrect:correct ? (previous?.consecutiveCorrect ?? 0)+1 : 0,
      score:Math.max(0,Math.min(10,(previous?.score ?? 0)+(correct ? -1 : 2))),
      lastAttemptAt:new Date().toISOString(),
    };
    this.state.update(records => [...records.filter(r => key(r) !== key(next)),next]);
    this.storage.set(WEAKNESSES_KEY,this.state(),{localOnly:true});
  }
  /** Resolve against the caller's dataset, keeping obsolete/disabled entries out of the UI and queues. */
  items<T extends {readonly id: string}>(module: WeaknessModule, entries: readonly T[], limit: number): T[] {
    const byId = new Map(entries.map(item => [item.id,item]));
    return this.weak().filter(r => r.module === module).flatMap(r => {
      const item = byId.get(r.itemId); return item ? [item] : [];
    }).slice(0,limit);
  }
  private read(): readonly WeaknessRecord[] {
    const stored = this.storage.get<unknown>(WEAKNESSES_KEY,[]);
    if (!Array.isArray(stored)) return [];
    return [...new Map(stored.filter(valid).map(r => [key(r),{
      module:r.module,activity:r.activity,itemId:r.itemId,attempts:r.attempts,failures:r.failures,
      consecutiveCorrect:r.consecutiveCorrect,score:r.score,lastAttemptAt:r.lastAttemptAt,
    }])).values()];
  }
}
