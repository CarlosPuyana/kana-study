import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { WeaknessService, WEAKNESSES_KEY } from '../../core/services/weakness.service';
import { WeaknessRecord } from '../../core/models/weakness.model';
import { CompletedSessionSummary } from '../../core/models/learning-session.model';
import { SessionHistoryService } from '../../core/services/session-history.service';
import { calculateLearningAnalytics } from '../../core/services/learning-analytics.service';
import { TranslationService } from '../../core/services/translation.service';
import { GrammarPracticeSession } from './services/grammar-practice-session';
import { grammarFocusedExercises, grammarWeaknessIdentity } from './services/grammar-weakness';
import { GRAMMAR_INTERACTIVE } from './data/grammar-interactive';
import { GRAMMAR_ROUTES } from './grammar.routes';
import { GrammarReviewPage } from './pages/grammar-review.page';
import { WeaknessesPage } from '../weaknesses/weaknesses.page';
import { StatsPage } from '../stats/stats.page';
import es from '../../../assets/i18n/es.json';
import en from '../../../assets/i18n/en.json';
import ca from '../../../assets/i18n/ca.json';
const now=new Date('2026-10-26T12:00:00Z');
const record=(patch:Partial<WeaknessRecord>={}):WeaknessRecord=>({module:'grammar',activity:'learn',itemId:'03.8',questionType:'conjugation',attempts:4,failures:3,consecutiveCorrect:0,score:6,lastAttemptAt:now.toISOString(),...patch});
const calculate=(records:readonly WeaknessRecord[]=[],history:readonly CompletedSessionSummary[]=[])=>calculateLearningAnalytics(records,history,now);
const source=GRAMMAR_INTERACTIVE.find(e=>e.id==='03.8')!;
describe('Grammar weakness identities and analytics',()=>{
  it('uses topic-qualified lessons, not exercise IDs',()=>{
    expect(grammarWeaknessIdentity(source)).toEqual({itemId:'03.8',questionType:'conjugation'});
    expect(grammarWeaknessIdentity({...source,id:'different'})).toEqual(grammarWeaknessIdentity(source));
  });
  it('falls back to a stable topic when a lesson is unavailable',()=>{
    const {lessonId,conceptId,...rest}=source;
    expect(grammarWeaknessIdentity({...rest,id:'topic-only'})).toEqual({itemId:'03',questionType:'conjugation'});
  });
  it('resolves a known legacy exercise without new metadata',()=>{
    const {lessonId,conceptId,topicId,exerciseType,...rest}=source;
    expect(grammarWeaknessIdentity(rest)).toEqual({itemId:'03.8',questionType:'conjugation'});
  });
  it('does not fabricate identities for unknown exercises without a topic',()=>{
    const {lessonId,conceptId,topicId,...rest}=source;expect(grammarWeaknessIdentity({...rest,id:'unknown'})).toBeNull();
  });
  it('focuses on the weak type before other exercises in the same lesson',()=>{
    const exercises=grammarFocusedExercises([record()]);expect(exercises[0].exerciseType).toBe('conjugation');
    expect(exercises.every(e=>e.conceptId==='03.8')).toBe(true);expect(exercises.length).toBeGreaterThan(1);
    expect(new Set(exercises.map(e=>e.id)).size).toBe(exercises.length);expect(exercises.length).toBeLessThanOrEqual(10);
  });
  it('supports topic fallback and ignores resolved or obsolete weaknesses',()=>{
    expect(grammarFocusedExercises([record({itemId:'03'})]).every(e=>e.topicId==='03')).toBe(true);
    expect(grammarFocusedExercises([record({score:2}),record({itemId:'obsolete'})])).toEqual([]);
  });
  it('computes weighted Grammar accuracy independently of weakness score',()=>{
    const stats=calculate([record({attempts:1,failures:1}),record({itemId:'03.9',attempts:9,failures:0,score:10})]);
    expect(stats.modules.find(m=>m.module==='grammar')).toMatchObject({attempts:10,failures:1,accuracy:90});
  });
  it('uses the existing attempt thresholds for Grammar types and strengths',()=>{
    const stats=calculate([record({attempts:2,failures:2}),record({questionType:'particle',attempts:3,failures:2}),record({questionType:'sentence-order',attempts:5,failures:0})]);
    expect(stats.difficult.map(d=>d.questionType)).toEqual(['particle','sentence-order']);expect(stats.strengths[0].questionType).toBe('sentence-order');
  });
  it('aggregates concepts across types, applies minimum attempts and ranks ties',()=>{
    const stats=calculate([record({attempts:2,failures:1}),record({questionType:'fill-gap',attempts:2,failures:1}),record({itemId:'03.9',attempts:8,failures:4}),record({itemId:'01.4',attempts:4,failures:3}),record({itemId:'01.6',attempts:1,failures:1})]);
    expect(stats.grammarConcepts.map(c=>c.itemId)).toEqual(['01.4','03.9','03.8']);expect(stats.grammarConcepts[2].attempts).toBe(4);
  });
  it('includes old Grammar sessions in 7/30-day activity without duplication',()=>{
    const base:CompletedSessionSummary={module:'grammar',sessionId:'g1',completedAt:'2026-10-25T10:00:00Z',mode:'quick-practice',exercisesCompleted:4,firstTrySuccesses:2,attempts:4,needsPracticeCount:2,durationSeconds:30};
    const older={...base,sessionId:'g2',completedAt:'2026-10-10T10:00:00Z'};
    const stats=calculate([],[base,base,older]);expect(stats.recent.map(r=>[r.sessions,r.exercises,r.seconds])).toEqual([[1,4,30],[2,8,60]]);
  });
  it('recommends Grammar only when comparable metrics justify it',()=>{
    expect(calculate([record()]).recommendations).toContainEqual(expect.objectContaining({key:'grammar.weakness.recommend'}));
    const stats=calculate([record(),record({module:'vocabulary',itemId:'word',questionType:'japanese-to-meaning',attempts:4,failures:4})]);
    expect(stats.recommendations.some(r=>r.direction?.module==='vocabulary')).toBe(true);expect(stats.recommendations.some(r=>r.direction?.module==='grammar')).toBe(false);
  });
  it('keeps empty Grammar and legacy Learn honest',()=>{
    const stats=calculate([record({module:'kana',questionType:undefined})]);expect(stats.modules.find(m=>m.module==='grammar')!.accuracy).toBeNull();expect(stats.grammarConcepts).toEqual([]);expect(stats.difficult).toEqual([]);
  });
});
describe('Grammar evaluation, focused practice and localized UI',()=>{
  const language=signal<'es'|'en'|'ca'>('es');
  beforeEach(()=>{
    vi.stubGlobal('matchMedia',vi.fn(()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()})));
    localStorage.clear();language.set('es');vi.spyOn(window,'scrollTo').mockImplementation(()=>{});
    TestBed.configureTestingModule({providers:[provideRouter([{path:'grammar',children:GRAMMAR_ROUTES}]),GrammarPracticeSession,
      {provide:TranslationService,useValue:{language,t:(key:string,params?:Record<string,string|number>)=>Object.entries(params??{}).reduce((text,[k,v])=>text.replaceAll('{{'+k+'}}',String(v)),({es,en,ca}[language()] as Record<string,string>)[key]??key)}}]});
  });
  afterEach(()=>{TestBed.resetTestingModule();vi.restoreAllMocks();vi.unstubAllGlobals();});
  function evaluate(correct:boolean,exercise=source){const session=TestBed.inject(GrammarPracticeSession);session.reset([exercise]);session.start();session.answer(correct);return session;}
  it('incorrect adds two and correct subtracts one with actual attempt counts',()=>{
    evaluate(false);evaluate(false);evaluate(true);
    expect(TestBed.inject(WeaknessService).records()[0]).toMatchObject({module:'grammar',activity:'learn',itemId:'03.8',attempts:3,failures:2,score:3,consecutiveCorrect:1});
  });
  it('aggregates different exercises from one lesson and separates types',()=>{
    evaluate(false);evaluate(false,{...source,id:'another'});evaluate(false,{...source,id:'third',exerciseType:'fill-gap'});
    const records=TestBed.inject(WeaknessService).records();expect(records).toHaveLength(2);expect(records.find(r=>r.questionType==='conjugation')!.attempts).toBe(2);
  });
  it('opening and duplicate checking do not create attempts',()=>{
    const session=TestBed.inject(GrammarPracticeSession);session.reset([source]);session.start();expect(TestBed.inject(WeaknessService).records()).toEqual([]);
    session.answer(false);session.answer(false);expect(TestBed.inject(WeaknessService).records()[0].attempts).toBe(1);
  });
  it('persists Grammar locally alongside all earlier activities and modules',()=>{
    const weaknesses=TestBed.inject(WeaknessService);
    weaknesses.record('kana','hira-a',false);weaknesses.record('vocabulary','word',true,'listening');weaknesses.recordLearn('kanji','water','kanji-to-meaning','hard');evaluate(false);
    const saved=JSON.parse(localStorage.getItem(WEAKNESSES_KEY)!);expect(saved).toHaveLength(4);
    TestBed.resetTestingModule();expect(TestBed.inject(WeaknessService).records().map(r=>r.module)).toEqual(['kana','vocabulary','kanji','grammar']);
  });
  it('practicing again recovers a weakness below the unchanged threshold',()=>{
    evaluate(false);evaluate(false);expect(TestBed.inject(WeaknessService).weak()).toHaveLength(1);
    evaluate(true);evaluate(true);expect(TestBed.inject(WeaknessService).weak()).toEqual([]);
  });
  it('opens focused review using existing Grammar engine and records its completion',async()=>{
    evaluate(false);evaluate(false);
    const harness=await RouterTestingHarness.create();const page=await harness.navigateByUrl('/grammar/review?weak=1',GrammarReviewPage);
    expect(page.focused()).toBe(true);expect(page.session.roundExercises().every(e=>e.conceptId==='03.8')).toBe(true);
    page.session.start();while(page.session.stage()==='question'){page.answer(true);page.next();}
    expect(TestBed.inject(SessionHistoryService).sessions()[0].module).toBe('grammar');expect(TestBed.inject(WeaknessService).records().find(r=>r.questionType==='conjugation')!.score).toBe(3);
  });
  it('does not switch an empty focused review to unrelated practice',async()=>{
    const harness=await RouterTestingHarness.create();const page=await harness.navigateByUrl('/grammar/review?weak=1',GrammarReviewPage);expect(page.session.total()).toBe(0);
  });
  for(const lang of ['es','en','ca'] as const)it('shows localized Grammar concepts and types in weaknesses and stats: '+lang,()=>{
    language.set(lang);evaluate(false);evaluate(false);evaluate(false);
    const weak=TestBed.createComponent(WeaknessesPage);weak.detectChanges();expect(weak.componentInstance.empty()).toBe(false);
    expect(weak.nativeElement.querySelector('a[href*="/grammar/review?weak=1"]')).not.toBeNull();
    const stats=TestBed.createComponent(StatsPage);stats.detectChanges();
    for(const fixture of [weak,stats]){const text=fixture.nativeElement.textContent;expect(text).toContain(({es,en,ca}[lang] as Record<string,string>)['grammar.weakness.type.conjugation']);expect(text).not.toContain('03.8');expect(text).not.toContain('fill-gap');expect(text).not.toContain('grammar.weakness.');}
  });
});
