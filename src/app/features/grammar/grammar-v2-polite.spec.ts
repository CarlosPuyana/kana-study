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
import {GrammarExerciseComponent} from './components/grammar-exercise';
import {GRAMMAR_LESSONS,GRAMMAR_PRACTICES} from './data/grammar-catalog';
import {grammarTopicRound,grammarMixedExercises} from './services/grammar-interactive-catalog';
import {grammarWeaknessIdentity,grammarFocusedExercises} from './services/grammar-weakness';
import {isChoiceExercise,isGrammarAnswerCorrect} from './services/grammar-exercise-answer';
import es from '../../../assets/i18n/es.json';
import en from '../../../assets/i18n/en.json';
import ca from '../../../assets/i18n/ca.json';

const ids=['verb-stem','motion-purpose-ni-iku','polite-verb-masu-system','polite-desu-system','da-vs-desu','question-ka','plain-vs-polite','sentence-ending-ne-yo'];
const concepts=GRAMMAR_V2_CONCEPTS.filter(c=>c.topicId==='05');
const review=GRAMMAR_V2_REVIEW.filter(e=>e.topicId==='05');
const all=[...concepts.flatMap(c=>c.exercises),...review];
const concept=(id:string)=>concepts.find(c=>c.id===id)!;
const t=(key:string)=>(es as Record<string,string>)[key]??key;
const pairs=(id:string)=>concept(id).exercises.flatMap(e=>e.kind==='matching'?e.pairs.map(p=>[t(p.leftKey),t(p.rightKey)]):[]);

describe('Grammar V2 Topic 05 content',()=>{
  it('contains exactly eight ordered core concepts with semantic dependencies and navigation',()=>{
    expect(concepts.map(c=>c.id)).toEqual(ids);
    expect(GRAMMAR_LESSONS.filter(l=>l.topicId==='05').map(l=>l.id)).toEqual(ids);
    expect(GRAMMAR_V2_CONCEPTS.filter(c=>c.id==='motion-purpose-ni-iku').map(c=>c.topicId)).toEqual(['05']);
    expect(GRAMMAR_V2_CONCEPTS.some(c=>['masu','masen','mashita','masendeshita'].includes(c.id))).toBe(false);
    for(const [i,c] of concepts.entries()){
      expect(c).toMatchObject({order:i+1,track:'core',level:'N5'});expect(c.id).not.toMatch(/^05\./);
      expect(c.prerequisiteIds.every(id=>GRAMMAR_V2_CONCEPTS.slice(0,GRAMMAR_V2_CONCEPTS.indexOf(c)).some(p=>p.id===id))).toBe(true);
      const l=GRAMMAR_LESSONS.find(l=>l.id===c.id)!;
      expect(l.previousPath).toBe(i?`/grammar/n5/05/${ids[i-1]}`:'/grammar/n5/05');
      expect(l.nextPath).toBe(i===7?'/grammar/n5/05/practice':`/grammar/n5/05/${ids[i+1]}`);
      expect(c.lesson.detailedExplanation).toHaveLength(2);
    }
  });
  it('authors 48 lesson exercises and 16 cumulative exercises with real IDs and usable answers',()=>{
    expect(concepts.map(c=>c.exercises.length)).toEqual([6,5,8,8,5,5,6,5]);expect(review).toHaveLength(16);
    expect(grammarTopicRound('05')).toEqual(review);expect(new Set(all.map(e=>e.id)).size).toBe(64);
    expect(review.map(e=>e.conceptId)).toEqual([ids[0],ids[0],ids[1],ids[1],ids[2],ids[2],ids[2],ids[3],ids[3],ids[3],ids[4],ids[5],ids[6],ids[6],ids[7],ids[7]]);
    for(const e of all){
      expect(e).toMatchObject({version:2,topicId:'05',lessonId:e.conceptId});expect(ids).toContain(e.conceptId);
      expect(isGrammarAnswerCorrect(e,{selected:isChoiceExercise(e)?e.answer:null,text:e.kind==='fill-gap'?e.acceptedAnswers[0]:'',sequence:e.kind==='sentence-order'||e.kind==='sentence-builder'?e.solution:[],matches:e.kind==='matching'?Object.fromEntries(e.pairs.map((_,i)=>[i,i])):{}}),e.id).toBe(true);
      if(isChoiceExercise(e))expect(e.options!.every(o=>t(o.feedbackKey).length>12)).toBe(true);
      if(e.kind==='matching')for(const dict of [es,en,ca])expect(new Set(e.pairs.map(p=>(dict as Record<string,string>)[p.rightKey])).size).toBe(e.pairs.length);
    }
    expect(grammarMixedExercises().some(e=>e.conceptId?.startsWith('05.'))).toBe(false);
  });
  it('teaches dictionary-to-stem for all families and constructs motion purpose from the stem',()=>{
    const rows=concept('verb-stem').lesson.tables![0].rows.map(r=>r.cells);
    for(const pair of [['食べる','食べ'],['飲む','飲み'],['書く','書き'],['買う','買い'],['する','し'],['来る','き']])expect(rows).toContainEqual(pair);
    expect(pairs('motion-purpose-ni-iku')).toEqual([['見る','見に行く'],['買う','買いに行く']]);
    expect(t(concept('verb-stem').lesson.detailedExplanation[0].bodyKey)).toContain('otras construcciones');
    expect(t(concept('motion-purpose-ni-iku').lesson.detailedExplanation[1].bodyKey)).toContain('sin quitar ます');
  });
  it('unifies four masu endings, including both irregulars, and preserves grammatical values',()=>{
    const tables=concept('polite-verb-masu-system').lesson.tables!;
    expect(tables[0].rows.map(r=>r.cells)).toEqual([['ます','ました'],['ません','ませんでした']]);
    const forms=tables.flatMap(table=>table.rows.flatMap(row=>row.cells));
    for(const answer of ['食べます','食べません','食べました','食べませんでした','飲みませんでした','します','きます'])expect(forms).toContain(answer);
    expect(pairs('polite-verb-masu-system')).toContainEqual(['食べなかった','食べませんでした']);
    const conversion=concept('plain-vs-polite').exercises[0];
    if(!isChoiceExercise(conversion))throw Error('choice');
    expect(t(conversion.optionKeys[conversion.answer])).toBe('食べませんでした');
    const wrong=conversion.optionKeys.findIndex(k=>t(k)==='食べません');
    expect(isGrammarAnswerCorrect(conversion,{selected:wrong,text:'',sequence:[],matches:{}})).toBe(false);
    expect(conversion.options![wrong].grammarStatus).toBe('valid');
    expect(review.some(e=>e.kind==='fill-gap'&&e.acceptedAnswers.includes('この映画は面白くなかったです。'))).toBe(true);
  });
  it('teaches everyday desu for nouns, な and conjugated い; formal variants remain recognition notes',()=>{
    const cells=concept('polite-desu-system').lesson.tables![0].rows.flatMap(r=>r.cells);
    for(const form of ['学生です','学生じゃないです','学生でした','学生じゃなかったです','静かです','高いです','高かったです','高くなかったです'])expect(cells).toContain(form);
    expect(t(concept('polite-desu-system').lesson.detailedExplanation[1].bodyKey)).toContain('no son las únicas correctas');
    expect(all.filter(e=>e.kind==='fill-gap').flatMap(e=>e.acceptedAnswers).some(a=>a.includes('ありません'))).toBe(false);
  });
  it('uses detect-error only for genuinely malformed Japanese and retains valid time/register alternatives',()=>{
    const invalidForms:string[]=[];
    for(const e of all.filter(e=>e.kind==='detect-error')){
      if(!isChoiceExercise(e))throw Error('choice');
      expect(e.options!.filter(o=>o.grammarStatus==='invalid')).toHaveLength(1);
      expect(e.options![e.answer].grammarStatus).toBe('invalid');invalidForms.push(t(e.optionKeys[e.answer]));
      expect(e.options!.filter((_,i)=>i!==e.answer).every(o=>o.grammarStatus==='valid')).toBe(true);
    }
    for(const form of ['学生だです。','高いだ。','高いでした。','学生でしたった。'])expect(invalidForms).toContain(form);
    expect(invalidForms).not.toContain('食べません');
  });
  it('reuses polite questions and teaches contextual ね/よ/よね without absolute translations',()=>{
    expect(concept('question-ka').lesson.formation.map(f=>f.pattern)).toContain('学生です → 学生ですか。');
    expect(concept('question-ka').lesson.examples.map(e=>e.japanese)).toContain('どこに行きますか。');
    expect(t(concept('question-ka').lesson.detailedExplanation[1].bodyKey)).toContain('no es incorrecto');
    const ending=concept('sentence-ending-ne-yo');expect(ending.lesson.examples).toHaveLength(5);
    const choices=ending.exercises.filter(isChoiceExercise);
    expect(choices.map(e=>t(e.optionKeys[e.answer]))).toEqual(['ね','よ','よね']);
    expect(choices.every(e=>t(e.promptKey).length>65)).toBe(true);
    expect(t(ending.lesson.detailedExplanation[0].bodyKey)).toContain('no una definición absoluta');
  });
  it('has complete ES/EN/CA without introducing later concepts',()=>{
    const keys=new Set<string>();const visit=(v:unknown):void=>{if(typeof v==='string'&&v.startsWith('grammar.'))keys.add(v);else if(Array.isArray(v))v.forEach(visit);else if(v&&typeof v==='object')Object.values(v).forEach(visit);};
    visit(concepts);visit(review);visit(GRAMMAR_PRACTICES.find(p=>p.topicId==='05'));
    for(const key of keys)for(const dict of [es,en,ca])expect((dict as Record<string,string>)[key],key).toBeTruthy();
    expect(GRAMMAR_V2_CONCEPTS.some(c=>Number(c.topicId)>=11)).toBe(false);
    expect(concepts.some(c=>['casual-question-no','nominalizer-no','explanatory-no','quotation-to'].includes(c.id))).toBe(false);
  });
});

describe('Grammar V2 Topic 05 integration',()=>{
  beforeEach(()=>{
    localStorage.clear();vi.spyOn(window,'scrollTo').mockImplementation(()=>undefined);
    vi.stubGlobal('matchMedia',()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()}));
    TestBed.configureTestingModule({providers:[provideRouter([{path:'grammar',children:GRAMMAR_ROUTES}]),{provide:TranslationService,useValue:{t,language:()=> 'es'}}]});
  });
  afterEach(()=>{TestBed.resetTestingModule();vi.restoreAllMocks();vi.unstubAllGlobals();});
  it('persists semantic progress, resume and Weakness and navigates cumulative review to untouched Topic 06',async()=>{
    const c=concept('polite-verb-masu-system'),harness=await RouterTestingHarness.create();
    const page=await harness.navigateByUrl(`/grammar/n5/05/${c.id}`,GrammarPage);page.answer(false);
    const progress=TestBed.inject(GrammarProgressService);
    expect(progress.state().review[c.id].topicId).toBe('05');
    expect(TestBed.inject(GrammarV2ProgressService).state().resume?.path).toBe(`/grammar/n5/05/${c.id}`);
    const weakness=TestBed.inject(WeaknessService);expect(weakness.records().some(r=>r.itemId===c.id)).toBe(true);
    c.exercises.slice(1).forEach((e,i)=>progress.recordAnswer(c.id,'05',e.id,i+1,true));
    expect(progress.conceptStatus(c.id)).toBe('in-progress');progress.recordAnswer(c.id,'05',c.exercises[0].id,0,true);
    expect(progress.conceptStatus(c.id)).toBe('completed');
    const identity=grammarWeaknessIdentity(review[4])!;for(let i=0;i<3;i++)weakness.recordLearn('grammar',identity.itemId,identity.questionType,'again');
    expect(grammarFocusedExercises(weakness.weak()).every(e=>e.conceptId===c.id)).toBe(true);
    for(const topicId of ['01','02','03','04','05'])progress.recordPractice(topicId,1,topicId==='05'?16:15,[],new Date().toISOString());
    const practicePage=await harness.navigateByUrl('/grammar/n5/05/practice',GrammarPage);
    expect(practicePage.practice()!.exercises).toHaveLength(16);expect(practicePage.practice()!.nextPath).toBe('/grammar/n5/06');
    expect(localStorage.getItem(GRAMMAR_PROGRESS_V2_KEY)).toBeTruthy();TestBed.resetTestingModule();
    const restored=TestBed.inject(GrammarV2ProgressService);expect(restored.state().concepts[c.id].status).toBe('completed');
    expect(Object.keys(restored.state().practices)).toEqual(['01','02','03','04','05']);
  });
  it('renders detected malformed Japanese with the existing invalid presentation',()=>{
    const e=concept('da-vs-desu').exercises[0];if(!isChoiceExercise(e))throw Error('choice');
    const fixture=TestBed.createComponent(GrammarExerciseComponent);fixture.componentRef.setInput('exercise',e);fixture.detectChanges();
    fixture.componentInstance.select(e.answer);fixture.componentInstance.check();fixture.detectChanges();
    const selected=fixture.nativeElement.querySelector('.exercise-option.selected') as HTMLElement;
    expect(fixture.componentInstance.correct()).toBe(true);expect(selected.textContent).toContain('学生だです。');
    expect(selected.classList.contains('wrong')).toBe(true);expect(selected.classList.contains('correct')).toBe(false);
  });
});
