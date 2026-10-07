import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { GrammarProgressService } from '../../core/services/grammar-progress.service';
import { SyncOutboxService } from '../../core/services/sync-outbox.service';
import { TranslationService } from '../../core/services/translation.service';
import { StorageService } from '../../core/services/storage.service';
import { emptyGrammarProgress, GRAMMAR_PROGRESS_KEY } from '../../core/models/grammar-progress.model';
import es from '../../../assets/i18n/es.json';
import { GRAMMAR_ROUTES } from './grammar.routes';
import { GRAMMAR_LESSONS, GRAMMAR_PRACTICES } from './data/grammar-n5.generated';
import { grammarLessonExercises } from './models/grammar.model';
import { GrammarPage } from './pages/grammar.page';
import { GrammarReviewPage } from './pages/grammar-review.page';
import { GrammarPracticeComponent } from './components/grammar-practice';

const t = (key: string, params?: Record<string, string | number>): string => Object.entries(params ?? {}).reduce((text, [name, value]) => text.replaceAll(`{{${name}}}`, String(value)), (es as Record<string, string>)[key] ?? key);
describe('Grammar progress UI and complete practice integration', () => {
  beforeEach(() => {
    localStorage.clear(); vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    TestBed.configureTestingModule({providers: [provideRouter([{path: 'grammar', children: GRAMMAR_ROUTES}]),
      {provide: TranslationService, useValue: {t}}, {provide: SyncOutboxService, useValue: {enqueue: vi.fn().mockResolvedValue(undefined)}}]});
  });
  afterEach(() => { TestBed.resetTestingModule(); vi.restoreAllMocks(); });
  it('shows real 0/70 and starts Continuar at the first semantic concept', async () => {
    const harness = await RouterTestingHarness.create(); await harness.navigateByUrl('/grammar', GrammarPage);
    expect(harness.routeNativeElement!.textContent).toContain('0 / 70 sesiones completadas');
    expect(harness.routeNativeElement!.querySelector('.primary-action')!.getAttribute('href')).toContain('/grammar/n5/01/sentence-structure-context');
    expect(harness.routeNativeElement!.textContent).not.toContain('grammar.progressState.');
  });
  it('opens a concept without starting it and records the exercise answered output', async () => {
    const harness = await RouterTestingHarness.create(); await harness.navigateByUrl('/grammar/n5/02/1', GrammarPage);
    const progress = TestBed.inject(GrammarProgressService); expect(progress.conceptStatus('02.1')).toBe('not-started');
    harness.routeNativeElement!.querySelector<HTMLButtonElement>('.exercise-option')!.click(); harness.detectChanges();
    harness.routeNativeElement!.querySelector<HTMLButtonElement>('.check-answer')!.click(); harness.detectChanges();
    expect(progress.conceptStatus('02.1')).toBe('in-progress'); expect(Object.keys(progress.state().concepts['02.1'].answers)).toHaveLength(1);
  });
  it('restores the exact exercise through Continuar and route re-entry', async () => {
    const harness = await RouterTestingHarness.create(), page = await harness.navigateByUrl('/grammar/n5/06/1', GrammarPage);
    for(let index=0;index<2;index++){
      harness.routeNativeElement!.querySelector<HTMLButtonElement>('.exercise-option')!.click(); harness.detectChanges();
      harness.routeNativeElement!.querySelector<HTMLButtonElement>('.check-answer')!.click(); harness.detectChanges();
      harness.routeNativeElement!.querySelector<HTMLButtonElement>('.continue-answer')!.click(); harness.detectChanges();
      await harness.fixture.whenStable();
    }
    await harness.navigateByUrl('/grammar', GrammarPage);
    expect(harness.routeNativeElement!.querySelector('.primary-action')!.getAttribute('href')).toContain('/grammar/n5/06/1');
    const resumed = await harness.navigateByUrl('/grammar/n5/06/1', GrammarPage);
    expect(resumed.exerciseIndex()).toBe(2); expect(harness.routeNativeElement!.textContent).toContain('Ejercicio 3 de 5');
  });
  it('shows partial steps and a completed session plus difficulty as independent states', async () => {
    const progress = TestBed.inject(GrammarProgressService);
    GRAMMAR_LESSONS.filter(lesson => lesson.topicId === '06' && Number(lesson.id) <= 7).forEach(lesson => grammarLessonExercises(lesson).forEach((exercise, index) => progress.recordAnswer(`06.${lesson.id}`, '06', exercise.id, index, lesson.id !== '1')));
    const harness = await RouterTestingHarness.create(); await harness.navigateByUrl('/grammar/n5/06', GrammarPage);
    const first = harness.routeNativeElement!.querySelector('.lesson-card')!;
    expect(first.textContent).toContain('✓ Completada'); expect(first.textContent).toContain('⚠ 1 concepto por repasar');
    expect(harness.routeNativeElement!.textContent).toContain('1 / 4 sesiones completadas');
  });
  it('saves only the full original practice and keeps immediate error review available', () => {
    const fixture = TestBed.createComponent(GrammarPracticeComponent); fixture.componentRef.setInput('practice', GRAMMAR_PRACTICES.find(p=>p.topicId==='02')!); fixture.detectChanges();
    const component = fixture.componentInstance; component.start();
    for (let index = 0; index < 10; index++) { component.answer(index > 1); component.next(); }
    const progress = TestBed.inject(GrammarProgressService); expect(progress.state().practices['02']).toMatchObject({score: 8, total: 10}); expect(progress.difficulties().length).toBeGreaterThan(0);
    component.session.reviewErrors(); const count = component.session.total(); expect(count).toBe(2);
    for (let index = 0; index < count; index++) { component.answer(true); component.next(); }
    expect(component.session.score()).toBe(2); expect(progress.state().practices['02'].score).toBe(8); expect(progress.difficulties()).toHaveLength(0);
    fixture.detectChanges(); expect(fixture.nativeElement.textContent).toContain(t('grammar.reviewingErrors'));
  });
  it('shows the last persisted full practice score on the topic', async () => {
    TestBed.inject(GrammarProgressService).recordPractice('02', 8, 10, [], new Date().toISOString());
    const harness = await RouterTestingHarness.create(); await harness.navigateByUrl('/grammar/n5/02', GrammarPage);
    expect(harness.routeNativeElement!.textContent).toContain('Última práctica: 8 / 10');
  });
  it('global review clears only fully correct selected concepts and preserves failures', async () => {
    const progress = TestBed.inject(GrammarProgressService), a = GRAMMAR_LESSONS.find(lesson => lesson.topicId === '06' && lesson.id === '1')!, b = GRAMMAR_LESSONS.find(lesson => lesson.topicId === '06' && lesson.id === '2')!;
    progress.flagDifficulty('06.1', a.exercise.id); progress.flagDifficulty('06.2', b.exercise.id);
    const harness = await RouterTestingHarness.create(), page = await harness.navigateByUrl('/grammar/review', GrammarReviewPage);
    page.session.start(); const total = page.session.total();
    for (let index = 0; index < total; index++) { page.answer(page.session.current()!.conceptId === '06.1'); page.next(); }
    harness.detectChanges(); expect(progress.state().review['06.1'].active).toBe(false); expect(progress.state().review['06.2'].active).toBe(true);
    expect(progress.state().concepts).toEqual({}); expect(progress.state().practices).toEqual({});
  });
  it('global review offers mixed practice even without saved difficulties', async () => {
    const harness = await RouterTestingHarness.create(), page = await harness.navigateByUrl('/grammar/review', GrammarReviewPage);
    expect(page.session.total()).toBe(10); expect(new Set(page.session.roundExercises().map(e=>e.topicId)).size).toBeGreaterThan(1);
    expect(harness.routeNativeElement!.querySelector('.practice-start')).not.toBeNull();
  });
  it('reloads the lesson at exercise two after answering without pressing Continue', async () => {
    const harness = await RouterTestingHarness.create(); await harness.navigateByUrl('/grammar/n5/06/1', GrammarPage);
    harness.routeNativeElement!.querySelector<HTMLButtonElement>('.exercise-option')!.click(); harness.detectChanges();
    harness.routeNativeElement!.querySelector<HTMLButtonElement>('.check-answer')!.click(); harness.detectChanges();
    // Recreate the app while retaining localStorage, as a browser reload does.
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({providers: [provideRouter([{path:'grammar',children:GRAMMAR_ROUTES}]), {provide:TranslationService,useValue:{t}}, {provide:SyncOutboxService,useValue:{enqueue:vi.fn().mockResolvedValue(undefined)}}]});
    const reloaded = await RouterTestingHarness.create(); const page = await reloaded.navigateByUrl('/grammar/n5/06/1', GrammarPage);
    expect(page.exerciseIndex()).toBe(1); expect(reloaded.routeNativeElement!.textContent).toContain('Ejercicio 2 de 5');
  });
  it('refreshes an empty review intro when cloud difficulties arrive without route reload', async () => {
    const harness = await RouterTestingHarness.create(), page = await harness.navigateByUrl('/grammar/review', GrammarReviewPage);
    const cloud = emptyGrammarProgress(); cloud.review['06.1'] = {conceptId:'06.1',topicId:'06',active:true,updatedAt:new Date().toISOString()};
    TestBed.inject(StorageService).setFromCloud(GRAMMAR_PROGRESS_KEY, cloud); TestBed.tick(); harness.detectChanges(); await harness.fixture.whenStable();
    expect(page.session.stage()).toBe('intro'); expect(page.session.total()).toBeGreaterThan(0);
    expect(harness.routeNativeElement!.querySelector('.practice-start')).not.toBeNull();
    expect(harness.routeNativeElement!.textContent).not.toContain(t('grammar.progressState.noDifficulties'));
  });
  it('never resets an active review or its results on sync, but explicit retry rebuilds it', async () => {
    const progress = TestBed.inject(GrammarProgressService);
    const lesson = GRAMMAR_LESSONS.find(lesson=>lesson.topicId==='06'&&lesson.id==='1')!; progress.flagDifficulty('06.1',lesson.exercise.id);
    const harness = await RouterTestingHarness.create(), page = await harness.navigateByUrl('/grammar/review', GrammarReviewPage);
    page.session.start(); page.answer(true); page.next();
    const questions = page.session.roundExercises(), index = page.session.index(), answers = page.session.answers();
    const cloud = emptyGrammarProgress(); cloud.review['02.1'] = {conceptId:'02.1',topicId:'02',active:true,updatedAt:new Date().toISOString()};
    TestBed.inject(StorageService).setFromCloud(GRAMMAR_PROGRESS_KEY,cloud); TestBed.tick(); harness.detectChanges();
    expect(page.session.stage()).toBe('question'); expect(page.session.roundExercises()).toBe(questions);
    expect(page.session.index()).toBe(index); expect(page.session.answers()).toEqual(answers);
    while(page.session.stage()==='question'){page.answer(true);page.next();} harness.detectChanges(); await harness.fixture.whenStable();
    expect(page.session.stage()).toBe('results'); const score = page.session.score();
    TestBed.inject(StorageService).setFromCloud(GRAMMAR_PROGRESS_KEY,cloud); TestBed.tick(); harness.detectChanges();
    expect(page.session.stage()).toBe('results'); expect(page.session.roundExercises()).toBe(questions); expect(page.session.score()).toBe(score);
    page.reset(); harness.detectChanges(); await harness.fixture.whenStable();
    expect(page.session.stage()).toBe('intro'); expect(page.session.roundExercises().some(exercise=>exercise.conceptId==='02.1')).toBe(true);
    expect(new Set(page.session.roundExercises().map(e=>e.topicId)).size).toBeGreaterThan(1);
  });
});
