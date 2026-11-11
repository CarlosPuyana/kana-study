import {ChangeDetectionStrategy,Component,computed,ElementRef,inject,signal,viewChild} from '@angular/core';
import {ActivatedRoute,RouterLink} from '@angular/router';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import * as copy from '../../../assets/i18n/conjugations.generated';
import {ConjugationPracticeIntent,ConjugationCategoryId} from '../../core/models/conjugations.model';
import {ConjugationPracticeService} from '../../core/services/conjugation-practice.service';
import {TranslationService} from '../../core/services/translation.service';
import {StudyTimer} from '../../shared/components/study-timer/study-timer';
import {ConjugationSelectionService} from '../../core/services/conjugation-selection.service';
import {conjugationAnswerInput} from './conjugation-kana-input';

@Component({selector:'app-conjugation-practice-page',imports:[RouterLink,StudyTimer],providers:[ConjugationPracticeService],host:{'(document:keydown)':'advanceWithSpace($event)'},templateUrl:'./conjugation-practice.page.html',styleUrl:'./conjugation-practice.page.scss',changeDetection:ChangeDetectionStrategy.OnPush})
export class ConjugationPracticePage {
  readonly i18n=inject(TranslationService);
  readonly practice=inject(ConjugationPracticeService);
  readonly selection=inject(ConjugationSelectionService);
  private readonly route=inject(ActivatedRoute);
  readonly isVerb=computed(()=>!!this.practice.question()?.id.startsWith('verb:'));
  readonly isCopula=computed(()=>!!this.practice.question()?.id.startsWith('copula:'));
  readonly ruleFamily=computed(()=>this.isCopula()?'copula-'+this.practice.question()?.register:this.isVerb()?'verb':this.practice.question()?.word.type);
  readonly registerKey=computed(()=>{
    const q=this.practice.question();
    return this.isCopula()?'conjugations.trainer.copula.'+q?.register:
      this.isVerb()&&['imperative','prohibitive'].includes(q!.transformation)?'conjugations.trainer.directRegister':
      this.isVerb()&&q?.transformation==='polite'?'conjugations.trainer.politeRegister':
      this.isVerb()&&q?.transformation==='te'?'conjugations.trainer.teRegister':'conjugations.trainer.register';
  });
  readonly answer=signal('');readonly ruleOpen=signal(false);private composing=false;private pendingNPair=false;
  private readonly input=viewChild<ElementRef<HTMLInputElement>>('answerInput');
  readonly attempts=computed(()=>{const s=this.practice.session();return s?s.index+(s.feedback?1:0):0;});
  readonly expected=computed(()=>{const a=this.practice.question()?.answers;return a?(a.kanji[0]??a.kana[0]??a.romaji[0]):'';});
  readonly resultMeaning=computed(()=>{
    const q=this.practice.question();if(!q)return '';
    const key=this.isCopula()?'conjugations.result.copula.'+q.transformation:this.isVerb()?'conjugations.result.verb.'+q.transformation:
      ['suki','kirai'].includes(q.word.id)?'conjugations.result.'+q.word.id+'.'+q.transformation:'conjugations.result.adjective.'+q.transformation;
    return this.i18n.t(key,{base:this.i18n.t(q.word.meaningKey)});
  });
  constructor(){this.i18n.useStudyCopy(copy);this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe(()=>this.start());}
  start():void {
    const params=this.route.snapshot.queryParamMap,mode=params.get('mode'),ids=params.getAll('categories');
    const intent:ConjugationPracticeIntent={mode:mode as 'single'|'mixed',categoryIds:(ids.length===1?ids[0].split(','):[]) as ConjugationCategoryId[],adjectiveTypes:{...this.selection.adjectiveTypes()}};
    this.practice.start(intent);this.resetInput();
  }
  composition(value:boolean):void{this.composing=value;}
  inputAnswer(event:Event):void{
    const input=event.target as HTMLInputElement,typed=event as InputEvent;
    if(this.composing||typed.isComposing||!this.selection.autoKana()||/^(delete|history)|Composition/.test(typed.inputType??'')){this.pendingNPair=false;this.answer.set(input.value);return;}
    const start=input.selectionStart??input.value.length,end=input.selectionEnd??start,direction=input.selectionDirection;
    this.pendingNPair=/nn$/i.test(input.value)||(this.pendingNPair&&input.value===this.answer());
    const converted=conjugationAnswerInput(input.value,this.practice.question()?.answers);
    input.value=converted.value;this.answer.set(converted.value);
    input.setSelectionRange(converted.offsets[start],converted.offsets[end],direction??'none');
  }
  enter(event:Event):void{if((event as KeyboardEvent).isComposing||this.composing)event.preventDefault();}
  submit(event:Event):void{event.preventDefault();if(!this.composing){if(this.selection.autoKana()){const raw=this.pendingNPair&&this.answer().endsWith('んn')?this.answer().slice(0,-1):this.answer();this.answer.set(conjugationAnswerInput(raw,this.practice.question()?.answers,true).value);}this.pendingNPair=false;this.practice.answer(this.answer());}}
  unknown():void{this.practice.answer('',true);}
  advanceWithSpace(rawEvent:Event):void {
    const event=rawEvent as KeyboardEvent;
    const session=this.practice.session();
    if(event.key!==' '||event.repeat||event.defaultPrevented||event.isComposing||this.composing||event.altKey||event.ctrlKey||event.metaKey||event.shiftKey||!session?.feedback||session.complete)return;
    const target=event.target;
    if(target instanceof HTMLElement){
      if(target.isContentEditable||target.closest('textarea,select,a,summary'))return;
      if(target instanceof HTMLInputElement&&!target.readOnly)return;
      const button=target.closest('button');if(button&&!button.classList.contains('next')&&!button.disabled)return;
    }
    event.preventDefault();this.next();
  }
  next():void{if(this.practice.next())this.resetInput();}
  private resetInput():void{this.answer.set('');this.ruleOpen.set(false);this.composing=false;this.pendingNPair=false;queueMicrotask(()=>this.input()?.nativeElement.focus());}
}
