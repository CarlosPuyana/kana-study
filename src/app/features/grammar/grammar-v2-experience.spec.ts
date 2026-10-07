import {TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import {RouterTestingHarness} from '@angular/router/testing';
import {GRAMMAR_V2_CONCEPTS,GRAMMAR_V2_REVIEW} from '../../data/grammar/grammar-n5-v2.generated';
import {GrammarProgressService} from '../../core/services/grammar-progress.service';
import {GrammarV2ProgressService} from '../../core/services/grammar-v2-progress.service';
import {WeaknessService} from '../../core/services/weakness.service';
import {TranslationService} from '../../core/services/translation.service';
import {GRAMMAR_ROUTES} from './grammar.routes';
import {GrammarPage} from './pages/grammar.page';
import {GRAMMAR_LESSONS,GRAMMAR_PRACTICES,GRAMMAR_TOPICS} from './data/grammar-catalog';
import {grammarTopicRound,grammarMixedExercises} from './services/grammar-interactive-catalog';
import {grammarWeaknessIdentity} from './services/grammar-weakness';
import {isChoiceExercise,isGrammarAnswerCorrect} from './services/grammar-exercise-answer';
import es from '../../../assets/i18n/es.json';
import en from '../../../assets/i18n/en.json';
import ca from '../../../assets/i18n/ca.json';

const ids=['experience-ta-koto-ga-aru','tsumori','comparison-yori-hou-ga','superlative-naka-de-ichiban','change-naru','choice-ni-suru','sugiru','deshou-darou','giving-receiving'];
const concepts=GRAMMAR_V2_CONCEPTS.filter(c=>c.topicId==='10'),review=GRAMMAR_V2_REVIEW.filter(e=>e.topicId==='10');
const all=[...concepts.flatMap(c=>c.exercises),...review];
const c=(id:string)=>concepts.find(c=>c.id===id)!;
const t=(key:string)=>(es as Record<string,string>)[key]??key;
const detail=(id:string)=>c(id).lesson.detailedExplanation.map(d=>t(d.bodyKey)).join(' ');
const text=(id:string)=>JSON.stringify(c(id).lesson)+' '+detail(id);

describe('Grammar V2 Topic 10 content',()=>{
  it('has nine ordered semantic concepts, seven Core and two Bridge, with valid prerequisites and optional navigation',()=>{
    expect(concepts.map(c=>c.id)).toEqual(ids);expect(GRAMMAR_LESSONS.filter(l=>l.topicId==='10').map(l=>l.id)).toEqual(ids);
    expect(concepts.filter(c=>c.track==='core')).toHaveLength(7);expect(concepts.filter(c=>c.track==='bridge').map(c=>c.id)).toEqual(['tsumori','sugiru']);
    for(const [i,c] of concepts.entries()){
      expect(c.order).toBe(i+1);expect(c.id).not.toMatch(/^10\./);
      expect(c.prerequisiteIds.every(id=>GRAMMAR_V2_CONCEPTS.slice(0,GRAMMAR_V2_CONCEPTS.indexOf(c)).some(p=>p.id===id))).toBe(true);
      if(c.track==='core')expect(c.prerequisiteIds.every(id=>GRAMMAR_V2_CONCEPTS.find(c=>c.id===id)!.track==='core')).toBe(true);
    }
    expect(GRAMMAR_LESSONS.find(l=>l.id===ids[0])!.nextPath).toBe('/grammar/n5/10/comparison-yori-hou-ga');
    expect(GRAMMAR_LESSONS.find(l=>l.id==='choice-ni-suru')!.nextPath).toBe('/grammar/n5/10/deshou-darou');
    expect(GRAMMAR_LESSONS.find(l=>l.id==='giving-receiving')!.nextPath).toBe('/grammar/n5/10/practice');
  });
  it('has 48 lesson and 18 review exercises with real concept IDs, usable answers and option feedback',()=>{
    expect(concepts.map(c=>c.exercises.length)).toEqual([6,4,5,5,6,4,5,5,8]);expect(review).toHaveLength(18);
    expect(grammarTopicRound('10')).toEqual(review);expect(new Set(all.map(e=>e.id)).size).toBe(66);
    for(const e of all){
      expect(e).toMatchObject({version:2,topicId:'10',lessonId:e.conceptId});expect(ids).toContain(e.conceptId);
      expect(isGrammarAnswerCorrect(e,{selected:isChoiceExercise(e)?e.answer:null,text:e.kind==='fill-gap'?e.acceptedAnswers[0]:'',sequence:e.kind==='sentence-order'||e.kind==='sentence-builder'?e.solution:[],matches:e.kind==='matching'?Object.fromEntries(e.pairs.map((_,i)=>[i,i])):{}}),e.id).toBe(true);
      if(isChoiceExercise(e))expect(e.options!.every(o=>t(o.feedbackKey).length>12),e.id).toBe(true);
      if(e.kind==='matching')for(const dict of [es,en,ca])expect(new Set(e.pairs.map(p=>(dict as Record<string,string>)[p.rightKey])).size).toBe(e.pairs.length);
    }
    expect(grammarMixedExercises().some(e=>e.conceptId?.startsWith('10.'))).toBe(false);
  });
  it('unifies affirmative, negative and question experience and contrasts it with a concrete past event',()=>{
    for(const form of ['行ったことがある','食べたことがあります','行ったことがない','行ったことがありません','日本に行ったことがありますか','去年、日本に行った'])expect(text(ids[0])).toContain(form);
    expect(detail(ids[0])).toContain('niega la existencia de la experiencia');
    expect(detail(ids[0])).toContain('no se declara automáticamente agramatical');
    expect(c(ids[0]).exercises.some(e=>e.kind==='matching'&&e.pairs.map(p=>t(p.leftKey)).includes('去年、日本に行った。'))).toBe(true);
    expect(c(ids[0]).exercises.some(e=>e.kind==='detect-error')).toBe(false);
    expect(c(ids[0]).lesson.examples.some(e=>e.japanese.includes('行かなかったことがある'))).toBe(false);
  });
  it('distinguishes intention from desire without guaranteeing plans',()=>{
    for(const form of ['行くつもり','行かないつもり','日本に行きたい'])expect(text('tsumori')).toContain(form);
    expect(detail('tsumori')).toContain('no garantiza');
    const comparison=c('tsumori').exercises[2];if(comparison.kind!=='matching')throw Error('matching');
    expect(comparison.pairs.map(p=>t(p.rightKey))).toEqual(['Deseo de ir','Intención de ir']);
  });
  it('distinguishes comparison, advice and a maximum within an explicit group',()=>{
    expect(text('comparison-yori-hou-ga')).toContain('AよりBのほうが');expect(detail('comparison-yori-hou-ga')).toContain('より puede aparecer sin ほう');
    const contrast=c('comparison-yori-hou-ga').exercises[3];if(contrast.kind!=='matching')throw Error('matching');expect(contrast.pairs.map(p=>t(p.rightKey))).toEqual(['Comparación','Consejo']);
    for(const form of ['果物の中で','りんごが一番好きです','果物の中で何が一番好きですか'])expect(text('superlative-naka-de-ichiban')).toContain(form);
    expect(detail('superlative-naka-de-ichiban')).toContain('no una equivalencia general de «muy»');
  });
  it('forms changes with both adjective classes and いい, while limiting にする to choice',()=>{
    for(const form of ['先生になる','静かになる','寒くなる','高くなる','よくなる','寒くなりました','先生になった'])expect(text('change-naru')).toContain(form);
    expect(detail('change-naru')).toContain('sin implicar necesariamente una decisión consciente');
    for(const form of ['コーヒーにします','この本にする'])expect(text('choice-ni-suru')).toContain(form);
    expect(text('choice-ni-suru')).not.toMatch(/部屋を静かにする|髪を短くする/);
    const contrast=c('choice-ni-suru').exercises[2];if(contrast.kind!=='matching')throw Error('matching');expect(contrast.pairs.map(p=>t(p.rightKey))).toEqual(['Cambio de estado','Elección']);
  });
  it('forms excess with verbs, both adjective classes and いい and distinguishes too much from very',()=>{
    for(const form of ['食べすぎる','飲みすぎる','高すぎる','大きすぎる','静かすぎる','よすぎる'])expect(text('sugiru')).toContain(form);
    const contrast=c('sugiru').exercises[2];if(contrast.kind!=='matching')throw Error('matching');expect(contrast.pairs.map(p=>t(p.rightKey))).toEqual(['Muy caro','Demasiado caro']);
    expect(text('sugiru')).not.toMatch(/食べなさすぎる|高くなさすぎる/);
  });
  it('covers both supposition forms for all word classes without treating probability as certainty or gender',()=>{
    for(const form of ['来るでしょう','来るだろう','高いでしょう','高いだろう','学生でしょう','学生だろう','静かでしょう','静かだろう'])expect(text('deshou-darou')).toContain(form);
    expect(detail('deshou-darou')).toContain('sin una regla universal de género');expect(detail('deshou-darou')).toContain('no certeza');
    expect(c('deshou-darou').lesson.examples.some(e=>/学生だでしょう|静かだでしょう/.test(e.japanese))).toBe(false);
  });
  it('unifies giving and receiving, tracks subject and direction, and accepts both sources for もらう',()=>{
    const forms=['私は友達に本をあげた。','友達が私に本をくれた。','私は友達から本をもらった。'];
    expect(c('giving-receiving').lesson.tables![0].rows.map(r=>r.cells[0])).toEqual(forms);
    expect(detail('giving-receiving')).toContain('el sujeto es quien recibe');expect(detail('giving-receiving')).toContain('describen el mismo intercambio');
    const source=c('giving-receiving').exercises[3];if(source.kind!=='fill-gap')throw Error('fill-gap');expect(source.acceptedAnswers).toEqual(['に','から']);
    const matching=review.find(e=>e.conceptId==='giving-receiving'&&e.kind==='matching')!;if(matching.kind!=='matching')throw Error('matching');expect(matching.pairs.map(p=>t(p.leftKey))).toEqual(forms);
    for(const e of c('giving-receiving').exercises)if(isChoiceExercise(e)&&e.options!.some(o=>o.grammarStatus))expect(e.options!.every(o=>o.grammarStatus==='valid')).toBe(true);
    expect(c('giving-receiving').exercises.some(e=>e.kind==='detect-error')).toBe(false);
    expect(new Set(forms).size).toBe(3);
  });
  it('limits error detection to malformed Japanese, supplies ES/EN/CA and introduces no favours or new Topic 11 concepts',()=>{
    const bad=[];for(const e of all.filter(e=>e.kind==='detect-error')){
      if(!isChoiceExercise(e))throw Error('choice');expect(e.options!.filter(o=>o.grammarStatus==='invalid')).toHaveLength(1);expect(e.options![e.answer].grammarStatus).toBe('invalid');bad.push(t(e.optionKeys[e.answer]));
    }
    expect(bad).toEqual(['寒いになる','食べるすぎる','高いすぎる','学生だでしょう','静かだでしょう']);
    const keys=new Set<string>();const visit=(v:unknown):void=>{if(typeof v==='string'&&v.startsWith('grammar.'))keys.add(v);else if(Array.isArray(v))v.forEach(visit);else if(v&&typeof v==='object')Object.values(v).forEach(visit);};visit(concepts);visit(review);visit(GRAMMAR_PRACTICES.find(p=>p.topicId==='10'));
    for(const key of keys)for(const dict of [es,en,ca])expect((dict as Record<string,string>)[key],key).toBeTruthy();
    expect([...keys].map(t).join(' ')).not.toMatch(/てあげる|てくれる|てもらう|くださる|いただく|もらえますか|かもしれない|ようと思う|予定|てしまう|ておく|てみる/);
    expect(GRAMMAR_V2_CONCEPTS.some(c=>Number(c.topicId)>=11)).toBe(false);expect(GRAMMAR_TOPICS.find(t=>t.id==='11')!.lessons).toEqual([]);
  });
});

describe('Grammar V2 Topic 10 Core and Bridge integration',()=>{
  beforeEach(()=>{
    localStorage.clear();vi.spyOn(window,'scrollTo').mockImplementation(()=>undefined);
    vi.stubGlobal('matchMedia',()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()}));
    TestBed.configureTestingModule({providers:[provideRouter([{path:'grammar',children:GRAMMAR_ROUTES}]),{provide:TranslationService,useValue:{t,language:()=> 'es'}}]});
  });
  afterEach(()=>{TestBed.resetTestingModule();vi.restoreAllMocks();vi.unstubAllGlobals();});
  it('completes all seven Core concepts without either Bridge and preserves 7/7 after reload',()=>{
    const progress=TestBed.inject(GrammarProgressService);
    for(const concept of concepts.filter(c=>c.track==='core')){progress.openLesson(concept.id);concept.exercises.forEach((e,i)=>progress.recordAnswer(concept.id,'10',e.id,i,true));}
    expect(progress.topicProgress('10')).toEqual({completed:7,total:7});expect(progress.totalSessions).toBe(94);
    for(const id of ['tsumori','sugiru'])expect(progress.conceptStatus(id)).toBe('not-started');
    TestBed.resetTestingModule();expect(TestBed.inject(GrammarProgressService).topicProgress('10')).toEqual({completed:7,total:7});
  });
  it('keeps optional Bridge progress, resume and distinct Weakness, and continues to integration without new concepts',async()=>{
    const harness=await RouterTestingHarness.create(),progress=TestBed.inject(GrammarProgressService),weakness=TestBed.inject(WeaknessService);
    for(const id of ['tsumori','sugiru']){const page=await harness.navigateByUrl(`/grammar/n5/10/${id}`,GrammarPage);page.answer(false);expect(weakness.records().some(r=>r.itemId===id)).toBe(true);}
    expect(new Set(['tsumori','sugiru'].map(id=>grammarWeaknessIdentity(c(id).exercises[0])!.itemId)).size).toBe(2);
    expect(progress.topicProgress('10')).toEqual({completed:0,total:7});expect(TestBed.inject(GrammarV2ProgressService).state().resume?.path).toBe('/grammar/n5/10/sugiru');
    for(const id of ['tsumori','sugiru'])expect(review.filter(e=>e.conceptId===id)).toHaveLength(1);
    progress.recordPractice('10',16,18,['tsumori','sugiru'],new Date().toISOString());
    const practice=await harness.navigateByUrl('/grammar/n5/10/practice',GrammarPage);expect(practice.practice()!.exercises).toHaveLength(18);expect(practice.practice()!.nextPath).toBe('/grammar/n5/11');
    TestBed.resetTestingModule();expect(TestBed.inject(GrammarV2ProgressService).state().practices['10']).toMatchObject({score:16,total:18,errorConceptIds:['tsumori','sugiru']});
  });
});
