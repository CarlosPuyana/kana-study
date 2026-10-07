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

const ids=['kara-reason','node-reason','ga-kedo-contrast','ya-open-list','dake-only','tari-tari','mou-mada','mada-te-inai','mae-ni','ato-de','toki'];
const concepts=GRAMMAR_V2_CONCEPTS.filter(c=>c.topicId==='09'),review=GRAMMAR_V2_REVIEW.filter(e=>e.topicId==='09');
const all=[...concepts.flatMap(c=>c.exercises),...review];
const c=(id:string)=>concepts.find(c=>c.id===id)!;
const t=(key:string)=>(es as Record<string,string>)[key]??key;
const detail=(id:string)=>c(id).lesson.detailedExplanation.map(d=>t(d.bodyKey)).join(' ');
const text=(id:string)=>JSON.stringify(c(id).lesson)+' '+detail(id);

describe('Grammar V2 Topic 09 content',()=>{
  it('has exactly eleven ordered Core concepts with semantic dependencies, routes and actual review IDs',()=>{
    expect(concepts.map(c=>c.id)).toEqual(ids);expect(GRAMMAR_LESSONS.filter(l=>l.topicId==='09').map(l=>l.id)).toEqual(ids);
    for(const [i,c] of concepts.entries()){
      expect(c).toMatchObject({order:i+1,track:'core',level:'N5'});expect(c.id).not.toMatch(/^09\./);
      expect(c.prerequisiteIds.every(id=>GRAMMAR_V2_CONCEPTS.slice(0,GRAMMAR_V2_CONCEPTS.indexOf(c)).some(p=>p.id===id))).toBe(true);
      const lesson=GRAMMAR_LESSONS.find(l=>l.id===c.id)!;
      expect(lesson.previousPath).toBe(i?`/grammar/n5/09/${ids[i-1]}`:'/grammar/n5/09');
      expect(lesson.nextPath).toBe(i===10?'/grammar/n5/09/practice':`/grammar/n5/09/${ids[i+1]}`);
    }
    expect(concepts.map(c=>c.exercises.length)).toEqual([5,5,6,4,4,5,5,5,5,5,7]);expect(review).toHaveLength(20);
    expect(grammarTopicRound('09')).toEqual(review);expect(new Set(all.map(e=>e.id)).size).toBe(76);
    for(const e of all){
      expect(e).toMatchObject({version:2,topicId:'09',lessonId:e.conceptId});expect(ids).toContain(e.conceptId);
      expect(isGrammarAnswerCorrect(e,{selected:isChoiceExercise(e)?e.answer:null,text:e.kind==='fill-gap'?e.acceptedAnswers[0]:'',sequence:e.kind==='sentence-order'||e.kind==='sentence-builder'?e.solution:[],matches:e.kind==='matching'?Object.fromEntries(e.pairs.map((_,i)=>[i,i])):{}}),e.id).toBe(true);
      if(isChoiceExercise(e))expect(e.options!.every(o=>t(o.feedbackKey).length>12),e.id).toBe(true);
      if(e.kind==='matching')for(const dict of [es,en,ca])expect(new Set(e.pairs.map(p=>(dict as Record<string,string>)[p.rightKey])).size).toBe(e.pairs.length);
    }
    expect(grammarMixedExercises().some(e=>e.conceptId?.startsWith('09.'))).toBe(false);
  });
  it('distinguishes reason, temporal starting point and てから by complete structure',()=>{
    for(const form of ['暑いから','暇だから','静かだから','時間がないから'])expect(text('kara-reason')).toContain(form);
    const rows=c('kara-reason').lesson.tables![0].rows;expect(rows.map(r=>r.cells[0])).toEqual(['九時から働く。','食べてから勉強する。','暑いから窓を開ける。']);
    expect(detail('kara-reason')).toContain('universalmente');
    expect(c('kara-reason').exercises.some(e=>e.kind==='matching'&&e.pairs.length===3)).toBe(true);
  });
  it('uses なので for nouns and な adjectives and keeps both causal constructions valid',()=>{
    for(const form of ['雨が降るので','寒いので','静かなので','休みなので'])expect(c('node-reason').lesson.examples.some(e=>e.japanese.includes(form))).toBe(true);
    expect(c('node-reason').lesson.examples.some(e=>e.japanese.includes('静かだので'))).toBe(false);
    expect(detail('node-reason')).toContain('Existe mucho solapamiento');expect(detail('node-reason')).toContain('No las reduzcas a oposiciones absolutas');
    const contrast=c('node-reason').exercises[3];if(!isChoiceExercise(contrast))throw Error('choice');
    expect(contrast.kind).toBe('multiple-choice');expect(contrast.options!.every(o=>o.grammarStatus==='valid')).toBe(true);
  });
  it('unifies が and けど and distinguishes clause connectors from identifying が',()=>{
    for(const form of ['高いけど','静かだけど','おいしいですが','猫がいる','行きたいですが、時間がありません'])expect(text('ga-kedo-contrast')).toContain(form);
    expect(detail('ga-kedo-contrast')).toContain('no son fronteras rígidas');expect(detail('ga-kedo-contrast')).toContain('el primer が conecta frases y el segundo marca 時間');
    expect(c('ga-kedo-contrast').exercises.some(e=>e.kind==='matching'&&e.pairs.map(p=>t(p.leftKey)).includes('猫がいる。'))).toBe(true);
    for(const e of c('ga-kedo-contrast').exercises)if(isChoiceExercise(e)&&e.options!.some(o=>o.grammarStatus))expect(e.options!.every(o=>o.grammarStatus==='valid')).toBe(true);
  });
  it('distinguishes open lists from sets and restriction without an absolute rule for を',()=>{
    expect(text('ya-open-list')).toContain('パンや果物');expect(text('ya-open-list')).toContain('パンと果物');expect(detail('ya-open-list')).toContain('No afirmamos que と sea absolutamente exhaustivo');
    for(const form of ['水だけ飲む','水だけを飲む','一人だけいる','日曜日だけ休む'])expect(text('dake-only')).toContain(form);
    expect(detail('dake-only')).toContain('No enseñamos que después de だけ siempre deba conservarse を');
  });
  it('forms たり from た, uses final する for tense, and contrasts examples of activities with sequence',()=>{
    for(const form of ['読んだり','見たり','飲んだりしました','読んだり、見たりした','読んだり、見たりします','本を読んで、寝る'])expect(text('tari-tari')).toContain(form);
    expect(detail('tari-tari')).toContain('sin fijar su orden cronológico');expect(detail('tari-tari')).toContain('no siempre hacen falta exactamente dos');
    const comparison=c('tari-tari').exercises[3];if(comparison.kind!=='matching')throw Error('matching');
    expect(comparison.pairs.map(p=>t(p.rightKey))).toEqual(['Secuencia de acciones','Actividades representativas']);
  });
  it('unifies もう and まだ while keeping ongoing and pending actions in separate concepts',()=>{
    for(const form of ['もう食べました','まだ暑い','まだ勉強している','まだ家にいる','いいえ、まだです'])expect(text('mou-mada')).toContain(form);
    for(const form of ['まだ食べていない','まだ本を読んでいません','まだ宿題をしていません','まだ本を読んでいる','まだ本を読んでいない'])expect(text('mada-te-inai')).toContain(form);
    expect(detail('mada-te-inai')).toContain('No enseñamos que まだ siempre requiera ている');
    expect(grammarWeaknessIdentity(c('mou-mada').exercises[0])!.itemId).not.toBe(grammarWeaknessIdentity(c('mada-te-inai').exercises[0])!.itemId);
  });
  it('uses dictionary 前に even with a past main clause and た後で for completion relative to B',()=>{
    for(const form of ['寝る前に','学校に行く前に、朝ご飯を食べた','食事の前に'])expect(text('mae-ni')).toContain(form);
    expect(c('mae-ni').exercises.some(e=>e.kind==='fill-gap'&&e.acceptedAnswers.includes('行く'))).toBe(true);
    for(const form of ['食べた後で','帰った後で','授業の後で','ご飯を食べた後で、出かけます'])expect(text('ato-de')).toContain(form);
    expect(detail('ato-de')).toContain('no necesariamente antes del momento de habla');expect(detail('ato-de')).toContain('puede ser un plan futuro');expect(detail('ato-de')).toContain('No afirmamos que sean siempre intercambiables');
  });
  it('forms とき for verbs, both adjective classes and nouns without a mechanical before/after rule',()=>{
    for(const form of ['出るとき','帰ったとき','忙しいとき','暇なとき','学生のとき'])expect(text('toki')).toContain(form);
    expect(detail('toki')).toContain('No es una regla mecánica');expect(detail('toki')).toContain('el verbo y la relación entre ambos eventos');
    expect(detail('toki')).toContain('日本に行くとき、カメラを買った');expect(detail('toki')).toContain('日本に行ったとき、カメラを買った');
  });
  it('limits error detection to malformed structures and keeps complete translations and Topic 10 out of V2',()=>{
    const bad=[];for(const e of all.filter(e=>e.kind==='detect-error')){
      if(!isChoiceExercise(e))throw Error('choice');expect(e.options!.filter(o=>o.grammarStatus==='invalid')).toHaveLength(1);expect(e.options![e.answer].grammarStatus).toBe('invalid');bad.push(t(e.optionKeys[e.answer]));
    }
    expect(bad).toEqual(['暇から、本を読む。','静かだので、ここで勉強する。','本を読むたり','学生なとき']);
    const keys=new Set<string>();const visit=(v:unknown):void=>{if(typeof v==='string'&&v.startsWith('grammar.'))keys.add(v);else if(Array.isArray(v))v.forEach(visit);else if(v&&typeof v==='object')Object.values(v).forEach(visit);};visit(concepts);visit(review);visit(GRAMMAR_PRACTICES.find(p=>p.topicId==='09'));
    for(const key of keys)for(const dict of [es,en,ca])expect((dict as Record<string,string>)[key],key).toBeTruthy();
    expect([...keys].map(t).join(' ')).not.toMatch(/たことがある|つもり|より|一番|すぎる|でしょう|だろう|あげる|くれる|もらう|しか|ばかり|てある|ておく/);
    expect(GRAMMAR_V2_CONCEPTS.some(c=>Number(c.topicId)>=11)).toBe(false);
  });
});

describe('Grammar V2 Topic 09 integration',()=>{
  beforeEach(()=>{
    localStorage.clear();vi.spyOn(window,'scrollTo').mockImplementation(()=>undefined);
    vi.stubGlobal('matchMedia',()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()}));
    TestBed.configureTestingModule({providers:[provideRouter([{path:'grammar',children:GRAMMAR_ROUTES}]),{provide:TranslationService,useValue:{t,language:()=> 'es'}}]});
  });
  afterEach(()=>{TestBed.resetTestingModule();vi.restoreAllMocks();vi.unstubAllGlobals();});
  it('persists semantic completion, resume, Weakness and review, and links to untouched Topic 10',async()=>{
    const concept=c('ato-de'),harness=await RouterTestingHarness.create(),page=await harness.navigateByUrl(`/grammar/n5/09/${concept.id}`,GrammarPage);page.answer(false);
    expect(TestBed.inject(WeaknessService).records().some(r=>r.itemId===concept.id)).toBe(true);
    expect(TestBed.inject(GrammarV2ProgressService).state().resume?.path).toBe(`/grammar/n5/09/${concept.id}`);
    const progress=TestBed.inject(GrammarProgressService);concept.exercises.forEach((e,i)=>progress.recordAnswer(concept.id,'09',e.id,i,true));expect(progress.conceptStatus(concept.id)).toBe('completed');
    progress.recordPractice('09',18,20,['ato-de','toki'],new Date().toISOString());
    const practice=await harness.navigateByUrl('/grammar/n5/09/practice',GrammarPage);expect(practice.practice()!.exercises).toHaveLength(20);expect(practice.practice()!.nextPath).toBe('/grammar/n5/10');
    TestBed.resetTestingModule();const restored=TestBed.inject(GrammarV2ProgressService);expect(restored.state().concepts[concept.id].status).toBe('completed');expect(restored.state().practices['09']).toMatchObject({score:18,total:20,errorConceptIds:['ato-de','toki']});
  });
});
