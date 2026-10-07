import {grammarConceptId} from '../../features/grammar/data/grammar-catalog';
import { TestBed } from '@angular/core/testing';
import { GRAMMAR_PROGRESS_KEY, emptyGrammarProgress } from '../models/grammar-progress.model';
import { GRAMMAR_LESSONS, GRAMMAR_PRACTICES, GRAMMAR_SESSIONS } from '../../features/grammar/data/grammar-catalog';
import { grammarLessonExercises } from '../../features/grammar/models/grammar.model';
import { GrammarProgressService } from './grammar-progress.service';
import { StorageService } from './storage.service';
import { SyncOutboxService } from './sync-outbox.service';
import { WorkspaceService } from './workspace.service';
import { mergeGrammarProgress } from './sync-merge';

describe('Persistent grammar participation and difficulties', () => {
  let progress: GrammarProgressService;
  const lesson = GRAMMAR_LESSONS.find(lesson => lesson.topicId === '06' && lesson.id === '1')!;
  const exercises = grammarLessonExercises(lesson);
  const answerAll = (id: string, correct = true): void => {
    const lesson = GRAMMAR_LESSONS.find(lesson => grammarConceptId(lesson) === id)!;
    progress.openLesson(id);
    grammarLessonExercises(lesson).forEach((exercise, index) => progress.recordAnswer(id, lesson.topicId, exercise.id, index, correct));
  };
  const reload = (value?: unknown): void => {
    if (value !== undefined) localStorage.setItem(GRAMMAR_PROGRESS_KEY, JSON.stringify(value));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({providers: [{provide: SyncOutboxService, useValue: {enqueue: vi.fn().mockResolvedValue(undefined)}}]});
    progress = TestBed.inject(GrammarProgressService); TestBed.tick();
  };
  beforeEach(() => { localStorage.clear(); reload(); });
  afterEach(() => { TestBed.resetTestingModule(); vi.useRealTimers(); });

  it('starts at zero and the first V2 concept without creating empty records', () => {
    expect(progress.conceptStatus('06.1')).toBe('not-started');
    expect(progress.completedSessions()).toBe(0); expect(progress.totalSessions).toBe(82);
    expect(progress.continuePath()).toBe('/grammar/n5/01/sentence-structure-context');
    expect(localStorage.getItem(GRAMMAR_PROGRESS_KEY)).toBeNull();
  });
  it('marks the first answer in progress and persists the actual answer', () => {
    progress.recordAnswer('06.1', '06', exercises[0].id, 0, true);
    expect(progress.conceptStatus('06.1')).toBe('in-progress');
    expect(JSON.parse(localStorage.getItem(GRAMMAR_PROGRESS_KEY)!).concepts['06.1'].answers[exercises[0].id].correct).toBe(true);
  });
  it('requires every current exercise, including the final one', () => {
    exercises.slice(0, -1).forEach((exercise, index) => progress.recordAnswer('06.1', '06', exercise.id, index, true));
    expect(progress.conceptStatus('06.1')).toBe('in-progress');
    progress.recordAnswer('06.1', '06', exercises.at(-1)!.id, exercises.length - 1, true);
    expect(progress.conceptStatus('06.1')).toBe('completed');
  });
  it('completes even when all answers are incorrect and keeps the difficulty', () => {
    answerAll('06.1', false); expect(progress.conceptStatus('06.1')).toBe('completed');
    expect(progress.state().concepts['06.1'].completedAt).toBeDefined();
    expect(progress.difficulties().map(row => row.conceptId)).toEqual(['06.1']);
  });
  it('preserves completion and completedAt when a completed concept is revisited incorrectly', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-03T10:00:00Z')); answerAll('06.1');
    const completedAt = progress.state().concepts['06.1'].completedAt;
    vi.setSystemTime(new Date('2026-10-03T11:00:00Z')); progress.recordAnswer('06.1', '06', exercises[0].id, 0, false);
    expect(progress.conceptStatus('06.1')).toBe('completed'); expect(progress.state().concepts['06.1'].completedAt).toBe(completedAt);
  });
  it('derives a seven-concept session only when all seven are completed', () => {
    const session = GRAMMAR_SESSIONS.find(session => session.topicId === '06' && session.position === 1)!;
    expect(session.lessonIds).toHaveLength(7); expect(progress.sessionStatus(session)).toBe('not-started');
    answerAll('06.1'); expect(progress.sessionStatus(session)).toBe('in-progress');
    session.lessonIds.slice(1, -1).forEach(id => answerAll(`06.${id}`)); expect(progress.sessionStatus(session)).toBe('in-progress');
    answerAll(`06.${session.lessonIds.at(-1)}`); expect(progress.sessionStatus(session)).toBe('completed');
    expect(progress.topicProgress('06')).toEqual({completed: 1, total: 4}); expect(progress.completedSessions()).toBe(1);
  });
  it('combines 82 sessions and 116 concepts in the incremental catalog', () => {
    expect(GRAMMAR_SESSIONS).toHaveLength(82); expect(GRAMMAR_LESSONS).toHaveLength(116);
    expect(GRAMMAR_SESSIONS.reduce((sum, session) => sum + session.lessonIds.length, 0)).toBe(116);
    expect(GRAMMAR_LESSONS.flatMap(grammarLessonExercises).length + GRAMMAR_PRACTICES.flatMap(practice => practice.exercises).length).toBe(571);
  });
  it('persists an exact index and restores it after a service/app reload', () => {
    progress.recordAnswer('06.1', '06', exercises[0].id, 0, true);
    progress.recordAnswer('06.1', '06', exercises[1].id, 1, true); progress.saveResume('06.1', 2); reload();
    expect(progress.resumeIndex('06.1')).toBe(2); expect(progress.continuePath()).toBe('/grammar/n5/06/1');
    expect(progress.state().resume?.path).toBe('/grammar/n5/06/1'); expect(progress.conceptStatus('06.1')).toBe('in-progress');
  });
  it('saving navigation alone does not start a concept', () => {
    progress.saveResume('06.1', 2); expect(progress.conceptStatus('06.1')).toBe('not-started');
    expect(progress.state().concepts).toEqual({});
  });
  it.each([-1, 999, 1.5, NaN])('falls back to zero for an invalid saved index %s', index => {
    reload({...emptyGrammarProgress(), resume: {conceptId: '06.1', path: '/grammar/n5/06/1', exerciseIndex: index, updatedAt: '2026-10-03T10:00:00Z'}});
    expect(progress.resumeIndex('06.1')).toBe(0);
  });
  it('ignores a resume whose path does not identify its current concept', () => {
    reload({...emptyGrammarProgress(), resume: {conceptId: '06.1', path: '/grammar/n5/06/2', exerciseIndex: 2, updatedAt: '2026-10-03T10:00:00Z'}});
    expect(progress.continuePath()).toBe('/grammar/n5/01/sentence-structure-context'); expect(progress.state().resume).toBeUndefined();
  });
  it('continues by curriculum order when the saved concept is completed', () => {
    answerAll('sentence-structure-context'); expect(progress.continuePath()).toBe('/grammar/n5/01/state-being-plain');
  });
  it('continues to review when every concept is completed and difficulties remain', () => {
    GRAMMAR_LESSONS.forEach(lesson => answerAll(grammarConceptId(lesson)));
    progress.flagDifficulty('06.1', exercises[0].id);
    expect(progress.completedSessions()).toBe(82); expect(progress.continuePath()).toBe('/grammar/review');
  });
  it('continues to final practice when the course is complete with no difficulties', () => {
    GRAMMAR_LESSONS.forEach(lesson => answerAll(grammarConceptId(lesson)));
    expect(progress.continuePath()).toBe('/grammar/n5/10/practice');
  });
  it('a normal correct answer never clears an earlier difficulty', () => {
    progress.recordAnswer('06.1', '06', exercises[0].id, 0, false);
    progress.recordAnswer('06.1', '06', exercises[0].id, 0, true);
    expect(progress.state().review['06.1'].active).toBe(true);
    expect(progress.state().review['06.1'].lastFailedExerciseId).toBe(exercises[0].id);
  });
  it('clears only concepts whose entire selected review was correct', () => {
    progress.flagDifficulty('06.1', exercises[0].id);
    progress.finishReview(exercises.slice(1, 3).map(exercise => ({conceptId: '06.1', exerciseId: exercise.id, correct: true})));
    expect(progress.state().review['06.1'].active).toBe(false); expect(progress.state().review['06.1'].clearedAt).toBeDefined();
    expect(progress.conceptStatus('06.1')).toBe('not-started');
  });
  it('keeps a difficulty active when even one selected exercise fails', () => {
    progress.flagDifficulty('06.1', exercises[0].id);
    progress.finishReview(exercises.slice(1, 3).map((exercise, index) => ({conceptId: '06.1', exerciseId: exercise.id, correct: index === 0})));
    expect(progress.state().review['06.1'].active).toBe(true);
  });
  it('avoids the last failed exercise if alternatives exist', () => {
    progress.flagDifficulty('06.1', exercises[0].id); const round = progress.buildReview();
    expect(round).toHaveLength(2); expect(round.every(exercise => exercise.id !== exercises[0].id && exercise.conceptId === '06.1')).toBe(true);
  });
  it('caps global review at twelve existing exercises', () => {
    GRAMMAR_LESSONS.slice(0, 20).forEach(lesson => progress.flagDifficulty(grammarConceptId(lesson), lesson.exercise.id));
    expect(progress.buildReview()).toHaveLength(12);
    expect(new Set(progress.buildReview().map(exercise => exercise.conceptId)).size).toBe(12);
  });
  it('does not fabricate a round when there are no difficulties', () => expect(progress.buildReview()).toEqual([]));
  it('persists the original complete practice score', () => {
    const practice = GRAMMAR_PRACTICES.find(p=>p.topicId==='05')!; progress.recordPractice(practice.topicId, 8, 10, ['05.1'], '2026-10-03T10:00:00Z'); reload();
    expect(progress.state().practices['05']).toMatchObject({score: 8, total: 10, errorConceptIds: ['05.1']});
  });
  it('error review never replaces the original full practice score', () => {
    progress.recordPractice('05', 8, 10, ['05.1'], '2026-10-03T10:00:00Z');
    const exercise = GRAMMAR_PRACTICES.find(p=>p.topicId==='05')!.exercises[0];
    progress.flagDifficulty(exercise.conceptId!, exercise.id); progress.finishReview([{conceptId: exercise.conceptId!, exerciseId: exercise.id, correct: true}]);
    expect(progress.state().practices['05'].score).toBe(8); expect(progress.state().practices['05'].total).toBe(10);
  });
  it('practice errors can flag difficulties without completing lesson exercises', () => {
    const exercise = GRAMMAR_PRACTICES.find(p=>p.topicId==='05')!.exercises[0]; progress.flagDifficulty(exercise.conceptId!, exercise.id);
    expect(progress.difficulties()).toHaveLength(1); expect(progress.state().concepts).toEqual({});
  });
  it('ignores invalid topic/exercise/index combinations', () => {
    progress.recordAnswer('06.1', '00', exercises[0].id, 0, true);
    progress.recordAnswer('06.1', '06', exercises[0].id, 1, true);
    progress.flagDifficulty('06.1', 'unknown'); expect(progress.state()).toEqual(emptyGrammarProgress());
  });
  it('ignores corrupt storage and unknown IDs without writing over the original', () => {
    localStorage.setItem(GRAMMAR_PROGRESS_KEY, '{broken'); reload(); expect(progress.state()).toEqual(emptyGrammarProgress());
    expect(localStorage.getItem(GRAMMAR_PROGRESS_KEY)).toBe('{broken');
    reload({...emptyGrammarProgress(), review: {'99.1': {conceptId: '99.1', topicId: '99', active: true, updatedAt: '2026-10-03T10:00:00Z'}}});
    expect(progress.difficulties()).toEqual([]);
  });
  it('does not trust completed if the current exercise IDs are not all answered', () => {
    answerAll('06.1'); const state = structuredClone(progress.state()); delete state.concepts['06.1'].answers[exercises.at(-1)!.id];
    state.concepts['06.1'].answers['removed-exercise'] = {correct: true, answeredAt: '2026-10-03T10:00:00Z'}; reload(state);
    expect(progress.conceptStatus('06.1')).toBe('in-progress'); expect(progress.state().concepts['06.1'].completedAt).toBeUndefined();
    expect(progress.state().concepts['06.1'].answers['removed-exercise']).toBeUndefined();
  });
  it('reloads merged cloud progress into its signals', () => {
    const state = emptyGrammarProgress(); state.review['06.1'] = {conceptId: '06.1', topicId: '06', active: true, updatedAt: '2026-10-03T10:00:00Z'};
    TestBed.inject(StorageService).setFromCloud(GRAMMAR_PROGRESS_KEY, state); TestBed.tick(); expect(progress.difficulties()).toHaveLength(1);
  });
  it('isolates guest and two accounts and restores each workspace', () => {
    progress.recordAnswer('06.1', '06', exercises[0].id, 0, true); const workspace = TestBed.inject(WorkspaceService);
    workspace.activateUser('carlos'); TestBed.tick(); expect(progress.conceptStatus('06.1')).toBe('not-started');
    answerAll('06.1'); workspace.activateUser('nora'); TestBed.tick(); expect(progress.conceptStatus('06.1')).toBe('not-started');
    workspace.activateGuest(); TestBed.tick(); expect(progress.conceptStatus('06.1')).toBe('in-progress');
    workspace.activateUser('carlos'); TestBed.tick(); expect(progress.conceptStatus('06.1')).toBe('completed');
  });
  it('imports guest Grammar progress by merging an existing account without deleting guest', () => {
    answerAll('05.1'); const workspace = TestBed.inject(WorkspaceService);
    workspace.activateUser('carlos'); TestBed.tick(); answerAll('06.1');
    workspace.copyGuestLocalStorageToUser('carlos'); TestBed.tick();
    expect(progress.conceptStatus('05.1')).toBe('completed'); expect(progress.conceptStatus('06.1')).toBe('completed');
    workspace.activateGuest(); TestBed.tick(); expect(progress.conceptStatus('05.1')).toBe('completed'); expect(progress.conceptStatus('06.1')).toBe('not-started');
  });
  it('does not treat resume-only data as answered guest progress', () => {
    progress.saveResume('06.1', 2); expect(TestBed.inject(WorkspaceService).hasGuestProgress()).toBe(false);
    progress.recordAnswer('06.1', '06', exercises[0].id, 0, true); expect(TestBed.inject(WorkspaceService).hasGuestProgress()).toBe(true);
  });
  it('answer then close before Continue resumes at the next unanswered exercise', () => {
    progress.recordAnswer('06.1', '06', exercises[0].id, 0, false);
    expect(progress.state().resume?.exerciseIndex).toBe(1);
    reload(); expect(progress.resumeIndex('06.1')).toBe(1);
    expect(progress.state().resume?.exerciseIndex).toBe(1);
  });
  it('uses the first real gap after merging answers one, two and four', () => {
    progress.recordAnswer('06.1', '06', exercises[0].id, 0, true);
    progress.recordAnswer('06.1', '06', exercises[1].id, 1, true);
    const local = structuredClone(progress.state());
    const remote = structuredClone(local);
    remote.concepts['06.1'].answers = {[exercises[3].id]: {correct: true, answeredAt: new Date().toISOString()}};
    remote.resume!.exerciseIndex = 4;
    reload(mergeGrammarProgress(local, remote));
    expect(progress.firstPendingExerciseIndex('06.1')).toBe(2);
    expect(progress.resumeIndex('06.1')).toBe(2);
  });
  it('opens a partial concept at its first pending exercise even with a different global resume', () => {
    progress.recordAnswer('06.1', '06', exercises[0].id, 0, true);
    progress.saveResume('05.1', 0);
    expect(progress.state().resume?.conceptId).toBe('05.1');
    expect(progress.resumeIndex('06.1')).toBe(1);
  });
  it('always opens manually completed concepts at zero without changing completion', () => {
    answerAll('06.1'); const completedAt = progress.state().concepts['06.1'].completedAt;
    progress.saveResume('06.1', 3); reload();
    expect(progress.resumeIndex('06.1')).toBe(0);
    expect(progress.conceptStatus('06.1')).toBe('completed'); expect(progress.state().concepts['06.1'].completedAt).toBe(completedAt);
  });
  it('treats a newly required current exercise as pending despite older completed metadata', () => {
    answerAll('06.1'); const olderCurriculum = structuredClone(progress.state());
    delete olderCurriculum.concepts['06.1'].answers[exercises.at(-1)!.id];
    olderCurriculum.resume!.exerciseIndex = 0; reload(olderCurriculum);
    expect(progress.conceptStatus('06.1')).toBe('in-progress');
    expect(progress.resumeIndex('06.1')).toBe(exercises.length - 1);
  });
  it('guest import reactively respects both newer cleared and newer active difficulty marks', () => {
    const guest = emptyGrammarProgress(), account = emptyGrammarProgress();
    const early = '2026-10-03T10:00:00Z', late = '2026-10-03T11:00:00Z';
    guest.review['05.1'] = {conceptId: '05.1', topicId: '05', active: true, updatedAt: early};
    guest.review['06.1'] = {conceptId: '06.1', topicId: '06', active: true, updatedAt: late};
    account.review['05.1'] = {conceptId: '05.1', topicId: '05', active: false, clearedAt: late, updatedAt: late};
    account.review['06.1'] = {conceptId: '06.1', topicId: '06', active: false, clearedAt: early, updatedAt: early};
    reload(guest); const originalGuest = localStorage.getItem(GRAMMAR_PROGRESS_KEY);
    const workspace = TestBed.inject(WorkspaceService); workspace.activateUser('carlos'); TestBed.tick();
    TestBed.inject(StorageService).setFromCloud(GRAMMAR_PROGRESS_KEY, account); TestBed.tick();
    workspace.copyGuestLocalStorageToUser('carlos'); TestBed.tick();
    expect(progress.state().review['05.1'].active).toBe(false); expect(progress.state().review['06.1'].active).toBe(true);
    expect(localStorage.getItem(GRAMMAR_PROGRESS_KEY)).toBe(originalGuest);
    const revision = workspace.dataRevision(); workspace.copyGuestLocalStorageToUser('carlos');
    expect(workspace.dataRevision()).toBe(revision);
  });
});
