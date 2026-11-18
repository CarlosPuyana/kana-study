import { Injectable, computed, signal } from '@angular/core';

export interface PhraseRecallAnswer {
  readonly phraseId: string;
  readonly known: boolean;
  readonly round: number;
  readonly order: number;
}
export interface PhraseRecallRound {
  readonly number: number;
  readonly ids: readonly string[];
  readonly answers: Readonly<Partial<Record<string, PhraseRecallAnswer>>>;
}
const EMPTY_ROUND: PhraseRecallRound = { number: 1, ids: [], answers: {} };

/** Component-scoped RUSH answers. No persistence, dates or study-scheduler dependencies. */
@Injectable()
export class PhraseRecallSession {
  private readonly state = signal<readonly PhraseRecallRound[]>([]);
  private readonly undoStack = signal<readonly PhraseRecallAnswer[]>([]);
  readonly rounds = this.state.asReadonly();
  readonly round = computed(() => this.state().at(-1) ?? EMPTY_ROUND);
  readonly evaluated = computed(() => Object.values(this.round().answers).filter((a): a is PhraseRecallAnswer => !!a));
  readonly correct = computed(() => this.evaluated().filter(a => a.known).length);
  readonly failedIds = computed(() => this.round().ids.filter(id => this.round().answers[id]?.known === false));
  readonly complete = computed(() => this.round().ids.length > 0 && this.evaluated().length === this.round().ids.length);
  readonly percent = computed(() => this.evaluated().length ? Math.round(100 * this.correct() / this.evaluated().length) : 0);
  readonly canUndo = computed(() => this.undoStack().length > 0);

  initialize(ids: readonly string[]): void {
    this.state.set(ids.length ? [{ number: 1, ids: [...new Set(ids)], answers: {} }] : []);
    this.undoStack.set([]);
  }
  answer(id: string, known: boolean): boolean {
    const round = this.round();
    if (!round.ids.includes(id) || round.answers[id] || this.complete()) return false;
    const answer: PhraseRecallAnswer = { phraseId: id, known, round: round.number, order: round.ids.indexOf(id) + 1 };
    this.state.update(rounds => [...rounds.slice(0, -1), { ...round, answers: { ...round.answers, [id]: answer } }]);
    this.undoStack.update(stack => [...stack, answer]);
    return true;
  }
  undo(): PhraseRecallAnswer | undefined {
    const last = this.undoStack().at(-1);
    if (!last) return;
    const rounds = this.state().slice(0, last.round);
    const round = rounds.at(-1)!;
    const answers = { ...round.answers };
    delete answers[last.phraseId];
    this.state.set([...rounds.slice(0, -1), { ...round, answers }]);
    this.undoStack.update(stack => stack.slice(0, -1));
    return last;
  }
  repeatFailures(): boolean {
    const ids = this.failedIds();
    if (!this.complete() || !ids.length) return false;
    this.state.update(rounds => [...rounds, { number: this.round().number + 1, ids, answers: {} }]);
    return true;
  }
}
