import { StudyTimer } from '../../shared/components/study-timer/study-timer';
import {vocabularyRomaji} from '../../core/services/vocabulary-romaji';
import { ChangeDetectionStrategy,Component,DestroyRef,inject,signal } from '@angular/core';import { Router } from '@angular/router';import { VocabularyEntry,VocabularyQuestionType } from '../../core/models/vocabulary.model';import { VOCABULARY_N5 } from '../../data/vocabulary-n5.generated';import { TranslationService } from '../../core/services/translation.service';import { DailyLearningService } from '../../core/services/daily-learning.service';import { VocabularyProgressService } from '../../core/services/vocabulary-progress.service';import { VocabularySessionService } from '../../core/services/vocabulary-session.service';import { MedalBadge } from '../../shared/components/medal-badge/medal-badge';import { FuriganaText } from '../../shared/components/furigana-text/furigana-text';import { showFuriganaInOption,showFuriganaInPrompt } from '../../core/services/vocabulary-furigana-visibility';
@Component({selector:'app-vocabulary-play-page',imports:[StudyTimer,MedalBadge,FuriganaText],templateUrl:'./vocabulary-play.page.html',styleUrl:'./vocabulary-play.page.scss',changeDetection:ChangeDetectionStrategy.OnPush,host:{'(document:keydown)':'handleKey($event)' }})export class VocabularyPlayPage{
  constructor(){inject(DestroyRef).onDestroy(()=>this.learning.clear());}

readonly romaji=vocabularyRomaji;
handleKey(event:KeyboardEvent):void{
  const session=this.learning.session();
  if(event.defaultPrevented||event.ctrlKey||event.altKey||event.metaKey||!session||session.mode!=='self-assessment'||this.learning.completed()||!this.learning.currentEntry()||this.showExit()||this.learning.newlyUnlockedMedals().length)return;
  const target=event.target instanceof Element?event.target:document.activeElement;
  if(target?.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"])'))return;
  const space=event.code==='Space'||event.key===' ';
  if(event.repeat){if(space)event.preventDefault();return;}
  if(space&&!this.learning.revealed()){event.preventDefault();this.learning.reveal();return;}
  const rating=({'1':'again','2':'hard','3':'good'} as const)[event.key as '1'|'2'|'3'];
  if(this.learning.revealed()&&rating){event.preventDefault();this.learning.rate(rating);}
}
readonly daily=inject(DailyLearningService);readonly learning=inject(VocabularySessionService);readonly progress=inject(VocabularyProgressService);readonly i18n=inject(TranslationService);readonly showExit=signal(false);private readonly router=inject(Router);options(){return this.learning.options(this.i18n.language())}optionEntry(id:string):VocabularyEntry|null{return VOCABULARY_N5.find(entry=>entry.id===id)??null}showPromptFurigana(type:VocabularyQuestionType){return showFuriganaInPrompt(type)}showOptionFurigana(type:VocabularyQuestionType,correct:boolean){return showFuriganaInOption(type,Boolean(this.learning.feedback()),correct)}promptKey(t:VocabularyQuestionType){return`vocabulary.prompt.${t}`}statusKey(){const u=this.learning.currentUnit();if(!u)return'home.new';const p=this.progress.get(u.key);return!p?'home.new':p.fsrs.state==='review'?'home.memorized':'home.pending'}requestExit(){const s=this.learning.session();if(!s||s.attempts===0||s.completedAt)this.exit();else this.showExit.set(true)}exit(){this.learning.clear();void this.router.navigateByUrl('/vocabulary')}anotherRound(){if(!this.learning.restart())void this.router.navigateByUrl('/vocabulary')}duration():string{return this.learning.clock?.label()??'00:00';}}
