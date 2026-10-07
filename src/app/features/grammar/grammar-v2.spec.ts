import {TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import {RouterTestingHarness} from '@angular/router/testing';
import {GRAMMAR_V2_CONCEPTS as ALL_V2_CONCEPTS, GRAMMAR_V2_REVIEW as ALL_V2_REVIEW} from '../../data/grammar/grammar-n5-v2.generated';
import {GRAMMAR_PROGRESS_V2_KEY} from '../../core/models/grammar-v2.model';
import {GRAMMAR_PROGRESS_KEY, emptyGrammarProgress} from '../../core/models/grammar-progress.model';
import {GrammarProgressService} from '../../core/services/grammar-progress.service';
import {GrammarV2ProgressService} from '../../core/services/grammar-v2-progress.service';
import {TranslationService} from '../../core/services/translation.service';
import {WeaknessService} from '../../core/services/weakness.service';
import {WorkspaceService} from '../../core/services/workspace.service';
import {SessionHistoryService} from '../../core/services/session-history.service';
import {GRAMMAR_ROUTES} from './grammar.routes';
import {GRAMMAR_LESSONS, GRAMMAR_PRACTICES, GRAMMAR_SESSIONS, GRAMMAR_TOPICS} from './data/grammar-catalog';
import * as legacy from './data/grammar-n5.generated';
import {GrammarPage} from './pages/grammar.page';
import {GrammarExerciseComponent} from './components/grammar-exercise';
import {GrammarV2LessonComponent} from './components/grammar-v2-lesson';
import {GrammarPracticeComponent} from './components/grammar-practice';
import {grammarMixedExercises, grammarTopicRound} from './services/grammar-interactive-catalog';
import {grammarFocusedExercises, grammarWeaknessIdentity, grammarWeaknessTitleKey} from './services/grammar-weakness';
import {shuffleGrammarExercise} from './services/grammar-shuffle';
import {GrammarExercise} from './models/grammar.model';
import {isChoiceExercise, isGrammarAnswerCorrect} from './services/grammar-exercise-answer';
import es from '../../../assets/i18n/es.json';
import en from '../../../assets/i18n/en.json';
import ca from '../../../assets/i18n/ca.json';

const GRAMMAR_V2_CONCEPTS=ALL_V2_CONCEPTS.filter(c=>c.topicId==='01');
const GRAMMAR_V2_REVIEW=ALL_V2_REVIEW.filter(e=>e.topicId==='01');
const ids=['sentence-structure-context','state-being-plain','state-being-negative','state-being-past','state-being-past-negative','particle-wa-topic','particle-mo-inclusive','particle-ga-identifier','particle-wa-vs-ga','particle-no-noun-link','demonstratives-ko-so-a-do'];
const t=(key:string,params:Record<string,string|number>={})=>Object.entries(params).reduce((s,[name,value])=>s.replaceAll(`{{${name}}}`,String(value)),(es as Record<string,string>)[key]??key);
const all=[...GRAMMAR_V2_CONCEPTS.flatMap(c=>c.exercises),...GRAMMAR_V2_REVIEW];

describe('Grammar V2 canonical catalog',()=>{
  it('replaces Topic 00 with prerequisites, and Topic 01 with eleven ordered semantic core concepts',()=>{
    expect(GRAMMAR_TOPICS.find(t=>t.id==='00')!.lessons).toEqual([]);
    expect(GRAMMAR_LESSONS.filter(l=>l.topicId==='00')).toEqual([]);
    expect(GRAMMAR_SESSIONS.filter(s=>s.topicId==='00')).toEqual([]);
    expect(GRAMMAR_PRACTICES.filter(p=>p.topicId==='00')).toEqual([]);
    expect(GRAMMAR_V2_CONCEPTS.map(c=>c.id)).toEqual(ids);
    expect(GRAMMAR_LESSONS.filter(l=>l.topicId==='01').map(l=>l.id)).toEqual(ids);
    for(const [i,c] of GRAMMAR_V2_CONCEPTS.entries()){
      expect(c).toMatchObject({level:'N5',track:'core',topicId:'01',order:i+1});
      expect(c.id).not.toMatch(/^\d+\.\d+$/);
      expect(c.prerequisiteIds.every(id=>ids.slice(0,i).includes(id))).toBe(true);
      expect(c.relatedIds.every(id=>ALL_V2_CONCEPTS.some(other=>other.id===id))).toBe(true);
      expect(c.lesson.detailedExplanation.length).toBeGreaterThanOrEqual(2);
    }
  });
  it('keeps Topics 03–10 byte-for-byte equivalent at the data boundary',()=>{
    for(const [actual,original] of [[GRAMMAR_LESSONS,legacy.GRAMMAR_LESSONS],[GRAMMAR_PRACTICES,legacy.GRAMMAR_PRACTICES],[GRAMMAR_SESSIONS,legacy.GRAMMAR_SESSIONS]] as const)
      expect(actual.filter(x=>Number(x.topicId)>=3)).toEqual(original.filter(x=>Number(x.topicId)>=3));
    expect(GRAMMAR_TOPICS.slice(3)).toEqual(legacy.GRAMMAR_TOPICS.slice(3));
  });
  it('has 53 lesson exercises and 15 distinct cumulative exercises with real concepts and answer-specific feedback',()=>{
    expect(GRAMMAR_V2_CONCEPTS.flatMap(c=>c.exercises)).toHaveLength(53);expect(GRAMMAR_V2_REVIEW).toHaveLength(15);
    expect(new Set(all.map(e=>e.id)).size).toBe(68);
    for(const e of all){
      expect(ids).toContain(e.conceptId);expect(e.skill).toBeTruthy();expect([1,2,3]).toContain(e.difficulty);
      if(isChoiceExercise(e)){
        expect(e.options?.map(o=>o.textKey)).toEqual(e.optionKeys);
        expect(e.options?.every(o=>t(o.feedbackKey).length>12)).toBe(true);
        if(e.kind==='detect-error'){
          expect(e.options![e.answer].grammarStatus).toBe('invalid');
          expect(e.options?.filter(o=>o.grammarStatus==='invalid')).toHaveLength(1);
        }
      }
      expect(isGrammarAnswerCorrect(e,{selected:isChoiceExercise(e)?e.answer:null,text:e.kind==='fill-gap'?e.acceptedAnswers[0]:'',sequence:e.kind==='sentence-order'||e.kind==='sentence-builder'?e.solution:[],matches:e.kind==='matching'?Object.fromEntries(e.pairs.map((_,i)=>[i,i])):{}}),e.id).toBe(true);
    }
    expect(grammarTopicRound('01')).toEqual(GRAMMAR_V2_REVIEW);
    expect(grammarMixedExercises().some(e=>e.topicId==='00')).toBe(false);
  });
  it('resolves every new translation in all languages without Spanish prose placeholders',()=>{
    const dictionaries=[es,en,ca] as Record<string,string>[];
    const visit=(value:unknown):void=>{if(typeof value==='string'&&value.startsWith('grammar.'))for(const d of dictionaries)expect(d[value],value).toBeTruthy();else if(Array.isArray(value))value.forEach(visit);else if(value&&typeof value==='object')Object.values(value).forEach(visit);};
    visit(GRAMMAR_V2_CONCEPTS);visit(GRAMMAR_V2_REVIEW);
    const keys=Object.keys(es).filter(k=>k.startsWith('grammar.v2.'));
    for(const key of keys){
      expect((en as Record<string,string>)[key]).toBeTruthy();expect((ca as Record<string,string>)[key]).toBeTruthy();
      const source=(es as Record<string,string>)[key];
      if(/[A-Za-zÀ-ÿ]/u.test(source)) {expect((en as Record<string,string>)[key],key).not.toBe(source);expect((ca as Record<string,string>)[key],key).not.toBe(source);}
    }
  });
  it('keeps feedback attached to the same option when shuffling',()=>{
    const source=all.find(e=>e.kind==='multiple-choice')!;
    const shuffled=shuffleGrammarExercise(source,()=>0);
    if(!isChoiceExercise(source)||!isChoiceExercise(shuffled))throw Error('choice expected');
    for(const [i,option] of shuffled.options!.entries())expect(option).toEqual(source.options!.find(o=>o.textKey===shuffled.optionKeys[i]));
    expect(shuffled.options![shuffled.answer].id).toBe(source.options![source.answer].id);
  });
});

describe('Grammar V2 progress, routes and rendering',()=>{
  beforeEach(()=>{
    localStorage.clear();vi.spyOn(window,'scrollTo').mockImplementation(()=>undefined);
    vi.stubGlobal('matchMedia',()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()}));
    TestBed.configureTestingModule({providers:[provideRouter([{path:'grammar',children:GRAMMAR_ROUTES},{path:'selection',component:GrammarPage}]),{provide:TranslationService,useValue:{t,language:()=> 'es'}}]});
  });
  afterEach(()=>{TestBed.resetTestingModule();vi.restoreAllMocks();vi.unstubAllGlobals();});
  it('renders prerequisites with real Kana links and a direct CTA, and redirects old Topic 00 lesson links without recording anything',async()=>{
    const harness=await RouterTestingHarness.create();
    await harness.navigateByUrl('/grammar/n5/00/1',GrammarPage);
    const root=harness.routeNativeElement!;
    expect(root.querySelector('app-grammar-prerequisites')).not.toBeNull();
    const links=Array.from(root.querySelectorAll('app-grammar-prerequisites a')).map(a=>a.getAttribute('href'));
    expect(links).toContain('/selection?from=grammar&kana=hiragana');expect(links).toContain('/selection?from=grammar&kana=katakana');
    expect(links).toContain('/grammar/n5/01/sentence-structure-context');
    expect(root.querySelector('app-grammar-exercise, .grammar-completion')).toBeNull();
    expect(TestBed.inject(GrammarProgressService).state().concepts).toEqual({});
    expect(TestBed.inject(WeaknessService).records()).toEqual([]);
    expect(localStorage.getItem(GRAMMAR_PROGRESS_V2_KEY)).toBeNull();expect(localStorage.getItem(GRAMMAR_PROGRESS_KEY)).toBeNull();
  });
  it('does not migrate or expose old Topic 00/01 progress',()=>{
    const old=emptyGrammarProgress();const now=new Date().toISOString();
    old.concepts['01.2']={conceptId:'01.2',topicId:'01',status:'completed',startedAt:now,updatedAt:now,completedAt:now,lastExerciseIndex:0,answers:{}};
    localStorage.setItem(GRAMMAR_PROGRESS_KEY,JSON.stringify(old));
    const service=TestBed.inject(GrammarV2ProgressService);expect(service.state().concepts).toEqual({});expect(localStorage.getItem(GRAMMAR_PROGRESS_V2_KEY)).toBeNull();
    service.open(ids[1]);expect(JSON.parse(localStorage.getItem(GRAMMAR_PROGRESS_V2_KEY)!).version).toBe(2);
    expect(localStorage.getItem(GRAMMAR_PROGRESS_KEY)).toBe(JSON.stringify(old));expect(TestBed.inject(GrammarProgressService).conceptStatus('01.2')).toBe('not-started');
  });
  it('requires opening and one success per required exercise, retaining failures and allowing correction',()=>{
    const service=TestBed.inject(GrammarV2ProgressService),c=GRAMMAR_V2_CONCEPTS[1];TestBed.tick();
    c.exercises.forEach((e,i)=>service.record(c.id,e.id,i,i!==0));
    expect(service.state().concepts[c.id].status).toBe('in-progress');
    service.record(c.id,c.exercises[0].id,0,true);expect(service.state().concepts[c.id].status).toBe('in-progress');
    service.open(c.id);let row=service.state().concepts[c.id];
    expect(row.status).toBe('completed');expect(row.completedAt).toBeTruthy();expect(row.attempts).toBe(c.exercises.length+1);expect(row.correct).toBe(c.exercises.length);
    service.record(c.id,c.exercises[0].id,0,false);row=service.state().concepts[c.id];
    expect(row.status).toBe('completed');expect(row.answers[c.exercises[0].id]).toMatchObject({correct:false,solved:true,attempts:3,correctCount:1});
    TestBed.resetTestingModule();expect(TestBed.inject(GrammarV2ProgressService).state().concepts[c.id]).toEqual(row);
  });
  it('restores the first unsolved exercise and isolates progress by workspace',()=>{
    const service=TestBed.inject(GrammarV2ProgressService),c=GRAMMAR_V2_CONCEPTS[0];TestBed.tick();service.open(c.id);
    service.record(c.id,c.exercises[0].id,0,true);service.record(c.id,c.exercises[1].id,1,false);
    expect(service.firstPending(c.id)).toBe(1);
    const workspace=TestBed.inject(WorkspaceService);workspace.activateUser('v2-test');TestBed.tick();expect(service.state().concepts).toEqual({});
    workspace.activateGuest();TestBed.tick();expect(service.firstPending(c.id)).toBe(1);
  });
  it('rejects forged completion and unknown exercise IDs on reload',()=>{
    const c=GRAMMAR_V2_CONCEPTS[0],now=new Date().toISOString();
    localStorage.setItem(GRAMMAR_PROGRESS_V2_KEY,JSON.stringify({version:2,concepts:{[c.id]:{conceptId:c.id,topicId:'01',startedAt:now,openedAt:now,updatedAt:now,status:'completed',answers:{fake:{solved:true,correct:true,attempts:1,correctCount:1,answeredAt:now}}}}}));
    const row=TestBed.inject(GrammarV2ProgressService).state().concepts[c.id];expect(row.status).toBe('in-progress');expect(row.answers).toEqual({});
  });
  it('keeps detailed explanation collapsed and resets it on concept navigation',()=>{
    const f=TestBed.createComponent(GrammarV2LessonComponent);f.componentRef.setInput('concept',GRAMMAR_V2_CONCEPTS[0]);f.detectChanges();
    const toggle=()=>f.nativeElement.querySelector('.details-toggle') as HTMLButtonElement;
    expect(toggle().getAttribute('aria-expanded')).toBe('false');toggle().click();f.detectChanges();expect(toggle().getAttribute('aria-expanded')).toBe('true');
    f.componentRef.setInput('concept',GRAMMAR_V2_CONCEPTS[1]);f.detectChanges();expect(toggle().getAttribute('aria-expanded')).toBe('false');
  });
  it.each(['dark','light'])('marks invalid Japanese with text and never as correct after successful error detection in %s theme',theme=>{
    document.documentElement.dataset['theme']=theme;
    const e=GRAMMAR_V2_CONCEPTS[1].exercises.find(e=>e.kind==='detect-error')!;
    if(!isChoiceExercise(e))throw Error('choice expected');
    const f=TestBed.createComponent(GrammarExerciseComponent);f.componentRef.setInput('exercise',e);f.detectChanges();const answered=vi.fn();f.componentInstance.answered.subscribe(answered);
    expect(e.optionKeys.map(k=>t(k))).toEqual(['学生だ。','学生だです。','学生です。']);
    f.componentInstance.select(e.answer);f.componentInstance.check();f.detectChanges();
    const invalid=f.nativeElement.querySelectorAll('.exercise-option')[e.answer] as HTMLElement;
    expect(answered).toHaveBeenCalledWith(true);expect(invalid.classList.contains('correct')).toBe(false);expect(invalid.classList.contains('wrong')).toBe(true);
    expect(invalid.textContent).toContain('❌ Construcción incorrecta');expect(f.nativeElement.querySelector('[role=status]').textContent).toContain('Has identificado correctamente el error.');
    expect(f.nativeElement.querySelector('[role=status]').textContent).toContain(t(e.options![e.answer].feedbackKey));
    document.documentElement.removeAttribute('data-theme');
  });
  it('shows the selected distractor feedback for multiple-choice',()=>{
    const e=all.find(e=>e.kind==='multiple-choice')!;if(!isChoiceExercise(e))throw Error('choice expected');
    const f=TestBed.createComponent(GrammarExerciseComponent);f.componentRef.setInput('exercise',e);f.detectChanges();f.componentInstance.select(1);f.componentInstance.check();f.detectChanges();
    expect(f.nativeElement.querySelector('[role=status]').textContent).toContain(t(e.options![1].feedbackKey));
  });
  it('opens semantic URLs, retries mistakes, records semantic Weakness, and advances in order',async()=>{
    const harness=await RouterTestingHarness.create(),c=GRAMMAR_V2_CONCEPTS[0];
    const page=await harness.navigateByUrl(`/grammar/n5/01/${c.id}`,GrammarPage);
    expect(TestBed.inject(GrammarV2ProgressService).state().concepts[c.id].openedAt).toBeTruthy();
    for(let i=0;i<c.exercises.length;i++){page.answer(i!==0);page.continueExercise();harness.detectChanges();}
    expect(page.retryPending()).toBe(true);page.retryExercises();harness.detectChanges();expect(page.exerciseIndex()).toBe(0);
    expect(TestBed.inject(WeaknessService).records().some(r=>r.module==='grammar'&&r.itemId===c.id)).toBe(true);
    for(let i=0;i<c.exercises.length;i++){page.answer(true);page.continueExercise();harness.detectChanges();}
    await harness.fixture.whenStable();expect(harness.routeNativeElement!.textContent).toContain(t(GRAMMAR_V2_CONCEPTS[1].titleKey));
  });
  it('finishes the last concept at cumulative practice and cumulative practice links to Topic 02',async()=>{
    const c=GRAMMAR_V2_CONCEPTS.at(-1)!,harness=await RouterTestingHarness.create();const page=await harness.navigateByUrl(`/grammar/n5/01/${c.id}`,GrammarPage);
    for(const _ of c.exercises){page.answer(true);page.continueExercise();harness.detectChanges();}await harness.fixture.whenStable();
    expect(harness.routeNativeElement!.querySelector('app-grammar-practice')).not.toBeNull();
    const f=TestBed.createComponent(GrammarPracticeComponent);f.componentRef.setInput('practice',GRAMMAR_PRACTICES[0]);f.detectChanges();const p=f.componentInstance;p.start();
    for(let i=0;i<15;i++){p.answer(i>0);p.next();}f.detectChanges();
    expect(TestBed.inject(GrammarV2ProgressService).state().practices['01']).toMatchObject({score:14,total:15});
    expect(f.nativeElement.querySelector('.results-actions .primary-link').getAttribute('href')).toBe('/grammar/n5/02');
    const history=TestBed.inject(SessionHistoryService);expect(history).toBeTruthy();
  });
  it('retains semantic identities in focused Weakness practice',()=>{
    const e=GRAMMAR_V2_CONCEPTS[5].exercises[0],identity=grammarWeaknessIdentity(e)!;
    expect(identity.itemId).toBe('particle-wa-topic');expect(grammarWeaknessTitleKey(identity.itemId)).toBe(GRAMMAR_V2_CONCEPTS[5].titleKey);
    const weaknesses=TestBed.inject(WeaknessService);for(let i=0;i<3;i++)weaknesses.recordLearn('grammar',identity.itemId,identity.questionType,'again');
    const round=grammarFocusedExercises(weaknesses.weak());expect(round.length).toBeGreaterThan(0);expect(round.every(e=>e.conceptId===identity.itemId)).toBe(true);
  });
  it.each(['03','04','05','06','07','08','09','10'])('still loads legacy topic %s, its first lesson and practice',async topic=>{
    const harness=await RouterTestingHarness.create();let page=await harness.navigateByUrl(`/grammar/n5/${topic}`,GrammarPage);expect(page.invalid()).toBe(false);
    page=await harness.navigateByUrl(`/grammar/n5/${topic}/1`,GrammarPage);expect(page.lesson()?.concept).toBeUndefined();expect(page.currentExercise()).toBeTruthy();
    page=await harness.navigateByUrl(`/grammar/n5/${topic}/practice`,GrammarPage);expect(page.practice()?.exercises.length).toBeGreaterThan(0);
  });
});
