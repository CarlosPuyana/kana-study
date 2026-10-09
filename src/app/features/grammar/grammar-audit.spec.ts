import {FuriganaText} from '../../shared/components/furigana-text/furigana-text';
import {grammarLessonExercises} from './models/grammar.model';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { TranslationService } from '../../core/services/translation.service';
import { SettingsService } from '../../core/services/settings.service';
import { DEFAULT_LEARNING_SELECTION } from '../../core/models/settings.model';
import { SelectionPage } from '../selection/selection.page';
import es from '../../../assets/i18n/es.json';
import { GRAMMAR_LESSONS, GRAMMAR_PRACTICES, GRAMMAR_SESSIONS } from './data/grammar-n5.generated';
import { GrammarExercise, GrammarExerciseKind } from './models/grammar.model';
import { GrammarExerciseComponent } from './components/grammar-exercise';
import { GrammarPage } from './pages/grammar.page';
import { GRAMMAR_ROUTES } from './grammar.routes';
import { GrammarPracticeSession, GRAMMAR_RANDOM } from './services/grammar-practice-session';
import { GrammarAnswer, isChoiceExercise, isGrammarAnswerCorrect } from './services/grammar-exercise-answer';
import { shuffleGrammar, shuffleGrammarExercise } from './services/grammar-shuffle';

const translate=(key:string,params?:Record<string,string|number>)=>Object.entries(params??{}).reduce((s,[k,v])=>s.replaceAll(`{{${k}}}`,String(v)),(es as Record<string,string>)[key]??key);
const allExercises=[...GRAMMAR_LESSONS.flatMap(grammarLessonExercises),...GRAMMAR_PRACTICES.flatMap(p=>p.exercises)];
const kinds:GrammarExerciseKind[]=['multiple-choice','sentence-builder','sentence-order','fill-gap','matching','detect-error','select-segment'];
const sample=(kind:GrammarExerciseKind)=>allExercises.find(e=>e.kind===kind)!;
const answerFor=(e:GrammarExercise):GrammarAnswer=>({selected:isChoiceExercise(e)?e.answer:null,text:e.kind==='fill-gap'?e.acceptedAnswers[0]:'',sequence:e.kind==='sentence-builder'||e.kind==='sentence-order'?e.solution:[],matches:e.kind==='matching'?Object.fromEntries(e.pairs.map((_,i)=>[i,i])):{}});

describe('Grammar exercise interactions',()=>{
  beforeEach(()=>TestBed.configureTestingModule({providers:[{provide:TranslationService,useValue:{t:translate,language:()=>'es'}}]}));
  afterEach(()=>TestBed.resetTestingModule());
  function respond(component:GrammarExerciseComponent,e:GrammarExercise,correct:boolean){
    if(isChoiceExercise(e))component.select(correct?e.answer:(e.answer+1)%e.optionKeys.length);
    else if(e.kind==='fill-gap')component.textAnswer.set(correct?e.acceptedAnswers[0]:'ちがいます');
    else if(e.kind==='matching')e.pairs.forEach((_,i)=>{component.chooseLeft(i);component.matchRight(correct?i:(i+1)%e.pairs.length);});
    else (correct?e.solution:[...e.solution].reverse()).forEach(i=>component.addToken(i));
  }
  it.each(kinds.flatMap(kind=>[true,false].map(correct=>({kind,correct}))))('$kind checks a $correct answer once and shows feedback',({kind,correct})=>{
    const fixture=TestBed.createComponent(GrammarExerciseComponent),exercise=sample(kind);
    fixture.componentRef.setInput('exercise',exercise);fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.check-answer').disabled).toBe(true);
    const answered=vi.fn();fixture.componentInstance.answered.subscribe(answered);
    respond(fixture.componentInstance,exercise,correct);fixture.detectChanges();
    (fixture.nativeElement.querySelector('.check-answer') as HTMLButtonElement).click();fixture.componentInstance.check();fixture.detectChanges();
    expect(answered).toHaveBeenCalledExactlyOnceWith(correct);
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain(translate(correct?exercise.successKey:exercise.errorKey));
    expect(fixture.nativeElement.querySelector('.continue-answer').disabled).toBe(false);
    if(!correct)expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain(translate('grammar.solution'));
  });
  it.each(kinds)('resets %s when changing exercise, including checked feedback',kind=>{
    const fixture=TestBed.createComponent(GrammarExerciseComponent),exercise=sample(kind);
    fixture.componentRef.setInput('exercise',exercise);fixture.detectChanges();respond(fixture.componentInstance,exercise,true);fixture.componentInstance.check();fixture.detectChanges();
    fixture.componentRef.setInput('exercise',{...exercise,id:'next'});fixture.detectChanges();
    expect(fixture.componentInstance.ready()).toBe(false);expect(fixture.nativeElement.querySelector('[role="status"]')).toBeNull();
    expect(fixture.componentInstance.sequence()).toEqual([]);expect(fixture.componentInstance.matches()).toEqual({});expect(fixture.componentInstance.textAnswer()).toBe('');
  });
  it('constructs and removes tokens using native buttons without duplicated blocks',()=>{
    const fixture=TestBed.createComponent(GrammarExerciseComponent);fixture.componentRef.setInput('exercise',sample('sentence-order'));fixture.detectChanges();
    (fixture.nativeElement.querySelector('.token-bank button') as HTMLButtonElement).click();fixture.detectChanges();
    expect(fixture.componentInstance.sequence()).toEqual([0]);expect(fixture.nativeElement.querySelector('.token-bank button').disabled).toBe(true);
    (fixture.nativeElement.querySelector('.constructed-sentence button') as HTMLButtonElement).click();fixture.detectChanges();expect(fixture.componentInstance.sequence()).toEqual([]);
  });
  it('lets a matching pair be changed before checking without assigning a right item twice',()=>{
    const fixture=TestBed.createComponent(GrammarExerciseComponent);fixture.componentRef.setInput('exercise',sample('matching'));fixture.detectChanges();
    const component=fixture.componentInstance;component.chooseLeft(0);component.matchRight(1);component.chooseLeft(1);component.matchRight(1);
    expect(component.matches()).toEqual({1:1});expect(component.ready()).toBe(false);
    component.chooseLeft(0);component.matchRight(0);component.chooseLeft(2);component.matchRight(2);expect(component.correct()).toBe(true);
  });
  it('accepts harmless spacing/full-width punctuation but does not accept romaji in a kana transformation',()=>{
    const e=sample('fill-gap');expect(isGrammarAnswerCorrect(e,{...answerFor(e),text:`　${answerFor(e).text}。 `})).toBe(true);
    expect(isGrammarAnswerCorrect(e,{...answerFor(e),text:'deshita'})).toBe(false);
  });
  it('does not check Enter while a Japanese IME composition is active',()=>{
    const fixture=TestBed.createComponent(GrammarExerciseComponent);fixture.componentRef.setInput('exercise',sample('fill-gap'));fixture.detectChanges();respond(fixture.componentInstance,sample('fill-gap'),true);
    fixture.componentInstance.onEnter(new KeyboardEvent('keydown',{key:'Enter',isComposing:true}));expect(fixture.componentInstance.checked()).toBe(false);
    fixture.componentInstance.onEnter(new KeyboardEvent('keydown',{key:'Enter'}));expect(fixture.componentInstance.checked()).toBe(true);
  });
  it('accepts authored equivalent orders but rejects an incomplete sentence',()=>{
    const e=allExercises.find(e=>(e.kind==='sentence-builder'||e.kind==='sentence-order')&&e.acceptedOrders?.length)!;
    if(e.kind!=='sentence-builder'&&e.kind!=='sentence-order')throw new Error('Expected sequence');
    expect(isGrammarAnswerCorrect(e,{...answerFor(e),sequence:e.acceptedOrders![0]})).toBe(true);
    expect(isGrammarAnswerCorrect(e,{...answerFor(e),sequence:e.solution.slice(1)})).toBe(false);
  });
});

describe('Grammar shuffling and error review',()=>{
  beforeEach(()=>TestBed.configureTestingModule({providers:[{provide:GRAMMAR_RANDOM,useValue:()=>0}]}));
  afterEach(()=>TestBed.resetTestingModule());
  it('shuffles questions predictably without changing source data',()=>{
    const source=[1,2,3,4];expect(shuffleGrammar(source,()=>0)).toEqual([2,3,4,1]);expect(source).toEqual([1,2,3,4]);
  });
  it.each(['multiple-choice','sentence-builder','sentence-order'] as const)('keeps the %s solution correct after shuffling options or blocks',kind=>{
    const original=sample(kind),shuffled=shuffleGrammarExercise(original,()=>0);
    expect(isGrammarAnswerCorrect(shuffled,answerFor(shuffled))).toBe(true);
    if(isChoiceExercise(original)&&isChoiceExercise(shuffled))expect(shuffled.optionKeys[shuffled.answer]).toBe(original.optionKeys[original.answer]);
    else if((original.kind==='sentence-builder'||original.kind==='sentence-order')&&(shuffled.kind==='sentence-builder'||shuffled.kind==='sentence-order')){
      expect(shuffled.solution.map(i=>shuffled.tokenKeys[i])).toEqual(original.solution.map(i=>original.tokenKeys[i]));
      expect(shuffled.tokenKeys).not.toEqual(original.tokenKeys);
    }
  });
  it('preserves segment syntax and shuffles only the right column in matching',()=>{
    for(const kind of ['select-segment','detect-error'] as const)expect(shuffleGrammarExercise(sample(kind),()=>0)).toEqual(sample(kind));
    const e=sample('matching'),shuffled=shuffleGrammarExercise(e,()=>0);if(e.kind!=='matching'||shuffled.kind!=='matching')throw new Error('Expected matching');
    expect(shuffled.pairs).toEqual(e.pairs);expect([...shuffled.rightOrder!].sort()).toEqual([0,1,2]);
  });
  it('reshuffles a round and reviews only failed exercises, then repeats the full original practice',()=>{
    const session=TestBed.runInInjectionContext(()=>new GrammarPracticeSession()),source=GRAMMAR_PRACTICES[1].exercises;
    session.reset(source);session.start();expect(session.current()!.id).not.toBe(source[0].id);
    const failed:string[]=[];
    for(let i=0;i<session.total();i++){if(i<2)failed.push(session.current()!.id);session.answer(i>=2);session.answer(true);session.next();}
    expect(session.score()).toBe(source.length-2);expect(session.failures().map(e=>e.id)).toEqual(failed);expect(session.errorConcepts().every(e=>e.conceptId&&e.errorCategoryKey)).toBe(true);
    session.reviewErrors();expect(session.reviewing()).toBe(true);expect(session.total()).toBe(2);expect(session.score()).toBe(0);
    const reviewed:string[]=[];for(let i=0;i<session.total();i++){reviewed.push(session.current()!.id);session.answer(true);session.next();}
    expect(reviewed.sort()).toEqual(failed.sort());expect(session.failures()).toEqual([]);expect(session.stage()).toBe('results');
    session.start();expect(session.total()).toBe(source.length);expect(session.reviewing()).toBe(false);
  });
  it('deduplicates concept summaries while retaining all failed exercises and does nothing without failures',()=>{
    const session=TestBed.runInInjectionContext(()=>new GrammarPracticeSession()),e=sample('multiple-choice');session.reset([{...e,conceptId:'00.1'},{...e,id:'another',conceptId:'00.1'}]);session.start();
    session.answer(false);session.next();session.answer(false);session.next();expect(session.errorConcepts()).toHaveLength(1);expect(session.failures()).toHaveLength(2);
    session.reviewErrors();session.answer(true);session.next();session.answer(true);session.next();session.reviewErrors();expect(session.stage()).toBe('results');
  });
});

describe('Grammar grouped content and routes',()=>{
  afterEach(()=>{TestBed.resetTestingModule();vi.restoreAllMocks();});
  it('groups all 131 stable concepts exactly once into 72 pedagogical sessions',()=>{
    expect(GRAMMAR_SESSIONS).toHaveLength(72);const ids=GRAMMAR_SESSIONS.flatMap(s=>s.lessonIds.map(id=>`${s.topicId}.${id}`));
    expect(new Set(ids).size).toBe(131);expect(ids.sort()).toEqual(GRAMMAR_LESSONS.map(l=>`${l.topicId}.${l.id}`).sort());
    expect(GRAMMAR_SESSIONS.filter(s=>s.topicId==='06').map(s=>s.lessonIds)).toEqual([['1','2','3','4','5','6','7'],['8','11'],['9','10'],['12','13','14']]);
  });
  it('uses active exercises in every topic 01–10 and keeps 542 total exercises',()=>{
    expect(allExercises).toHaveLength(542);expect(new Set(allExercises.map(e=>e.kind))).toEqual(new Set(kinds));
    for(let i=1;i<=10;i++)expect(GRAMMAR_LESSONS.some(l=>+l.topicId===i&&l.exercise.kind!=='multiple-choice')).toBe(true);
    expect(GRAMMAR_LESSONS.filter(l=>l.topicId==='06'&&+l.id<=7).every(l=>l.exercise.kind==='fill-gap')).toBe(true);
  });
  it('declares lightweight prerequisites and has no unexplained kanji in the beginner lessons',()=>{
    for(const lesson of GRAMMAR_LESSONS){expect(lesson.prerequisites.intendedVocabulary.length).toBeGreaterThan(0);expect(lesson.prerequisites.requiredKana).toBeInstanceOf(Array);}
    function collect(value:unknown):string[]{
      if(Array.isArray(value))return value.flatMap(collect);
      if(value&&typeof value==='object')return Object.entries(value).flatMap(([name,item])=>name.endsWith('Key')?[translate(item as string)]:name==='symbol'?[item as string]:collect(item));
      return [];
    }
    for(const lesson of GRAMMAR_LESSONS.filter(l=>+l.topicId<2)){
      const visible=(lesson.prerequisites.inlineExplanations??[]).reduce((text,e)=>text.replaceAll(e.term,''),collect(lesson).join(''));
      const kanji=visible.match(/\p{Script=Han}/gu)??[];
      expect(kanji.every(c=>lesson.prerequisites.allowedKanji.includes(c)),`${lesson.topicId}.${lesson.id}`).toBe(true);
    }
  });
  it('uses original multi-sentence reading and a practical menu with a real ordering exercise',()=>{
    const lesson=(id:string)=>GRAMMAR_LESSONS.find(l=>l.topicId==='10'&&l.id===id)!;
    expect(lesson('4').exercise.kind).toBe('sentence-order');
    expect(translate(lesson('6').exercise.contextKey!)).toContain('こうえん');
    expect(translate(lesson('7').exercise.contextKey!).length).toBeGreaterThan(250);
    expect(translate(lesson('8').exercise.contextKey!)).toContain('<table>');
    expect(translate(lesson('9').ideaKey)).toContain('Repasar errores');
  });
  it('shows the semantic lesson and its position in Topic 10 navigation',async()=>{
    vi.spyOn(window,'scrollTo').mockImplementation(()=>{});TestBed.configureTestingModule({providers:[provideRouter([{path:'grammar',children:GRAMMAR_ROUTES}]),{provide:TranslationService,useValue:{t:translate,language:()=>'es'}}]});
    const harness=await RouterTestingHarness.create();const page=await harness.navigateByUrl('/grammar/n5/10/change-naru',GrammarPage);
    expect(page.lesson()!.concept!.id).toBe('change-naru');expect(page.lesson()!.position).toBe(5);
    expect(harness.routeNativeElement!.querySelectorAll('.topic-subnav-item')).toHaveLength(9);
    expect(harness.routeNativeElement!.querySelector('.topic-subnav-item[aria-current=step]')).not.toBeNull();
    expect(page.lesson()!.nextPath).toBe('/grammar/n5/10/choice-ni-suru');
  });
  it('renders authored kanji reading help through the existing ruby component',()=>{
    const example=GRAMMAR_LESSONS.find(l=>l.topicId==='09'&&l.id==='12')!.kanjiExamples![0];
    const fixture=TestBed.createComponent(FuriganaText);fixture.componentRef.setInput('segments',example.segments);fixture.detectChanges();
    const segment=example.segments.find(s=>s.reading)!;expect(fixture.nativeElement.querySelector('ruby').textContent).toBe(segment.text+segment.reading);expect(fixture.nativeElement.querySelector('rt').textContent).toBe(segment.reading);
  });
  it('shows readings and meanings in the V2 nominal examples',async()=>{
    vi.spyOn(window,'scrollTo').mockImplementation(()=>{});TestBed.configureTestingModule({providers:[provideRouter([{path:'grammar',children:GRAMMAR_ROUTES}]),{provide:TranslationService,useValue:{t:translate,language:()=>'es'}}]});
    const harness=await RouterTestingHarness.create();await harness.navigateByUrl('/grammar/n5/01/state-being-plain',GrammarPage);
    const explanation=harness.routeNativeElement!.querySelector('app-grammar-v2-lesson')!.textContent;
    expect(explanation).toContain('がくせいだ。');expect(explanation).toContain('Es estudiante.');
  });
  it('offers both Kana entry points from Topic 00 with from=grammar',async()=>{
    vi.spyOn(window,'scrollTo').mockImplementation(()=>{});TestBed.configureTestingModule({providers:[provideRouter([{path:'grammar',children:GRAMMAR_ROUTES}]),{provide:TranslationService,useValue:{t:translate,language:()=>'es'}}]});
    const harness=await RouterTestingHarness.create();await harness.navigateByUrl('/grammar/n5/00',GrammarPage);
    const links=harness.routeNativeElement!.querySelectorAll('app-grammar-prerequisites .prerequisites nav a');expect(links).toHaveLength(2);
    expect(links[0].getAttribute('href')).toContain('kana=hiragana');expect(links[1].getAttribute('href')).toContain('kana=katakana');expect(links[0].getAttribute('href')).toContain('from=grammar');
  });
  it.each(['hiragana','katakana'] as const)('preselects %s in the existing Kana module as an unsaved draft',kana=>{
    const saved=structuredClone(DEFAULT_LEARNING_SELECTION),save=vi.fn();TestBed.configureTestingModule({providers:[provideRouter([]),{provide:TranslationService,useValue:{t:translate,language:()=>'es'}},{provide:SettingsService,useValue:{selection:()=>saved,saveLearningSelection:save}},{provide:ActivatedRoute,useValue:{snapshot:{queryParamMap:convertToParamMap({from:'grammar',kana})}}}]});
    const fixture=TestBed.createComponent(SelectionPage);fixture.detectChanges();const draft=fixture.componentInstance.draft();
    expect(Object.values(draft.categories[kana]).every(Boolean)).toBe(true);expect(Object.values(draft.categories[kana==='hiragana'?'katakana':'hiragana']).every(v=>!v)).toBe(true);
    expect(saved).toEqual(DEFAULT_LEARNING_SELECTION);expect(save).not.toHaveBeenCalled();
  });
});
