import {grammarConceptId} from '../data/grammar-catalog';
import { WeaknessRecord } from '../../../core/models/weakness.model';
import { GrammarExercise } from '../models/grammar.model';
import { GRAMMAR_LESSONS, GRAMMAR_TOPICS } from '../data/grammar-catalog';
import { GRAMMAR_PRACTICE_CATALOG } from './grammar-interactive-catalog';

export const GRAMMAR_QUESTION_TYPES = ['particle','fill-gap','sentence-order','conjugation','multiple-choice','sentence-builder','detect-error','select-segment','matching'] as const;
const sourceById=new Map(GRAMMAR_PRACTICE_CATALOG.map(e=>[e.id,e]));
/** Lesson numbers are topic-scoped; use the existing qualified concept identifier. */
export function grammarWeaknessIdentity(exercise:GrammarExercise):{itemId:string;questionType:string}|null {
  const source=sourceById.get(exercise.id);
  const topic=exercise.topicId??source?.topicId??exercise.conceptId?.split('.')[0];
  if(!topic||topic==='00'||!GRAMMAR_TOPICS.some(t=>t.id===topic))return null;
  const lessonId=exercise.lessonId??source?.lessonId;
  const concept=exercise.version===2?exercise.conceptId:lessonId?`${topic}.${lessonId}`:exercise.conceptId??source?.conceptId;
  const itemId=concept&&GRAMMAR_LESSONS.some(l=>grammarConceptId(l)===concept)?concept:topic;
  return {itemId,questionType:exercise.exerciseType??source?.exerciseType??exercise.kind};
}
export function grammarWeaknessTitleKey(itemId:string):string|null {
  return GRAMMAR_LESSONS.find(l=>grammarConceptId(l)===itemId)?.titleKey??GRAMMAR_TOPICS.find(t=>t.id===itemId)?.titleKey??null;
}
export function grammarQuestionLabelKey(questionType:string):string {
  return (GRAMMAR_QUESTION_TYPES as readonly string[]).includes(questionType)?`grammar.weakness.type.${questionType}`:'grammar.exercise';
}
export function grammarFocusedExercises(records:readonly WeaknessRecord[]):readonly GrammarExercise[] {
  const weak=records.filter(r=>r.module==='grammar'&&r.activity==='learn'&&r.score>=3&&grammarWeaknessTitleKey(r.itemId));
  const exact:GrammarExercise[]=[],fallback:GrammarExercise[]=[];
  for(const record of weak){
    const pool=GRAMMAR_PRACTICE_CATALOG.filter(e=>(GRAMMAR_LESSONS.some(l=>grammarConceptId(l)===record.itemId)?grammarWeaknessIdentity(e)?.itemId===record.itemId:e.topicId===record.itemId));
    exact.push(...pool.filter(e=>grammarWeaknessIdentity(e)?.questionType===record.questionType));
    fallback.push(...pool);
  }
  return [...new Map([...exact,...fallback].map(e=>[e.id,e])).values()].slice(0,10);
}
