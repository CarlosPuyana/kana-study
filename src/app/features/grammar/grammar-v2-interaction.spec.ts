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

const ids=['masen-ka','mashou','mashou-ka','tai','hoshii','koto-ga-dekiru','obligation-standard','obligation-colloquial','hou-ga-ii'];
const concepts=GRAMMAR_V2_CONCEPTS.filter(c=>c.topicId==='08'),review=GRAMMAR_V2_REVIEW.filter(e=>e.topicId==='08');
const all=[...concepts.flatMap(c=>c.exercises),...review];
const c=(id:string)=>concepts.find(c=>c.id===id)!;
const t=(key:string)=>(es as Record<string,string>)[key]??key;
const text=(id:string)=>JSON.stringify(c(id).lesson)+' '+c(id).lesson.detailedExplanation.map(d=>t(d.bodyKey)).join(' ');

describe('Grammar V2 Topic 08 content',()=>{
  it('has nine semantic concepts in order, eight Core and one Bridge, with valid dependencies',()=>{
    expect(concepts.map(c=>c.id)).toEqual(ids);expect(concepts.filter(c=>c.track==='core')).toHaveLength(8);
    expect(concepts.filter(c=>c.track==='bridge').map(c=>c.id)).toEqual(['obligation-colloquial']);
    expect(GRAMMAR_LESSONS.filter(l=>l.topicId==='08').map(l=>l.id)).toEqual(ids);
    for(const [i,c] of concepts.entries()){
      expect(c.order).toBe(i+1);expect(c.id).not.toMatch(/^08\./);
      expect(c.prerequisiteIds.every(id=>GRAMMAR_V2_CONCEPTS.slice(0,GRAMMAR_V2_CONCEPTS.indexOf(c)).some(p=>p.id===id))).toBe(true);
      if(c.track==='core')expect(c.prerequisiteIds).not.toContain('obligation-colloquial');
    }
    expect(GRAMMAR_LESSONS.find(l=>l.id==='obligation-standard')!.nextPath).toBe('/grammar/n5/08/hou-ga-ii');
    expect(GRAMMAR_LESSONS.find(l=>l.id==='hou-ga-ii')!.previousPath).toBe('/grammar/n5/08/obligation-standard');
  });
  it('has 44 lesson and 16 cumulative exercises with actual IDs, usable answers and specific feedback',()=>{
    expect(concepts.map(c=>c.exercises.length)).toEqual([4,4,4,6,5,5,7,3,6]);expect(review).toHaveLength(16);
    expect(grammarTopicRound('08')).toEqual(review);expect(new Set(all.map(e=>e.id)).size).toBe(60);
    for(const e of all){
      expect(e).toMatchObject({version:2,topicId:'08',lessonId:e.conceptId});expect(ids).toContain(e.conceptId);
      expect(isGrammarAnswerCorrect(e,{selected:isChoiceExercise(e)?e.answer:null,text:e.kind==='fill-gap'?e.acceptedAnswers[0]:'',sequence:e.kind==='sentence-order'||e.kind==='sentence-builder'?e.solution:[],matches:e.kind==='matching'?Object.fromEntries(e.pairs.map((_,i)=>[i,i])):{}}),e.id).toBe(true);
      if(isChoiceExercise(e))expect(e.options!.every(o=>t(o.feedbackKey).length>12),e.id).toBe(true);
      if(e.kind==='matching')for(const dict of [es,en,ca])expect(new Set(e.pairs.map(p=>(dict as Record<string,string>)[p.rightKey])).size).toBe(e.pairs.length);
    }
    expect(grammarMixedExercises().some(e=>e.conceptId?.startsWith('08.'))).toBe(false);
    expect(c('obligation-colloquial').exercises.every(e=>e.skill==='recognition')).toBe(true);
  });
  it('teaches invitations, direct proposals, consultative proposals and offers without rigid validity boundaries',()=>{
    const rows=c('mashou-ka').lesson.tables![0].rows;
    expect(rows.map(r=>r.cells[0])).toEqual(['行きませんか。','行きましょう。','行きましょうか。']);
    expect(text('masen-ka')).toContain('simple negación');expect(text('masen-ka')).toContain('traducción universal');
    expect(text('mashou')).toContain('Aquí distinguimos');expect(text('mashou')).toContain('ここで食べましょう。');
    for(const form of ['荷物を持ちましょうか。','窓を開けましょうか。','そろそろ行きましょうか。'])expect(text('mashou-ka')).toContain(form);
    for(const id of ids.slice(0,3))for(const e of c(id).exercises)if(isChoiceExercise(e))expect(e.options!.every(o=>o.grammarStatus==='valid')).toBe(true);
  });
  it('distinguishes desire for things from actions and avoids ungrounded third-person wishes',()=>{
    for(const form of ['行きたい','食べたい','したい','来たい','行きたくない','行きたかった','行きたくなかった'])expect(text('tai')).toContain(form);
    expect(c('tai').lesson.examples.some(e=>e.japanese==='田中さんは日本に行きたい。')).toBe(false);
    expect(text('tai')).toContain('no afirmamos sin contexto');expect(text('tai')).toContain('田中さんは日本に行きたいと言った');
    for(const form of ['水がほしい。','新しい本がほしい。','水を飲みたい','ほしくない','ほしかった'])expect(text('hoshii')).toContain(form);
    expect(text('hoshii')).not.toContain('食べてほしい');
  });
  it('teaches dictionary plus ことができる without a potential conjugation system',()=>{
    for(const form of ['日本語を話すことができる。','泳ぐことができます。','漢字を読むことができません。','泳ぐことができますか。','ことができない'])expect(text('koto-ga-dekiru')).toContain(form);
    expect(text('koto-ga-dekiru')).not.toMatch(/読める|行ける|食べられる/);
  });
  it('unifies standard obligation, keeps colloquial recognition contextual, and distinguishes advice from obligation and prohibition',()=>{
    for(const form of ['食べなくてはいけない','食べなくてはいけません','行かなくてはならない','行かなくてはなりません','食べてはいけない'])expect(text('obligation-standard')).toContain(form);
    for(const form of ['もう行かないと。','勉強しなきゃ。','帰らなくちゃ。'])expect(text('obligation-colloquial')).toContain(form);
    expect(text('obligation-colloquial')).toContain('equivalencia universal');
    for(const form of ['休んだほうがいい。','行かないほうがいい。','薬を飲んだほうがいい','薬を飲まなくてはいけない','ここで薬を飲んではいけない'])expect(text('hou-ga-ii')).toContain(form);
    expect(text('hou-ga-ii')).toContain('no significa que el consejo se refiera necesariamente al pasado');
    expect(new Set(['hou-ga-ii','obligation-standard','te-wa-ikenai'].map(id=>grammarWeaknessIdentity(GRAMMAR_V2_CONCEPTS.find(c=>c.id===id)!.exercises[0])!.itemId)).size).toBe(3);
  });
  it('uses detect-error only for malformed Japanese, complete ES/EN/CA, and introduces no Topic 09 or excluded constructions',()=>{
    const bad=[];
    for(const e of all.filter(e=>e.kind==='detect-error')){
      if(!isChoiceExercise(e))throw Error('choice');expect(e.options!.filter(o=>o.grammarStatus==='invalid')).toHaveLength(1);expect(e.options![e.answer].grammarStatus).toBe('invalid');bad.push(t(e.optionKeys[e.answer]));
    }
    expect(bad).toEqual(['食べますたい','泳ぐができる','食べたほういい']);
    const keys=new Set<string>();const visit=(v:unknown):void=>{if(typeof v==='string'&&v.startsWith('grammar.'))keys.add(v);else if(Array.isArray(v))v.forEach(visit);else if(v&&typeof v==='object')Object.values(v).forEach(visit);};visit(concepts);visit(review);visit(GRAMMAR_PRACTICES.find(p=>p.topicId==='08'));
    for(const key of keys)for(const dict of [es,en,ca])expect((dict as Record<string,string>)[key],key).toBeTruthy();
    expect([...keys].map(t).join(' ')).not.toMatch(/なければならない|なければいけない|なくてはだめ|食べてほしい|読める|食べられる|てみる/);
    expect(GRAMMAR_V2_CONCEPTS.some(c=>Number(c.topicId)>=9)).toBe(false);
    expect(GRAMMAR_V2_CONCEPTS.filter(c=>c.id==='nai-de-kudasai')).toHaveLength(1);
  });
});

describe('Grammar V2 Topic 08 Core and Bridge integration',()=>{
  beforeEach(()=>{
    localStorage.clear();vi.spyOn(window,'scrollTo').mockImplementation(()=>undefined);
    vi.stubGlobal('matchMedia',()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()}));
    TestBed.configureTestingModule({providers:[provideRouter([{path:'grammar',children:GRAMMAR_ROUTES}]),{provide:TranslationService,useValue:{t,language:()=> 'es'}}]});
  });
  afterEach(()=>{TestBed.resetTestingModule();vi.restoreAllMocks();vi.unstubAllGlobals();});
  it('completes all eight Core concepts without Bridge, skips Bridge in Continuar and preserves completion after reload',()=>{
    const progress=TestBed.inject(GrammarProgressService);
    for(const concept of GRAMMAR_V2_CONCEPTS.filter(c=>Number(c.topicId)<=8&&c.track==='core')){
      progress.openLesson(concept.id);concept.exercises.forEach((e,i)=>progress.recordAnswer(concept.id,concept.topicId,e.id,i,true));
    }
    expect(progress.topicProgress('08')).toEqual({completed:8,total:8});expect(progress.conceptStatus('obligation-colloquial')).toBe('not-started');
    expect(progress.continuePath()).toBe('/grammar/n5/09/1');
    expect(progress.completedSessions()).toBe(76);expect(progress.totalSessions).toBe(89);
    TestBed.resetTestingModule();expect(TestBed.inject(GrammarProgressService).topicProgress('08')).toEqual({completed:8,total:8});
  });
  it('allows optional Bridge practice with its own Weakness, semantic resume and cumulative review ID',async()=>{
    const harness=await RouterTestingHarness.create(),page=await harness.navigateByUrl('/grammar/n5/08/obligation-colloquial',GrammarPage);page.answer(false);
    expect(TestBed.inject(WeaknessService).records().some(r=>r.itemId==='obligation-colloquial')).toBe(true);
    expect(TestBed.inject(GrammarV2ProgressService).state().resume?.path).toBe('/grammar/n5/08/obligation-colloquial');
    expect(TestBed.inject(GrammarProgressService).topicProgress('08')).toEqual({completed:0,total:8});
    const bridgeReview=review.filter(e=>e.conceptId==='obligation-colloquial');expect(bridgeReview).toHaveLength(1);expect(bridgeReview[0].skill).toBe('recognition');
    const practice=await harness.navigateByUrl('/grammar/n5/08/practice',GrammarPage);
    expect(practice.practice()!.exercises).toHaveLength(16);expect(practice.practice()!.nextPath).toBe('/grammar/n5/09');
  });
});
