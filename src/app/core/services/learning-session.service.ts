import { computed, inject, Injectable, signal } from '@angular/core';
import { ALL_KANA } from '../../data/kana';
import {
  LearningMode, LearningSession, SessionFeedback, SessionItem,
} from '../models/learning-session.model';
import { StudyRating, StudyUnit } from '../models/progress.model';
import { MedalState } from '../models/medal.model';
import { answerFor, buildQuestionOptions } from './learning-options';
import { MedalService } from './medal.service';
import { ProgressService } from './progress.service';
import { SessionHistoryService } from './session-history.service';
import { DailyLearningService } from './daily-learning.service';
import { WeaknessService } from './weakness.service';

interface SessionState {
  readonly practice: boolean;
  readonly session: LearningSession;
  readonly queue: readonly string[];
  readonly queueIndex: number;
  readonly revealed: boolean;
  readonly feedback: SessionFeedback | null;
}

export const MAX_APPEARANCES_PER_UNIT = 4;
const AGAIN_GAP = 2;
const HARD_GAP = 4;

@Injectable({ providedIn: 'root' })
export class LearningSessionService {
  private readonly progress = inject(ProgressService);
  private readonly history = inject(SessionHistoryService);
  private readonly medals = inject(MedalService);
  private readonly dailyLearning = inject(DailyLearningService);
  private readonly weaknesses = inject(WeaknessService);
  private readonly state = signal<SessionState | null>(null);
  private readonly newMedalState = signal<readonly MedalState[]>([]);

  readonly session = computed(() => this.state()?.session ?? null);
  readonly isPractice = computed(() => this.state()?.practice ?? false);
  readonly newlyUnlockedMedals = this.newMedalState.asReadonly();
  readonly currentUnit = computed(() => {
    const state = this.state();
    if (!state || state.session.completedAt) return null;
    const key = state.queue[state.queueIndex];
    return state.session.units.find(unit => unit.key === key) ?? null;
  });
  readonly currentKana = computed(() => {
    const unit = this.currentUnit();
    return unit ? ALL_KANA.find(kana => kana.id === unit.kanaId) ?? null : null;
  });
  readonly currentExample = computed(() => this.currentKana()?.examples[0] ?? null);
  readonly currentItem = computed(() => {
    const session = this.session();
    const unit = this.currentUnit();
    return session && unit
      ? session.items.find(item => item.studyKey === unit.key) ?? null
      : null;
  });
  readonly questionValue = computed(() => {
    const unit = this.currentUnit();
    const kana = this.currentKana();
    if (!unit || !kana) return '';
    return unit.questionType === 'romaji-to-kana' ? kana.romaji : kana.character;
  });
  readonly answer = computed(() => {
    const unit = this.currentUnit();
    const kana = this.currentKana();
    return unit && kana ? answerFor(kana, unit.questionType) : '';
  });
  readonly revealed = computed(() => this.state()?.revealed ?? false);
  readonly feedback = computed(() => this.state()?.feedback ?? null);
  readonly completed = computed(() => Boolean(this.session()?.completedAt));
  readonly resolvedCount = computed(() =>
    this.session()?.items.filter(item => item.resolved).length ?? 0,
  );
  readonly progressPercent = computed(() => {
    const session = this.session();
    return session?.sessionSize ? (this.resolvedCount() / session.sessionSize) * 100 : 0;
  });
  readonly firstTrySuccessCount = computed(() =>
    this.session()?.items.filter(item => item.initialRating === 'good').length ?? 0,
  );
  readonly firstTrySuccessPercentage = computed(() => {
    const session = this.session();
    return session?.sessionSize
      ? Math.round((this.firstTrySuccessCount() / session.sessionSize) * 100)
      : 0;
  });
  readonly options = computed(() => {
    const unit = this.currentUnit();
    const kana = this.currentKana();
    const session = this.session();
    if (!unit || !kana || !session) return [];
    return buildQuestionOptions(kana, unit.questionType, ALL_KANA, `${session.id}:${unit.key}`);
  });

  start(mode: LearningMode): boolean {
    if (this.dailyLearning.isCompletedToday('kana')) return false;
    const units = this.progress.buildRound();
    return this.initialize(units,mode,false);
  }

  startPractice(units: readonly StudyUnit[], mode: LearningMode = 'quick-practice'): boolean {
    const valid=units.filter(u=>ALL_KANA.some(k=>k.id===u.kanaId) && ['kana-to-romaji','romaji-to-kana'].includes(u.questionType));
    const unique=[...new Map(valid.map(u=>[`${u.kanaId}:${u.questionType}`,{...u,key:`${u.kanaId}:${u.questionType}`}])).values()];
    return this.initialize(unique,mode,true);
  }

  private initialize(units: readonly StudyUnit[], mode: LearningMode, practice: boolean): boolean {
    if (!units.length) return false;
    const session: LearningSession = {
      id: globalThis.crypto?.randomUUID?.() ?? `session-${Date.now()}`,
      startedAt: new Date().toISOString(),
      completedAt: null,
      mode,
      sessionSize: units.length,
      units,
      items: units.map(unit => this.newItem(unit)),
      attempts: 0,
    };
    this.newMedalState.set([]);
    this.state.set({ session, practice, queue: units.map(unit => unit.key), queueIndex: 0,
      revealed: false, feedback: null });
    this.markAppearance();
    return true;
  }

  answerQuick(selected: string): void {
    const state = this.state();
    const kana = this.currentKana();
    const unit = this.currentUnit();
    if (!state || !kana || !unit || state.feedback) return;
    const answer = answerFor(kana, unit.questionType);
    const correct = selected === answer;
    this.registerAttempt(correct ? 'good' : 'again', correct);
    this.patchState({ feedback: { correct, selected, answer } });
  }

  continueQuick(): void {
    const state = this.state();
    if (!state?.feedback) return;
    if (!state.feedback.correct && !this.currentItem()?.resolved) {
      this.enqueueCurrent('again');
    }
    this.advance();
  }

  reveal(): void {
    if (this.state()) this.patchState({ revealed: true });
  }

  rate(rating: StudyRating): void {
    const state = this.state();
    if (!state?.revealed) return;
    this.registerAttempt(rating, rating === 'good');
    if (rating !== 'good' && !this.currentItem()?.resolved) this.enqueueCurrent(rating);
    this.advance();
  }

  restart(mode = this.session()?.mode ?? 'quick-practice'): boolean {
    if (this.isPractice()) return this.startPractice(this.session()!.units,mode);
    return this.start(mode);
  }

  clear(): void {
    this.state.set(null);
    this.newMedalState.set([]);
  }

  dismissNextMedal(): void {
    this.newMedalState.update(medals => medals.slice(1));
  }

  private registerAttempt(rating: StudyRating, resolved: boolean): void {
    const state = this.state();
    const unit = this.currentUnit();
    if (!state || !unit) return;
    this.weaknesses.recordLearn('kana',unit.kanaId,unit.questionType,rating);
    const items = state.session.items.map(item => {
      if (item.studyKey !== unit.key) return item;
      const firstAttempt = item.initialRating === null;
      if (!state.practice && firstAttempt) {
        this.progress.recordReview(unit, rating, rating === 'good', state.session.id);
      }
      else if (!state.practice) this.progress.recordPracticeAttempt(unit, rating === 'good');
      const reachedAppearanceLimit = !resolved
        && item.appearances >= MAX_APPEARANCES_PER_UNIT;
      return {
        ...item,
        attempts: item.attempts + 1,
        initialRating: item.initialRating ?? rating,
        resolved: item.resolved || resolved || reachedAppearanceLimit,
        needsPractice: item.needsPractice || rating !== 'good',
      };
    });
    this.state.set({ ...state, session: {
      ...state.session, items, attempts: state.session.attempts + 1,
    }});
  }

  private enqueueCurrent(rating: Exclude<StudyRating, 'good'>): void {
    const state = this.state();
    const unit = this.currentUnit();
    if (!state || !unit) return;
    const gap = rating === 'again' ? AGAIN_GAP : HARD_GAP;
    const insertionIndex = Math.min(state.queueIndex + 1 + gap, state.queue.length);
    this.patchState({
      queue: [
        ...state.queue.slice(0, insertionIndex),
        unit.key,
        ...state.queue.slice(insertionIndex),
      ],
    });
  }

  private advance(): void {
    const state = this.state();
    if (!state) return;
    const nextIndex = state.queueIndex + 1;
    if (nextIndex >= state.queue.length) {
      const completedAt = new Date();
      if (!state.practice) this.dailyLearning.refresh(completedAt);
      const completedSession = {
        ...state.session,
        completedAt: completedAt.toISOString(),
      };
      this.state.set({ ...state, session: {
        ...completedSession,
      }, feedback: null, revealed: false });
      if (state.practice) return;
      this.history.record({
        module: 'kana',
        sessionId: completedSession.id,
        completedAt: completedSession.completedAt,
        mode: completedSession.mode,
        exercisesCompleted: completedSession.sessionSize,
        firstTrySuccesses: completedSession.items.filter(item => item.initialRating === 'good').length,
        attempts: completedSession.attempts,
        needsPracticeCount: completedSession.items.filter(item => item.needsPractice).length,
        durationSeconds: Math.max(0, Math.round(
          (completedAt.getTime() - new Date(completedSession.startedAt).getTime()) / 1000,
        )),
      });
      this.newMedalState.set(this.medals.evaluateUnlocks(completedAt));
      return;
    }
    this.state.set({ ...state, queueIndex: nextIndex, feedback: null, revealed: false });
    this.markAppearance();
  }

  private markAppearance(): void {
    const state = this.state();
    const unit = this.currentUnit();
    if (!state || !unit) return;
    this.state.set({ ...state, session: { ...state.session,
      items: state.session.items.map(item => item.studyKey === unit.key
        ? { ...item, appearances: item.appearances + 1 } : item),
    }});
  }

  private patchState(patch: Partial<SessionState>): void {
    this.state.update(state => state ? { ...state, ...patch } : null);
  }

  private newItem(unit: StudyUnit): SessionItem {
    return { studyKey: unit.key, attempts: 0, appearances: 0, initialRating: null,
      resolved: false, needsPractice: false };
  }

}
