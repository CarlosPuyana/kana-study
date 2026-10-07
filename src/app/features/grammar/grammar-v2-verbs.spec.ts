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

const ids=['verb-role-dictionary','verb-ichidan','verb-godan','verb-irregular-suru-kuru','verb-negative-plain','verb-past-plain','verb-past-negative-plain','adjective-adverb-ku-ni'];
const concepts=GRAMMAR_V2_CONCEPTS.filter(c=>c.topicId==='03');
const review=GRAMMAR_V2_REVIEW.filter(e=>e.topicId==='03');
const exercises=[...concepts.flatMap(c=>c.exercises),...review];
const concept=(id:string)=>concepts.find(c=>c.id===id)!;
const t=(key:string)=>(es as Record<string,string>)[key]??key;
const forms=(id:string)=>concept(id).lesson.formation.map(f=>f.pattern).join('\n');

describe('Grammar V2 Topic 03 authored content',()=>{
  it('contains the eight ordered core concepts with semantic prerequisites and URLs',()=>{
    expect(concepts.map(c=>c.id)).toEqual(ids);
    expect(GRAMMAR_LESSONS.filter(l=>l.topicId==='03').map(l=>l.id)).toEqual(ids);
    expect(concepts.some(c=>c.id==='verb-transitivity-basic')).toBe(false);
    for(const [index,c] of concepts.entries()){
      expect(c).toMatchObject({order:index+1,track:'core',level:'N5'});expect(c.id).not.toMatch(/^03\./);
      expect(c.prerequisiteIds.every(id=>GRAMMAR_V2_CONCEPTS.slice(0,GRAMMAR_V2_CONCEPTS.indexOf(c)).some(p=>p.id===id))).toBe(true);
      expect(c.lesson.detailedExplanation).toHaveLength(2);
      const l=GRAMMAR_LESSONS.find(l=>l.id===c.id)!;
      expect(l.previousPath).toBe(index?`/grammar/n5/03/${ids[index-1]}`:'/grammar/n5/03');
      expect(l.nextPath).toBe(index===7?'/grammar/n5/03/practice':`/grammar/n5/03/${ids[index+1]}`);
    }
    expect(concept('adjective-adverb-ku-ni').prerequisiteIds).toEqual(['adjective-i','adjective-na','verb-role-dictionary']);
    expect(concept('verb-past-negative-plain').prerequisiteIds).toEqual(['verb-negative-plain','verb-past-plain']);
  });
  it('authors 42 lesson exercises and 15 cumulative questions with real concepts and unambiguous answers',()=>{
    expect(concepts.map(c=>c.exercises.length)).toEqual([5,5,5,4,6,7,5,5]);
    expect(review).toHaveLength(15);expect(exercises).toHaveLength(57);expect(new Set(exercises.map(e=>e.id)).size).toBe(57);
    expect(grammarTopicRound('03')).toEqual(review);
    expect(review.map(e=>e.conceptId)).toEqual([ids[0],ids[0],ids[1],ids[2],ids[3],ids[4],ids[4],ids[5],ids[5],ids[5],ids[6],ids[6],ids[6],ids[6],ids[7]]);
    for(const e of exercises){
      expect(e).toMatchObject({version:2,topicId:'03',lessonId:e.conceptId});expect(ids).toContain(e.conceptId);expect(e.skill).toBeTruthy();expect(e.difficulty).toBeTruthy();
      expect(isGrammarAnswerCorrect(e,{selected:isChoiceExercise(e)?e.answer:null,text:e.kind==='fill-gap'?e.acceptedAnswers[0]:'',sequence:e.kind==='sentence-order'||e.kind==='sentence-builder'?e.solution:[],matches:e.kind==='matching'?Object.fromEntries(e.pairs.map((_,i)=>[i,i])):{}}),e.id).toBe(true);
      if(e.kind==='matching')for(const dictionary of [es,en,ca])expect(new Set(e.pairs.map(p=>(dictionary as Record<string,string>)[p.rightKey])).size).toBe(e.pairs.length);
      if(isChoiceExercise(e)){
        expect(e.options?.every(o=>t(o.feedbackKey).length>12)).toBe(true);
        if(e.kind==='detect-error'){expect(e.options!.filter(o=>o.grammarStatus==='invalid')).toHaveLength(1);expect(e.options![e.answer].grammarStatus).toBe('invalid');}
      }
    }
    expect(grammarMixedExercises(['verb-godan'])[0].conceptId).toBe('verb-godan');
    expect(grammarMixedExercises().some(e=>e.conceptId?.startsWith('03.'))).toBe(false);
  });
  it('teaches the exceptions and irregular readings and assesses them in their real concepts',()=>{
    expect(forms('verb-negative-plain')).toContain('買う → 買わない');
    expect(forms('verb-negative-plain')).toContain('する → しない');expect(forms('verb-negative-plain')).toContain('こない');
    expect(forms('verb-past-plain')).toContain('行く → 行った');expect(forms('verb-past-plain')).toContain('する → した');expect(forms('verb-past-plain')).toContain('きた');
    const expected=new Map([['買わない',ids[4]],['しない',ids[4]],['こない',ids[4]],['行った',ids[5]],['した',ids[5]],['きた',ids[5]]]);
    for(const [answer,id] of expected)expect(exercises.some(e=>e.kind==='fill-gap'&&e.conceptId===id&&e.acceptedAnswers.includes(answer)),answer).toBe(true);
    for(const wrong of ['買あない','飲むない','行いた']){
      expect(exercises.some(e=>e.kind==='detect-error'&&isChoiceExercise(e)&&t(e.optionKeys[e.answer])===wrong),wrong).toBe(true);
    }
    expect(concept('verb-ichidan').lesson.contrasts![0].right).toBe('帰る');
    expect(concept('verb-negative-plain').exercises.some(e=>t(e.promptKey).includes('ある'))).toBe(false);
  });
  it('derives past negative from ない and distinguishes time/polarity from grammatical errors',()=>{
    const c=concept('verb-past-negative-plain');
    expect(c.lesson.formation.map(f=>f.pattern)).toContain('高くない → 高くなかった');
    expect(c.lesson.tables!.map(table=>table.rows.map(row=>row.cells))).toEqual([[['食べる','食べた'],['食べない','食べなかった']],[['飲む','飲んだ'],['飲まない','飲まなかった']]]);
    expect(c.exercises.some(e=>e.kind==='detect-error')).toBe(false);
    expect(exercises.some(e=>e.kind==='fill-gap'&&e.acceptedAnswers.includes('飲まなかった'))).toBe(true);
    const manner=concept('adjective-adverb-ku-ni');
    expect(manner.lesson.tables![0].rows.map(r=>r.cells)).toEqual([['早い人','早く歩く'],['静かな人','静かに話す']]);
    expect(manner.exercises.filter(e=>e.kind==='fill-gap').map(e=>e.acceptedAnswers)).toEqual([['く'],['に']]);
  });
  it('provides real ES/EN/CA translations without polite forms or verbal-particle lessons',()=>{
    const keys=new Set<string>();
    const visit=(v:unknown):void=>{if(typeof v==='string'&&v.startsWith('grammar.'))keys.add(v);else if(Array.isArray(v))v.forEach(visit);else if(v&&typeof v==='object')Object.values(v).forEach(visit);};
    visit(concepts);visit(review);visit(GRAMMAR_PRACTICES.find(p=>p.topicId==='03'));
    for(const key of keys){
      const source=t(key);
      for(const dict of [es,en,ca])expect((dict as Record<string,string>)[key],key).toBeTruthy();
      if(/[A-Za-zÀ-ÿ]/u.test(source))for(const dict of [en,ca])expect((dict as Record<string,string>)[key],key).not.toBe(source);
      expect(source).not.toMatch(/です|ます|ません|ました|ませんでした/);
    }
    expect(JSON.stringify(concepts)).not.toMatch(/を|へ|で[。 ]/);
    expect(t(concept('adjective-adverb-ku-ni').lesson.detailedExplanation[1].bodyKey)).toContain('formas independientes');
  });
});

describe('Grammar V2 Topic 03 integration',()=>{
  beforeEach(()=>{
    localStorage.clear();vi.spyOn(window,'scrollTo').mockImplementation(()=>undefined);
    vi.stubGlobal('matchMedia',()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()}));
    TestBed.configureTestingModule({providers:[provideRouter([{path:'grammar',children:GRAMMAR_ROUTES}]),{provide:TranslationService,useValue:{t,language:()=> 'es'}}]});
  });
  afterEach(()=>{TestBed.resetTestingModule();vi.restoreAllMocks();vi.unstubAllGlobals();});
  it('uses Topic 03 semantic IDs for route, completion, resume and Weakness through reload',async()=>{
    const c=concept('verb-negative-plain'),harness=await RouterTestingHarness.create();
    const page=await harness.navigateByUrl(`/grammar/n5/03/${c.id}`,GrammarPage);
    expect(harness.routeNativeElement!.querySelector('app-grammar-v2-lesson')).not.toBeNull();page.answer(false);
    const progress=TestBed.inject(GrammarProgressService),v2=TestBed.inject(GrammarV2ProgressService);
    expect(progress.state().review[c.id].topicId).toBe('03');expect(v2.state().resume?.path).toBe(`/grammar/n5/03/${c.id}`);
    expect(TestBed.inject(WeaknessService).records().some(r=>r.itemId===c.id)).toBe(true);
    c.exercises.slice(1).forEach((e,index)=>progress.recordAnswer(c.id,'03',e.id,index+1,true));expect(progress.conceptStatus(c.id)).toBe('in-progress');
    progress.recordAnswer(c.id,'03',c.exercises[0].id,0,true);expect(progress.conceptStatus(c.id)).toBe('completed');
    for(const topicId of ['01','02','03'])progress.recordPractice(topicId,14,15,[],new Date().toISOString());
    expect(localStorage.getItem(GRAMMAR_PROGRESS_KEY)).toBeNull();expect(localStorage.getItem(GRAMMAR_PROGRESS_V2_KEY)).toBeTruthy();
    TestBed.resetTestingModule();const restored=TestBed.inject(GrammarV2ProgressService);
    expect(restored.state().concepts[c.id].status).toBe('completed');expect(restored.state().review[c.id].topicId).toBe('03');
    expect(Object.keys(restored.state().practices)).toEqual(['01','02','03']);
  });
  it('focuses Weakness on the semantic verb concept and links cumulative practice to Topic 04',async()=>{
    const e=review.find(e=>e.conceptId==='verb-godan')!,identity=grammarWeaknessIdentity(e)!;
    expect(identity.itemId).toBe('verb-godan');
    const weaknesses=TestBed.inject(WeaknessService);for(let i=0;i<3;i++)weaknesses.recordLearn('grammar',identity.itemId,identity.questionType,'again');
    expect(grammarFocusedExercises(weaknesses.weak()).every(e=>e.conceptId==='verb-godan')).toBe(true);
    const harness=await RouterTestingHarness.create(),page=await harness.navigateByUrl('/grammar/n5/03/practice',GrammarPage);
    expect(page.practice()!.exercises).toHaveLength(15);expect(page.practice()!.nextPath).toBe('/grammar/n5/04');
  });
  it('shows successful identification of 買あない while retaining invalid Japanese presentation',()=>{
    const e=concept('verb-negative-plain').exercises.find(e=>e.kind==='detect-error')!;
    if(!isChoiceExercise(e))throw Error('choice');
    const fixture=TestBed.createComponent(GrammarExerciseComponent);fixture.componentRef.setInput('exercise',e);fixture.detectChanges();
    fixture.componentInstance.select(e.answer);fixture.componentInstance.check();fixture.detectChanges();
    const selected=fixture.nativeElement.querySelector('.exercise-option.selected') as HTMLElement;
    expect(fixture.componentInstance.correct()).toBe(true);expect(selected.textContent).toContain('買あない');expect(selected.textContent).toContain('❌');
    expect(selected.classList.contains('wrong')).toBe(true);expect(selected.classList.contains('correct')).toBe(false);
  });
});
