import { Injectable, InjectionToken, computed, inject, signal } from '@angular/core';
import { GrammarExercise } from '../models/grammar.model';
import { shuffleGrammar, shuffleGrammarExercise } from './grammar-shuffle';

export const GRAMMAR_RANDOM=new InjectionToken<()=>number>('GRAMMAR_RANDOM',{providedIn:'root',factory:()=>Math.random});

// Component-scoped, transient practice state. Does not read or write saved study progress.
@Injectable()
export class GrammarPracticeSession {
  private readonly random=inject(GRAMMAR_RANDOM);
  private original:readonly GrammarExercise[]=[];
  private readonly questions = signal<readonly GrammarExercise[]>([]);
  readonly stage = signal<'intro' | 'question' | 'results'>('intro');
  readonly index = signal(0);
  readonly answers = signal<readonly boolean[]>([]);
  readonly current = computed(() => this.questions()[this.index()] ?? null);
  readonly total = computed(() => this.questions().length);
  readonly score = computed(() => this.answers().filter(Boolean).length);
  readonly checked = computed(() => this.answers().length > this.index());
  readonly failures=signal<readonly GrammarExercise[]>([]);
  readonly reviewing=signal(false);
  readonly errorConcepts=computed(()=>Array.from(new Map(this.failures().map(e=>[e.conceptId??e.id,e])).values()));
  reset(questions: readonly GrammarExercise[]): void {
    this.original=questions;this.questions.set(questions);this.index.set(0);this.answers.set([]);this.failures.set([]);this.reviewing.set(false);this.stage.set('intro');
  }
  start():void {this.reviewing.set(false);this.startRound(this.original);}
  reviewErrors():void {
    if(this.stage()!=='results'||!this.failures().length)return;
    const questions=this.failures();this.reviewing.set(true);this.startRound(questions);
  }
  private startRound(questions:readonly GrammarExercise[]):void {
    this.questions.set(shuffleGrammar(questions,this.random).map(e=>shuffleGrammarExercise(e,this.random)));
    this.index.set(0);this.answers.set([]);this.failures.set([]);this.stage.set(questions.length?'question':'results');
  }
  answer(correct: boolean): void {
    if (this.stage() !== 'question' || this.checked()) return;
    this.answers.update(answers => [...answers, correct]);
    if(!correct&&this.current())this.failures.update(failed=>[...failed,this.current()!]);
  }
  next(): void {
    if (this.stage()!=='question'||!this.checked()) return;
    if (this.index()+1 < this.total()) this.index.update(index => index+1);
    else this.stage.set('results');
  }
  resultKey(): string {
    const ratio = this.total() ? this.score()/this.total() : 0;
    return ratio===1?'grammar.scorePerfect':ratio>=.8?'grammar.scoreGood':ratio>=.6?'grammar.scoreBase':'grammar.scoreLow';
  }
}
