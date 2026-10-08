import { DestroyRef, effect, inject, Injectable, signal, untracked, computed } from '@angular/core';
import { LocalWorkspaceId } from '../models/account.model';
import { isMangaFsrsEvent, MangaFsrsCard, MangaFsrsEvent, MangaFsrsRating, mangaFsrsGrade } from '../models/manga-fsrs.model';
import { WorkspaceService } from './workspace.service';
import { MangaReviewHistoryService } from './manga-review-history.service';
import { SessionHistoryService } from './session-history.service';
import { createStudyClock } from './study-clock';
import { MangaFsrsService } from './manga-fsrs.service';
import { mangaFsrsQueue } from './manga-fsrs-scheduler';

@Injectable()
export class MangaFsrsSessionService {
  private readonly workspace = inject(WorkspaceService);
  private readonly history = inject(MangaReviewHistoryService);
  private readonly sessions = inject(SessionHistoryService);
  private readonly fsrs = inject(MangaFsrsService);
  readonly clock = createStudyClock();
  readonly state = signal<'intro'|'question'|'results'>('intro');
  readonly revealed = signal(false);
  readonly busy = signal(false);
  readonly error = signal(false);
  readonly index = signal(0);
  readonly cards = signal<readonly MangaFsrsCard[]>([]);
  readonly current = computed(() => this.cards()[this.index()]);
  private owner: LocalWorkspaceId | null = null;
  private sessionId = '';
  private pending: MangaFsrsEvent | null = null;
  private answers: MangaFsrsEvent[] = [];
  private completedAt: string | null = null;
  constructor() {
    inject(DestroyRef).onDestroy(() => this.abandon());
    effect(() => {const workspace = this.workspace.active(), enabled = this.fsrs.enabled();
      untracked(() => {if (this.owner && (workspace !== this.owner || !enabled)) this.abandon();});});
  }
  start(): void {
    if (this.busy() || !this.fsrs.enabled()) return;
    const cards = mangaFsrsQueue(this.fsrs.cards(), Date.now());
    if (!cards.length) return;
    this.abandon(); this.owner = this.workspace.active(); this.sessionId = crypto.randomUUID();
    this.cards.set(structuredClone(cards)); this.clock.reset(); this.state.set('question');
    this.clock.attach(); this.clock.startAppearance();
  }
  reveal(): void {
    if (this.state() !== 'question' || this.busy() || this.revealed() || !this.validOwner()) return;
    this.clock.commitAppearance(); this.clock.pause(); this.revealed.set(true);
  }
  async rate(rating: MangaFsrsRating): Promise<void> {
    if (this.state() !== 'question' || !this.revealed() || this.busy() || !this.validOwner()) return;
    const grade = mangaFsrsGrade(rating);
    this.busy.set(true); this.error.set(false);
    if (!this.pending) {
      const item = this.current().item;
      this.pending = {id: `${this.sessionId}:${this.index()}`, key:item.id, savedItemId:item.id, sessionId:this.sessionId,
        reviewedAt:new Date().toISOString(), exerciseType:this.current().meaning ? 'meaning' : 'reading', correct:rating === 'good', repetition:false,
        answerMode:'self-assessment', rating, reviewKind:'fsrs', fsrsVersion:1, fsrsGrade:grade};
    }
    const event = this.pending;
    try {
      if (!isMangaFsrsEvent(event)) throw new Error('Invalid Manga FSRS review');
      await this.history.record(event, this.owner!);
      if (!this.validOwner()) return;
      this.answers.push(event); this.pending = null;
      this.advance();
    } catch {if (this.owner === this.workspace.active()) this.error.set(true);}
    finally {this.busy.set(false);}
  }
  retry(): Promise<void> {
    if (this.pending) return this.rate(this.pending.rating);
    if (this.error() && this.revealed()) {
      this.finish(); return Promise.resolve();
    }
    return Promise.resolve();
  }
  private advance(): void {
    // Remote reviews/removal can make a remaining word no longer due. Never
    // resurrect saved items or introduce the same word twice in this session.
    const eligible = new Set(mangaFsrsQueue(this.fsrs.cards(), Date.now()).map(row => row.item.id));
    let next = this.index() + 1;
    while (next < this.cards().length && !eligible.has(this.cards()[next].item.id)) next++;
    if (next >= this.cards().length) {this.finish(); return;}
    this.index.set(next); this.revealed.set(false); this.state.set('question'); this.clock.startAppearance();
  }
  private finish(): void {
    if (!this.validOwner()) return;
    this.completedAt ??= new Date().toISOString();
    try {
      const good = this.answers.filter(event => event.rating === 'good').length;
      this.sessions.record({module:'manga', mangaSessionKind:'fsrs', sessionId:this.sessionId, completedAt:this.completedAt,
        mode:'self-assessment', exercisesCompleted:this.answers.length, firstTrySuccesses:good, attempts:this.answers.length,
        needsPracticeCount:this.answers.length-good, durationSeconds:this.clock.committedSeconds}, {strict:true});
      this.clock.detach(); this.state.set('results'); this.error.set(false);
    } catch {this.error.set(true);}
  }
  private validOwner(): boolean {
    if (this.owner === this.workspace.active() && this.fsrs.enabled()) return true;
    this.abandon(); return false;
  }
  abandon(): void {
    this.clock.detach(); this.clock.discardAppearance(); this.owner = null; this.pending = null;
    this.answers = []; this.cards.set([]); this.index.set(0); this.revealed.set(false);
    this.completedAt = null; this.error.set(false); this.state.set('intro');
  }
}
