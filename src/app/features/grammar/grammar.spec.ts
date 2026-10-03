import {grammarLessonExercises} from './models/grammar.model';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { TranslationService } from '../../core/services/translation.service';
import es from '../../../assets/i18n/es.json';
import en from '../../../assets/i18n/en.json';
import ca from '../../../assets/i18n/ca.json';
import { APP_MODULES } from '../../data/app-modules';
import { GRAMMAR_LESSONS, GRAMMAR_PRACTICES, GRAMMAR_TOPICS, GRAMMAR_ROADMAP, GRAMMAR_SESSIONS } from './data/grammar-n5.generated';
import { isChoiceExercise, isGrammarAnswerCorrect, GrammarAnswer } from './services/grammar-exercise-answer';
import { GrammarExercise } from './models/grammar.model';
import { GRAMMAR_ROUTES } from './grammar.routes';
import { GrammarExerciseComponent } from './components/grammar-exercise';
import { GrammarPracticeComponent } from './components/grammar-practice';
import { GrammarPage } from './pages/grammar.page';
import { GrammarPracticeSession } from './services/grammar-practice-session';

const translate = (key:string, values?:Record<string,string|number>) => {
  let value=(es as Record<string,string>)[key]??key;
  for(const [name,replacement]of Object.entries(values??{}))value=value.replaceAll(`{{${name}}}`,String(replacement));
  return value;
};
describe('Grammar N5 content and practice',()=>{
  afterEach(()=>TestBed.resetTestingModule());
  it('keeps eleven topics, eight writing lessons, thirteen nominal lessons and the original practice sizes',()=>{
    expect(GRAMMAR_TOPICS.map(t=>t.id)).toEqual(['00','01','02','03','04','05','06','07','08','09','10']);
    expect(GRAMMAR_LESSONS.filter(l=>l.topicId==='00')).toHaveLength(8);
    expect(GRAMMAR_LESSONS.filter(l=>l.topicId==='01')).toHaveLength(13);
    expect(GRAMMAR_TOPICS.map(t=>GRAMMAR_LESSONS.filter(l=>l.topicId===t.id).length)).toEqual([8,13,11,17,12,12,14,11,11,12,10]);
    expect(GRAMMAR_LESSONS).toHaveLength(131);
    expect(GRAMMAR_PRACTICES.map(p=>p.exercises.length)).toEqual([10,12,10,10,10,10,10,10,10,10,10]);
    expect(GRAMMAR_TOPICS.flatMap(t=>t.lessons).every(l=>l.path!==null)).toBe(true);
  });
  it('preserves example copy and defines a valid answer for every used exercise',()=>{
    expect(translate(GRAMMAR_LESSONS[0].exercise.promptKey)).toBe('テレビ');
    expect(translate(GRAMMAR_LESSONS[4].exercise.promptKey)).toBe('きて　　きって');
    for(const e of [...GRAMMAR_LESSONS.flatMap(grammarLessonExercises),...GRAMMAR_PRACTICES.flatMap(p=>p.exercises)]){
      const answer:GrammarAnswer={selected:isChoiceExercise(e)?e.answer:null,text:e.kind==='fill-gap'?e.acceptedAnswers[0]:'',sequence:e.kind==='sentence-order'||e.kind==='sentence-builder'?e.solution:[],matches:e.kind==='matching'?Object.fromEntries(e.pairs.map((_,i)=>[i,i])):{}};
      expect(isGrammarAnswerCorrect(e,answer),e.id).toBe(true);
    }
  });
  it('provides objectives, three theory blocks, independent examples and feedback for the new lessons',()=>{
    for(const lesson of GRAMMAR_LESSONS.filter(l=>Number(l.topicId)>=2)){
      expect(translate(lesson.descriptionKey).length).toBeGreaterThan(10);
      expect(lesson.theory.length).toBeGreaterThanOrEqual(2);
      expect(lesson.theory.length).toBeLessThanOrEqual(4);
      expect(translate(lesson.ideaKey).trim()).not.toBe('');
      expect(translate(lesson.exercise.successKey).length).toBeGreaterThan(10);
      expect(translate(lesson.exercise.errorKey).length).toBeGreaterThan(10);
      for(const example of lesson.theory.slice(1)){
        const japanese=translate(example.bodyKey).split(' — ')[0];
        expect(translate(lesson.exercise.promptKey)).not.toContain(japanese);
      }
      if(isChoiceExercise(lesson.exercise))expect(new Set(lesson.exercise.optionKeys.map(key=>translate(key))).size).toBe(lesson.exercise.optionKeys.length);
    }
  });
  it('offers mixed practice without source-lesson labels and returns the final topic to the roadmap',()=>{
    for(const practice of GRAMMAR_PRACTICES.filter(p=>Number(p.topicId)>=2)){
      expect(practice.exercises.length).toBeGreaterThanOrEqual(8);
      expect(practice.exercises.length).toBeLessThanOrEqual(12);
      for(const exercise of practice.exercises)expect(translate(exercise.topicKey)).toBe(`Tema ${practice.topicId}`);
      const theoryExamples=GRAMMAR_LESSONS.filter(l=>l.topicId===practice.topicId).flatMap(l=>l.theory.slice(1).map(b=>translate(b.bodyKey).split(' — ')[0]));
      for(const exercise of practice.exercises)for(const example of theoryExamples)expect(translate(exercise.promptKey)).not.toContain(example);
    }
    expect(GRAMMAR_PRACTICES.at(-1)?.nextPath).toBe('/grammar');
  });
  it('shows the current topic in practice results and starts another attempt with zero answers',()=>{
    TestBed.configureTestingModule({providers:[provideRouter([]),{provide:TranslationService,useValue:{t:translate}}]});
    const fixture=TestBed.createComponent(GrammarPracticeComponent);
    fixture.componentRef.setInput('practice',GRAMMAR_PRACTICES.find(p=>p.topicId==='09'));fixture.detectChanges();
    const session=fixture.componentInstance.session;session.start();
    for(let i=0;i<session.total();i++){session.answer(true);session.next();}
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.practice-results').textContent).toContain('Tema 09');
    expect(fixture.nativeElement.querySelector('.practice-results').textContent).not.toContain('Tema 00');
    (fixture.nativeElement.querySelector('.results-actions button') as HTMLButtonElement).click();fixture.detectChanges();
    expect(session.stage()).toBe('question');expect(session.score()).toBe(0);expect(session.index()).toBe(0);
  });
  it('resolves every content translation in ES, EN and CA',()=>{
    const keys:string[]=[];
    function visit(value:unknown):void{
      if(Array.isArray(value)){value.forEach(visit);return;}
      if(value&&typeof value==='object'){for(const [name,item]of Object.entries(value)){
        if(name.endsWith('Key'))keys.push(item as string);else if(name.endsWith('Keys'))keys.push(...item as string[]);else visit(item);
      }}
    }
    visit([GRAMMAR_TOPICS,GRAMMAR_LESSONS,GRAMMAR_PRACTICES,GRAMMAR_ROADMAP,GRAMMAR_SESSIONS]);
    for(const dictionary of [es,en,ca])for(const key of keys)expect(key in dictionary).toBe(true);
  });
  it('preserves next/previous lesson navigation and ends each topic at cumulative practice',()=>{
    for(const topic of GRAMMAR_TOPICS.map(t=>t.id)){
      const lessons=GRAMMAR_SESSIONS.filter(s=>s.topicId===topic).flatMap(s=>s.lessonIds.map(id=>GRAMMAR_LESSONS.find(l=>l.topicId===topic&&l.id===id)!));
      expect(lessons.at(-1)?.nextPath).toBe(`/grammar/n5/${topic}/practice`);
      for(let i=0;i<lessons.length-1;i++)expect(lessons[i].nextPath).toBe(`/grammar/n5/${topic}/${lessons[i+1].id}`);
    }
  });
  it('does not advance or count unanswered questions, scores once and can repeat the practice',()=>{
    const session=TestBed.runInInjectionContext(()=>new GrammarPracticeSession());session.reset(GRAMMAR_PRACTICES[0].exercises);session.start();session.next();expect(session.index()).toBe(0);
    for(let i=0;i<session.total();i++){session.answer(i!==0);session.answer(true);session.next();}
    expect(session.score()).toBe(9);expect(session.stage()).toBe('results');
    session.start();expect(session.score()).toBe(0);expect(session.index()).toBe(0);expect(session.checked()).toBe(false);
  });
  it.each([true,false])('checks a lesson answer once, gives feedback and reveals the correct option (correct=%s)',correct=>{
    TestBed.configureTestingModule({providers:[{provide:TranslationService,useValue:{t:translate}}]});
    const fixture=TestBed.createComponent(GrammarExerciseComponent);const exercise=GRAMMAR_LESSONS[0].exercise;
    if(!isChoiceExercise(exercise))throw new Error('Expected a choice exercise');
    fixture.componentRef.setInput('exercise',exercise);fixture.detectChanges();
    const answered=vi.fn();fixture.componentInstance.answered.subscribe(answered);
    expect(fixture.nativeElement.querySelector('.check-answer').disabled).toBe(true);
    fixture.componentInstance.select(correct?exercise.answer:0);fixture.componentInstance.check();fixture.componentInstance.check();fixture.detectChanges();
    expect(answered).toHaveBeenCalledExactlyOnceWith(correct);expect(fixture.nativeElement.querySelector('.correct').textContent).toBe('Katakana');
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain(translate(correct?exercise.successKey:exercise.errorKey));
    expect(fixture.nativeElement.querySelector('.continue-answer').disabled).toBe(false);
    expect([...fixture.nativeElement.querySelectorAll('.exercise-option')].every((b:any)=>b.disabled)).toBe(true);
  });
});

describe('Grammar navigation',()=>{
  beforeEach(()=>{vi.spyOn(window,'scrollTo').mockImplementation(()=>{});TestBed.configureTestingModule({providers:[provideRouter([{path:'grammar',children:GRAMMAR_ROUTES}]),{provide:TranslationService,useValue:{t:translate}}]});});
  afterEach(()=>{TestBed.resetTestingModule();vi.restoreAllMocks();});
  it('starts with N5 expanded, roadmap selected and all eleven topic links',async()=>{
    const harness=await RouterTestingHarness.create();await harness.navigateByUrl('/grammar',GrammarPage);
    const root=harness.routeNativeElement!;
    expect(root.querySelectorAll('.stage-card')).toHaveLength(11);
    expect(root.querySelector('.group-title')?.getAttribute('aria-expanded')).toBe('true');
    expect(root.querySelector('.subnav-item.selected')?.textContent).toContain('ROADMAP');
    expect(APP_MODULES.find(m=>m.id==='grammar')?.available).toBe(true);
    expect(root.querySelector('.grammar-toolbar a')?.getAttribute('href')).toContain('from=grammar');
  });
  it('renders every topic overview and every micro-lesson from data',async()=>{
    const harness=await RouterTestingHarness.create();
    for(const topic of GRAMMAR_TOPICS){await harness.navigateByUrl(`/grammar/n5/${topic.id}`,GrammarPage);expect(harness.routeNativeElement?.querySelectorAll('.lesson-card')).toHaveLength(GRAMMAR_SESSIONS.filter(s=>s.topicId===topic.id).length);}
    for(const lesson of GRAMMAR_LESSONS){await harness.navigateByUrl(`/grammar/n5/${lesson.topicId}/${lesson.id}`,GrammarPage);expect(harness.routeNativeElement?.querySelector('.lesson-heading-card h2')?.textContent).toBe(translate(lesson.titleKey));if(isChoiceExercise(grammarLessonExercises(lesson)[0]))expect(harness.routeNativeElement?.querySelectorAll('.exercise-option')).toHaveLength((grammarLessonExercises(lesson)[0] as import('./models/grammar.model').GrammarChoiceExercise).optionKeys.length);else expect(harness.routeNativeElement?.querySelector('.check-answer')).not.toBeNull();}
  });
  it('opens all cumulative practices and handles unsupported lessons without inventing content',async()=>{
    const harness=await RouterTestingHarness.create();
    for(const p of GRAMMAR_PRACTICES){await harness.navigateByUrl(`/grammar/n5/${p.topicId}/practice`,GrammarPage);expect(harness.routeNativeElement?.querySelector('.practice-intro h1')?.textContent).toBe(translate(p.intro.titleKey));}
    await harness.navigateByUrl('/grammar/n5/02/99',GrammarPage);expect(harness.routeNativeElement?.querySelector('.exercise-block')).toBeNull();
  });
  it('resets lesson feedback when navigating to the next lesson',async()=>{
    const harness=await RouterTestingHarness.create();await harness.navigateByUrl('/grammar/n5/00/1',GrammarPage);
    (harness.routeNativeElement?.querySelectorAll('.exercise-option')[1] as HTMLButtonElement).click();harness.detectChanges();
    (harness.routeNativeElement?.querySelector('.check-answer') as HTMLButtonElement).click();harness.detectChanges();
    (harness.routeNativeElement?.querySelector('.continue-answer') as HTMLButtonElement).click();await harness.fixture.whenStable();harness.detectChanges();
    expect(harness.routeNativeElement?.querySelector('.lesson-heading-card h2')?.textContent).toBe('Los sistemas de escritura');
    const page=harness.routeDebugElement!.componentInstance as GrammarPage;
    page.continueExercise();await harness.fixture.whenStable();harness.detectChanges();
    expect(harness.routeNativeElement?.querySelector('.lesson-heading-card h2')?.textContent).toBe('Hiragana básico');
    expect((harness.routeNativeElement?.querySelector('.check-answer')as HTMLButtonElement).disabled).toBe(true);
    expect(harness.routeNativeElement?.querySelector('.exercise-feedback')).toBeNull();
  });
});
