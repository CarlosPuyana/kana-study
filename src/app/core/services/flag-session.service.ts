import { computed, inject, Injectable, signal } from '@angular/core';
import { COUNTRIES } from '../../data/countries.generated';
import { AppLanguage, FlagStudyUnit } from '../models/country.model';
import {
  FlagLearningSession, FlagSessionFeedback, FlagSessionItem,
} from '../models/flag-session.model';
import { MedalState } from '../models/medal.model';
import { StudyRating } from '../models/progress.model';
import { FlagProgressService } from './flag-progress.service';
import { buildFlagOptions } from './flag-options';
import { FlagMedalService } from './flag-medal.service';
import { SessionHistoryService } from './session-history.service';

interface FlagSessionState {
  readonly session: FlagLearningSession;
  readonly queue: readonly string[];
  readonly queueIndex: number;
  readonly feedback: FlagSessionFeedback | null;
}

export const FLAG_MAX_APPEARANCES = 4;
const AGAIN_GAP = 2;

@Injectable({ providedIn: 'root' })
export class FlagSessionService {
  private readonly progress = inject(FlagProgressService);
  private readonly history = inject(SessionHistoryService);
  private readonly medals = inject(FlagMedalService);
  private readonly state = signal<FlagSessionState | null>(null);
  private readonly medalState = signal<readonly MedalState[]>([]);
  readonly session = computed(() => this.state()?.session ?? null);
  readonly newlyUnlockedMedals = this.medalState.asReadonly();
  readonly currentUnit = computed(() => {
    const state = this.state();
    if (!state || state.session.completedAt) return null;
    const key = state.queue[state.queueIndex];
    return state.session.units.find(unit => unit.key === key) ?? null;
  });
  readonly currentCountry = computed(() => {
    const unit = this.currentUnit();
    return unit ? COUNTRIES.find(country => country.id === unit.countryId) ?? null : null;
  });
  readonly currentItem = computed(() => {
    const unit = this.currentUnit();
    return unit ? this.session()?.items.find(item => item.studyKey === unit.key) ?? null : null;
  });
  readonly feedback = computed(() => this.state()?.feedback ?? null);
  readonly completed = computed(() => Boolean(this.session()?.completedAt));
  readonly resolvedCount = computed(() => this.session()?.items.filter(item => item.resolved).length ?? 0);
  readonly progressPercent = computed(() => this.session()?.sessionSize
    ? (this.resolvedCount() / this.session()!.sessionSize) * 100 : 0);
  readonly firstTrySuccessCount = computed(() =>
    this.session()?.items.filter(item => item.initialRating === 'good').length ?? 0);
  readonly firstTryPercentage = computed(() => this.session()?.sessionSize
    ? Math.round((this.firstTrySuccessCount() / this.session()!.sessionSize) * 100) : 0);

  start(): boolean {
    const units = this.progress.buildRound();
    if (!units.length) return false;
    const session: FlagLearningSession = {
      id: globalThis.crypto?.randomUUID?.() ?? `flag-session-${Date.now()}`,
      startedAt: new Date().toISOString(), completedAt: null, sessionSize: units.length, units,
      items: units.map(unit => this.newItem(unit)), attempts: 0,
    };
    this.medalState.set([]);
    this.state.set({ session, queue: units.map(unit => unit.key), queueIndex: 0, feedback: null });
    this.markAppearance();
    return true;
  }

  options(language: AppLanguage) {
    const unit = this.currentUnit();
    const session = this.session();
    return unit && session ? buildFlagOptions(unit, COUNTRIES, language, `${session.id}:${unit.key}`) : [];
  }

  answer(countryId: string): void {
    const state = this.state();
    const unit = this.currentUnit();
    if (!state || !unit || state.feedback) return;
    const correct = countryId === unit.countryId;
    this.registerAttempt(correct ? 'good' : 'again', correct);
    this.patch({ feedback: { correct, selectedId: countryId, correctId: unit.countryId } });
  }

  continue(): void {
    const state = this.state();
    if (!state?.feedback) return;
    if (!state.feedback.correct && !this.currentItem()?.resolved) this.enqueueCurrent();
    this.advance();
  }

  restart(): boolean { return this.start(); }
  clear(): void { this.state.set(null); this.medalState.set([]); }
  dismissNextMedal(): void { this.medalState.update(items => items.slice(1)); }

  private registerAttempt(rating: StudyRating, resolved: boolean): void {
    const state = this.state();
    const unit = this.currentUnit();
    if (!state || !unit) return;
    const items = state.session.items.map(item => {
      if (item.studyKey !== unit.key) return item;
      const firstAttempt = item.initialRating === null;
      if (firstAttempt) this.progress.recordReview(unit, rating, resolved, state.session.id);
      else this.progress.recordPracticeAttempt(unit, resolved);
      const reachedLimit = !resolved && item.appearances >= FLAG_MAX_APPEARANCES;
      return { ...item, attempts: item.attempts + 1, initialRating: item.initialRating ?? rating,
        resolved: item.resolved || resolved || reachedLimit,
        needsPractice: item.needsPractice || rating === 'again' };
    });
    this.state.set({ ...state, session: { ...state.session, items,
      attempts: state.session.attempts + 1 } });
  }

  private enqueueCurrent(): void {
    const state = this.state();
    const unit = this.currentUnit();
    if (!state || !unit) return;
    const at = Math.min(state.queueIndex + 1 + AGAIN_GAP, state.queue.length);
    this.patch({ queue: [...state.queue.slice(0, at), unit.key, ...state.queue.slice(at)] });
  }

  private advance(): void {
    const state = this.state();
    if (!state) return;
    const next = state.queueIndex + 1;
    if (next < state.queue.length) {
      this.state.set({ ...state, queueIndex: next, feedback: null });
      this.markAppearance();
      return;
    }
    const completedAt = new Date();
    const completed = { ...state.session, completedAt: completedAt.toISOString() };
    this.state.set({ ...state, session: completed, feedback: null });
    const countries = completed.units.map(unit => COUNTRIES.find(item => item.id === unit.countryId)!)
      .filter(Boolean);
    this.history.record({
      module: 'flags', sessionId: completed.id, completedAt: completed.completedAt,
      mode: 'quick-practice', exercisesCompleted: completed.sessionSize,
      firstTrySuccesses: completed.items.filter(item => item.initialRating === 'good').length,
      attempts: completed.attempts,
      needsPracticeCount: completed.items.filter(item => item.needsPractice).length,
      durationSeconds: Math.max(0, Math.round((completedAt.getTime()
        - new Date(completed.startedAt).getTime()) / 1000)),
      questionTypes: [...new Set(completed.units.map(unit => unit.questionType))],
      countryIds: [...new Set(completed.units.map(unit => unit.countryId))],
      studyRegions: [...new Set(countries.map(country => country.studyRegion))],
    });
    this.medalState.set(this.medals.evaluateUnlocks(completedAt));
  }

  private markAppearance(): void {
    const state = this.state();
    const unit = this.currentUnit();
    if (!state || !unit) return;
    this.state.set({ ...state, session: { ...state.session,
      items: state.session.items.map(item => item.studyKey === unit.key
        ? { ...item, appearances: item.appearances + 1 } : item) } });
  }

  private patch(patch: Partial<FlagSessionState>): void {
    this.state.update(state => state ? { ...state, ...patch } : null);
  }

  private newItem(unit: FlagStudyUnit): FlagSessionItem {
    return { studyKey: unit.key, attempts: 0, appearances: 0, initialRating: null,
      resolved: false, needsPractice: false };
  }
}

