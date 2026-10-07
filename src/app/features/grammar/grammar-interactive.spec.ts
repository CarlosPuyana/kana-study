import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { TranslationService } from '../../core/services/translation.service';
import { SessionHistoryService } from '../../core/services/session-history.service';
import { GRAMMAR_INTERACTIVE } from './data/grammar-interactive';
import { GRAMMAR_LESSONS, GRAMMAR_TOPICS } from './data/grammar-n5.generated';
import { GrammarPracticeComponent } from './components/grammar-practice';
import { GRAMMAR_PRACTICES } from './data/grammar-n5.generated';
import { GrammarExerciseComponent } from './components/grammar-exercise';
import { GrammarPracticeSession } from './services/grammar-practice-session';
import { grammarMixedExercises, grammarTopicExercises, grammarTopicRound, GRAMMAR_PRACTICE_CATALOG } from './services/grammar-interactive-catalog';
import { isChoiceExercise, isGrammarAnswerCorrect } from './services/grammar-exercise-answer';
import { GRAMMAR_ROUTES } from './grammar.routes';
import { GrammarPage } from './pages/grammar.page';
import es from '../../../assets/i18n/es.json';
import en from '../../../assets/i18n/en.json';
import ca from '../../../assets/i18n/ca.json';
const t=(key:string,values?:Record<string,string|number>)=>Object.entries(values??{}).reduce((text,[name,value])=>text.replaceAll('{{'+name+'}}',String(value)),(es as Record<string,string>)[key]??key);
const empty={selected:null,text:'',sequence:[],matches:{}};

describe('Grammar interactive N5 catalog',()=>{
  it('curates six exercises for each family with unique stable IDs',()=>{
    expect(GRAMMAR_INTERACTIVE).toHaveLength(24);
    expect(new Set(GRAMMAR_INTERACTIVE.map(e=>e.id)).size).toBe(24);
    for(const family of ['particle','fill-gap','sentence-order','conjugation'])expect(GRAMMAR_INTERACTIVE.filter(e=>e.exerciseType===family)).toHaveLength(6);
  });
  it('references existing topics and source lessons',()=>{
    for(const e of GRAMMAR_INTERACTIVE){
      expect(GRAMMAR_TOPICS.some(topic=>topic.id===e.topicId)).toBe(true);
      expect(GRAMMAR_LESSONS.some(l=>l.topicId===e.topicId&&l.id===e.lessonId)).toBe(true);
    }
    expect(new Set(GRAMMAR_PRACTICE_CATALOG.map(e=>e.id)).size).toBe(GRAMMAR_PRACTICE_CATALOG.length);
  });
  it('has unique options and exactly one valid choice in every language',()=>{
    for(const e of GRAMMAR_INTERACTIVE.filter(isChoiceExercise)){
      for(const d of [es,en,ca])expect(new Set(e.optionKeys.map(k=>(d as Record<string,string>)[k])).size).toBe(e.optionKeys.length);
      expect(e.optionKeys.filter((_,selected)=>isGrammarAnswerCorrect(e,{...empty,selected}))).toHaveLength(1);
    }
  });
  it('uses closed answers for particle, gap and conjugation practice',()=>{
    expect(GRAMMAR_INTERACTIVE.filter(e=>e.exerciseType!=='sentence-order').every(isChoiceExercise)).toBe(true);
  });
  it('loads only the requested topic and supports every N5 topic',()=>{
    expect(grammarTopicRound('00')).toEqual([]);
    for(const topic of GRAMMAR_TOPICS.filter(t=>t.id!=='00')){const round=grammarTopicRound(topic.id);expect(round.length).toBeGreaterThan(0);expect(round.length).toBeLessThanOrEqual(topic.id==='01'?15:10);expect(round.every(e=>e.topicId===topic.id)).toBe(true);}
  });
  it('loads exercises belonging only to a requested lesson',()=>{
    const exercises=grammarTopicRound('03','8');
    expect(exercises.length).toBeGreaterThan(0);expect(exercises.every(e=>e.lessonId==='8'&&e.topicId==='03')).toBe(true);
  });
  it('does not silently fall back for an unknown topic or lesson',()=>{
    expect(grammarTopicExercises('99')).toEqual([]);expect(grammarTopicRound('03','999')).toEqual([]);
  });
  it('creates a mixed review with no repeated exercise IDs',()=>{
    const exercises=grammarMixedExercises();expect(exercises).toHaveLength(10);
    expect(new Set(exercises.map(e=>e.topicId)).size).toBeGreaterThan(1);
    expect(new Set(exercises.map(e=>e.id)).size).toBe(10);
  });
  it('prioritizes a studied concept within its topic',()=>{
    expect(grammarMixedExercises(['03.8'])[0].conceptId).toBe('03.8');
  });
  it('sentence reconstruction uses one constrained explicit order',()=>{
    for(const e of GRAMMAR_INTERACTIVE){if(e.kind!=='sentence-order')continue;
      expect(e.orderPolicy).toBe('constrained');expect(e.acceptedOrders).toBeUndefined();
      expect(new Set(e.solution).size).toBe(e.solution.length);
      expect(e.solution.length).toBe(e.tokenKeys.length);
      expect(isGrammarAnswerCorrect(e,{...empty,sequence:e.solution})).toBe(true);
      expect(isGrammarAnswerCorrect(e,{...empty,sequence:[...e.solution].reverse()})).toBe(false);
    }
  });
  it('preserves explicit conjugation prompts and correct forms',()=>{
    const e=GRAMMAR_INTERACTIVE.find(e=>e.id==='03.8')!;expect(t(e.questionKey)).toContain('pasado');
    expect(isChoiceExercise(e)).toBe(true);if(isChoiceExercise(e))expect(t(e.optionKeys[e.answer])).toBe('のみました');
  });
  it('resolves curated prompts and explanations in ES, EN and CA',()=>{
    for(const e of GRAMMAR_INTERACTIVE)for(const d of [es,en,ca])for(const key of [e.questionKey,e.promptKey,e.successKey,e.errorKey])expect((d as Record<string,string>)[key]).toBeTruthy();
  });
});

describe('Grammar interactive answers and completed sessions',()=>{
  beforeEach(()=>{localStorage.clear();vi.spyOn(window,'scrollTo').mockImplementation(()=>{});TestBed.configureTestingModule({providers:[provideRouter([{path:'grammar',children:GRAMMAR_ROUTES}]),GrammarPracticeSession,{provide:TranslationService,useValue:{t}}]});});
  afterEach(()=>{TestBed.resetTestingModule();vi.restoreAllMocks();});
  function fixtureFor(id:string){const fixture=TestBed.createComponent(GrammarExerciseComponent);fixture.componentRef.setInput('exercise',GRAMMAR_INTERACTIVE.find(e=>e.id===id));fixture.componentRef.setInput('practice',true);fixture.detectChanges();return fixture;}
  it('reports an incorrect answer and solution, waiting for Continue',()=>{
    const fixture=fixtureFor('03.8'),component=fixture.componentInstance;const e=component.choice()!;
    const continued=vi.fn();component.continued.subscribe(continued);
    component.select((e.answer+1)%e.optionKeys.length);component.check();fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Tu respuesta');expect(fixture.nativeElement.textContent).toContain('のみました');
    expect(component.checked()).toBe(true);expect(continued).not.toHaveBeenCalled();
  });
  it('shows correct feedback and a brief explanation',()=>{
    const fixture=fixtureFor('03.8'),component=fixture.componentInstance;component.select(component.choice()!.answer);component.check();fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain('Correcto');expect(fixture.nativeElement.textContent).toContain(t(component.exercise().successKey));
  });
  it('allows adding, removing and resetting ordered blocks by buttons',()=>{
    const fixture=fixtureFor('01.1'),component=fixture.componentInstance;const e=component.ordered()!;
    component.addToken(e.solution[0]);component.addToken(e.solution[0]);expect(component.sequence()).toHaveLength(1);
    component.removeToken(0);expect(component.sequence()).toEqual([]);
    for(const index of e.solution)component.addToken(index);expect(component.correct()).toBe(true);
    fixture.detectChanges();const reset=Array.from(fixture.nativeElement.querySelectorAll('button')).find(button=>(button as HTMLButtonElement).textContent?.includes('Reiniciar bloques')) as HTMLButtonElement;reset.click();fixture.detectChanges();
    expect(component.sequence()).toEqual([]);expect(component.ready()).toBe(false);
  });
  it('keeps a checked ordered answer immutable',()=>{
    const fixture=fixtureFor('01.1'),component=fixture.componentInstance;
    component.ordered()!.solution.forEach(i=>component.addToken(i));component.check();component.resetSequence();expect(component.correct()).toBe(true);
  });
  it('records one completed Grammar summary and does not record partial sessions',()=>{
    const session=TestBed.inject(GrammarPracticeSession),history=TestBed.inject(SessionHistoryService);
    const pool=grammarTopicRound('03');session.reset([...pool,pool[0]]);session.start();expect(new Set(session.roundExercises().map(e=>e.id)).size).toBe(session.total());
    session.answer(true);expect(history.sessions()).toEqual([]);session.answer(false);session.next();
    while(session.stage()==='question'){session.answer(false);session.next();}
    expect(session.stage()).toBe('results');expect(session.score()).toBe(1);expect(session.percent()).toBe(Math.round(100/session.total()));
    expect(history.sessions()).toHaveLength(1);const summary=history.sessions()[0];
    expect(summary).toMatchObject({module:'grammar',exercisesCompleted:pool.length,firstTrySuccesses:1,attempts:pool.length,grammarTopicIds:['03']});
    expect(summary.durationSeconds).toBeGreaterThanOrEqual(0);expect(summary.grammarExerciseIds).toHaveLength(pool.length);
    session.next();expect(history.sessions()).toHaveLength(1);
    expect(JSON.parse(localStorage.getItem('kana-study.completed-sessions.v1')!)[0].module).toBe('grammar');
  });
  it('renders score, errors, percentage and topics at the end of a round',()=>{
    const fixture=TestBed.createComponent(GrammarPracticeComponent);
    fixture.componentRef.setInput('practice',{...GRAMMAR_PRACTICES.find(p=>p.topicId==='03')!,exercises:grammarTopicRound('03','8')});fixture.detectChanges();
    const component=fixture.componentInstance;component.start();let index=0;
    while(component.session.stage()==='question'){component.answer(index++===0);component.next();}
    fixture.detectChanges();const text=fixture.nativeElement.querySelector('.practice-results').textContent;
    expect(text).toContain('1 / 4');expect(text).toContain('25%');expect(text).toContain('3 errores');expect(text).toContain('03');
    expect(TestBed.inject(SessionHistoryService).sessions()).toHaveLength(1);
    expect(component.progress.state().practices['03']).toBeUndefined();
  });
  it('does not register an empty round in history',()=>{
    const session=TestBed.inject(GrammarPracticeSession);session.reset([]);session.start();session.next();expect(TestBed.inject(SessionHistoryService).sessions()).toEqual([]);expect(session.percent()).toBe(0);
  });
  it('starts another round without carrying previous scores',()=>{
    const session=TestBed.inject(GrammarPracticeSession);session.reset(grammarTopicRound('03'));session.start();session.answer(true);session.next();session.start();
    expect(session.index()).toBe(0);expect(session.answers()).toEqual([]);
  });
  it('opens filtered practice through the existing topic route',async()=>{
    const harness=await RouterTestingHarness.create();const page=await harness.navigateByUrl('/grammar/n5/03/practice?lesson=8',GrammarPage);
    expect(page.practice()!.exercises.every(e=>e.lessonId==='8')).toBe(true);expect(harness.routeNativeElement!.querySelector('.practice-start')).not.toBeNull();
  });
  it('offers lesson practice while preserving the theory',async()=>{
    const harness=await RouterTestingHarness.create();await harness.navigateByUrl('/grammar/n5/03/8',GrammarPage);
    expect(harness.routeNativeElement!.querySelector('.lesson-theory-block')).not.toBeNull();
    expect(harness.routeNativeElement!.querySelector('a[href*="practice?lesson=8"]')).not.toBeNull();
  });
});
