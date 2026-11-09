import {ChangeDetectionStrategy,Component,computed,ElementRef,inject,signal,viewChild} from '@angular/core';
import {ActivatedRoute,RouterLink} from '@angular/router';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import * as copy from '../../../assets/i18n/conjugations.generated';
import {ConjugationPracticeIntent,ConjugationCategoryId} from '../../core/models/conjugations.model';
import {ConjugationPracticeService} from '../../core/services/conjugation-practice.service';
import {TranslationService} from '../../core/services/translation.service';

@Component({selector:'app-conjugation-practice-page',imports:[RouterLink],providers:[ConjugationPracticeService],host:{'(document:keydown)':'advanceWithSpace($event)'},templateUrl:'./conjugation-practice.page.html',styleUrl:'./conjugation-practice.page.scss',changeDetection:ChangeDetectionStrategy.OnPush})
export class ConjugationPracticePage {
  readonly i18n=inject(TranslationService);
  readonly practice=inject(ConjugationPracticeService);
  private readonly route=inject(ActivatedRoute);
  readonly isVerb=computed(()=>!!this.practice.question()?.id.startsWith('verb:'));
  readonly ruleFamily=computed(()=>this.isVerb()?'verb':this.practice.question()?.word.type);
  readonly answer=signal('');readonly ruleOpen=signal(false);private composing=false;
  private readonly input=viewChild<ElementRef<HTMLInputElement>>('answerInput');
  readonly attempts=computed(()=>{const s=this.practice.session();return s?s.index+(s.feedback?1:0):0;});
  readonly expected=computed(()=>{const a=this.practice.question()?.answers;return a?(a.kanji[0]??a.kana[0]??a.romaji[0]):'';});
  constructor(){this.i18n.useStudyCopy(copy);this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe(()=>this.start());}
  start():void {
    const params=this.route.snapshot.queryParamMap,mode=params.get('mode'),ids=params.getAll('categories');
    const intent:ConjugationPracticeIntent={mode:mode as 'single'|'mixed',categoryIds:(ids.length===1?ids[0].split(','):[]) as ConjugationCategoryId[]};
    this.practice.start(intent);this.resetInput();
  }
  composition(value:boolean):void{this.composing=value;}
  enter(event:Event):void{if((event as KeyboardEvent).isComposing||this.composing)event.preventDefault();}
  submit(event:Event):void{event.preventDefault();if(!this.composing)this.practice.answer(this.answer());}
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
  private resetInput():void{this.answer.set('');this.ruleOpen.set(false);this.composing=false;queueMicrotask(()=>this.input()?.nativeElement.focus());}
}
