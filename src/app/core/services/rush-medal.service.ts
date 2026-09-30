import { computed, inject, Injectable, signal } from '@angular/core';
import { MedalState, MedalUnlock } from '../models/medal.model';
import { RUSH_MEDAL_DEFINITIONS } from '../../data/rush-medals';
import { isMedalComplete, presentMedal } from './medal-rules';
import { LocalRushRepository } from './rush-repository.service';
import { evaluateRushMedals } from './rush-medal-rules';
import { StorageService } from './storage.service';

const KEY = 'kana-study.rush.medal-unlocks.v1';

@Injectable({ providedIn: 'root' })
export class RushMedalService {
  private readonly repository = inject(LocalRushRepository);
  private readonly storage = inject(StorageService);
  private readonly unlockState = signal<readonly MedalUnlock[]>(this.storage.get(KEY, []));
  private readonly medalState = signal<readonly MedalState[]>([]);
  readonly definitions = RUSH_MEDAL_DEFINITIONS;
  readonly medals = this.medalState.asReadonly();
  readonly unlockedCount = computed(() => this.medals().filter(medal => medal.unlocked).length);
  readonly newlyUnlocked = signal<readonly MedalState[]>([]);

  async refresh(now = new Date()): Promise<readonly MedalState[]> {
    const stats = await this.repository.getStats();
    let states = evaluateRushMedals(stats, this.unlockState());
    const additions = states.filter(state => !state.unlocked && isMedalComplete(state.progress));
    if (additions.length) {
      const unlockedAt = now.toISOString();
      this.unlockState.update(current => [...current, ...additions.map(item => ({ medalId: item.definition.id, unlockedAt }))]);
      this.storage.set(KEY, this.unlockState());
      states = evaluateRushMedals(stats, this.unlockState());
      this.newlyUnlocked.set(states.filter(state => additions.some(item => item.definition.id === state.definition.id)));
    }
    this.medalState.set(states);
    return states;
  }

  dismiss(): void { this.newlyUnlocked.update(items => items.slice(1)); }
  presentation(state: MedalState) { return presentMedal(state); }
}
