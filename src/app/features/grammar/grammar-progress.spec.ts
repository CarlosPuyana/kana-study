import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { GrammarProgressService } from '../../core/services/grammar-progress.service';
import { SyncOutboxService } from '../../core/services/sync-outbox.service';
import { TranslationService } from '../../core/services/translation.service';
import { StorageService } from '../../core/services/storage.service';
import {GRAMMAR_PROGRESS_V2_KEY as GRAMMAR_PROGRESS_KEY} from '../../core/models/grammar-v2.model';
const emptyGrammarProgress=()=>({version:2,concepts:{},practices:{},review:{} as Record<string,{conceptId:string;topicId:string;active:boolean;updatedAt:string}>});
import es from '../../../assets/i18n/es.json';
import { GRAMMAR_ROUTES } from './grammar.routes';
import { GRAMMAR_LESSONS, GRAMMAR_PRACTICES } from './data/grammar-catalog';
import { grammarLessonExercises } from './models/grammar.model';
import { GrammarPage } from './pages/grammar.page';
import { GrammarReviewPage } from './pages/grammar-review.page';
import { GrammarPracticeComponent } from './components/grammar-practice';

const t = (key: string, params?: Record<string, string | number>): string => Object.entries(params ?? {}).reduce((text, [name, value]) => text.replaceAll(`{{${name}}}`, String(value)), (es as Record<string, string>)[key] ?? key);
describe('Grammar progress UI and complete practice integration', () => {
  beforeEach(() => {
    localStorage.clear(); vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    TestBed.configureTestingModule({providers: [provideRouter([{path: 'grammar', children: GRAMMAR_ROUTES}]),
      {provide: TranslationService, useValue: {t,language:()=> 'es'}}, {provide: SyncOutboxService, useValue: {enqueue: vi.fn().mockResolvedValue(undefined)}}]});
  });
  afterEach(() => { TestBed.resetTestingModule(); vi.restoreAllMocks(); });
  it('shows real 0/94 and starts Continuar at the first semantic concept', async () => {
    const harness = await RouterTestingHarness.create(); await harness.navigateByUrl('/grammar', GrammarPage);
    expect(harness.routeNativeElement!.textContent).toContain('0 / 94 sesiones completadas');
    expect(harness.routeNativeElement!.querySelector('.primary-action')!.getAttribute('href')).toContain('/grammar/n5/01/sentence-structure-context');
    expect(harness.routeNativeElement!.textContent).not.toContain('grammar.progressState.');
  });
  it('opening starts a concept without fabricating answers and records the answered output', async () => {
    const harness = await RouterTestingHarness.create(); await harness.navigateByUrl('/grammar/n5/10/choice-ni-suru', GrammarPage);
    const progress = TestBed.inject(GrammarProgressService); expect(progress.conceptStatus('choice-ni-suru')).toBe('in-progress'); expect(progress.state().concepts['choice-ni-suru'].answers).toEqual({});
    const grammarPage=await harness.navigateByUrl('/grammar/n5/10/choice-ni-suru',GrammarPage);grammarPage.answer(true);harness.detectChanges();
    expect(progress.conceptStatus('choice-ni-suru')).toBe('in-progress'); expect(Object.keys(progress.state().concepts['choice-ni-suru'].answers)).toHaveLength(1);
  });
  it('restores the exact exercise through Continuar and route re-entry', async () => {
    const harness = await RouterTestingHarness.create(), page = await harness.navigateByUrl('/grammar/n5/10/change-naru', GrammarPage);
    for(let index=0;index<2;index++){
      page.answer(true);page.continueExercise();harness.detectChanges();
      await harness.fixture.whenStable();
    }
    await harness.navigateByUrl('/grammar', GrammarPage);
    expect(harness.routeNativeElement!.querySelector('.primary-action')!.getAttribute('href')).toContain('/grammar/n5/10/change-naru');
    const resumed = await harness.navigateByUrl('/grammar/n5/10/change-naru', GrammarPage);
    expect(resumed.exerciseIndex()).toBe(2); expect(harness.routeNativeElement!.textContent).toContain('Ejercicio 3 de 6');
  });
  it('shows partial steps and a completed session plus difficulty as independent states', async () => {
    const progress = TestBed.inject(GrammarProgressService);
    progress.openLesson('change-naru');
    progress.openLesson('change-naru');
    GRAMMAR_LESSONS.filter(lesson => lesson.topicId === '10' && lesson.id === 'change-naru').forEach(lesson => grammarLessonExercises(lesson).forEach((exercise, index) => progress.recordAnswer(lesson.id, '10', exercise.id, index, true)));
    const harness = await RouterTestingHarness.create(); await harness.navigateByUrl('/grammar/n5/10', GrammarPage);
    const first = harness.routeNativeElement!.querySelectorAll('.lesson-card')[4]!;
    expect(first.textContent).toContain('✓ Completada'); progress.flagDifficulty('change-naru',GRAMMAR_LESSONS.find(l=>l.id==='change-naru')!.exercise.id);harness.detectChanges();expect(first.textContent).toContain('⚠ 1 concepto por repasar');
    expect(harness.routeNativeElement!.textContent).toContain('1 / 7 sesiones completadas');
  });
  it('saves only the full original practice and keeps immediate error review available', () => {
    const fixture = TestBed.createComponent(GrammarPracticeComponent); fixture.componentRef.setInput('practice', GRAMMAR_PRACTICES.find(p=>p.topicId==='10')!); fixture.detectChanges();
    const component = fixture.componentInstance; component.start();
    for (let index = 0; index < 18; index++) { component.answer(index > 1); component.next(); }
    const progress = TestBed.inject(GrammarProgressService); expect(progress.state().practices['10']).toMatchObject({score: 16, total: 18}); expect(progress.difficulties().length).toBeGreaterThan(0);
    component.session.reviewErrors(); const count = component.session.total(); expect(count).toBe(2);
    for (let index = 0; index < count; index++) { component.answer(true); component.next(); }
    expect(component.session.score()).toBe(2); expect(progress.state().practices['10'].score).toBe(16); expect(progress.difficulties()).toHaveLength(0);
    fixture.detectChanges(); expect(fixture.nativeElement.textContent).toContain(t('grammar.reviewingErrors'));
  });
  it('shows the last persisted full practice score on the topic', async () => {
    TestBed.inject(GrammarProgressService).recordPractice('10', 16, 18, [], new Date().toISOString());
    const harness = await RouterTestingHarness.create(); await harness.navigateByUrl('/grammar/n5/10', GrammarPage);
    expect(harness.routeNativeElement!.textContent).toContain('Última práctica: 16 / 18');
  });
  it('global review clears only fully correct selected concepts and preserves failures', async () => {
    const progress = TestBed.inject(GrammarProgressService), a = GRAMMAR_LESSONS.find(lesson => lesson.topicId === '10' && lesson.id === 'change-naru')!, b = GRAMMAR_LESSONS.find(lesson => lesson.topicId === '10' && lesson.id === 'choice-ni-suru')!;
    progress.flagDifficulty('change-naru', a.exercise.id); progress.flagDifficulty('choice-ni-suru', b.exercise.id);
    const harness = await RouterTestingHarness.create(), page = await harness.navigateByUrl('/grammar/review', GrammarReviewPage);
    page.session.start(); const total = page.session.total();
    for (let index = 0; index < total; index++) { page.answer(page.session.current()!.conceptId === 'change-naru'); page.next(); }
    harness.detectChanges(); expect(progress.state().review['change-naru'].active).toBe(false); expect(progress.state().review['choice-ni-suru'].active).toBe(true);
    expect(progress.state().concepts).toEqual({}); expect(progress.state().practices).toEqual({});
  });
  it('global review offers mixed practice even without saved difficulties', async () => {
    const harness = await RouterTestingHarness.create(), page = await harness.navigateByUrl('/grammar/review', GrammarReviewPage);
    expect(page.session.total()).toBe(10); expect(new Set(page.session.roundExercises().map(e=>e.topicId)).size).toBeGreaterThan(1);
    expect(harness.routeNativeElement!.querySelector('.practice-start')).not.toBeNull();
  });
  it('reloads the lesson at exercise two after answering without pressing Continue', async () => {
    const harness = await RouterTestingHarness.create(); const initialPage=await harness.navigateByUrl('/grammar/n5/10/change-naru', GrammarPage);
    initialPage.answer(true); harness.detectChanges();
    // Recreate the app while retaining localStorage, as a browser reload does.
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({providers: [provideRouter([{path:'grammar',children:GRAMMAR_ROUTES}]), {provide:TranslationService,useValue:{t,language:()=>'es'}}, {provide:SyncOutboxService,useValue:{enqueue:vi.fn().mockResolvedValue(undefined)}}]});
    const reloaded = await RouterTestingHarness.create(); const page = await reloaded.navigateByUrl('/grammar/n5/10/change-naru', GrammarPage);
    expect(page.exerciseIndex()).toBe(1); expect(reloaded.routeNativeElement!.textContent).toContain('Ejercicio 2 de 6');
  });
  it('refreshes an empty review intro when cloud difficulties arrive without route reload', async () => {
    const harness = await RouterTestingHarness.create(), page = await harness.navigateByUrl('/grammar/review', GrammarReviewPage);
    const cloud = emptyGrammarProgress(); cloud.review['change-naru'] = {conceptId:'change-naru',topicId:'10',active:true,updatedAt:new Date().toISOString()};
    TestBed.inject(StorageService).setFromCloud(GRAMMAR_PROGRESS_KEY, cloud); TestBed.tick(); harness.detectChanges(); await harness.fixture.whenStable();
    expect(page.session.stage()).toBe('intro'); expect(page.session.total()).toBeGreaterThan(0);
    expect(harness.routeNativeElement!.querySelector('.practice-start')).not.toBeNull();
    expect(harness.routeNativeElement!.textContent).not.toContain(t('grammar.progressState.noDifficulties'));
  });
  it('never resets an active review or its results on sync, but explicit retry rebuilds it', async () => {
    const progress = TestBed.inject(GrammarProgressService);
    const lesson = GRAMMAR_LESSONS.find(lesson=>lesson.topicId==='10'&&lesson.id==='change-naru')!; progress.flagDifficulty('change-naru',lesson.exercise.id);
    const harness = await RouterTestingHarness.create(), page = await harness.navigateByUrl('/grammar/review', GrammarReviewPage);
    page.session.start(); page.answer(true); page.next();
    const questions = page.session.roundExercises(), index = page.session.index(), answers = page.session.answers();
    const cloud = emptyGrammarProgress(); cloud.review['experience-ta-koto-ga-aru'] = {conceptId:'experience-ta-koto-ga-aru',topicId:'10',active:true,updatedAt:new Date().toISOString()};
    TestBed.inject(StorageService).setFromCloud(GRAMMAR_PROGRESS_KEY,cloud); TestBed.tick(); harness.detectChanges();
    expect(page.session.stage()).toBe('question'); expect(page.session.roundExercises()).toBe(questions);
    expect(page.session.index()).toBe(index); expect(page.session.answers()).toEqual(answers);
    while(page.session.stage()==='question'){page.answer(true);page.next();} harness.detectChanges(); await harness.fixture.whenStable();
    expect(page.session.stage()).toBe('results'); const score = page.session.score();
    TestBed.inject(StorageService).setFromCloud(GRAMMAR_PROGRESS_KEY,cloud); TestBed.tick(); harness.detectChanges();
    expect(page.session.stage()).toBe('results'); expect(page.session.roundExercises()).toBe(questions); expect(page.session.score()).toBe(score);
    page.reset(); harness.detectChanges(); await harness.fixture.whenStable();
    expect(page.session.stage()).toBe('intro'); expect(page.session.roundExercises().some(exercise=>exercise.conceptId==='experience-ta-koto-ga-aru')).toBe(true);
    expect(new Set(page.session.roundExercises().map(e=>e.topicId)).size).toBeGreaterThan(1);
  });
});
