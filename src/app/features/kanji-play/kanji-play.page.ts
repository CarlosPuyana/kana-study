import {runStudyShortcut} from '../../shared/keyboard/study-shortcuts';
import {ModalFocusDirective} from '../../shared/directives/modal-focus.directive';
import {LearningWritingPrompt} from '../../shared/components/learning-writing-prompt/learning-writing-prompt';
import { StudyTimer } from '../../shared/components/study-timer/study-timer';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal, viewChild } from '@angular/core';
import { LearningSessionList, StudiedSessionContent } from '../../shared/components/learning-session-list/learning-session-list';
import { studiedSessionEntries } from '../../shared/components/learning-session-list/studied-session-entries';
import { KANJI_N5 } from '../../data/kanji-n5.generated';
import { Router } from '@angular/router';
import { KanjiQuestionType } from '../../core/models/kanji.model';
import { KanjiProgressService } from '../../core/services/kanji-progress.service';
import { KanjiSessionService } from '../../core/services/kanji-session.service';
import { TranslationService } from '../../core/services/translation.service';
import { DailyLearningService } from '../../core/services/daily-learning.service';
import { MedalBadge } from '../../shared/components/medal-badge/medal-badge';
@Component({selector:'app-kanji-play-page',imports:[StudyTimer,MedalBadge,LearningWritingPrompt,ModalFocusDirective,LearningSessionList],templateUrl:'./kanji-play.page.html',styleUrl:'./kanji-play.page.scss',changeDetection:ChangeDetectionStrategy.OnPush,host:{'(document:keydown)':'handleKey($event)'}})
export class KanjiPlayPage {
  readonly studiedContent=computed<StudiedSessionContent>(()=>({kind:'kanji',entries:studiedSessionEntries(this.learning.session(),KANJI_N5,unit=>unit.kanjiId)}));
  private readonly writingPrompt=viewChild(LearningWritingPrompt);
  readonly drawingOptionsKey=signal('');
  writingKey():string {return `${this.learning.session()?.id}:${this.learning.currentUnit()?.key}:${this.learning.currentItem()?.appearances}`;}
  writingOptionsVisible():boolean {return this.learning.currentUnit()?.questionType!=='meaning-to-kanji' || this.drawingOptionsKey()===this.writingKey();}

  constructor(){inject(DestroyRef).onDestroy(()=>this.learning.clear());}
readonly daily=inject(DailyLearningService);readonly learning=inject(KanjiSessionService);readonly progress=inject(KanjiProgressService);readonly i18n=inject(TranslationService);readonly showExit=signal(false);private readonly router=inject(Router);options(){return this.learning.options(this.i18n.language())}promptKey(type:KanjiQuestionType){return `kanji.prompt.${type}`}statusKey(){const u=this.learning.currentUnit();if(!u)return'home.new';const p=this.progress.get(u.key);if(!p)return'home.new';return p.fsrs.state==='review'?'home.memorized':'home.pending'}requestExit(){const s=this.learning.session();if(!s||s.attempts===0||s.completedAt)this.exit();else this.showExit.set(true)}exit(){this.learning.clear();void this.router.navigateByUrl('/kanji')}anotherRound(){if(!this.learning.restart())void this.router.navigateByUrl('/kanji')}duration():string{return this.learning.clock?.label()??'00:00';}
handleKey(event:KeyboardEvent):void {
    if(!this.learning.session() || this.learning.session()!.mode!=='self-assessment' || this.learning.completed() ||
      !this.learning.currentKanji() || this.showExit() || this.learning.newlyUnlockedMedals().length || this.writingPrompt()?.keyboardBusy())return;
    runStudyShortcut(event,this.learning.revealed()?null:()=>this.learning.reveal(),
      this.learning.revealed()?(['again','hard','good'] as const).map(rating=>()=>this.learning.rate(rating)):[]);
  }
}
