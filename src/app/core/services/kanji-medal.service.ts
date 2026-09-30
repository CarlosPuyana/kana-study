import { computed, inject, Injectable } from '@angular/core';
import { KANJI_N5 } from '../../data/kanji-n5.generated';
import { KANJI_MEDAL_DEFINITIONS } from '../../data/kanji-medals';
import { MedalPresentation, MedalState } from '../models/medal.model';
import { evaluateKanjiMedals } from './kanji-medal-rules';
import { KanjiProgressService } from './kanji-progress.service';
import { MedalService } from './medal.service';
import { selectHomeMedals } from './medal-rules';
import { SessionHistoryService } from './session-history.service';

@Injectable({ providedIn: 'root' })
export class KanjiMedalService {
  private readonly progress = inject(KanjiProgressService);
  private readonly history = inject(SessionHistoryService);
  private readonly unlocks = inject(MedalService);
  readonly definitions = KANJI_MEDAL_DEFINITIONS;
  readonly medals = computed(() => evaluateKanjiMedals({ definitions: this.definitions,
    kanji: KANJI_N5, progress: this.progress.allProgress(), reviewEvents: this.progress.reviewEvents(),
    sessions: this.history.sessions(), unlocks: this.unlocks.unlocks() }));
  readonly unlockedCount = computed(() => this.medals().filter(medal => medal.unlocked).length);
  readonly unlockedPercentage = computed(() => Math.round(this.unlockedCount() / this.definitions.length * 100));
  readonly homeMedals = computed(() => selectHomeMedals(this.medals()));
  constructor() { this.evaluateUnlocks(); }
  evaluateUnlocks(now = new Date()): readonly MedalState[] { const ids = this.unlocks.unlockCompleted(this.medals(), now); return this.medals().filter(medal => ids.includes(medal.definition.id)); }
  presentation(state: MedalState): MedalPresentation { return this.unlocks.presentation(state); }
}
