import { computed, inject, Injectable, signal } from '@angular/core';
import { ALL_KANA } from '../../data/kana';
import { MEDAL_DEFINITIONS } from '../../data/medals';
import { MedalPresentation, MedalState, MedalUnlock } from '../models/medal.model';
import { ProgressService } from './progress.service';
import { evaluateMedalStates, isMedalComplete, presentMedal, selectHomeMedals } from './medal-rules';
import { SessionHistoryService } from './session-history.service';
import { StorageService } from './storage.service';

const MEDAL_UNLOCKS_KEY = 'kana-study.medal-unlocks.v1';

@Injectable({ providedIn: 'root' })
export class MedalService {
  private readonly storage = inject(StorageService);
  private readonly progress = inject(ProgressService);
  private readonly history = inject(SessionHistoryService);
  private readonly unlockState = signal<readonly MedalUnlock[]>(
    this.storage.get<readonly MedalUnlock[]>(MEDAL_UNLOCKS_KEY, []),
  );

  readonly definitions = MEDAL_DEFINITIONS;
  readonly unlocks = this.unlockState.asReadonly();
  readonly medals = computed(() => evaluateMedalStates({
    definitions: this.definitions,
    kana: ALL_KANA,
    progress: this.progress.allProgress(),
    reviewEvents: this.progress.reviewEvents(),
    sessions: this.history.sessions(),
    unlocks: this.unlockState(),
  }));
  readonly unlockedCount = computed(() => this.medals().filter(medal => medal.unlocked).length);
  readonly unlockedPercentage = computed(() => Math.round(
    (this.unlockedCount() / this.definitions.length) * 100,
  ));
  readonly homeMedals = computed(() => selectHomeMedals(this.medals()));

  constructor() { this.evaluateUnlocks(); }

  evaluateUnlocks(now = new Date()): readonly MedalState[] {
    const ids = this.unlockCompleted(this.medals(), now);
    return this.medals().filter(medal => ids.includes(medal.definition.id));
  }

  unlockCompleted(states: readonly MedalState[], now = new Date()): readonly string[] {
    const unlockedIds = new Set(this.unlockState().map(unlock => unlock.medalId));
    const completed = states.filter(medal =>
      !unlockedIds.has(medal.definition.id) && isMedalComplete(medal.progress));
    if (!completed.length) return [];
    const unlockedAt = now.toISOString();
    this.unlockState.update(unlocks => [
      ...unlocks,
      ...completed.map(medal => ({ medalId: medal.definition.id, unlockedAt })),
    ]);
    this.storage.set(MEDAL_UNLOCKS_KEY, this.unlockState());
    return completed.map(medal => medal.definition.id);
  }

  presentation(state: MedalState): MedalPresentation { return presentMedal(state); }

  reset(): void {
    this.unlockState.set([]);
    this.storage.remove(MEDAL_UNLOCKS_KEY);
  }
}
