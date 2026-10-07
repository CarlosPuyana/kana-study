import {GrammarV2ProgressService} from './grammar-v2-progress.service';
import {grammarConceptId, grammarSessionConceptId} from '../../features/grammar/data/grammar-catalog';
import { computed, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { emptyGrammarProgress, GRAMMAR_PROGRESS_KEY, GrammarProgressStateV1, GrammarProgressStatus } from '../models/grammar-progress.model';
import { GRAMMAR_LESSONS, GRAMMAR_PRACTICES, GRAMMAR_SESSIONS } from '../../features/grammar/data/grammar-catalog';
import { GrammarExercise, GrammarStudySession, grammarLessonExercises } from '../../features/grammar/models/grammar.model';
import { readGrammarProgress } from './grammar-progress-state';
import { StorageService } from './storage.service';
import { WorkspaceService } from './workspace.service';

export interface GrammarReviewAnswer { conceptId: string; exerciseId: string; correct: boolean }
const concepts = new Map(GRAMMAR_LESSONS.map(lesson => [grammarConceptId(lesson), {lesson, exercises: grammarLessonExercises(lesson)}]));
const order = GRAMMAR_SESSIONS.flatMap(session => session.lessonIds.map(id => grammarSessionConceptId(session.topicId,id)));
const exerciseConcepts = new Map([...GRAMMAR_LESSONS.flatMap(lesson => grammarLessonExercises(lesson).map(exercise => [exercise.id, grammarConceptId(lesson)] as const)),
  ...GRAMMAR_PRACTICES.flatMap(practice => practice.exercises.map(exercise => [exercise.id, exercise.conceptId ?? exercise.id] as const))]);
const pathFor = (id: string): string => {const lesson=concepts.get(id)!.lesson;return `/grammar/n5/${lesson.topicId}/${lesson.id}`;};
function firstPendingIndex(conceptId: string, state: GrammarProgressStateV1): number {
  const exercises = concepts.get(conceptId)?.exercises ?? [];
  const answers = state.concepts[conceptId]?.answers ?? {};
  const pending = exercises.findIndex(exercise => !answers[exercise.id]);
  // Completed concepts open at zero for voluntary practice; never return -1.
  return pending >= 0 ? pending : 0;
}

/** Completion records observable participation, never mastery or scheduled retention. */
@Injectable({providedIn: 'root'})
export class GrammarProgressService {
  private readonly storage = inject(StorageService);
  private readonly workspace = inject(WorkspaceService);
  private readonly saved = signal(this.normalize(this.storage.get<unknown>(GRAMMAR_PROGRESS_KEY, null)));
  private readonly v2 = inject(GrammarV2ProgressService);
  readonly state = computed(() => {
    const legacy=this.saved(), modern=this.v2.state();
    const resume=!legacy.resume?modern.resume:!modern.resume?legacy.resume:legacy.resume.updatedAt>modern.resume.updatedAt?legacy.resume:modern.resume;
    return {...legacy,concepts:{...legacy.concepts,...modern.concepts},practices:{...legacy.practices,...modern.practices},review:{...legacy.review,...modern.review},resume};
  });
  openLesson(conceptId:string):void {if(this.v2.has(conceptId))this.v2.open(conceptId);}
  readonly difficulties = computed(() => Object.values(this.state().review).filter(row => row.active));
  readonly completedSessions = computed(() => GRAMMAR_SESSIONS.filter(session => this.sessionStatus(session) === 'completed').length);
  readonly totalSessions = GRAMMAR_SESSIONS.length;
  readonly continuePath = computed(() => {
    const resume = this.state().resume;
    if (resume && this.conceptStatus(resume.conceptId) !== 'completed') return resume.path;
    const pending = order.find(id => this.conceptStatus(id) !== 'completed');
    return pending ? pathFor(pending) : this.difficulties().length ? '/grammar/review' : '/grammar/n5/10/practice';
  });

  constructor() {
    effect(() => {
      this.workspace.active(); this.workspace.dataRevision(); this.storage.cloudRevision();
      untracked(() => this.saved.set(this.normalize(this.storage.get<unknown>(GRAMMAR_PROGRESS_KEY, null))));
    });
  }

  conceptStatus(conceptId: string): GrammarProgressStatus { return this.state().concepts[conceptId]?.status ?? 'not-started'; }
  statusSymbol(status: GrammarProgressStatus): string { return status === 'completed' ? '✓' : status === 'in-progress' ? '◐' : '○'; }
  sessionStatus(session: GrammarStudySession): GrammarProgressStatus {
    const statuses = session.lessonIds.map(id => this.conceptStatus(grammarSessionConceptId(session.topicId,id)));
    return statuses.every(status => status === 'completed') ? 'completed' : statuses.some(status => status !== 'not-started') ? 'in-progress' : 'not-started';
  }
  sessionDifficulties(session: GrammarStudySession): number { return session.lessonIds.filter(id => this.state().review[grammarSessionConceptId(session.topicId,id)]?.active).length; }
  topicProgress(topicId: string): {completed: number; total: number} {
    const sessions = GRAMMAR_SESSIONS.filter(session => session.topicId === topicId);
    return {completed: sessions.filter(session => this.sessionStatus(session) === 'completed').length, total: sessions.length};
  }
  firstPendingExerciseIndex(conceptId: string): number {
    return this.v2.has(conceptId)?this.v2.firstPending(conceptId):firstPendingIndex(conceptId, this.state());
  }
  resumeIndex(conceptId: string): number { return this.firstPendingExerciseIndex(conceptId); }
  saveResume(conceptId: string, _exerciseIndex: number): void {
    if(this.v2.has(conceptId)){this.v2.resume(conceptId);return;}
    const concept = concepts.get(conceptId);
    if (!concept) return;
    const safeIndex = this.firstPendingExerciseIndex(conceptId);
    this.write({...this.state(), resume: {conceptId, path: pathFor(conceptId), exerciseIndex: safeIndex, updatedAt: this.now()}});
  }
  recordAnswer(conceptId: string, topicId: string, exerciseId: string, exerciseIndex: number, correct: boolean): void {
    if(this.v2.has(conceptId)){if(concepts.get(conceptId)?.lesson.topicId===topicId)this.v2.record(conceptId,exerciseId,exerciseIndex,correct);return;}
    const concept = concepts.get(conceptId);
    if (!concept || concept.lesson.topicId !== topicId || concept.exercises[exerciseIndex]?.id !== exerciseId) return;
    const now = this.now(), old = this.state().concepts[conceptId];
    const answers = {...old?.answers, [exerciseId]: {correct, answeredAt: now}};
    const completed = concept.exercises.every(exercise => !!answers[exercise.id]);
    const record = {conceptId, topicId, status: completed ? 'completed' as const : 'in-progress' as const, startedAt: old?.startedAt ?? now, updatedAt: now,
      answers, lastExerciseIndex: exerciseIndex, ...(completed ? {completedAt: old?.completedAt ?? now} : {})};
    this.write({...this.state(), concepts: {...this.state().concepts, [conceptId]: record}});
    this.saveResume(conceptId, exerciseIndex);
    if (!correct) this.flagDifficulty(conceptId, exerciseId);
  }
  flagDifficulty(conceptId: string, exerciseId: string): void {
    if(this.v2.has(conceptId)){this.v2.flag(conceptId,exerciseId);return;}
    const concept = concepts.get(conceptId);
    if (!concept || exerciseConcepts.get(exerciseId) !== conceptId) return;
    const now = this.now(), old = this.state().review[conceptId];
    this.write({...this.state(), review: {...this.state().review, [conceptId]: {...old, conceptId, topicId: concept.lesson.topicId, active: true, updatedAt: now, flaggedAt: now, lastFailedExerciseId: exerciseId}}});
  }
  recordPractice(topicId: string, score: number, total: number, errorConceptIds: readonly string[], attemptedAt: string): void {
    if(topicId==='01'||topicId==='02'||topicId==='03'||topicId==='04'||topicId==='05'||topicId==='06'||topicId==='07'){this.v2.practice(score,total,errorConceptIds,attemptedAt,topicId);return;}
    const practice = GRAMMAR_PRACTICES.find(practice => practice.topicId === topicId);
    if (!practice || (!Number.isInteger(total) || total < 1 || total > practice.exercises.length) || score < 0 || score > total || !Number.isInteger(score) || !Number.isFinite(Date.parse(attemptedAt))) return;
    this.write({...this.state(), practices: {...this.state().practices, [topicId]: {topicId, score, total, attemptedAt, updatedAt: this.now(), errorConceptIds: [...new Set(errorConceptIds.filter(id => concepts.has(id) && id.startsWith(topicId + '.')))]}}});
  }
  /** Only call at the end of the selected round; a partial round cannot clear errors. */
  finishReview(answers: readonly GrammarReviewAnswer[]): void {
    const modern=answers.filter(a=>this.v2.has(a.conceptId));
    if(modern.length)this.v2.finishReview(modern);
    const grouped = new Map<string, GrammarReviewAnswer[]>();
    for (const answer of answers.filter(a=>!this.v2.has(a.conceptId))) {
      if (!concepts.has(answer.conceptId) || exerciseConcepts.get(answer.exerciseId) !== answer.conceptId) continue;
      grouped.set(answer.conceptId, [...grouped.get(answer.conceptId) ?? [], answer]);
    }
    const review = {...this.state().review}, now = this.now();
    for (const [conceptId, results] of grouped) {
      const failed = results.find(result => !result.correct);
      if (failed) {
        review[conceptId] = {...review[conceptId], conceptId, topicId: concepts.get(conceptId)!.lesson.topicId, active: true, updatedAt: now, flaggedAt: now, lastFailedExerciseId: failed.exerciseId};
      } else if (review[conceptId]) review[conceptId] = {...review[conceptId], active: false, updatedAt: now, clearedAt: now};
    }
    if (grouped.size) this.write({...this.state(), review});
  }
  buildReview(): GrammarExercise[] {
    const active = this.difficulties().slice().sort((a, b) => a.updatedAt.localeCompare(b.updatedAt) || a.conceptId.localeCompare(b.conceptId));
    const selected: GrammarExercise[] = [];
    const perConcept = active.length <= 6 ? 2 : 1;
    for (const difficulty of active) {
      if (selected.length >= 12) break;
      const available = concepts.get(difficulty.conceptId)!.exercises;
      const alternatives = available.filter(exercise => exercise.id !== difficulty.lastFailedExerciseId);
      const pool = alternatives.length ? alternatives : available;
      selected.push(...pool.slice(0, Math.min(perConcept, 12 - selected.length)).map(exercise => ({...exercise, conceptId: difficulty.conceptId})));
    }
    return selected;
  }

  private now(): string { return new Date().toISOString(); }
  private write(state: GrammarProgressStateV1): void { const legacy=this.normalize(state); this.saved.set(legacy); this.storage.set(GRAMMAR_PROGRESS_KEY, legacy); }
  private normalize(value: unknown): GrammarProgressStateV1 {
    const input = readGrammarProgress(value), state = emptyGrammarProgress();
    for (const [id, row] of Object.entries(input.concepts)) {
      const concept = concepts.get(id);
      if (!concept || concept.lesson.topicId !== row.topicId) continue;
      const answers = Object.fromEntries(Object.entries(row.answers).filter(([exerciseId]) => concept.exercises.some(exercise => exercise.id === exerciseId)));
      if (!Object.keys(answers).length) continue;
      const completed = concept.exercises.every(exercise => !!answers[exercise.id]);
      const {completedAt, ...rest} = row;
      state.concepts[id] = {...rest, answers, status: completed ? 'completed' : 'in-progress', lastExerciseIndex: row.lastExerciseIndex < concept.exercises.length ? row.lastExerciseIndex : 0,
        ...(completed ? {completedAt: completedAt ?? row.updatedAt} : {})};
    }
    for (const [id, row] of Object.entries(input.practices)) if (Number(id)>=8 && GRAMMAR_PRACTICES.some(practice => practice.topicId === id)) state.practices[id] = {...row, errorConceptIds: row.errorConceptIds.filter(id => concepts.has(id))};
    for (const [id, row] of Object.entries(input.review)) if (concepts.has(id)) {
      const {lastFailedExerciseId, ...rest} = row;
      state.review[id] = {...rest, ...(lastFailedExerciseId && exerciseConcepts.get(lastFailedExerciseId) === id ? {lastFailedExerciseId} : {})};
    }
    const resume = input.resume, concept = resume && concepts.get(resume.conceptId);
    if (resume && concept && resume.path === pathFor(resume.conceptId)) state.resume = {...resume, exerciseIndex: firstPendingIndex(resume.conceptId, state)};
    return state;
  }
}
