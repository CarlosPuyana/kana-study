import { TestBed } from '@angular/core/testing';
import { TranslationService } from '../../core/services/translation.service';
import { GrammarExerciseComponent } from './components/grammar-exercise';
import { GRAMMAR_LESSONS } from './data/grammar-n5.generated';
import es from '../../../assets/i18n/es.json';

describe('Contextual kana assistance',()=>{
  beforeEach(()=>TestBed.configureTestingModule({providers:[{provide:TranslationService,useValue:{t:(key:string)=>(es as Record<string,string>)[key]??key}}]}));
  afterEach(()=>TestBed.resetTestingModule());
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
