import { GrammarExercise, GrammarChoiceExercise } from '../models/grammar.model';

export interface GrammarAnswer {
  readonly selected: number | null;
  readonly text: string;
  readonly sequence: readonly number[];
  readonly matches: Readonly<Record<number,number>>;
}
export function isChoiceExercise(exercise: GrammarExercise): exercise is GrammarChoiceExercise {
  return exercise.kind==='multiple-choice'||exercise.kind==='select-segment'||exercise.kind==='detect-error';
}
export function normalizeGrammarAnswer(value:string):string {
  return value.normalize('NFKC').replace(/\s+/gu,'').replace(/[。.!！]+$/u,'');
}
export function grammarAnswerReady(exercise:GrammarExercise, answer:GrammarAnswer):boolean {
  if(isChoiceExercise(exercise))return answer.selected!==null;
  if(exercise.kind==='fill-gap')return normalizeGrammarAnswer(answer.text).length>0;
  if(exercise.kind==='matching')return exercise.pairs.every((_,i)=>answer.matches[i]!==undefined);
  return answer.sequence.length===exercise.solution.length;
}
export function isGrammarAnswerCorrect(exercise:GrammarExercise, answer:GrammarAnswer):boolean {
  if(!grammarAnswerReady(exercise,answer))return false;
  if(isChoiceExercise(exercise))return answer.selected===exercise.answer;
  if(exercise.kind==='fill-gap')return exercise.acceptedAnswers.some(value=>normalizeGrammarAnswer(value)===normalizeGrammarAnswer(answer.text));
  if(exercise.kind==='matching')return exercise.pairs.every((_,i)=>answer.matches[i]===i);
  return [exercise.solution,...exercise.acceptedOrders??[]].some(order=>answer.sequence.every((token,i)=>token===order[i]));
}
