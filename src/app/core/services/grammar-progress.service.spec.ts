import {grammarConceptId} from '../../features/grammar/data/grammar-catalog';
import { TestBed } from '@angular/core/testing';
import { GRAMMAR_PROGRESS_V2_KEY as GRAMMAR_PROGRESS_KEY } from '../models/grammar-v2.model';
import { GrammarV2ProgressService } from './grammar-v2-progress.service';
const emptyGrammarProgress=():ReturnType<GrammarV2ProgressService['state']>=>({version:2,concepts:{},practices:{},review:{}});
import {emptyGrammarProgress as emptyV1,GRAMMAR_PROGRESS_KEY as V1_KEY} from '../models/grammar-progress.model';
import { GRAMMAR_LESSONS, GRAMMAR_PRACTICES, GRAMMAR_SESSIONS } from '../../features/grammar/data/grammar-catalog';
import { grammarLessonExercises } from '../../features/grammar/models/grammar.model';
import { GrammarProgressService } from './grammar-progress.service';
import { StorageService } from './storage.service';
import { SyncOutboxService } from './sync-outbox.service';
import { WorkspaceService } from './workspace.service';


describe('Persistent grammar participation and difficulties', () => {
  let progress: GrammarProgressService;
  const lesson = GRAMMAR_LESSONS.find(lesson => lesson.id === 'change-naru')!;
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
    expect(progress.conceptStatus('change-naru')).toBe('not-started');
    expect(progress.completedSessions()).toBe(0); expect(progress.totalSessions).toBe(94);
    expect(progress.continuePath()).toBe('/grammar/n5/01/sentence-structure-context');
    expect(localStorage.getItem(GRAMMAR_PROGRESS_KEY)).toBeNull();
  });
  it('marks the first answer in progress and persists the actual answer', () => {
    progress.recordAnswer('change-naru', '10', exercises[0].id, 0, true);
    expect(progress.conceptStatus('change-naru')).toBe('in-progress');
    expect(JSON.parse(localStorage.getItem(GRAMMAR_PROGRESS_KEY)!).concepts['change-naru'].answers[exercises[0].id].correct).toBe(true);
  });
  it('requires every current exercise, including the final one', () => {
    exercises.slice(0, -1).forEach((exercise, index) => progress.recordAnswer('change-naru', '10', exercise.id, index, true));
    expect(progress.conceptStatus('change-naru')).toBe('in-progress');
    progress.openLesson('change-naru'); progress.recordAnswer('change-naru', '10', exercises.at(-1)!.id, exercises.length - 1, true);
    expect(progress.conceptStatus('change-naru')).toBe('completed');
  });
  it('keeps all incorrect answers pending and preserves the difficulty', () => {
    answerAll('change-naru', false); expect(progress.conceptStatus('change-naru')).toBe('in-progress');
    expect(progress.state().concepts['change-naru'].completedAt).toBeUndefined();
    expect(progress.difficulties().map(row => row.conceptId)).toEqual(['change-naru']);
  });
  it('preserves completion and completedAt when a completed concept is revisited incorrectly', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-03T10:00:00Z')); answerAll('change-naru');
    const completedAt = progress.state().concepts['change-naru'].completedAt;
    vi.setSystemTime(new Date('2026-10-03T11:00:00Z')); progress.recordAnswer('change-naru', '10', exercises[0].id, 0, false);
    expect(progress.conceptStatus('change-naru')).toBe('completed'); expect(progress.state().concepts['change-naru'].completedAt).toBe(completedAt);
  });
  it('derives a semantic session from its complete concept without counting Bridge', () => {
    const session=GRAMMAR_SESSIONS.find(s=>s.topicId==='10'&&s.position===1)!;
    expect(session.lessonIds).toEqual(['experience-ta-koto-ga-aru']);expect(progress.sessionStatus(session)).toBe('not-started');
    progress.openLesson('experience-ta-koto-ga-aru');expect(progress.sessionStatus(session)).toBe('in-progress');
    answerAll('experience-ta-koto-ga-aru');expect(progress.sessionStatus(session)).toBe('completed');
    expect(progress.topicProgress('10')).toEqual({completed:1,total:7});expect(progress.completedSessions()).toBe(1);
  });
  it('combines 97 sessions and 97 concepts in the incremental catalog', () => {
    expect(GRAMMAR_SESSIONS).toHaveLength(97); expect(GRAMMAR_LESSONS).toHaveLength(97);
    expect(GRAMMAR_SESSIONS.reduce((sum, session) => sum + session.lessonIds.length, 0)).toBe(97);
    expect(GRAMMAR_LESSONS.flatMap(grammarLessonExercises).length + GRAMMAR_PRACTICES.flatMap(practice => practice.exercises).length).toBe(651);
  });
  it('persists an exact index and restores it after a service/app reload', () => {
    progress.recordAnswer('change-naru', '10', exercises[0].id, 0, true);
    progress.recordAnswer('change-naru', '10', exercises[1].id, 1, true); progress.saveResume('change-naru', 2); reload();
    expect(progress.resumeIndex('change-naru')).toBe(2); expect(progress.continuePath()).toBe('/grammar/n5/10/change-naru');
    expect(progress.state().resume?.path).toBe('/grammar/n5/10/change-naru'); expect(progress.conceptStatus('change-naru')).toBe('in-progress');
  });
  it('saving navigation alone does not start a concept', () => {
    progress.saveResume('change-naru', 2); expect(progress.conceptStatus('change-naru')).toBe('not-started');
    expect(progress.state().concepts).toEqual({});
  });
  it.each([-1, 999, 1.5, NaN])('falls back to zero for an invalid saved index %s', index => {
    reload({...emptyGrammarProgress(), resume: {conceptId: 'change-naru', path: '/grammar/n5/10/change-naru', exerciseIndex: index, updatedAt: '2026-10-03T10:00:00Z'}});
    expect(progress.resumeIndex('change-naru')).toBe(0);
  });
  it('rebuilds the canonical path from the semantic resume identity', () => {
    reload({...emptyGrammarProgress(), resume: {conceptId: 'change-naru', path: '/grammar/n5/10/choice-ni-suru', exerciseIndex: 2, updatedAt: '2026-10-03T10:00:00Z'}});
    expect(progress.continuePath()).toBe('/grammar/n5/10/change-naru'); expect(progress.state().resume?.path).toBe('/grammar/n5/10/change-naru');
  });
  it('continues by curriculum order when the saved concept is completed', () => {
    answerAll('sentence-structure-context'); expect(progress.continuePath()).toBe('/grammar/n5/01/state-being-plain');
  });
  it('continues to integration when every Core concept is completed and difficulties remain', () => {
    GRAMMAR_LESSONS.forEach(lesson => answerAll(grammarConceptId(lesson)));
    progress.flagDifficulty('change-naru', exercises[0].id);
    expect(progress.completedSessions()).toBe(94); expect(progress.continuePath()).toBe('/grammar/n5/11/00');
  });
  it('continues to integration after the semantic curriculum with no difficulties', () => {
    GRAMMAR_LESSONS.forEach(lesson => answerAll(grammarConceptId(lesson)));
    expect(progress.continuePath()).toBe('/grammar/n5/11/00');
  });
  it('a normal correct answer never clears an earlier difficulty', () => {
    progress.recordAnswer('change-naru', '10', exercises[0].id, 0, false);
    progress.recordAnswer('change-naru', '10', exercises[0].id, 0, true);
    expect(progress.state().review['change-naru'].active).toBe(true);
    expect(progress.state().review['change-naru'].lastFailedExerciseId).toBe(exercises[0].id);
  });
  it('clears only concepts whose entire selected review was correct', () => {
    progress.flagDifficulty('change-naru', exercises[0].id);
    progress.finishReview(exercises.slice(1, 3).map(exercise => ({conceptId: 'change-naru', exerciseId: exercise.id, correct: true})));
    expect(progress.state().review['change-naru'].active).toBe(false); expect(progress.state().review['change-naru'].clearedAt).toBeDefined();
    expect(progress.conceptStatus('change-naru')).toBe('not-started');
  });
  it('keeps a difficulty active when even one selected exercise fails', () => {
    progress.flagDifficulty('change-naru', exercises[0].id);
    progress.finishReview(exercises.slice(1, 3).map((exercise, index) => ({conceptId: 'change-naru', exerciseId: exercise.id, correct: index === 0})));
    expect(progress.state().review['change-naru'].active).toBe(true);
  });
  it('avoids the last failed exercise if alternatives exist', () => {
    progress.flagDifficulty('change-naru', exercises[0].id); const round = progress.buildReview();
    expect(round).toHaveLength(2); expect(round.every(exercise => exercise.id !== exercises[0].id && exercise.conceptId === 'change-naru')).toBe(true);
  });
  it('caps global review at twelve existing exercises', () => {
    GRAMMAR_LESSONS.slice(0, 20).forEach(lesson => progress.flagDifficulty(grammarConceptId(lesson), lesson.exercise.id));
    expect(progress.buildReview()).toHaveLength(12);
    expect(new Set(progress.buildReview().map(exercise => exercise.conceptId)).size).toBe(12);
  });
  it('does not fabricate a round when there are no difficulties', () => expect(progress.buildReview()).toEqual([]));
  it('persists the original complete practice score', () => {
    const practice = GRAMMAR_PRACTICES.find(p=>p.topicId==='10')!; progress.recordPractice(practice.topicId, 8, 10, ['experience-ta-koto-ga-aru'], '2026-10-03T10:00:00Z'); reload();
    expect(progress.state().practices['10']).toMatchObject({score: 8, total: 10, errorConceptIds: ['experience-ta-koto-ga-aru']});
  });
  it('error review never replaces the original full practice score', () => {
    progress.recordPractice('10', 8, 10, ['experience-ta-koto-ga-aru'], '2026-10-03T10:00:00Z');
    const exercise = GRAMMAR_PRACTICES.find(p=>p.topicId==='10')!.exercises[0];
    progress.flagDifficulty(exercise.conceptId!, exercise.id); progress.finishReview([{conceptId: exercise.conceptId!, exerciseId: exercise.id, correct: true}]);
    expect(progress.state().practices['10'].score).toBe(8); expect(progress.state().practices['10'].total).toBe(10);
  });
  it('practice errors can flag difficulties without completing lesson exercises', () => {
    const exercise = GRAMMAR_PRACTICES.find(p=>p.topicId==='10')!.exercises[0]; progress.flagDifficulty(exercise.conceptId!, exercise.id);
    expect(progress.difficulties()).toHaveLength(1); expect(progress.state().concepts).toEqual({});
  });
  it('ignores invalid topic/exercise/index combinations', () => {
    progress.recordAnswer('change-naru', '00', exercises[0].id, 0, true);
    progress.recordAnswer('change-naru', '10', exercises[0].id, 1, true);
    progress.flagDifficulty('change-naru', 'unknown'); expect(TestBed.inject(GrammarV2ProgressService).state()).toEqual(emptyGrammarProgress());
  });
  it('ignores corrupt storage and unknown IDs without writing over the original', () => {
    localStorage.setItem(GRAMMAR_PROGRESS_KEY, '{broken'); reload(); expect(TestBed.inject(GrammarV2ProgressService).state()).toEqual(emptyGrammarProgress());
    expect(localStorage.getItem(GRAMMAR_PROGRESS_KEY)).toBe('{broken');
    reload({...emptyGrammarProgress(), review: {'98.1': {conceptId: '98.1', topicId: '98', active: true, updatedAt: '2026-10-03T10:00:00Z'}}});
    expect(progress.difficulties()).toEqual([]);
  });
  it('does not trust completed if the current exercise IDs are not all answered', () => {
    answerAll('change-naru'); const state = structuredClone(TestBed.inject(GrammarV2ProgressService).state()); delete state.concepts['change-naru'].answers[exercises.at(-1)!.id];
    state.concepts['change-naru'].answers['removed-exercise'] = {correct:true,solved:true,attempts:1,correctCount:1,answeredAt:'2026-10-03T10:00:00Z'}; reload(state);
    expect(progress.conceptStatus('change-naru')).toBe('in-progress'); expect(progress.state().concepts['change-naru'].completedAt).toBeUndefined();
    expect(progress.state().concepts['change-naru'].answers['removed-exercise']).toBeUndefined();
  });
  it('reloads merged cloud progress into its signals', () => {
    const state = emptyGrammarProgress(); state.review['change-naru'] = {conceptId: 'change-naru', topicId: '10', active: true, updatedAt: '2026-10-03T10:00:00Z'};
    TestBed.inject(StorageService).setFromCloud(GRAMMAR_PROGRESS_KEY, state); TestBed.tick(); expect(progress.difficulties()).toHaveLength(1);
  });
  it('isolates guest and two accounts and restores each workspace', () => {
    progress.recordAnswer('change-naru', '10', exercises[0].id, 0, true); const workspace = TestBed.inject(WorkspaceService);
    workspace.activateUser('carlos'); TestBed.tick(); expect(progress.conceptStatus('change-naru')).toBe('not-started');
    answerAll('change-naru'); workspace.activateUser('nora'); TestBed.tick(); expect(progress.conceptStatus('change-naru')).toBe('not-started');
    workspace.activateGuest(); TestBed.tick(); expect(progress.conceptStatus('change-naru')).toBe('in-progress');
    workspace.activateUser('carlos'); TestBed.tick(); expect(progress.conceptStatus('change-naru')).toBe('completed');
  });
  it('imports archived V1 guest difficulties without deleting guest storage', () => {
    const guest=emptyV1(),account=emptyV1(),stamp='2026-10-03T10:00:00.000Z';
    guest.review['10.1']={conceptId:'10.1',topicId:'10',active:true,updatedAt:stamp};
    account.review['10.4']={conceptId:'10.4',topicId:'10',active:true,updatedAt:stamp};
    localStorage.setItem(V1_KEY,JSON.stringify(guest));const workspace=TestBed.inject(WorkspaceService);
    workspace.activateUser('carlos');TestBed.inject(StorageService).setFromCloud(V1_KEY,account);
    workspace.copyGuestLocalStorageToUser('carlos');
    expect(TestBed.inject(StorageService).get(V1_KEY,emptyV1()).review).toEqual({...guest.review,...account.review});
    workspace.activateGuest();expect(TestBed.inject(StorageService).get(V1_KEY,emptyV1())).toEqual(guest);
  });
  it('does not treat archived V1 resume-only data as answered guest progress', () => {
    const guest=emptyV1();guest.resume={conceptId:'10.4',path:'/grammar/n5/10/4',exerciseIndex:2,updatedAt:'2026-10-03T10:00:00Z'};
    localStorage.setItem(V1_KEY,JSON.stringify(guest));expect(TestBed.inject(WorkspaceService).hasGuestProgress()).toBe(false);
    guest.review['10.4']={conceptId:'10.4',topicId:'10',active:true,updatedAt:'2026-10-03T10:00:00Z'};
    localStorage.setItem(V1_KEY,JSON.stringify(guest));expect(TestBed.inject(WorkspaceService).hasGuestProgress()).toBe(true);
  });
  it('an incorrect answer remains pending after closing before Continue', () => {
    progress.recordAnswer('change-naru', '10', exercises[0].id, 0, false);
    expect(progress.state().resume?.exerciseIndex).toBe(0);
    reload(); expect(progress.resumeIndex('change-naru')).toBe(0);
    expect(progress.state().resume?.exerciseIndex).toBe(0);
  });
  it('uses the first real gap after restoring answers one and three', () => {
    progress.openLesson('change-naru');progress.recordAnswer('change-naru','10',exercises[0].id,0,true);
    progress.recordAnswer('change-naru','10',exercises[2].id,2,true);
    reload(structuredClone(TestBed.inject(GrammarV2ProgressService).state()));
    expect(progress.firstPendingExerciseIndex('change-naru')).toBe(1);expect(progress.resumeIndex('change-naru')).toBe(1);
  });
  it('opens a partial concept at its first pending exercise even with a different global resume', () => {
    progress.recordAnswer('change-naru', '10', exercises[0].id, 0, true);
    progress.saveResume('experience-ta-koto-ga-aru', 0);
    expect(progress.state().resume?.conceptId).toBe('experience-ta-koto-ga-aru');
    expect(progress.resumeIndex('change-naru')).toBe(1);
  });
  it('always opens manually completed concepts at zero without changing completion', () => {
    answerAll('change-naru'); const completedAt = progress.state().concepts['change-naru'].completedAt;
    progress.saveResume('change-naru', 3); reload();
    expect(progress.resumeIndex('change-naru')).toBe(0);
    expect(progress.conceptStatus('change-naru')).toBe('completed'); expect(progress.state().concepts['change-naru'].completedAt).toBe(completedAt);
  });
  it('treats a newly required current exercise as pending despite older completed metadata', () => {
    answerAll('change-naru'); const olderCurriculum = structuredClone(TestBed.inject(GrammarV2ProgressService).state());
    delete olderCurriculum.concepts['change-naru'].answers[exercises.at(-1)!.id];
    olderCurriculum.resume!.exerciseIndex = 0; reload(olderCurriculum);
    expect(progress.conceptStatus('change-naru')).toBe('in-progress');
    expect(progress.resumeIndex('change-naru')).toBe(exercises.length - 1);
  });
  it('guest import preserves newer cleared and active archived V1 difficulties', () => {
    const guest=emptyV1(),account=emptyV1(),early='2026-10-03T10:00:00Z',late='2026-10-03T11:00:00Z';
    guest.review['10.1']={conceptId:'10.1',topicId:'10',active:true,updatedAt:early};
    guest.review['10.4']={conceptId:'10.4',topicId:'10',active:true,updatedAt:late};
    account.review['10.1']={conceptId:'10.1',topicId:'10',active:false,clearedAt:late,updatedAt:late};
    account.review['10.4']={conceptId:'10.4',topicId:'10',active:false,clearedAt:early,updatedAt:early};
    localStorage.setItem(V1_KEY,JSON.stringify(guest));const originalGuest=localStorage.getItem(V1_KEY);
    const workspace=TestBed.inject(WorkspaceService);workspace.activateUser('carlos');TestBed.tick();
    TestBed.inject(StorageService).setFromCloud(V1_KEY,account);workspace.copyGuestLocalStorageToUser('carlos');TestBed.tick();
    const merged=TestBed.inject(StorageService).get(V1_KEY,emptyV1());
    expect(merged.review['10.1'].active).toBe(false);expect(merged.review['10.4'].active).toBe(true);
    expect(localStorage.getItem(V1_KEY)).toBe(originalGuest);
    const revision=workspace.dataRevision();workspace.copyGuestLocalStorageToUser('carlos');expect(workspace.dataRevision()).toBe(revision);
  });
});
