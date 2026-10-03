import {TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import {RouterTestingHarness} from '@angular/router/testing';
import {TranslationService} from '../../core/services/translation.service';
import {GrammarExerciseComponent} from './components/grammar-exercise';
import {GrammarPage} from './pages/grammar.page';
import {GRAMMAR_ROUTES} from './grammar.routes';
import {GRAMMAR_LESSONS} from './data/grammar-n5.generated';
import {isGrammarAnswerCorrect} from './services/grammar-exercise-answer';
import es from '../../../assets/i18n/es.json';
const lesson=(id:string)=>GRAMMAR_LESSONS.find(l=>`${l.topicId}.${l.id}`===id)!;
const providers=[{provide:TranslationService,useValue:{t:(key:string)=>(es as Record<string,string>)[key]??key}}];
describe('Editorial answers and keyboard focus',()=>{
 beforeEach(()=>TestBed.configureTestingModule({providers}));
 afterEach(()=>{TestBed.resetTestingModule();vi.restoreAllMocks();});
 it.each([
  ['04.12','さんじかんくらい'],['04.12','さんじかんぐらい'],['05.8','いそがしいのです'],['05.8','いそがしいんです'],['03.11','へ'],['03.11','に'],
 ])('accepts the explicit equivalent %s: %s',(id,text)=>{
  expect(isGrammarAnswerCorrect(lesson(id).exercise,{text,selected:null,sequence:[],matches:{}})).toBe(true);
 });
 it.each([['09.4',[1,2,0]],['08.10',[3,0,1,2]]] as const)('accepts the authored alternative order for %s',(id,sequence)=>{
  expect(isGrammarAnswerCorrect(lesson(id).exercise,{text:'',selected:null,sequence,matches:{}})).toBe(true);
 });
 function setup(){const fixture=TestBed.createComponent(GrammarExerciseComponent);fixture.componentRef.setInput('exercise',lesson('05.8').exercise);fixture.detectChanges();const input=fixture.nativeElement.querySelector('input') as HTMLInputElement;input.value='いそがしいのです';input.dispatchEvent(new Event('input'));fixture.detectChanges();return {fixture,input};}
 it('focuses Continue after keyboard submission once feedback is rendered',async()=>{
  const {fixture,input}=setup();input.focus();input.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));fixture.detectChanges();await fixture.whenStable();
  expect(document.activeElement).toBe(fixture.nativeElement.querySelector('.continue-answer'));
 });
 it('does not steal pointer focus or submit an IME composition',async()=>{
  const {fixture,input}=setup();input.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',isComposing:true,bubbles:true}));fixture.detectChanges();expect(fixture.componentInstance.checked()).toBe(false);
  input.focus();fixture.componentInstance.check(new MouseEvent('click',{detail:1}));fixture.detectChanges();await fixture.whenStable();
  expect(document.activeElement).not.toBe(fixture.nativeElement.querySelector('.continue-answer'));
 });
});
describe('Mobile Grammar menu focus',()=>{
 const width=Object.getOwnPropertyDescriptor(window,'innerWidth');
 afterEach(()=>{if(width)Object.defineProperty(window,'innerWidth',width);TestBed.resetTestingModule();vi.restoreAllMocks();});
 it('opens inside the dialog, traps Tab, closes with Escape and restores the opener',async()=>{
  Object.defineProperty(window,'innerWidth',{configurable:true,value:390});vi.spyOn(window,'scrollTo').mockImplementation(()=>{});
  TestBed.configureTestingModule({providers:[...providers,provideRouter([{path:'grammar',children:GRAMMAR_ROUTES}])]});
  const harness=await RouterTestingHarness.create();await harness.navigateByUrl('/grammar/n5/06/13',GrammarPage);
  const root=harness.routeNativeElement!,trigger=root.querySelector('.grammar-toolbar button') as HTMLButtonElement;
  trigger.focus();trigger.click();harness.detectChanges();await harness.fixture.whenStable();
  const dialog=root.querySelector('[role="dialog"]')!;expect(dialog.contains(document.activeElement)).toBe(true);expect(root.querySelector('main')!.hasAttribute('inert')).toBe(true);
  const first=dialog.querySelector('button') as HTMLButtonElement,links=dialog.querySelectorAll('a[href]'),last=links[links.length-1] as HTMLAnchorElement;
  last.focus();last.dispatchEvent(new KeyboardEvent('keydown',{key:'Tab',bubbles:true,cancelable:true}));expect(document.activeElement).toBe(first);
  first.dispatchEvent(new KeyboardEvent('keydown',{key:'Tab',shiftKey:true,bubbles:true,cancelable:true}));expect(document.activeElement).toBe(last);
  last.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));harness.detectChanges();await harness.fixture.whenStable();
  expect(root.querySelector('[role="dialog"]')).toBeNull();expect(root.querySelector('main')!.hasAttribute('inert')).toBe(false);expect(document.activeElement).toBe(trigger);
 });
});
