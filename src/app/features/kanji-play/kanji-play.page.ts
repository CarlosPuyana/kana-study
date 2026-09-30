import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { KanjiQuestionType } from '../../core/models/kanji.model';
import { KanjiProgressService } from '../../core/services/kanji-progress.service';
import { KanjiSessionService } from '../../core/services/kanji-session.service';
import { TranslationService } from '../../core/services/translation.service';
import { DailyLearningService } from '../../core/services/daily-learning.service';
import { MedalBadge } from '../../shared/components/medal-badge/medal-badge';
@Component({selector:'app-kanji-play-page',imports:[MedalBadge],templateUrl:'./kanji-play.page.html',styleUrl:'./kanji-play.page.scss',changeDetection:ChangeDetectionStrategy.OnPush})
export class KanjiPlayPage {readonly daily=inject(DailyLearningService);readonly learning=inject(KanjiSessionService);readonly progress=inject(KanjiProgressService);readonly i18n=inject(TranslationService);readonly showExit=signal(false);private readonly router=inject(Router);options(){return this.learning.options(this.i18n.language())}promptKey(type:KanjiQuestionType){return `kanji.prompt.${type}`}statusKey(){const u=this.learning.currentUnit();if(!u)return'home.new';const p=this.progress.get(u.key);if(!p)return'home.new';return p.fsrs.state==='review'?'home.memorized':'home.pending'}requestExit(){const s=this.learning.session();if(!s||s.attempts===0||s.completedAt)this.exit();else this.showExit.set(true)}exit(){this.learning.clear();void this.router.navigateByUrl('/kanji')}anotherRound(){if(!this.learning.restart())void this.router.navigateByUrl('/kanji')}duration(){const s=this.learning.session();if(!s?.completedAt)return'0:00';const seconds=Math.max(0,Math.round((new Date(s.completedAt).getTime()-new Date(s.startedAt).getTime())/1000));return`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`}}
