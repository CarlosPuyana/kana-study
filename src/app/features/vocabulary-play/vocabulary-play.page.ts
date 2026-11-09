import {VocabularyStudyAnswer} from './vocabulary-study-answer';
import {vocabularyReadingVariants} from '../../core/services/vocabulary-form-readings';
import {VocabularyLessonSummary} from '../vocabulary/components/vocabulary-lesson-summary';
import * as studyCopy from '../../../assets/i18n/deck-study.generated';
import {runStudyShortcut} from '../../shared/keyboard/study-shortcuts';
import { computed } from '@angular/core';
import { VocabularySessionRush } from '../../core/services/vocabulary-session-rush';
import { LearningSessionList, StudiedSessionContent } from '../../shared/components/learning-session-list/learning-session-list';
import { studiedSessionEntries } from '../../shared/components/learning-session-list/studied-session-entries';
import {ModalFocusDirective} from '../../shared/directives/modal-focus.directive';
import { StudyTimer } from '../../shared/components/study-timer/study-timer';
import {vocabularyRomaji} from '../../core/services/vocabulary-romaji';
import { ChangeDetectionStrategy,Component,DestroyRef,inject,signal } from '@angular/core';import { Router } from '@angular/router';import { VocabularyEntry,VocabularyQuestionType } from '../../core/models/vocabulary.model';import { VOCABULARY_N5 } from '../../data/vocabulary-n5.generated';import { TranslationService } from '../../core/services/translation.service';import { DailyLearningService } from '../../core/services/daily-learning.service';import { VocabularyProgressService } from '../../core/services/vocabulary-progress.service';import { VocabularySessionService } from '../../core/services/vocabulary-session.service';import { MedalBadge } from '../../shared/components/medal-badge/medal-badge';import { FuriganaText } from '../../shared/components/furigana-text/furigana-text';import { showFuriganaInOption,showFuriganaInPrompt } from '../../core/services/vocabulary-furigana-visibility';
@Component({selector:'app-vocabulary-play-page',imports:[VocabularyStudyAnswer,VocabularyLessonSummary,StudyTimer,MedalBadge,FuriganaText,ModalFocusDirective,LearningSessionList],templateUrl:'./vocabulary-play.page.html',styleUrl:'./vocabulary-play.page.scss',changeDetection:ChangeDetectionStrategy.OnPush,host:{'(document:keydown)':'handleKey($event)' }})export class VocabularyPlayPage{
  readonly readingVariants=vocabularyReadingVariants;
  readonly ratings=['again','hard','good'] as const;
  readonly studiedContent=computed<StudiedSessionContent>(()=>({kind:'vocabulary',entries:studiedSessionEntries(this.learning.session(),VOCABULARY_N5,unit=>unit.entryId),notes:this.learning.isPractice()?undefined:Object.fromEntries((this.learning.session()?.units??[]).flatMap(u=>{const item=this.learning.session()?.items.find(i=>i.studyKey===u.key);return item?.initialRating?[[u.entryId,this.i18n.t('vocabulary.daily.consolidation.wordResult',{rating:this.i18n.t(item.initialRating==='again'?'learn.no':item.initialRating==='hard'?'learn.almost':'learn.yes'),count:item.attempts})]]:[];}))}));
  private readonly rushPool=inject(VocabularySessionRush);
  constructor(){this.i18n.useStudyCopy?.(studyCopy);const active=this.progress.activeLesson?.();if(!this.learning.session()&&active)this.learning.start(active.session.mode);inject(DestroyRef).onDestroy(()=>this.learning.leave());}
  startSessionRush(difficult:boolean):void{
    const session=this.learning.session();if(!session?.completedAt)return;
    const units=session.units.filter(u=>session.items.some(i=>i.studyKey===u.key&&i.attempts>0&&(!difficult||i.needsPractice)));
    const token=this.rushPool.prepare(this.learning.sessionWords(difficult),units);if(!token)return;
    this.learning.retainResults();void this.router.navigate(['/vocabulary/rush'],{queryParams:{sessionRush:token}});
  }

readonly romaji=vocabularyRomaji;
handleKey(event:KeyboardEvent):void {
    if(!this.learning.session() || this.learning.session()!.mode!=='self-assessment' || this.learning.completed() ||
      !this.learning.currentEntry() || this.showExit() || this.learning.newlyUnlockedMedals().length)return;
    runStudyShortcut(event,this.learning.revealed()?null:()=>this.learning.reveal(),
      this.learning.revealed()?(['again','hard','good'] as const).map(rating=>()=>this.learning.rate(rating)):[]);
  }
readonly daily=inject(DailyLearningService);readonly learning=inject(VocabularySessionService);readonly progress=inject(VocabularyProgressService);readonly i18n=inject(TranslationService);readonly showExit=signal(false);private readonly router=inject(Router);options(){return this.learning.options(this.i18n.language())}optionEntry(id:string):VocabularyEntry|null{return VOCABULARY_N5.find(entry=>entry.id===id)??null}showPromptFurigana(type:VocabularyQuestionType){return showFuriganaInPrompt(type)}showOptionFurigana(type:VocabularyQuestionType,correct:boolean){return showFuriganaInOption(type,Boolean(this.learning.feedback()),correct)}promptKey(t:VocabularyQuestionType){return`vocabulary.prompt.${t}`}statusKey(){const u=this.learning.currentUnit();if(!u)return'home.new';const p=this.progress.get(u.key);return!p?'home.new':p.fsrs.state==='review'?'home.memorized':'home.pending'}requestExit(){const s=this.learning.session();if(!s||s.attempts===0||s.completedAt)this.exit();else this.showExit.set(true)}exit(){this.learning.clear();void this.router.navigateByUrl('/vocabulary')}anotherRound(){if(!this.learning.restart())void this.router.navigateByUrl('/vocabulary')}duration():string{return this.learning.clock?.label()??'00:00';}}
