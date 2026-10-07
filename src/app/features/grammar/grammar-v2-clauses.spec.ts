import {TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import {RouterTestingHarness} from '@angular/router/testing';
import {GRAMMAR_V2_CONCEPTS,GRAMMAR_V2_REVIEW} from '../../data/grammar/grammar-n5-v2.generated';
import {GRAMMAR_PROGRESS_V2_KEY} from '../../core/models/grammar-v2.model';
import {GrammarProgressService} from '../../core/services/grammar-progress.service';
import {GrammarV2ProgressService} from '../../core/services/grammar-v2-progress.service';
import {WeaknessService} from '../../core/services/weakness.service';
import {TranslationService} from '../../core/services/translation.service';
import {GRAMMAR_ROUTES} from './grammar.routes';
import {GrammarPage} from './pages/grammar.page';
import {GRAMMAR_LESSONS,GRAMMAR_PRACTICES} from './data/grammar-catalog';
import {grammarTopicRound,grammarMixedExercises} from './services/grammar-interactive-catalog';
import {grammarFocusedExercises,grammarWeaknessIdentity} from './services/grammar-weakness';
import {isChoiceExercise,isGrammarAnswerCorrect} from './services/grammar-exercise-answer';
import es from '../../../assets/i18n/es.json';
import en from '../../../assets/i18n/en.json';
import ca from '../../../assets/i18n/ca.json';

const ids=['relative-clause-noun','nominalizer-no','explanatory-no-ndesu','casual-question-no','quotation-to'];
const concepts=GRAMMAR_V2_CONCEPTS.filter(c=>c.topicId==='06');
const review=GRAMMAR_V2_REVIEW.filter(e=>e.topicId==='06');
const all=[...concepts.flatMap(c=>c.exercises),...review];
const concept=(id:string)=>concepts.find(c=>c.id===id)!;
const t=(key:string)=>(es as Record<string,string>)[key]??key;

describe('Grammar V2 Topic 06 content',()=>{
  it('contains exactly five ordered core concepts with prior semantic dependencies and navigation',()=>{
    expect(concepts.map(c=>c.id)).toEqual(ids);expect(GRAMMAR_LESSONS.filter(l=>l.topicId==='06').map(l=>l.id)).toEqual(ids);
    for(const [i,c] of concepts.entries()){
      expect(c).toMatchObject({order:i+1,track:'core',level:'N5'});expect(c.id).not.toMatch(/^06\./);
      expect(c.prerequisiteIds.every(id=>GRAMMAR_V2_CONCEPTS.slice(0,GRAMMAR_V2_CONCEPTS.indexOf(c)).some(p=>p.id===id))).toBe(true);
      const l=GRAMMAR_LESSONS.find(l=>l.id===c.id)!;
      expect(l.previousPath).toBe(i?`/grammar/n5/06/${ids[i-1]}`:'/grammar/n5/06');
      expect(l.nextPath).toBe(i===4?'/grammar/n5/06/practice':`/grammar/n5/06/${ids[i+1]}`);
    }
    expect(concept('casual-question-no').prerequisiteIds).toEqual(['explanatory-no-ndesu','question-ka']);
  });
  it('has 30 lesson exercises and 15 cumulative questions with usable answers, feedback and real concept IDs',()=>{
    expect(concepts.map(c=>c.exercises.length)).toEqual([6,5,7,5,7]);expect(review).toHaveLength(15);
    expect(grammarTopicRound('06')).toEqual(review);expect(new Set(all.map(e=>e.id)).size).toBe(45);
    expect(review.map(e=>e.conceptId)).toEqual([ids[0],ids[0],ids[0],ids[1],ids[1],ids[1],ids[2],ids[2],ids[2],ids[3],ids[3],ids[4],ids[4],ids[4],ids[3]]);
    for(const e of all){
      expect(e).toMatchObject({version:2,topicId:'06',lessonId:e.conceptId});expect(ids).toContain(e.conceptId);
      expect(isGrammarAnswerCorrect(e,{selected:isChoiceExercise(e)?e.answer:null,text:e.kind==='fill-gap'?e.acceptedAnswers[0]:'',sequence:e.kind==='sentence-order'||e.kind==='sentence-builder'?e.solution:[],matches:e.kind==='matching'?Object.fromEntries(e.pairs.map((_,i)=>[i,i])):{}}),e.id).toBe(true);
      if(isChoiceExercise(e))expect(e.options!.every(o=>t(o.feedbackKey).length>12)).toBe(true);
      if(e.kind==='matching')for(const dict of [es,en,ca])expect(new Set(e.pairs.map(p=>(dict as Record<string,string>)[p.rightKey])).size).toBe(e.pairs.length);
    }
    expect(grammarMixedExercises().some(e=>e.conceptId?.startsWith('06.'))).toBe(false);
  });
  it('preserves tense and negation in plain verbal clauses, basic が and the existing な modifier',()=>{
    const c=concept('relative-clause-noun');
    for(const sentence of ['昨日買った本','田中さんが読んだ本','毎日読む本','買わなかった本'])expect(c.lesson.examples.map(e=>e.japanese)).toContain(sentence);
    expect(c.exercises.some(e=>e.kind==='fill-gap'&&e.acceptedAnswers.includes('が'))).toBe(true);
    const modifier=c.exercises[4];if(!isChoiceExercise(modifier))throw Error('choice');
    expect(t(modifier.optionKeys[modifier.answer])).toBe('静かな町');expect(modifier.options![modifier.answer].grammarStatus).toBe('valid');
    expect(c.lesson.examples.some(e=>/買いました本|静かだ町/.test(e.japanese))).toBe(false);
    const detail=t(c.lesson.detailedExplanation[1].bodyKey);expect(detail).toContain('sin afirmar que は sea universalmente imposible');expect(detail).toContain('日本の本');
    expect(review[1].kind).toBe('multiple-choice');if(!isChoiceExercise(review[1]))throw Error('choice');
    expect(t(review[1].optionKeys[review[1].answer])).toBe('買わなかった本');
  });
  it('nominalises actions with のが/のは and distinguishes noun-linking の from verbal nominalisation',()=>{
    const c=concept('nominalizer-no');
    expect(c.lesson.examples.map(e=>e.japanese)).toEqual(['本を読むのが好きだ。','歩くのが好きだ。','毎日勉強するのは大変だ。']);
    expect(t(c.lesson.detailedExplanation[1].bodyKey)).toContain('日本語の本 relaciona nombres');
    const exercise=c.exercises[3];if(exercise.kind!=='matching')throw Error('matching');
    expect(exercise.pairs.map(p=>t(p.leftKey))).toEqual(['日本語の本','日本語を勉強するの']);
    expect(t(exercise.pairs[0].rightKey)).not.toBe(t(exercise.pairs[1].rightKey));
  });
  it('uses な only for nominal/な non-past affirmatives and presents explanation as contextual framing',()=>{
    const c=concept('explanatory-no-ndesu'),forms=c.lesson.tables![0].rows.flatMap(r=>r.cells);
    for(const form of ['明日行くんです','高いんです','学生なんです','静かなんです','学生じゃないんです','学生だったんです','学生じゃなかったんです','静かじゃないんです','静かだったんです'])expect(forms).toContain(form);
    expect(forms).not.toContain('学生んです');expect(forms).not.toContain('学生じゃないなんです');
    expect(c.lesson.formation[0].pattern).toBe('のだ → んだ / のです → んです');
    expect(t(c.lesson.detailedExplanation[1].bodyKey)).toContain('no significa literalmente «porque»');
    const contextual=c.exercises[6];if(!isChoiceExercise(contextual))throw Error('choice');
    expect(contextual.options!.every(o=>o.grammarStatus==='valid')).toBe(true);
  });
  it('teaches contextual の questions with the nominal な rule without reducing them to casual か questions',()=>{
    const c=concept('casual-question-no');
    for(const sentence of ['明日行くの？','高いの？','学生なの？','静かなの？','学生じゃないの？','行かなかったの？','学生だったの？'])expect(c.lesson.examples.map(e=>e.japanese)).toContain(sentence);
    expect(t(c.lesson.detailedExplanation[0].bodyKey)).toContain('No aprendas の？ como simplemente la versión informal');
    expect(c.exercises.some(e=>e.kind==='fill-gap'&&e.acceptedAnswers.includes('なの'))).toBe(true);
    expect(c.lesson.examples.some(e=>e.japanese.includes('学生じゃないなの'))).toBe(false);
  });
  it('separates literal quotation with polite words from plain indirect thought and companion と',()=>{
    const c=concept('quotation-to');
    for(const sentence of ['「ありがとう」と言った。','「学生です」と言った。','「明日行きます」と言った。','学生だと思う。','静かだと思う。'])expect(c.lesson.examples.map(e=>e.japanese)).toContain(sentence);
    expect(c.lesson.examples.some(e=>e.japanese==='学生ですと思う。')).toBe(false);
    const direct=c.exercises[2];if(!isChoiceExercise(direct))throw Error('choice');
    expect(t(direct.optionKeys[direct.answer])).toBe('「学生です」と言った。');expect(direct.options!.every(o=>o.grammarStatus==='valid')).toBe(true);
    const roles=c.lesson.tables![0].rows.map(r=>r.cells[0]);expect(roles).toEqual(['友達と行く。','「学生です」と言った。','学生だと思う。']);
    expect(t(c.lesson.detailedExplanation[0].bodyKey)).toContain('No hay una prohibición universal');
  });
  it('compares all three の functions using the same base in theory and cumulative practice',()=>{
    const expected=['本を読むのが好きだ。','本を読むんです。','本を読むの？'];
    expect(concept('casual-question-no').lesson.tables![0].rows.map(r=>r.cells[0])).toEqual(expected);
    const contrast=review[14];if(contrast.kind!=='matching')throw Error('matching');
    expect(contrast.pairs.map(p=>t(p.leftKey))).toEqual(expected);
    expect(contrast.pairs.map(p=>t(p.rightKey))).toEqual(['Nominalización: la acción como unidad nominal','Explicación: contexto o trasfondo','Pregunta: situación con matiz contextual']);
    expect(new Set(ids.slice(1,4).map(id=>concept(id).lesson.ideaKey)).size).toBe(3);
  });
  it('restricts detect-error to malformed structures and keeps later content out of this topic',()=>{
    const bad:string[]=[];
    for(const e of all.filter(e=>e.kind==='detect-error')){
      if(!isChoiceExercise(e))throw Error('choice');expect(e.options!.filter(o=>o.grammarStatus==='invalid')).toHaveLength(1);
      expect(e.options![e.answer].grammarStatus).toBe('invalid');bad.push(t(e.optionKeys[e.answer]));
    }
    expect(bad).toEqual(['昨日買いました本','学生んです。','学生じゃないなんです。']);
    expect(GRAMMAR_V2_CONCEPTS.some(c=>Number(c.topicId)>=8)).toBe(false);
    const keys=new Set<string>();const visit=(v:unknown):void=>{if(typeof v==='string'&&v.startsWith('grammar.'))keys.add(v);else if(Array.isArray(v))v.forEach(visit);else if(v&&typeof v==='object')Object.values(v).forEach(visit);};
    visit(concepts);visit(review);visit(GRAMMAR_PRACTICES.find(p=>p.topicId==='06'));
    for(const key of keys)for(const dict of [es,en,ca])expect((dict as Record<string,string>)[key],key).toBeTruthy();
    const text=[...keys].map(t).join('\n')+JSON.stringify(concepts.map(c=>c.lesson));
    expect(text).not.toMatch(/ことができる|と言って|と思って|聞いたんだけど|てください|ています/);
  });
});

describe('Grammar V2 Topic 06 integration',()=>{
  beforeEach(()=>{
    localStorage.clear();vi.spyOn(window,'scrollTo').mockImplementation(()=>undefined);
    vi.stubGlobal('matchMedia',()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()}));
    TestBed.configureTestingModule({providers:[provideRouter([{path:'grammar',children:GRAMMAR_ROUTES}]),{provide:TranslationService,useValue:{t,language:()=> 'es'}}]});
  });
  afterEach(()=>{TestBed.resetTestingModule();vi.restoreAllMocks();vi.unstubAllGlobals();});
  it('persists semantic completion, resume and Weakness and links cumulative practice to Topic 07',async()=>{
    const c=concept('explanatory-no-ndesu'),harness=await RouterTestingHarness.create();
    const page=await harness.navigateByUrl(`/grammar/n5/06/${c.id}`,GrammarPage);page.answer(false);
    expect(harness.routeNativeElement!.querySelector('app-grammar-v2-lesson')).not.toBeNull();
    const progress=TestBed.inject(GrammarProgressService),weakness=TestBed.inject(WeaknessService);
    expect(progress.state().review[c.id].topicId).toBe('06');expect(weakness.records().some(r=>r.itemId===c.id)).toBe(true);
    expect(TestBed.inject(GrammarV2ProgressService).state().resume?.path).toBe(`/grammar/n5/06/${c.id}`);
    c.exercises.slice(1).forEach((e,i)=>progress.recordAnswer(c.id,'06',e.id,i+1,true));expect(progress.conceptStatus(c.id)).toBe('in-progress');
    progress.recordAnswer(c.id,'06',c.exercises[0].id,0,true);expect(progress.conceptStatus(c.id)).toBe('completed');
    const identity=grammarWeaknessIdentity(review[6])!;for(let i=0;i<3;i++)weakness.recordLearn('grammar',identity.itemId,identity.questionType,'again');
    expect(grammarFocusedExercises(weakness.weak()).every(e=>e.conceptId===c.id)).toBe(true);
    for(const topicId of ['01','02','03','04','05','06'])progress.recordPractice(topicId,1,GRAMMAR_PRACTICES.find(p=>p.topicId===topicId)!.exercises.length,[],new Date().toISOString());
    const practicePage=await harness.navigateByUrl('/grammar/n5/06/practice',GrammarPage);
    expect(practicePage.practice()!.exercises).toHaveLength(15);expect(practicePage.practice()!.nextPath).toBe('/grammar/n5/07');
    expect(localStorage.getItem(GRAMMAR_PROGRESS_V2_KEY)).toBeTruthy();TestBed.resetTestingModule();
    const restored=TestBed.inject(GrammarV2ProgressService);expect(restored.state().concepts[c.id].status).toBe('completed');
    expect(Object.keys(restored.state().practices)).toEqual(['01','02','03','04','05','06']);
  });
});
