import {TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import {RouterTestingHarness} from '@angular/router/testing';
import {GRAMMAR_V2_CONCEPTS, GRAMMAR_V2_REVIEW} from '../../data/grammar/grammar-n5-v2.generated';
import {GRAMMAR_PROGRESS_V2_KEY} from '../../core/models/grammar-v2.model';
import {GRAMMAR_PROGRESS_KEY} from '../../core/models/grammar-progress.model';
import {GrammarProgressService} from '../../core/services/grammar-progress.service';
import {GrammarV2ProgressService} from '../../core/services/grammar-v2-progress.service';
import {TranslationService} from '../../core/services/translation.service';
import {WeaknessService} from '../../core/services/weakness.service';
import {GRAMMAR_ROUTES} from './grammar.routes';
import {GrammarPage} from './pages/grammar.page';
import {GrammarExerciseComponent} from './components/grammar-exercise';
import {GRAMMAR_LESSONS, GRAMMAR_PRACTICES} from './data/grammar-catalog';
import {grammarTopicRound, grammarMixedExercises} from './services/grammar-interactive-catalog';
import {grammarWeaknessIdentity, grammarFocusedExercises} from './services/grammar-weakness';
import {isChoiceExercise, isGrammarAnswerCorrect} from './services/grammar-exercise-answer';
import es from '../../../assets/i18n/es.json';
import en from '../../../assets/i18n/en.json';
import ca from '../../../assets/i18n/ca.json';

const ids=['particle-wo-object', 'verb-transitivity-basic', 'particle-ni-destination', 'particle-he-direction', 'particle-de-action-location', 'particle-ni-time', 'particle-to-companion', 'particle-kara-made', 'existence-aru-iru', 'location-ni-vs-de', 'position-words', 'question-words-basic', 'question-words-ka-mo', 'basic-counters', 'clock-time', 'calendar-dates', 'duration', 'duration-gurai'];

const concepts=GRAMMAR_V2_CONCEPTS.filter(c=>c.topicId==='04');
const review=GRAMMAR_V2_REVIEW.filter(e=>e.topicId==='04');
const exercises=[...concepts.flatMap(c=>c.exercises),...review];
const t=(key:string)=>(es as Record<string,string>)[key]??key;
const concept=(id:string)=>concepts.find(c=>c.id===id)!;
describe('Grammar V2 Topic 04 authored content',()=>{
  it('has exactly eighteen ordered concepts, valid dependencies and semantic navigation',()=>{
    expect(concepts.map(c=>c.id)).toEqual(ids);
    expect(GRAMMAR_V2_CONCEPTS.some(c=>['motion-purpose-ni-iku','verb-stem','existence-ga'].includes(c.id))).toBe(false);
    concepts.forEach((c,i)=>{
      expect(c).toMatchObject({order:i+1,track:'core',level:'N5'});
      expect(c.prerequisiteIds.every(id=>GRAMMAR_V2_CONCEPTS.slice(0,GRAMMAR_V2_CONCEPTS.indexOf(c)).some(p=>p.id===id))).toBe(true);
      const l=GRAMMAR_LESSONS.find(l=>l.id===c.id)!;
      expect(l.previousPath).toBe(i?`/grammar/n5/04/${ids[i-1]}`:'/grammar/n5/04');
      expect(l.nextPath).toBe(i===17?'/grammar/n5/04/practice':`/grammar/n5/04/${ids[i+1]}`);
    });
  });
  it('has 66 lesson exercises and 20 complete cumulative questions with usable answers and feedback',()=>{
    expect(concepts.map(c=>c.exercises.length)).toEqual([4,4,3,3,4,3,3,3,5,5,3,4,4,4,4,4,3,3]);
    expect(review).toHaveLength(20);expect(new Set(exercises.map(e=>e.id)).size).toBe(86);
    expect(grammarTopicRound('04')).toEqual(review);
    for(const e of exercises){
      expect(e).toMatchObject({version:2,topicId:'04',lessonId:e.conceptId});expect(ids).toContain(e.conceptId);
      expect(isGrammarAnswerCorrect(e,{selected:isChoiceExercise(e)?e.answer:null,text:e.kind==='fill-gap'?e.acceptedAnswers[0]:'',sequence:e.kind==='sentence-order'||e.kind==='sentence-builder'?e.solution:[],matches:e.kind==='matching'?Object.fromEntries(e.pairs.map((_,i)=>[i,i])):{}}),e.id).toBe(true);
      if(isChoiceExercise(e))expect(e.options?.every(o=>t(o.feedbackKey).length>12)).toBe(true);
      if(e.kind==='matching')for(const dictionary of [es,en,ca])expect(new Set(e.pairs.map(p=>(dictionary as Record<string,string>)[p.rightKey])).size).toBe(e.pairs.length);
    }
    expect(grammarMixedExercises().some(e=>e.conceptId?.startsWith('04.'))).toBe(false);
  });
  it('accepts both natural destination particles and both approximation spellings',()=>{
    const motion=exercises.filter(e=>e.kind==='fill-gap'&&['particle-ni-destination','particle-he-direction'].includes(e.conceptId!)&&e.acceptedAnswers.length===2);
    expect(motion.length).toBeGreaterThan(1);
    for(const e of motion)for(const text of ['に','へ'])expect(isGrammarAnswerCorrect(e,{selected:null,text,sequence:[],matches:{}})).toBe(true);
    const approximate=exercises.filter(e=>e.kind==='fill-gap'&&e.conceptId==='duration-gurai');
    expect(approximate.length).toBeGreaterThan(1);
    for(const e of approximate)for(const text of ['くらい','ぐらい'])expect(isGrammarAnswerCorrect(e,{selected:null,text,sequence:[],matches:{}})).toBe(true);
  });
  it('teaches transitivity, existence negatives, contextual location and special readings',()=>{
    expect(concept('verb-transitivity-basic').lesson.formation.map(f=>f.pattern).join()).toContain('ドアが開く');
    expect(concept('existence-aru-iru').lesson.formation.map(f=>f.pattern).join()).toContain('ない');
    expect(concept('location-ni-vs-de').exercises).toHaveLength(5);
    const tables=JSON.stringify(concept('calendar-dates').lesson.tables);
    for(const reading of ['ついたち','みっか','じゅうよっか','はつか','にじゅうよっか'])expect(tables).toContain(reading);
    const counter=JSON.stringify(concept('basic-counters').lesson.tables);
    for(const reading of ['ひとり','ふたり','いっぽん'])expect(counter).toContain(reading);
    expect(JSON.stringify(concept('clock-time').lesson)).toContain('しちじ');
    expect(JSON.stringify(concept('duration').lesson)).toContain('二時間');
  });
  it('assesses action versus existence and transitivity without calling valid alternatives invalid',()=>{
    const location=concept('location-ni-vs-de').exercises.filter(isChoiceExercise);
    expect(location.map(e=>t(e.optionKeys[e.answer]))).toEqual(['に','で','に','で']);
    const door=concept('verb-transitivity-basic').exercises[0];
    if(!isChoiceExercise(door))throw Error('choice');
    expect(t(door.optionKeys[door.answer])).toBe('ドアが開く。');
    expect(door.options!.every(o=>o.grammarStatus==='valid')).toBe(true);
    const directed=concept('particle-he-direction').exercises[1];
    if(!isChoiceExercise(directed))throw Error('choice');
    expect(t(directed.promptKey)).toContain('específicamente');
    expect(t(directed.optionKeys[directed.answer])).toBe('へ');
    expect(directed.options!.every(o=>o.grammarStatus==='valid')).toBe(true);
  });
  it('assesses existence negation, negative indefinites and duration without に',()=>{
    const answers=concept('existence-aru-iru').exercises.flatMap(e=>e.kind==='fill-gap'?e.acceptedAnswers:[]);
    expect(answers).toEqual(['ある','ない','いない']);
    const indef=concept('question-words-ka-mo').exercises.filter(isChoiceExercise);
    expect(indef.map(e=>t(e.optionKeys[e.answer]))).toEqual(['いない','ない']);
    const duration=concept('duration').exercises[1];
    if(!isChoiceExercise(duration))throw Error('choice');
    expect(t(duration.optionKeys[duration.answer])).toBe('二時間勉強する。');
    const clock=concept('clock-time').exercises[0];
    if(clock.kind!=='matching')throw Error('matching');
    expect(clock.pairs.map(p=>[t(p.leftKey),t(p.rightKey)])).toEqual([['四時','よじ'],['七時','しちじ'],['九時','くじ']]);
  });
  it('provides all three translations without introducing polite forms',()=>{
    const keys=new Set<string>();const visit=(v:unknown):void=>{if(typeof v==='string'&&v.startsWith('grammar.'))keys.add(v);else if(Array.isArray(v))v.forEach(visit);else if(v&&typeof v==='object')Object.values(v).forEach(visit);};
    visit(concepts);visit(review);visit(GRAMMAR_PRACTICES.find(p=>p.topicId==='04'));
    for(const key of keys){for(const dict of [es,en,ca])expect((dict as Record<string,string>)[key],key).toBeTruthy();expect(t(key)).not.toMatch(/です|ます|ません|ました|ください/);}
  });
});
describe('Grammar V2 Topic 04 integration',()=>{
  beforeEach(()=>{
    localStorage.clear();vi.spyOn(window,'scrollTo').mockImplementation(()=>undefined);
    vi.stubGlobal('matchMedia',()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()}));
    TestBed.configureTestingModule({providers:[provideRouter([{path:'grammar',children:GRAMMAR_ROUTES}]),{provide:TranslationService,useValue:{t,language:()=> 'es'}}]});
  });
  afterEach(()=>{TestBed.resetTestingModule();vi.restoreAllMocks();vi.unstubAllGlobals();});
  it('uses Topic 04 semantic IDs for route, completion, resume and Weakness through reload',async()=>{
    const c=concept('location-ni-vs-de'),harness=await RouterTestingHarness.create();
    const page=await harness.navigateByUrl(`/grammar/n5/04/${c.id}`,GrammarPage);
    expect(harness.routeNativeElement!.querySelector('app-grammar-v2-lesson')).not.toBeNull();page.answer(false);
    const progress=TestBed.inject(GrammarProgressService),v2=TestBed.inject(GrammarV2ProgressService);
    expect(progress.state().review[c.id].topicId).toBe('04');expect(v2.state().resume?.path).toBe(`/grammar/n5/04/${c.id}`);
    expect(TestBed.inject(WeaknessService).records().some(r=>r.itemId===c.id)).toBe(true);
    c.exercises.slice(1).forEach((e,index)=>progress.recordAnswer(c.id,'04',e.id,index+1,true));expect(progress.conceptStatus(c.id)).toBe('in-progress');
    progress.recordAnswer(c.id,'04',c.exercises[0].id,0,true);expect(progress.conceptStatus(c.id)).toBe('completed');
    for(const topicId of ['01','02','03','04'])progress.recordPractice(topicId,topicId==='04'?19:14,topicId==='04'?20:15,[],new Date().toISOString());
    expect(localStorage.getItem(GRAMMAR_PROGRESS_KEY)).toBeNull();expect(localStorage.getItem(GRAMMAR_PROGRESS_V2_KEY)).toBeTruthy();
    TestBed.resetTestingModule();const restored=TestBed.inject(GrammarV2ProgressService);
    expect(restored.state().concepts[c.id].status).toBe('completed');expect(restored.state().review[c.id].topicId).toBe('04');
    expect(Object.keys(restored.state().practices)).toEqual(['01','02','03','04']);
  });
  it('focuses Weakness on the semantic location concept and links cumulative practice to Topic 05',async()=>{
    const e=review.find(e=>e.conceptId==='location-ni-vs-de')!,identity=grammarWeaknessIdentity(e)!;
    expect(identity.itemId).toBe('location-ni-vs-de');
    const weaknesses=TestBed.inject(WeaknessService);for(let i=0;i<3;i++)weaknesses.recordLearn('grammar',identity.itemId,identity.questionType,'again');
    expect(grammarFocusedExercises(weaknesses.weak()).every(e=>e.conceptId==='location-ni-vs-de')).toBe(true);
    const harness=await RouterTestingHarness.create(),page=await harness.navigateByUrl('/grammar/n5/04/practice',GrammarPage);
    expect(page.practice()!.exercises).toHaveLength(20);expect(page.practice()!.nextPath).toBe('/grammar/n5/05');
  });
});
