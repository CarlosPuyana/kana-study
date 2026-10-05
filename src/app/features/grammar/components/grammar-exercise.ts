import { afterRenderEffect, ChangeDetectionStrategy, Component, computed, effect, ElementRef, inject, input, output, signal, viewChild } from '@angular/core';
import { TranslationService } from '../../../core/services/translation.service';
import { GrammarExercise } from '../models/grammar.model';
import { grammarAnswerReady, isGrammarAnswerCorrect, isChoiceExercise } from '../services/grammar-exercise-answer';
import { GrammarDirectionComponent } from './grammar-direction';
import { GrammarKanaAssistComponent } from './grammar-kana-assist';

@Component({selector:'app-grammar-exercise',imports:[GrammarDirectionComponent,GrammarKanaAssistComponent],changeDetection:ChangeDetectionStrategy.OnPush,templateUrl:'./grammar-exercise.html',styleUrl:'./grammar-exercise.scss'})
export class GrammarExerciseComponent {
  readonly i18n=inject(TranslationService);
  readonly exercise=input.required<GrammarExercise>(); readonly practice=input(false); readonly last=input(false);
  readonly answered=output<boolean>(); readonly continued=output<void>();
  readonly selected=signal<number|null>(null); readonly checked=signal(false);
  readonly textAnswer=signal(''); readonly sequence=signal<readonly number[]>([]);
  readonly matches=signal<Readonly<Record<number,number>>>({}); readonly matchingLeft=signal<number|null>(null);
  readonly choice=computed(()=>{const e=this.exercise();return isChoiceExercise(e)?e:null;});
  readonly ordered=computed(()=>{const e=this.exercise();return e.kind==='sentence-builder'||e.kind==='sentence-order'?e:null;});
  readonly matching=computed(()=>{const e=this.exercise();return e.kind==='matching'?e:null;});
  readonly gap=computed(()=>{const e=this.exercise();return e.kind==='fill-gap'?e:null;});
  private readonly gapInput=viewChild<ElementRef<HTMLInputElement>>('gapInput');
  private readonly continueButton=viewChild<ElementRef<HTMLButtonElement>>('continueButton');
  private readonly keyboardCheck=signal(false);
  private readonly host=inject<ElementRef<HTMLElement>>(ElementRef);
  focusAnswer():void{this.host.nativeElement.querySelector<HTMLElement>('input,button:not(:disabled)')?.focus();}
  readonly rightOrder=computed(()=>{const e=this.matching();return e?.rightOrder??e?.pairs.map((_,i)=>i).reverse()??[];});
  readonly ready=computed(()=>grammarAnswerReady(this.exercise(),this.answer()));
  constructor(){effect(()=>{this.exercise();this.selected.set(null);this.checked.set(false);this.textAnswer.set('');this.sequence.set([]);this.matches.set({});this.matchingLeft.set(null);});
    afterRenderEffect(()=>{if(this.checked()&&this.keyboardCheck()){this.continueButton()?.nativeElement.focus();this.keyboardCheck.set(false);}});
  }
  private answer(){return {selected:this.selected(),text:this.textAnswer(),sequence:this.sequence(),matches:this.matches()};}
  correct():boolean{return isGrammarAnswerCorrect(this.exercise(),this.answer());}
  select(index:number):void{if(!this.checked())this.selected.set(index);}
  addToken(index:number):void{if(!this.checked()&&!this.sequence().includes(index))this.sequence.update(tokens=>[...tokens,index]);}
  resetSequence():void{if(!this.checked())this.sequence.set([]);}
  userAnswer():string {
    const e=this.exercise();
    if(isChoiceExercise(e))return this.selected()===null?'':this.i18n.t(e.optionKeys[this.selected()!]);
    if(e.kind==='fill-gap')return this.textAnswer();
    if(e.kind==='sentence-builder'||e.kind==='sentence-order')return this.sequence().map(i=>this.i18n.t(e.tokenKeys[i])).join('');
    if(e.kind!=='matching')return '';
    return e.pairs.map((p,i)=>this.i18n.t(p.leftKey)+' → '+this.i18n.t(e.pairs[this.matches()[i]].rightKey)).join(' · ');
  }
  removeToken(position:number):void{if(!this.checked())this.sequence.update(tokens=>tokens.filter((_,i)=>i!==position));}
  chooseLeft(index:number):void{if(!this.checked())this.matchingLeft.set(index);}
  matchRight(index:number):void {
    const left=this.matchingLeft();if(left===null||this.checked())return;
    this.matches.update(matches=>({...Object.fromEntries(Object.entries(matches).filter(([key,value])=>Number(key)!==left&&value!==index)),[left]:index}));
    this.matchingLeft.set(null);
  }
  onEnter(event:Event):void{if(event instanceof KeyboardEvent&&!event.isComposing)this.check(event);}
  editGap(kana:string,erase=false):void {
    if(this.checked()||!this.gap()||(!erase&&!this.gap()!.kanaBank?.includes(kana)))return;
    const input=this.gapInput()?.nativeElement,current=this.textAnswer();
    const start=input?.selectionStart??current.length,end=input?.selectionEnd??start;
    let prefix=current.slice(0,start);
    if(erase&&start===end){const chars=Array.from(prefix);chars.pop();prefix=chars.join('');}
    const value=prefix+kana+current.slice(end),cursor=prefix.length+kana.length;
    this.textAnswer.set(value);
    if(input){input.value=value;input.setSelectionRange(cursor,cursor);}
  }
  check(event?:Event):void{if(!this.ready()||this.checked())return;
    this.keyboardCheck.set(event instanceof KeyboardEvent||event instanceof MouseEvent&&event.detail===0);
    this.checked.set(true);this.answered.emit(this.correct());
  }
}
