import {TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import {RouterTestingHarness} from '@angular/router/testing';
import {GRAMMAR_V2_CONCEPTS, GRAMMAR_V2_REVIEW} from '../../data/grammar/grammar-n5-v2.generated';
import {GrammarProgressService} from '../../core/services/grammar-progress.service';
import {GrammarV2ProgressService} from '../../core/services/grammar-v2-progress.service';
import {GRAMMAR_PROGRESS_V2_KEY} from '../../core/models/grammar-v2.model';
import {GRAMMAR_PROGRESS_KEY, emptyGrammarProgress} from '../../core/models/grammar-progress.model';
import {TranslationService} from '../../core/services/translation.service';
import {WeaknessService} from '../../core/services/weakness.service';
import {GRAMMAR_ROUTES} from './grammar.routes';
import {GrammarPage} from './pages/grammar.page';
import {GrammarExerciseComponent} from './components/grammar-exercise';
import {GRAMMAR_LESSONS, GRAMMAR_PRACTICES, GRAMMAR_SESSIONS} from './data/grammar-catalog';
import {grammarFocusedExercises, grammarWeaknessIdentity} from './services/grammar-weakness';
import {grammarMixedExercises, grammarTopicRound} from './services/grammar-interactive-catalog';
import {isChoiceExercise, isGrammarAnswerCorrect} from './services/grammar-exercise-answer';
import es from '../../../assets/i18n/es.json';
import en from '../../../assets/i18n/en.json';
import ca from '../../../assets/i18n/ca.json';

const ids=['adjective-na','adjective-i','adjective-noun-modification','adjective-negative','adjective-past','adjective-past-negative','adjective-ii-irregular','degree-adverbs','adjectival-predicates-ga'];
const concepts=GRAMMAR_V2_CONCEPTS.filter(c=>c.topicId==='02');
const review=GRAMMAR_V2_REVIEW.filter(e=>e.topicId==='02');
const all=[...concepts.flatMap(c=>c.exercises),...review];
const t=(key:string)=>(es as Record<string,string>)[key]??key;
const concept=(id:string)=>concepts.find(c=>c.id===id)!;

describe('Grammar V2 Topic 02 content',()=>{
  it('contains exactly nine ordered core concepts with preceding semantic prerequisites',()=>{
    expect(concepts.map(c=>c.id)).toEqual(ids);
    expect(GRAMMAR_LESSONS.filter(l=>l.topicId==='02').map(l=>l.id)).toEqual(ids);
    expect(GRAMMAR_SESSIONS.filter(s=>s.topicId==='02').map(s=>s.lessonIds)).toEqual(ids.map(id=>[id]));
    expect(concepts.some(c=>c.id==='adjective-adverb-ku-ni')).toBe(false);
    concepts.forEach((c,index)=>{
      expect(c).toMatchObject({track:'core',level:'N5',order:index+1});
      expect(c.prerequisiteIds.length).toBeGreaterThan(0);
      expect(c.prerequisiteIds.every(id=>GRAMMAR_V2_CONCEPTS.slice(0,GRAMMAR_V2_CONCEPTS.indexOf(c)).some(p=>p.id===id))).toBe(true);
      expect(c.lesson.detailedExplanation.length).toBeGreaterThanOrEqual(2);
    });
    expect(concept('adjectival-predicates-ga').prerequisiteIds).toEqual(['adjective-na','particle-wa-topic','particle-ga-identifier','particle-wa-vs-ga']);
  });
  it('has 47 lessons exercises and 15 cumulative exercises, all answerable and correctly attributed',()=>{
    expect(concepts.map(c=>c.exercises.length)).toEqual([5,5,6,5,5,5,5,5,6]);
    expect(review).toHaveLength(15);expect(all).toHaveLength(62);
    expect(new Set([...GRAMMAR_V2_CONCEPTS.filter(c=>['01','02'].includes(c.topicId)).flatMap(c=>c.exercises),...GRAMMAR_V2_REVIEW.filter(e=>e.topicId&&['01','02'].includes(e.topicId))].map(e=>e.id)).size).toBe(130);
    expect(grammarTopicRound('02')).toEqual(review);
    for(const c of concepts)expect(grammarTopicRound('02',c.id)).toEqual(c.exercises);
    for(const e of all){
      expect(e).toMatchObject({version:2,topicId:'02',lessonId:e.conceptId});expect(ids).toContain(e.conceptId);
      expect(e.conceptId).not.toMatch(/^02\./);expect(e.skill).toBeTruthy();expect(e.difficulty).toBeTruthy();
      expect(isGrammarAnswerCorrect(e,{selected:isChoiceExercise(e)?e.answer:null,text:e.kind==='fill-gap'?e.acceptedAnswers[0]:'',sequence:e.kind==='sentence-order'||e.kind==='sentence-builder'?e.solution:[],matches:e.kind==='matching'?Object.fromEntries(e.pairs.map((_,i)=>[i,i])):{}}),e.id).toBe(true);
      if(isChoiceExercise(e)){
        expect(e.options?.map(o=>o.textKey)).toEqual(e.optionKeys);
        expect(e.options?.every(o=>t(o.feedbackKey).length>12)).toBe(true);
        if(e.kind==='detect-error'){expect(e.options![e.answer].grammarStatus).toBe('invalid');expect(e.options!.filter(o=>o.grammarStatus==='invalid')).toHaveLength(1);}
      }
      if(e.kind==='matching')expect(new Set(e.pairs.map(p=>t(p.rightKey))).size).toBe(e.pairs.length);
    }
    expect(grammarMixedExercises().some(e=>e.conceptId?.startsWith('02.'))).toBe(false);
  });
  it('teaches the visual exceptions as な and never accepts 高いだ',()=>{
    const classifications=all.filter(e=>t(e.promptKey).includes('¿A qué grupo')&&/きれい|嫌い/.test(t(e.promptKey)));
    expect(classifications).toHaveLength(2);
    for(const e of classifications){if(!isChoiceExercise(e))throw Error('choice');expect(t(e.optionKeys[e.answer])).toBe('Grupo な');}
    const options=all.flatMap(e=>isChoiceExercise(e)?e.options??[]:[]);
    expect(options.find(o=>t(o.textKey)==='高いだ。')?.grammarStatus).toBe('invalid');
    const negative=concept('adjective-negative').exercises.find(e=>e.kind==='detect-error')!;
    if(!isChoiceExercise(negative))throw Error('choice');
    expect(t(negative.optionKeys[negative.answer])).toBe('高いくない。');
    expect(options.some(o=>t(o.textKey).includes('高いじゃない'))).toBe(false);
    expect(concept('adjective-ii-irregular').lesson.tables![0].rows.map(r=>r.cells)).toEqual([['いい','よくない'],['よかった','よくなかった']]);
    expect(concept('adjective-past-negative').lesson.tables![0].rows.map(r=>r.cells)).toEqual([['静かだ','静かじゃない'],['静かだった','静かじゃなかった'],['高い','高くない'],['高かった','高くなかった']]);
  });
  it('has real ES/EN/CA copy, no polite system, and preserves the pragmatic qualifications',()=>{
    const keys=new Set<string>();
    const visit=(v:unknown):void=>{if(typeof v==='string'&&v.startsWith('grammar.'))keys.add(v);else if(Array.isArray(v))v.forEach(visit);else if(v&&typeof v==='object')Object.values(v).forEach(visit);};
    visit(concepts);visit(review);visit(GRAMMAR_PRACTICES.find(p=>p.topicId==='02'));
    for(const key of keys){
      for(const dict of [es,en,ca])expect((dict as Record<string,string>)[key],key).toBeTruthy();
      const source=t(key);
      if(/[A-Za-zÀ-ÿ]/u.test(source))for(const dict of [en,ca])expect((dict as Record<string,string>)[key],key).not.toBe(source);
      expect(source).not.toMatch(/です|でした|ます/);
    }
    expect(t(concept('degree-adverbs').lesson.detailedExplanation[1].bodyKey)).toContain('expresiones afirmativas');
    expect(t(concept('adjectival-predicates-ga').lesson.detailedExplanation[1].bodyKey)).toContain('no es una prohibición gramatical');
  });
});

describe('Grammar V2 Topic 02 integration',()=>{
  beforeEach(()=>{
    localStorage.clear();vi.spyOn(window,'scrollTo').mockImplementation(()=>undefined);
    vi.stubGlobal('matchMedia',()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()}));
    TestBed.configureTestingModule({providers:[provideRouter([{path:'grammar',children:GRAMMAR_ROUTES}]),{provide:TranslationService,useValue:{t,language:()=> 'es'}}]});
  });
  afterEach(()=>{TestBed.resetTestingModule();vi.restoreAllMocks();vi.unstubAllGlobals();});
  it('opens semantic routes, records completion and Weakness, and resumes Topic 02 after reload',async()=>{
    const c=concepts[0],harness=await RouterTestingHarness.create();
    const page=await harness.navigateByUrl(`/grammar/n5/02/${c.id}`,GrammarPage);
    expect(harness.routeNativeElement!.querySelector('app-grammar-v2-lesson')).not.toBeNull();
    page.answer(false);
    const progress=TestBed.inject(GrammarProgressService),v2=TestBed.inject(GrammarV2ProgressService);
    expect(progress.continuePath()).toBe(`/grammar/n5/02/${c.id}`);
    expect(progress.state().review[c.id].topicId).toBe('02');
    expect(TestBed.inject(WeaknessService).records().some(r=>r.itemId===c.id)).toBe(true);
    c.exercises.slice(1).forEach((e,i)=>progress.recordAnswer(c.id,'02',e.id,i+1,true));
    expect(progress.conceptStatus(c.id)).toBe('in-progress');
    progress.recordAnswer(c.id,'02',c.exercises[0].id,0,true);
    expect(progress.conceptStatus(c.id)).toBe('completed');
    v2.open('adjective-i');
    const stored=JSON.parse(localStorage.getItem(GRAMMAR_PROGRESS_V2_KEY)!);
    expect(stored.concepts[c.id].topicId).toBe('02');
    expect(localStorage.getItem(GRAMMAR_PROGRESS_KEY)).toBeNull();
    TestBed.resetTestingModule();
    const restored=TestBed.inject(GrammarV2ProgressService);
    expect(restored.state().concepts[c.id].status).toBe('completed');
    expect(restored.state().resume?.path).toBe('/grammar/n5/02/adjective-i');
    expect(restored.state().review[c.id].topicId).toBe('02');
  });
  it('keeps both topic practices on save/reload and filters cross-topic errors and old V1 progress',()=>{
    const old=emptyGrammarProgress();old.practices['02']={topicId:'02',score:10,total:10,errorConceptIds:['02.1'],attemptedAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
    localStorage.setItem(GRAMMAR_PROGRESS_KEY,JSON.stringify(old));
    const progress=TestBed.inject(GrammarProgressService);TestBed.tick();
    expect(progress.state().practices['02']).toBeUndefined();
    progress.recordPractice('01',14,15,['state-being-plain'],new Date().toISOString());
    progress.recordPractice('02',13,15,['adjective-na','state-being-plain','02.1'],new Date().toISOString());
    progress.finishReview([{conceptId:'adjective-i',exerciseId:concept('adjective-i').exercises[0].id,correct:false}]);
    TestBed.resetTestingModule();const restored=TestBed.inject(GrammarV2ProgressService);
    expect(restored.state().practices['01'].score).toBe(14);
    expect(restored.state().practices['02']).toMatchObject({score:13,total:15,errorConceptIds:['adjective-na']});
    expect(restored.state().review['adjective-i'].topicId).toBe('02');
  });
  it('uses semantic Weakness identities in cumulative and focused practice',()=>{
    const e=review.at(-1)!,identity=grammarWeaknessIdentity(e)!;
    expect(identity.itemId).toBe('adjectival-predicates-ga');
    const weaknesses=TestBed.inject(WeaknessService);
    for(let i=0;i<3;i++)weaknesses.recordLearn('grammar',identity.itemId,identity.questionType,'again');
    const round=grammarFocusedExercises(weaknesses.weak());
    expect(round.length).toBeGreaterThan(0);expect(round.every(e=>e.conceptId===identity.itemId&&e.topicId==='02')).toBe(true);
  });
  it.each(['dark','light'])('retains invalid Japanese styling on a successful Topic 02 detection (%s)',theme=>{
    const e=concept('adjective-negative').exercises.find(e=>e.kind==='detect-error')!;
    if(!isChoiceExercise(e))throw Error('choice');
    const fixture=TestBed.createComponent(GrammarExerciseComponent);fixture.nativeElement.setAttribute('data-theme',theme);fixture.componentRef.setInput('exercise',e);fixture.detectChanges();
    fixture.componentInstance.select(e.answer);fixture.componentInstance.check();fixture.detectChanges();
    expect(fixture.componentInstance.correct()).toBe(true);
    const selected=fixture.nativeElement.querySelector('.exercise-option.selected') as HTMLElement;
    expect(selected.textContent).toContain('高いくない');expect(selected.textContent).toContain('❌');
    expect(selected.classList.contains('wrong')).toBe(true);expect(selected.classList.contains('correct')).toBe(false);
  });
  it('navigates through all nine semantic lessons and ends at review then Topic 03',async()=>{
    const harness=await RouterTestingHarness.create();
    for(const [i,c] of concepts.entries()){
      const page=await harness.navigateByUrl(`/grammar/n5/02/${c.id}`,GrammarPage);
      expect(page.invalid()).toBe(false);
      expect(page.lesson()!.previousPath).toBe(i?`/grammar/n5/02/${concepts[i-1].id}`:'/grammar/n5/02');
      expect(page.lesson()!.nextPath).toBe(i===8?'/grammar/n5/02/practice':`/grammar/n5/02/${concepts[i+1].id}`);
    }
    const page=await harness.navigateByUrl('/grammar/n5/02/practice',GrammarPage);
    expect(page.practice()!.exercises).toHaveLength(15);expect(page.practice()!.nextPath).toBe('/grammar/n5/03');
  });
});
