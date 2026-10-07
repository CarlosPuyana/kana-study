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
import {GRAMMAR_LESSONS,GRAMMAR_PRACTICES} from './data/grammar-catalog';
import {grammarTopicRound,grammarMixedExercises} from './services/grammar-interactive-catalog';
import {grammarWeaknessIdentity} from './services/grammar-weakness';
import {isChoiceExercise,isGrammarAnswerCorrect} from './services/grammar-exercise-answer';
import es from '../../../assets/i18n/es.json';
import en from '../../../assets/i18n/en.json';
import ca from '../../../assets/i18n/ca.json';

const ids=['te-form-formation','te-action-sequence','te-iru-progressive','te-iru-result-state','te-kara','te-kudasai','te-mo-ii','te-wa-ikenai','nai-de-kudasai'];
const concepts=GRAMMAR_V2_CONCEPTS.filter(c=>c.topicId==='07');
const review=GRAMMAR_V2_REVIEW.filter(e=>e.topicId==='07');
const all=[...concepts.flatMap(c=>c.exercises),...review];
const t=(key:string)=>(es as Record<string,string>)[key]??key;
const c=(id:string)=>concepts.find(c=>c.id===id)!;
const detail=(id:string)=>c(id).lesson.detailedExplanation.map(d=>t(d.bodyKey)).join(' ');

describe('Grammar V2 Topic 07 content',()=>{
  it('unifies formation and preserves nine ordered semantic concepts and dependencies',()=>{
    expect(concepts.map(c=>c.id)).toEqual(ids);
    expect(GRAMMAR_LESSONS.filter(l=>l.topicId==='07').map(l=>l.id)).toEqual(ids);
    for(const [i,concept] of concepts.entries()){
      expect(concept).toMatchObject({order:i+1,track:'core',level:'N5'});
      expect(concept.prerequisiteIds.every(id=>GRAMMAR_V2_CONCEPTS.slice(0,GRAMMAR_V2_CONCEPTS.indexOf(concept)).some(p=>p.id===id))).toBe(true);
      const lesson=GRAMMAR_LESSONS.find(l=>l.id===concept.id)!;
      expect(lesson.previousPath).toBe(i?`/grammar/n5/07/${ids[i-1]}`:'/grammar/n5/07');
      expect(lesson.nextPath).toBe(i===8?'/grammar/n5/07/practice':`/grammar/n5/07/${ids[i+1]}`);
    }
    expect(c('nai-de-kudasai').prerequisiteIds).toEqual(['te-kudasai','verb-negative-plain']);
    expect(c('te-iru-result-state').prerequisiteIds).toEqual(['te-iru-progressive']);
  });
  it('provides 49 lesson exercises and 18 cumulative exercises with usable answers and feedback',()=>{
    expect(concepts.map(c=>c.exercises.length)).toEqual([10,5,6,6,5,4,4,4,5]);
    expect(review).toHaveLength(18);expect(grammarTopicRound('07')).toEqual(review);
    expect(new Set(all.map(e=>e.id)).size).toBe(67);
    for(const e of all){
      expect(e).toMatchObject({version:2,topicId:'07',lessonId:e.conceptId});expect(ids).toContain(e.conceptId);
      expect(isGrammarAnswerCorrect(e,{selected:isChoiceExercise(e)?e.answer:null,text:e.kind==='fill-gap'?e.acceptedAnswers[0]:'',sequence:e.kind==='sentence-order'||e.kind==='sentence-builder'?e.solution:[],matches:e.kind==='matching'?Object.fromEntries(e.pairs.map((_,i)=>[i,i])):{}}),e.id).toBe(true);
      if(isChoiceExercise(e))expect(e.options!.every(o=>t(o.feedbackKey).length>12),e.id).toBe(true);
      if(e.kind==='matching')for(const dict of [es,en,ca])expect(new Set(e.pairs.map(p=>(dict as Record<string,string>)[p.rightKey])).size).toBe(e.pairs.length);
    }
    expect(grammarMixedExercises().some(e=>e.conceptId?.startsWith('07.'))).toBe(false);
  });
  it('covers all formation families and exceptions through the known past without teaching past meaning',()=>{
    const rows=c('te-form-formation').lesson.tables![0].rows.map(r=>r.cells);
    expect(rows).toEqual([
      ['食べる','食べた','食べて'],['見る','見た','見て'],['起きる','起きた','起きて'],
      ['買う','買った','買って'],['待つ','待った','待って'],['帰る','帰った','帰って'],
      ['飲む','飲んだ','飲んで'],['遊ぶ','遊んだ','遊んで'],['死ぬ','死んだ','死んで'],
      ['書く','書いた','書いて'],['聞く','聞いた','聞いて'],['泳ぐ','泳いだ','泳いで'],['急ぐ','急いだ','急いで'],
      ['話す','話した','話して'],['消す','消した','消して'],['行く','行った','行って'],['する','した','して'],['来る','来た','来て']]);
    expect(c('te-form-formation').lesson.examples.find(e=>e.japanese==='来る → 来て')!.reading).toBe('くる → きて');
    expect(detail('te-form-formation')).toMatch(/pasada/);
    expect(review.some(e=>e.kind==='fill-gap'&&e.acceptedAnswers.includes('読んで'))).toBe(true);
  });
  it('distinguishes final tense, ongoing activities, continuing states and completion before B',()=>{
    expect(c('te-action-sequence').lesson.tables![0].rows.map(r=>r.cells[0])).toEqual(['本を読んで、寝る。','本を読んで、寝た。','本を読んで、寝ました。']);
    expect(detail('te-action-sequence')).toContain('traducción universal');
    expect(detail('te-iru-progressive')).toContain('読んでいない');expect(detail('te-iru-progressive')).toContain('読んでいません');
    for(const form of ['住んでいる','結婚している','知っている'])expect(JSON.stringify(c('te-iru-result-state').lesson)).toContain(form);
    expect(detail('te-iru-progressive')).toContain('equivalencia universal');
    expect(detail('te-kara')).toContain('completa');
    expect(c('te-iru-progressive').exercises.some(e=>e.kind==='fill-gap'&&e.acceptedAnswers.includes('読んでいます'))).toBe(true);
  });
  it('contrasts four valid functions with the same action in theory and cumulative practice',()=>{
    const forms=['写真を撮ってください。','写真を撮らないでください。','写真を撮ってもいいです。','写真を撮ってはいけません。'];
    expect(c('nai-de-kudasai').lesson.tables![0].rows.map(r=>r.cells[0])).toEqual(forms);
    const matching=review.at(-1)!;if(matching.kind!=='matching')throw Error('matching');
    expect(matching.pairs.map(p=>t(p.leftKey))).toEqual(forms);
    const choice=review.at(-2)!;if(!isChoiceExercise(choice))throw Error('choice');
    expect(choice.options!.every(o=>o.grammarStatus==='valid')).toBe(true);
    const functions=ids.slice(5);expect(new Set(functions.map(id=>grammarWeaknessIdentity(c(id).exercises[0])!.itemId)).size).toBe(4);
    expect(c('nai-de-kudasai').lesson.examples.find(e=>e.japanese==='ここに来ないでください。')!.reading).toBe('ここにこないでください。');
    expect(detail('nai-de-kudasai')).toContain('forma ない + でください');
    expect(detail('te-wa-ikenai')).toContain('pronuncia わ');
    expect(c('te-mo-ii').lesson.examples.some(e=>e.japanese.includes('いいですか'))).toBe(true);
  });
  it('limits error detection to malformed Japanese and supplies all three translations without migrating Topic 08',()=>{
    for(const e of all.filter(e=>e.kind==='detect-error')){
      if(!isChoiceExercise(e))throw Error('choice');expect(e.options!.filter(o=>o.grammarStatus==='invalid')).toHaveLength(1);
      expect(e.options![e.answer].grammarStatus).toBe('invalid');
      expect(['食べって','飲みて','行いて','見るください。','食べるもいい。','撮らないてください。']).toContain(t(e.optionKeys[e.answer]));
    }
    const keys=new Set<string>();const visit=(v:unknown):void=>{if(typeof v==='string'&&v.startsWith('grammar.'))keys.add(v);else if(Array.isArray(v))v.forEach(visit);else if(v&&typeof v==='object')Object.values(v).forEach(visit);};visit(concepts);visit(review);visit(GRAMMAR_PRACTICES.find(p=>p.topicId==='07'));
    for(const key of keys)for(const dict of [es,en,ca])expect((dict as Record<string,string>)[key],key).toBeTruthy();
    expect(GRAMMAR_V2_CONCEPTS.some(c=>Number(c.topicId)>=8)).toBe(false);
    expect([...keys].map(t).join(' ')).not.toMatch(/ませんか|ましょう|ほしい|ことができる|ほうがいい|てある|ておく|てみる/);
  });
});

describe('Grammar V2 Topic 07 integration',()=>{
  beforeEach(()=>{
    localStorage.clear();vi.spyOn(window,'scrollTo').mockImplementation(()=>undefined);
    vi.stubGlobal('matchMedia',()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()}));
    TestBed.configureTestingModule({providers:[provideRouter([{path:'grammar',children:GRAMMAR_ROUTES}]),{provide:TranslationService,useValue:{t,language:()=> 'es'}}]});
  });
  afterEach(()=>{TestBed.resetTestingModule();vi.restoreAllMocks();vi.unstubAllGlobals();});
  it('persists completion, resume and four separate Weakness records and routes review to Topic 08',async()=>{
    const harness=await RouterTestingHarness.create(),concept=c('te-iru-result-state');
    const page=await harness.navigateByUrl(`/grammar/n5/07/${concept.id}`,GrammarPage);page.answer(false);
    const progress=TestBed.inject(GrammarProgressService),weakness=TestBed.inject(WeaknessService);
    expect(TestBed.inject(GrammarV2ProgressService).state().resume?.path).toBe(`/grammar/n5/07/${concept.id}`);
    concept.exercises.forEach((e,i)=>progress.recordAnswer(concept.id,'07',e.id,i,true));expect(progress.conceptStatus(concept.id)).toBe('completed');
    for(const id of ids.slice(5)){const requestPage=await harness.navigateByUrl(`/grammar/n5/07/${id}`,GrammarPage);requestPage.answer(false);}
    expect(ids.slice(5).every(id=>weakness.records().some(r=>r.itemId===id))).toBe(true);
    progress.recordPractice('07',15,18,ids.slice(5),new Date().toISOString());
    const practicePage=await harness.navigateByUrl('/grammar/n5/07/practice',GrammarPage);
    expect(practicePage.practice()!.exercises).toHaveLength(18);expect(practicePage.practice()!.nextPath).toBe('/grammar/n5/08');
    TestBed.resetTestingModule();const restored=TestBed.inject(GrammarV2ProgressService);
    expect(restored.state().concepts[concept.id].status).toBe('completed');expect(restored.state().practices['07']).toMatchObject({score:15,total:18});
  });
});
