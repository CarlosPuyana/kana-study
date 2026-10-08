import { readStudyProgress, readReviewEvents } from './study-progress-validation';
import { computed, inject, Injectable } from '@angular/core';
import { ALL_KANA } from '../../data/kana';
import {
  ProgressStats, QUESTION_TYPES, ReviewEvent, RoundSummary, StudyProgress, StudyRating, StudyUnit,
} from '../models/progress.model';
import { SettingsService } from './settings.service';
import { SpacedRepetitionService } from './spaced-repetition.service';
import { StorageService, workspaceStorageSignal } from './storage.service';
import { buildStudyRound } from './study-round-builder';

export const ROUND_SIZE = 10;
const PROGRESS_KEY = 'kana-study.study-progress.v2';
const REVIEW_EVENTS_KEY = 'kana-study.review-events.v1';
const LEGACY_PROGRESS_KEY = 'kana-study.progress.v1';
type ProgressMap = Record<string, StudyProgress>;

@Injectable({ providedIn: 'root' })
export class ProgressService {
  private readonly storage = inject(StorageService);
  private readonly settingsService = inject(SettingsService);
  private readonly spacedRepetition = inject(SpacedRepetitionService);
  private readonly progress = workspaceStorageSignal<ProgressMap>(() => readStudyProgress<StudyProgress>(this.storage.get<unknown>(PROGRESS_KEY, {}), 'kanaId', QUESTION_TYPES));
  private readonly reviewEventState = workspaceStorageSignal<readonly ReviewEvent[]>(() => readReviewEvents<ReviewEvent>(this.storage.get<unknown>(REVIEW_EVENTS_KEY, []), 'kanaId', QUESTION_TYPES));
  readonly reviewEvents = this.reviewEventState.asReadonly();
  readonly allProgress = this.progress.asReadonly();

  readonly activeCards = computed(() => {
    const selection = this.settingsService.selection();
    return ALL_KANA.filter(kana => selection.categories[kana.type][kana.variant]);
  });

  readonly activeQuestionTypes = computed(() => this.settingsService.selection().questionTypes);

  readonly activeUnits = computed<readonly StudyUnit[]>(() =>
    this.activeCards().flatMap(kana => this.activeQuestionTypes().map(questionType => ({
      key: `${kana.id}:${questionType}`,
      kanaId: kana.id,
      questionType,
    }))),
  );

  readonly stats = computed<ProgressStats>(() => {
    const now = new Date();
    let newCount = 0;
    let pendingCount = 0;
    let memorizedCount = 0;
    let dueCount = 0;
    for (const unit of this.activeUnits()) {
      const stored = this.progress()[unit.key];
      if (!stored || stored.fsrs.state === 'new') newCount++;
      else if (stored.fsrs.state === 'review') memorizedCount++;
      else pendingCount++;
      if (stored && this.spacedRepetition.isDue(stored.fsrs, now)) dueCount++;
    }
    const total = this.activeUnits().length;
    return {
      total, newCount, pendingCount, memorizedCount, dueCount,
      percentage: total === 0 ? 0 : Math.round((memorizedCount / total) * 100),
    };
  });

  readonly roundSummary = computed<RoundSummary>(() => {
    const round = this.buildRound();
    const progress = this.progress();
    const selection = this.settingsService.selection();
    const enabledCategories = Object.values(selection.categories.hiragana).filter(Boolean).length
      + Object.values(selection.categories.katakana).filter(Boolean).length;
    return {
      enabledCategories,
      totalCategories: 8,
      enabledQuestionTypes: this.activeQuestionTypes().length,
      totalQuestionTypes: QUESTION_TYPES.length,
      available: this.activeUnits().length,
      due: this.stats().dueCount,
      newCount: this.stats().newCount,
      roundSize: round.length,
      roundDue: round.filter(unit => Boolean(progress[unit.key])).length,
      roundNew: round.filter(unit => !progress[unit.key]).length,
    };
  });

  get(key: string): StudyProgress | null {
    return this.progress()[key] ?? null;
  }

  buildRound(now = new Date()): readonly StudyUnit[] {
    return buildStudyRound({
      units: this.activeUnits(),
      progress: this.progress(),
      now,
      limit: ROUND_SIZE,
    });
  }

  recordReview(
    unit: StudyUnit,
    rating: StudyRating,
    firstTry: boolean,
    sessionId: string,
    now = new Date(),
  ): void {
    const current = this.progress()[unit.key];
    const iso = now.toISOString();
    const nextFsrs = this.spacedRepetition.review(current?.fsrs ?? null, rating, now);
    const next: StudyProgress = {
      ...unit,
      fsrs: nextFsrs,
      firstSeenAt: current?.firstSeenAt ?? iso,
      lastSeenAt: iso,
      totalAttempts: (current?.totalAttempts ?? 0) + 1,
      totalFirstTrySuccesses: (current?.totalFirstTrySuccesses ?? 0) + Number(firstTry),
      totalFailures: (current?.totalFailures ?? 0) + Number(rating === 'again'),
      lastRating: rating,
    };
    this.progress.update(value => ({ ...value, [unit.key]: next }));
    this.storage.set(PROGRESS_KEY, this.progress());
    const event: ReviewEvent = {
      ...unit,
      id: globalThis.crypto?.randomUUID?.() ?? `review-${Date.now()}-${unit.key}`,
      sessionId,
      rating,
      reviewedAt: iso,
      fsrsBefore: current?.fsrs ?? null,
      fsrsAfter: nextFsrs,
    };
    this.reviewEventState.update(events => [...events, event]);
    this.storage.set(REVIEW_EVENTS_KEY, this.reviewEventState());
  }

  recordPracticeAttempt(unit: StudyUnit, successful: boolean, now = new Date()): void {
    const current = this.progress()[unit.key];
    if (!current) return;
    this.progress.update(value => ({
      ...value,
      [unit.key]: {
        ...current,
        lastSeenAt: now.toISOString(),
        totalAttempts: current.totalAttempts + 1,
        totalFailures: current.totalFailures + Number(!successful),
      },
    }));
    this.storage.set(PROGRESS_KEY, this.progress());
  }

  resetProgress(): void {
    this.progress.set({});
    this.reviewEventState.set([]);
    this.storage.remove(PROGRESS_KEY);
    this.storage.remove(REVIEW_EVENTS_KEY);
    this.storage.remove(LEGACY_PROGRESS_KEY);
  }

}
