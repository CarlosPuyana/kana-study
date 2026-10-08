import { computed, DestroyRef, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { MangaReviewEvent, MangaReviewQuestion, MangaReviewResult } from '../models/manga-review.model';
import { LocalWorkspaceId } from '../models/account.model';
import { createStudyClock } from './study-clock';
import { WorkspaceService } from './workspace.service';
import { SessionHistoryService } from './session-history.service';
import { MangaReviewHistoryService } from './manga-review-history.service';

/** Page-scoped flow: navigation destroys its clock and unfinished session. */
@Injectable()
export class MangaReviewSessionService {
  private readonly workspace = inject(WorkspaceService);
  private readonly history = inject(MangaReviewHistoryService);
  private readonly sessions = inject(SessionHistoryService);
  readonly clock = createStudyClock();
  readonly state = signal<'intro' | 'question' | 'feedback' | 'results'>('intro');
  readonly busy = signal(false);
  readonly error = signal(false);
  readonly revealed = signal(false);
  readonly correct = signal(false);
  readonly index = signal(0);
  readonly questions = signal<readonly MangaReviewQuestion[]>([]);
  readonly current = computed(() => this.questions()[this.index()]);
  private owner: LocalWorkspaceId | null = null;
  private sessionId = '';
  private initialCount = 0;
  private answers: MangaReviewEvent[] = [];
  private pending: MangaReviewEvent | null = null;
  private completedAt: string | null = null;
  readonly result = signal<MangaReviewResult | null>(null);
  constructor() {
    inject(DestroyRef).onDestroy(() => this.abandon());
    effect(() => { const workspace = this.workspace.active(); untracked(() => {if (this.owner && workspace !== this.owner) this.abandon();}); });
  }
  start(questions: readonly MangaReviewQuestion[]): void {
    if (this.busy() || !questions.length) return;
    this.abandon(); this.owner = this.workspace.active();
    this.sessionId = crypto.randomUUID(); this.questions.set(structuredClone(questions)); this.initialCount = questions.length;
    this.clock.reset(); this.state.set('question'); this.clock.attach(); this.clock.startAppearance();
  }
  reveal(): void { if (this.state() === 'question' && !this.busy() && this.validOwner()) {this.revealed.set(true); this.clock.pause();} }
  retryAnswer(): Promise<void> { return this.answer(this.pending?.correct ?? false); }
  private validOwner(): boolean {
    if (this.owner === this.workspace.active()) return true;
    this.abandon(); return false;
  }
  async answer(correct: boolean): Promise<void> {
    if (this.state() !== 'question' || this.busy() || !this.validOwner()) return;
    if (!this.current().options.length && !this.revealed()) return;
    this.busy.set(true); this.error.set(false);
    if (!this.pending) {
      this.clock.commitAppearance(); this.clock.pause();
      const q = this.current();
      this.pending = {id: `${this.sessionId}:${this.index()}`, key: q.item.id, savedItemId: q.item.id, sessionId: this.sessionId,
        reviewedAt: new Date().toISOString(), exerciseType: q.type, correct, repetition: this.index() >= this.initialCount,
        answerMode: q.options.length ? 'automatic' : 'self-assessment', rating: correct ? 'good' : 'again'};
    }
    const event = this.pending;
    try {
      await this.history.record(event, this.owner!);
      if (!this.validOwner()) return;
      this.answers.push(event); this.pending = null; this.correct.set(event.correct);
      if (!event.correct && !event.repetition) this.questions.update(questions => [...questions, structuredClone(this.current())]);
      this.state.set('feedback');
    } catch { if (this.owner === this.workspace.active()) this.error.set(true); }
    finally { this.busy.set(false); }
  }
  async next(): Promise<void> {
    if (this.state() !== 'feedback' || this.busy() || !this.validOwner()) return;
    if (this.index() + 1 < this.questions().length) {
      this.index.update(index => index + 1); this.revealed.set(false); this.error.set(false);
      this.state.set('question'); this.clock.attach(); this.clock.startAppearance(); return;
    }
    this.busy.set(true); this.error.set(false);
    const first = this.answers.filter(event => !event.repetition), repeated = this.answers.filter(event => event.repetition);
    const firstCorrect = first.filter(event => event.correct).length, recovered = repeated.filter(event => event.correct).length;
    const result: MangaReviewResult = {uniqueWords: this.initialCount, firstCorrect, initialErrors: this.initialCount - firstCorrect,
      recovered, remainingErrors: this.initialCount - firstCorrect - recovered, appearances: this.answers.length,
      accuracy: Math.round(firstCorrect / this.initialCount * 100)};
    this.completedAt ??= new Date().toISOString();
    try {
      this.sessions.record({module: 'manga', sessionId: this.sessionId, completedAt: this.completedAt, mode: 'quick-practice',
        exercisesCompleted: this.initialCount, firstTrySuccesses: firstCorrect, attempts: this.answers.length,
        needsPracticeCount: result.remainingErrors, durationSeconds: this.clock.committedSeconds, mangaResult: result}, {strict: true});
      this.result.set(result); this.state.set('results'); this.clock.detach();
    } catch { this.error.set(true); }
    finally { this.busy.set(false); }
  }
  abandon(): void {
    this.clock.detach(); this.clock.discardAppearance(); this.owner = null; this.pending = null; this.answers = [];
    this.questions.set([]); this.index.set(0); this.revealed.set(false); this.completedAt = null;
    this.result.set(null); this.error.set(false); this.state.set('intro');
  }
}
