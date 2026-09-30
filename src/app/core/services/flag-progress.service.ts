import { computed, inject, Injectable, signal } from '@angular/core';
import { COUNTRIES } from '../../data/countries.generated';
import { FLAG_QUESTION_TYPES, FLAG_REGIONS, FlagStudyUnit } from '../models/country.model';
import {
  FlagReviewEvent, FlagRoundSummary, FlagStudyProgress,
} from '../models/flag-study.model';
import { ProgressStats, StudyRating } from '../models/progress.model';
import { flagStudyUnits } from './flag-selection';
import { buildFlagRound } from './flag-round-builder';
import { FlagSettingsService } from './flag-settings.service';
import { SpacedRepetitionService } from './spaced-repetition.service';
import { StorageService } from './storage.service';

export const FLAG_ROUND_SIZE = 10;
const FLAG_PROGRESS_KEY = 'kana-study.flags-progress.v1';
const FLAG_EVENTS_KEY = 'kana-study.flags-review-events.v1';
type FlagProgressMap = Record<string, FlagStudyProgress>;

@Injectable({ providedIn: 'root' })
export class FlagProgressService {
  private readonly storage = inject(StorageService);
  private readonly settings = inject(FlagSettingsService);
  private readonly spacedRepetition = inject(SpacedRepetitionService);
  private readonly state = signal<FlagProgressMap>(this.storage.get(FLAG_PROGRESS_KEY, {}));
  private readonly eventState = signal<readonly FlagReviewEvent[]>(
    this.storage.get(FLAG_EVENTS_KEY, []),
  );
  readonly allProgress = this.state.asReadonly();
  readonly reviewEvents = this.eventState.asReadonly();
  readonly activeCountries = computed(() => COUNTRIES.filter(country =>
    country.enabled && this.settings.selection().regions[country.studyRegion]));
  readonly activeUnits = computed(() => flagStudyUnits(COUNTRIES, this.settings.selection()));
  readonly stats = computed<ProgressStats>(() => {
    const now = new Date();
    let newCount = 0;
    let pendingCount = 0;
    let memorizedCount = 0;
    let dueCount = 0;
    for (const unit of this.activeUnits()) {
      const stored = this.state()[unit.key];
      if (!stored || stored.fsrs.state === 'new') newCount++;
      else if (stored.fsrs.state === 'review') memorizedCount++;
      else pendingCount++;
      if (stored && this.spacedRepetition.isDue(stored.fsrs, now)) dueCount++;
    }
    const total = this.activeUnits().length;
    return { total, newCount, pendingCount, memorizedCount, dueCount,
      percentage: total ? Math.round((memorizedCount / total) * 100) : 0 };
  });
  readonly roundSummary = computed<FlagRoundSummary>(() => {
    const round = this.buildRound();
    const progress = this.state();
    const selection = this.settings.selection();
    return {
      enabledRegions: FLAG_REGIONS.filter(region => selection.regions[region]).length,
      totalRegions: FLAG_REGIONS.length,
      enabledQuestionTypes: selection.questionTypes.length,
      totalQuestionTypes: FLAG_QUESTION_TYPES.length,
      available: this.activeUnits().length,
      due: this.stats().dueCount,
      newCount: this.stats().newCount,
      roundSize: round.length,
      roundDue: round.filter(unit => progress[unit.key] !== undefined).length,
      roundNew: round.filter(unit => progress[unit.key] === undefined).length,
    };
  });

  get(key: string): FlagStudyProgress | null {
    return this.state()[key] ?? null;
  }

  buildRound(now = new Date()): readonly FlagStudyUnit[] {
    return buildFlagRound({ units: this.activeUnits(), progress: this.state(), now,
      limit: FLAG_ROUND_SIZE });
  }

  recordReview(
    unit: FlagStudyUnit,
    rating: StudyRating,
    firstTry: boolean,
    sessionId: string,
    now = new Date(),
  ): void {
    const current = this.state()[unit.key];
    const iso = now.toISOString();
    const nextFsrs = this.spacedRepetition.review(current?.fsrs ?? null, rating, now);
    const next: FlagStudyProgress = {
      ...unit,
      fsrs: nextFsrs,
      firstSeenAt: current?.firstSeenAt ?? iso,
      lastSeenAt: iso,
      totalAttempts: (current?.totalAttempts ?? 0) + 1,
      totalFirstTrySuccesses: (current?.totalFirstTrySuccesses ?? 0) + Number(firstTry),
      totalFailures: (current?.totalFailures ?? 0) + Number(rating === 'again'),
      lastRating: rating,
    };
    this.state.update(value => ({ ...value, [unit.key]: next }));
    this.storage.set(FLAG_PROGRESS_KEY, this.state());
    this.eventState.update(events => [...events, {
      ...unit,
      id: globalThis.crypto?.randomUUID?.() ?? `flag-review-${Date.now()}-${unit.key}`,
      sessionId,
      rating,
      reviewedAt: iso,
      fsrsBefore: current?.fsrs ?? null,
      fsrsAfter: nextFsrs,
    }]);
    this.storage.set(FLAG_EVENTS_KEY, this.eventState());
  }

  recordPracticeAttempt(unit: FlagStudyUnit, successful: boolean, now = new Date()): void {
    const current = this.state()[unit.key];
    if (!current) return;
    this.state.update(value => ({ ...value, [unit.key]: {
      ...current,
      lastSeenAt: now.toISOString(),
      totalAttempts: current.totalAttempts + 1,
      totalFailures: current.totalFailures + Number(!successful),
    }}));
    this.storage.set(FLAG_PROGRESS_KEY, this.state());
  }
}
