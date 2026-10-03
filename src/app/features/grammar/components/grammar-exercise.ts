import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import { TranslationService } from '../../../core/services/translation.service';
import { GrammarExercise } from '../models/grammar.model';

@Component({selector:'app-grammar-exercise',changeDetection:ChangeDetectionStrategy.OnPush,template:`
  <section [class]="practice()?'practice-question-card':'exercise-block'">
    @if(practice()){
      <div class="practice-question-meta"><span class="practice-type">{{i18n.t(exercise().labelKey)}}</span><span class="practice-topic">{{i18n.t(exercise().topicKey)}}</span></div>
      <h2>{{i18n.t(exercise().questionKey)}}</h2>
    } @else {
      <div class="section-title"><span>02</span><div><small>{{i18n.t('grammar.exercise')}}</small><h3>{{i18n.t(exercise().questionKey)}}</h3></div></div>
    }
    <div [class]="practice()?'practice-prompt':'exercise-prompt'">{{i18n.t(exercise().promptKey)}}</div>
    <div [class]="practice()?'practice-options-grid':'exercise-options'" role="group" [attr.aria-label]="i18n.t(exercise().questionKey)">
      @for(option of exercise().optionKeys;track $index){
        <button type="button" [class]="practice()?'practice-option':'exercise-option'" [class.selected]="selected()===$index" [class.correct]="checked()&&$index===exercise().answer" [class.wrong]="checked()&&selected()===$index&&!correct()" [disabled]="checked()" [attr.aria-pressed]="selected()===$index" (click)="select($index)">{{i18n.t(option)}}</button>
      }
    </div>
    @if(checked()){
      <div [class]="practice()?'practice-feedback-box':'exercise-feedback show'" [class.success]="correct()" [class.error]="!correct()" role="status">
        <div [class]="practice()?'practice-feedback-icon':'feedback-icon'">{{correct()?'✓':'!'}}</div><div><strong>{{i18n.t(correct()?'grammar.correct':practice()?'grammar.review':'grammar.almost')}}</strong><p>{{i18n.t(correct()?exercise().successKey:exercise().errorKey)}}</p></div>
      </div>
    }
    <div [class]="practice()?'practice-question-actions':'exercise-actions'">
      @if(!checked()){<button type="button" [class]="practice()?'practice-check':'check-answer'" [disabled]="selected()===null" (click)="check()">{{i18n.t('grammar.check')}}</button>}
      <button type="button" [class]="practice()?'practice-next':'continue-answer'" [disabled]="!checked()" [hidden]="practice()&&!checked()" (click)="continued.emit()">{{i18n.t(last()?'grammar.results':'grammar.next')}}</button>
    </div>
  </section>
`})
export class GrammarExerciseComponent {
  readonly i18n=inject(TranslationService);
  readonly exercise=input.required<GrammarExercise>();readonly practice=input(false);readonly last=input(false);
  readonly answered=output<boolean>();readonly continued=output<void>();
  readonly selected=signal<number|null>(null);readonly checked=signal(false);
  constructor(){effect(()=>{this.exercise();this.selected.set(null);this.checked.set(false);});}
  correct():boolean{return this.selected()===this.exercise().answer;}
  select(index:number):void{if(!this.checked())this.selected.set(index);}
  check():void{if(this.selected()===null||this.checked())return;this.checked.set(true);this.answered.emit(this.correct());}
}
