import {TestBed} from '@angular/core/testing';
import {provideRouter,Router} from '@angular/router';
import {RouterTestingHarness} from '@angular/router/testing';
import {TranslationService} from '../../core/services/translation.service';
import es from '../../../assets/i18n/es.json';
import en from '../../../assets/i18n/en.json';
import ca from '../../../assets/i18n/ca.json';
import {es as compactEs,en as compactEn,ca as compactCa} from '../../../assets/i18n/dictionaries.generated';
import {GRAMMAR_LESSONS,GRAMMAR_PRACTICES} from './data/grammar-n5.generated';
import {GrammarExercise,grammarLessonExercises} from './models/grammar.model';
import {GrammarAnswer,isChoiceExercise,isGrammarAnswerCorrect} from './services/grammar-exercise-answer';
import {shuffleGrammarExercise} from './services/grammar-shuffle';
import {GrammarPage} from './pages/grammar.page';
import {GRAMMAR_ROUTES} from './grammar.routes';
const t=(key:string,params?:Record<string,string|number>)=>Object.entries(params??{}).reduce((s,[k,v])=>s.replaceAll(`{{${k}}}`,String(v)),(es as Record<string,string>)[key]??key);
const answer=(e:GrammarExercise):GrammarAnswer=>({selected:isChoiceExercise(e)?e.answer:null,text:e.kind==='fill-gap'?e.acceptedAnswers[0]:'',sequence:e.kind==='sentence-builder'||e.kind==='sentence-order'?e.solution:[],matches:e.kind==='matching'?Object.fromEntries(e.pairs.map((_,i)=>[i,i])):{}});
describe('Expanded grammar concept practice',()=>{
 afterEach(()=>TestBed.resetTestingModule());
 it('preserves every ES/EN/CA key and value in the compact build representation',()=>{
  expect(compactEs).toEqual(es);expect(compactEn).toEqual(en);expect(compactCa).toEqual(ca);
 });
 it('resolves all 542 exercises and authored variants before and after shuffling',()=>{
  for(const original of [...GRAMMAR_LESSONS.flatMap(grammarLessonExercises),...GRAMMAR_PRACTICES.flatMap(p=>p.exercises)]){
   for(const e of [original,shuffleGrammarExercise(original,()=>0.25)]){
    expect(isGrammarAnswerCorrect(e,answer(e)),e.id).toBe(true);
    if(e.kind==='fill-gap')for(const text of e.acceptedAnswers)expect(isGrammarAnswerCorrect(e,{...answer(e),text}),e.id).toBe(true);
    if(e.kind==='sentence-builder'||e.kind==='sentence-order')for(const sequence of e.acceptedOrders??[])expect(isGrammarAnswerCorrect(e,{...answer(e),sequence}),e.id).toBe(true);
   }
  }
 });
 it('keeps the route within a concept until all exercises have been continued, then uses its existing next path',async()=>{
  vi.spyOn(window,'scrollTo').mockImplementation(()=>{});
  TestBed.configureTestingModule({providers:[provideRouter([{path:'grammar',children:GRAMMAR_ROUTES}]),{provide:TranslationService,useValue:{t}}]});
  const harness=await RouterTestingHarness.create(),page=await harness.navigateByUrl('/grammar/n5/10/change-naru',GrammarPage);
  const router=TestBed.inject(Router),ids=page.exercises().map(e=>e.id),seen:string[]=[];
  for(let i=0;i<ids.length;i++){
   page.answer(true);seen.push(page.currentExercise()!.id);expect(harness.routeNativeElement!.querySelector('.lesson-exercise-count')!.textContent).toContain(`Ejercicio ${i+1} de ${ids.length}`);
   if(i<ids.length-1){page.continueExercise();harness.detectChanges();await harness.fixture.whenStable();expect(router.url).toBe('/grammar/n5/10/change-naru');}
  }
  expect(seen).toEqual(ids);page.continueExercise();await harness.fixture.whenStable();harness.detectChanges();
  expect(router.url).toBe('/grammar/n5/10/choice-ni-suru');expect(page.exerciseIndex()).toBe(0);
 });
 it('resets answers and moves keyboard focus to the next exercise control',async()=>{
  vi.spyOn(window,'scrollTo').mockImplementation(()=>{});
  TestBed.configureTestingModule({providers:[provideRouter([{path:'grammar',children:GRAMMAR_ROUTES}]),{provide:TranslationService,useValue:{t}}]});
  const harness=await RouterTestingHarness.create(),page=await harness.navigateByUrl('/grammar/n5/01/sentence-structure-context',GrammarPage);
  const option=harness.routeNativeElement!.querySelector<HTMLButtonElement>('.exercise-option')!;option.click();harness.detectChanges();
  harness.routeNativeElement!.querySelector<HTMLButtonElement>('.check-answer')!.click();harness.detectChanges();
  harness.routeNativeElement!.querySelector<HTMLButtonElement>('.continue-answer')!.click();harness.detectChanges();await harness.fixture.whenStable();
  expect(page.exerciseIndex()).toBe(1);expect(harness.routeNativeElement!.querySelector('[role="status"]')).toBeNull();
  expect(harness.routeNativeElement!.querySelector<HTMLButtonElement>('.check-answer')!.disabled).toBe(true);
  expect(document.activeElement?.closest('app-grammar-exercise')).not.toBeNull();
 });
});
