import { TestBed } from '@angular/core/testing';
import { TranslationService } from '../../core/services/translation.service';
import { GrammarExerciseComponent } from './components/grammar-exercise';
import { GRAMMAR_LESSONS } from './data/grammar-n5.generated';
import es from '../../../assets/i18n/es.json';
import {GRAMMAR_V2_CONCEPTS, GRAMMAR_V2_REVIEW} from '../../data/grammar/grammar-n5-v2.generated';
import {GrammarFillExercise} from './models/grammar.model';

const v2Gaps=[...GRAMMAR_V2_CONCEPTS.flatMap(c=>c.exercises),...GRAMMAR_V2_REVIEW].filter((e):e is GrammarFillExercise=>e.kind==='fill-gap');
function safeBank(e:Pick<GrammarFillExercise,'acceptedAnswers'|'kanaBank'>):boolean {
  const required=new Set(Array.from(e.acceptedAnswers.join(''))),bank=e.kanaBank??[];
  return bank.length>=6&&new Set(bank).size===bank.length&&[...required].every(c=>bank.includes(c))
    &&bank.filter(c=>!required.has(c)).length>=2
    &&e.acceptedAnswers.every(answer=>bank.join('')!==answer);
}

describe('Contextual kana assistance',()=>{
  beforeEach(()=>TestBed.configureTestingModule({providers:[{provide:TranslationService,useValue:{t:(key:string)=>(es as Record<string,string>)[key]??key}}]}));
  afterEach(()=>TestBed.resetTestingModule());
  it('rejects the reported answer-only banks and protects every V2 fill-gap and accepted variant',()=>{
    for(const answer of ['だ','は','じゃない','だった','じゃなかった'])expect(safeBank({acceptedAnswers:[answer],kanaBank:[...new Set(Array.from(answer))]})).toBe(false);
    expect(v2Gaps.length).toBeGreaterThan(40);
    for(const e of v2Gaps){
      expect(safeBank(e),e.id).toBe(true);
      const required=[...new Set(Array.from(e.acceptedAnswers[0]))];
      if(required.length>1)expect(e.kanaBank!.filter(c=>required.includes(c)).join(''),e.id).not.toBe(required.join(''));
    }
  });
  it('renders stable safe buttons in all five reported lessons and samples Topics 02–04',()=>{
    const ids=['state-being-plain','state-being-negative','state-being-past','state-being-past-negative','particle-wa-topic'];
    const examples=[...ids.map(id=>GRAMMAR_V2_CONCEPTS.find(c=>c.id===id)!.exercises.find(e=>e.kind==='fill-gap')!),...['02','03','04'].map(topic=>v2Gaps.find(e=>e.topicId===topic)!)];
    for(const e of examples){
      if(e.kind!=='fill-gap')throw Error('fill-gap');
      const fixture=TestBed.createComponent(GrammarExerciseComponent);fixture.componentRef.setInput('exercise',e);fixture.detectChanges();
      const buttons=()=>Array.from(fixture.nativeElement.querySelectorAll('app-grammar-kana-assist button:not(.erase)') as NodeListOf<HTMLButtonElement>);
      expect(buttons().map(b=>b.textContent!.trim())).toEqual(e.kanaBank);
      fixture.detectChanges();expect(buttons().map(b=>b.textContent!.trim())).toEqual(e.kanaBank);
      for(const character of e.acceptedAnswers[0]){buttons().find(b=>b.textContent!.trim()===character)!.click();fixture.detectChanges();}
      expect(fixture.componentInstance.textAnswer()).toBe(e.acceptedAnswers[0]);expect(fixture.componentInstance.correct()).toBe(true);
      fixture.destroy();
    }
  });
  function setup(){
    const exercise=GRAMMAR_LESSONS.find(l=>l.topicId==='06'&&l.id==='3')!.exercise;
    if(exercise.kind!=='fill-gap')throw new Error('Expected kana conjugation');
    const fixture=TestBed.createComponent(GrammarExerciseComponent);fixture.componentRef.setInput('exercise',exercise);fixture.detectChanges();
    const input=fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const click=(text:string)=>{const button=Array.from(fixture.nativeElement.querySelectorAll('app-grammar-kana-assist button') as NodeListOf<HTMLButtonElement>).find(b=>b.textContent!.trim()===text)!;button.click();fixture.detectChanges();};
    return {fixture,input,exercise,click};
  }
  it('constructs the same Japanese answer as typing, without an IME',()=>{
    const {fixture,input,exercise,click}=setup();
    for(const kana of exercise.acceptedAnswers[0])click(kana);
    expect(input.value).toBe(exercise.acceptedAnswers[0]);expect(fixture.componentInstance.correct()).toBe(true);
    fixture.componentInstance.check();fixture.detectChanges();expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain('Correcto');
    expect(Array.from(fixture.nativeElement.querySelectorAll('app-grammar-kana-assist button') as NodeListOf<HTMLButtonElement>).every(b=>b.disabled)).toBe(true);
    click(exercise.kanaBank![0]);expect(input.value).toBe(exercise.acceptedAnswers[0]);
  });
  it('keeps normal Japanese keyboard input and rejects romaji',()=>{
    const {fixture,input,exercise}=setup();
    input.value=exercise.acceptedAnswers[0];input.dispatchEvent(new Event('input'));fixture.detectChanges();expect(fixture.componentInstance.correct()).toBe(true);
    input.value='nonde';input.dispatchEvent(new Event('input'));fixture.detectChanges();expect(fixture.componentInstance.correct()).toBe(false);
  });
  it('inserts at the caret, replaces a selection and erases, including repeated kana',()=>{
    const {fixture,input,click}=setup();click('よ');click('で');input.setSelectionRange(1,1);click('ん');expect(input.value).toBe('よんで');
    input.setSelectionRange(1,2);click('よ');expect(input.value).toBe('よよで');click('Borrar');expect(input.value).toBe('よで');
    input.setSelectionRange(0,2);click('Borrar');expect(input.value).toBe('');expect(fixture.componentInstance.ready()).toBe(false);
  });
  it('resets the kana answer and assist buttons for the next exercise',()=>{
    const {fixture,input,exercise,click}=setup();click('よ');fixture.componentRef.setInput('exercise',{...exercise,id:'next'});fixture.detectChanges();
    expect(input.value).toBe('');expect(fixture.componentInstance.ready()).toBe(false);expect(fixture.nativeElement.querySelector('button.erase').disabled).toBe(true);
  });
});
