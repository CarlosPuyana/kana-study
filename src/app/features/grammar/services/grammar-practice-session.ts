import { Injectable, computed, signal } from '@angular/core';
import { GrammarExercise } from '../models/grammar.model';

// Component-scoped, transient practice state. Does not read or write saved study progress.
@Injectable()
export class GrammarPracticeSession {
  private readonly questions = signal<readonly GrammarExercise[]>([]);
  readonly stage = signal<'intro' | 'question' | 'results'>('intro');
  readonly index = signal(0);
  readonly answers = signal<readonly boolean[]>([]);
  readonly current = computed(() => this.questions()[this.index()] ?? null);
  readonly total = computed(() => this.questions().length);
  readonly score = computed(() => this.answers().filter(Boolean).length);
  readonly checked = computed(() => this.answers().length > this.index());
  reset(questions: readonly GrammarExercise[]): void {
    this.questions.set(questions);this.index.set(0);this.answers.set([]);this.stage.set('intro');
  }
  start(): void { this.index.set(0);this.answers.set([]);this.stage.set('question'); }
  answer(correct: boolean): void {
    if (this.stage() !== 'question' || this.checked()) return;
    this.answers.update(answers => [...answers, correct]);
  }
  next(): void {
    if (!this.checked()) return;
    if (this.index()+1 < this.total()) this.index.update(index => index+1);
    else this.stage.set('results');
  }
  resultKey(): string {
    const ratio = this.total() ? this.score()/this.total() : 0;
    return ratio===1?'grammar.scorePerfect':ratio>=.8?'grammar.scoreGood':ratio>=.6?'grammar.scoreBase':'grammar.scoreLow';
  }
}
