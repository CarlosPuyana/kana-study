import {Injectable, computed, effect, inject, signal} from '@angular/core';
import {WeaknessActivity, WeaknessModule, WeaknessRecord} from '../models/weakness.model';
import {StorageService} from './storage.service';
import {StudyRating} from '../models/progress.model';

export const WEAKNESSES_KEY = 'kana-study.weaknesses.v1';
const modules: readonly WeaknessModule[] = ['kana', 'vocabulary', 'kanji', 'grammar'];
function valid(value: unknown): value is WeaknessRecord {
  if (!value || typeof value !== 'object') return false;
  const r = value as WeaknessRecord;
  return modules.includes(r.module) && ['writing','listening','learn'].includes(r.activity) && typeof r.itemId === 'string' && !!r.itemId
    && (r.questionType === undefined || (typeof r.questionType === 'string' && !!r.questionType))
    && [r.attempts,r.failures,r.consecutiveCorrect,r.score].every(n => Number.isInteger(n) && n >= 0)
    && r.attempts > 0 && r.failures <= r.attempts && r.consecutiveCorrect <= r.attempts
    && r.score <= 10 && typeof r.lastAttemptAt === 'string' && Number.isFinite(Date.parse(r.lastAttemptAt));
}
function key(record: Pick<WeaknessRecord,'module'|'activity'|'itemId'|'questionType'>): string {
  return JSON.stringify([record.module,record.activity,record.itemId,record.questionType ?? null]);
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
  record(module: WeaknessModule, itemId: string, correct: boolean, activity: WeaknessActivity = 'writing'): void {
    this.recordRating(module,itemId,correct ? 'good' : 'again',activity);
  }
  recordLearn(module: WeaknessModule, itemId: string, questionType: string, rating: StudyRating): void {
    if (!questionType) return;
    this.recordRating(module,itemId,rating,'learn',questionType);
  }
  private recordRating(module: WeaknessModule, itemId: string, rating: StudyRating, activity: WeaknessActivity, questionType?: string): void {
    if (!itemId) return;
    const identity = {module,activity,itemId,...(questionType ? {questionType} : {})};
    const previous = this.state().find(r => key(r) === key(identity));
    const next: WeaknessRecord = {
      ...identity, attempts:(previous?.attempts ?? 0)+1,
      failures:(previous?.failures ?? 0)+(rating === 'again' ? 1 : 0),
      consecutiveCorrect:rating === 'good' ? (previous?.consecutiveCorrect ?? 0)+1 : 0,
      score:Math.max(0,Math.min(10,(previous?.score ?? 0)+(rating === 'good' ? -1 : rating === 'hard' ? 1 : 2))),
      lastAttemptAt:new Date().toISOString(),
    };
    this.state.update(records => [...records.filter(r => key(r) !== key(next)),next]);
    this.storage.set(WEAKNESSES_KEY,this.state(),{localOnly:true});
  }
  /** Resolve against the caller's dataset, keeping obsolete/disabled entries out of the UI and queues. */
  items<T extends {readonly id: string}>(module: WeaknessModule, entries: readonly T[], limit: number, activity: WeaknessActivity = 'writing'): T[] {
    const byId = new Map(entries.map(item => [item.id,item]));
    return this.weak().filter(r => r.module === module && r.activity === activity).flatMap(r => {
      const item = byId.get(r.itemId); return item ? [item] : [];
    }).slice(0,limit);
  }
  /** Resolve complete study-unit identities without changing the user's normal selection. */
  learnUnits<T extends {readonly questionType: string}>(module: WeaknessModule, units: readonly T[], itemId: (unit:T)=>string, limit = 10): T[] {
    return this.weak().filter(r=>r.module===module && r.activity==='learn').flatMap(record=>{
      const unit=units.find(u=>itemId(u)===record.itemId && u.questionType===record.questionType);
      return unit ? [unit] : [];
    }).slice(0,limit);
  }
  private read(): readonly WeaknessRecord[] {
    const stored = this.storage.get<unknown>(WEAKNESSES_KEY,[]);
    if (!Array.isArray(stored)) return [];
    return [...new Map(stored.filter(valid).map(r => [key(r),{
      module:r.module,activity:r.activity,itemId:r.itemId,attempts:r.attempts,failures:r.failures,
      ...(r.questionType ? {questionType:r.questionType} : {}),
      consecutiveCorrect:r.consecutiveCorrect,score:r.score,lastAttemptAt:r.lastAttemptAt,
    }])).values()];
  }
}
