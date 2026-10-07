import {grammarConceptId} from '../data/grammar-catalog';
import { GRAMMAR_INTERACTIVE } from '../data/grammar-interactive';
import { GRAMMAR_LESSONS, GRAMMAR_PRACTICES } from '../data/grammar-catalog';
import { GrammarExercise, grammarLessonExercises } from '../models/grammar.model';

const adapted = new Map(GRAMMAR_INTERACTIVE.map(exercise => [exercise.id, exercise]));
export const GRAMMAR_PRACTICE_CATALOG: readonly GrammarExercise[] = [
  ...GRAMMAR_LESSONS.flatMap(lesson => grammarLessonExercises(lesson).map(exercise => adapted.get(exercise.id) ??
    {...exercise, topicId: lesson.topicId, lessonId: lesson.id, conceptId: grammarConceptId(lesson)})),
  ...GRAMMAR_PRACTICES.flatMap(practice => practice.exercises.map(exercise => ({...exercise, topicId: practice.topicId}))),
];
export function grammarTopicExercises(topicId: string, lessonId?: string): readonly GrammarExercise[] {
  return GRAMMAR_PRACTICE_CATALOG.filter(exercise => exercise.topicId === topicId && (!lessonId || exercise.lessonId === lessonId));
}
/** Mix topics round-robin, prioritizing reliable opened/answered concepts and difficulties. */
export function grammarMixedExercises(preferredConcepts: readonly string[] = [], difficulties: readonly GrammarExercise[] = []): readonly GrammarExercise[] {
  const preferred = new Set(preferredConcepts);
  const pool = [...difficulties, ...GRAMMAR_INTERACTIVE.filter(e=>Number(e.topicId)>=5), ...GRAMMAR_PRACTICE_CATALOG];
  const ordered = [...pool.filter(e => e.conceptId && preferred.has(e.conceptId)), ...pool];
  const groups = new Map<string, GrammarExercise[]>();
  const seen = new Set<string>();
  for (const exercise of ordered) {
    if (seen.has(exercise.id)) continue;
    seen.add(exercise.id);
    const topicId = exercise.topicId ?? exercise.conceptId?.split('.')[0];
    if (!topicId) continue;
    groups.set(topicId, [...groups.get(topicId) ?? [], {...exercise, topicId}]);
  }
  const result: GrammarExercise[] = [];
  const preferredGroups=[...groups.values()].map(group=>group.filter(e=>e.conceptId&&preferred.has(e.conceptId)));
  const preferredLimit=preferredGroups.filter(group=>group.length).length===1&&groups.size>1?8:10;
  while(result.length<preferredLimit&&preferredGroups.some(group=>group.length)){
    for(const group of preferredGroups){
      if(result.length===preferredLimit)break;
      const exercise=group.shift();if(exercise)result.push(exercise);
    }
  }
  for(const [topic,group] of groups)groups.set(topic,group.filter(e=>!result.some(chosen=>chosen.id===e.id)));
  while (result.length < 10 && [...groups.values()].some(group => group.length)) {
    for (const group of groups.values()) {
      if (result.length === 10) break;
      if (group.length) result.push(group.shift()!);
    }
  }
  return result;
}
export function grammarTopicRound(topicId: string, lessonId?: string): readonly GrammarExercise[] {
  if(topicId==='01'||topicId==='02'||topicId==='03'||topicId==='04')return lessonId?grammarTopicExercises(topicId,lessonId).filter(e=>!e.id.startsWith(`topic${topicId}-review-`)):GRAMMAR_PRACTICES.find(p=>p.topicId===topicId)!.exercises;
  const pool = grammarTopicExercises(topicId, lessonId);
  const prioritized = [...pool.filter(e => e.exerciseType), ...pool];
  return [...new Map(prioritized.map(e => [e.id, e])).values()].slice(0, 10);
}
