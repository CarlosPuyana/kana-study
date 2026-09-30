import { computed, inject, Injectable } from '@angular/core';
import { COUNTRIES } from '../../data/countries.generated';
import { FLAG_MEDAL_DEFINITIONS } from '../../data/flag-medals';
import { MedalPresentation, MedalState } from '../models/medal.model';
import { evaluateFlagMedals } from './flag-medal-rules';
import { FlagProgressService } from './flag-progress.service';
import { MedalService } from './medal.service';
import { selectHomeMedals } from './medal-rules';
import { SessionHistoryService } from './session-history.service';

@Injectable({ providedIn: 'root' })
export class FlagMedalService {
  private readonly progress = inject(FlagProgressService);
  private readonly history = inject(SessionHistoryService);
  private readonly unlocks = inject(MedalService);
  readonly definitions = FLAG_MEDAL_DEFINITIONS;
  readonly medals = computed(() => evaluateFlagMedals({ definitions: this.definitions,
    countries: COUNTRIES, progress: this.progress.allProgress(), sessions: this.history.sessions(),
    unlocks: this.unlocks.unlocks() }));
  readonly unlockedCount = computed(() => this.medals().filter(medal => medal.unlocked).length);
  readonly unlockedPercentage = computed(() => Math.round(this.unlockedCount() / this.definitions.length * 100));
  readonly homeMedals = computed(() => selectHomeMedals(this.medals()));
  constructor() { this.evaluateUnlocks(); }
  evaluateUnlocks(now = new Date()): readonly MedalState[] { const ids = this.unlocks.unlockCompleted(this.medals(), now); return this.medals().filter(medal => ids.includes(medal.definition.id)); }
  presentation(state: MedalState): MedalPresentation { return this.unlocks.presentation(state); }
}
