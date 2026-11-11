import {DeckUndoPendingService} from '../../core/services/deck-undo-pending.service';
import * as studyCopy from '../../../assets/i18n/deck-study.generated';
import { DeckLearningSummary } from '../../shared/components/deck-learning-summary/deck-learning-summary';
import { deckLearningSummary } from '../../core/services/deck-learning-presentation';
import {PublicDeckImage} from '../../shared/components/public-deck-image/public-deck-image';
import {DeckIntensivePractice} from './deck-intensive-practice';
import {DeckDayPresentation, deckDayCounts, deckDayDifficulties} from '../../core/services/deck-day-presentation';
import {KaishiCardMedia} from '../../shared/components/kaishi-card-media/kaishi-card-media';
import {LocalDeckNotice} from '../../shared/components/local-deck-notice/local-deck-notice';
import { createStudyClock } from '../../core/services/study-clock';
import { StudyTimer } from '../../shared/components/study-timer/study-timer';
import { ChangeDetectionStrategy, Component, ElementRef, afterRenderEffect, viewChild, computed, effect, inject, untracked, OnDestroy, OnInit, PendingTasks, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DeckMixedCursor, DeckQueueChoice, DeckQueueSnapshot, DeckRating, DeckReviewEvent } from '../../core/models/deck-study.model';
import { DeckSchedulePreview,deckPreviewExpired } from '../../core/services/deck-scheduler.service';
import { deckContentLanguage } from '../../core/services/deck-content-language';
import { DeckStudyService } from '../../core/services/deck-study.service';
import { formatStudyInterval, getLocalStudyDayKey, nextLocalStudyDayStart } from '../../core/services/deck-study-time';
import { TranslationService } from '../../core/services/translation.service';
import { BUILTIN_DECK_CONTENT } from '../../core/services/builtin-deck-content';

import { createDeckRouteResource, entryMeaning } from '../../core/services/deck-route-resource';
import { isCustomEntry, DeckStudyEntryView } from '../../core/models/deck-catalog.model';
import { FuriganaText } from '../../shared/components/furigana-text/furigana-text';
import { DeckSentenceText } from '../anki-cards/components/deck-sentence-text/deck-sentence-text';

@Component({
  selector: 'app-anki-study-page',
  imports: [DeckLearningSummary,PublicDeckImage,DeckIntensivePractice,KaishiCardMedia,LocalDeckNotice,StudyTimer, RouterLink, FuriganaText, DeckSentenceText],
  templateUrl: './anki-study.page.html',
  styleUrl: './anki-study.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown)': 'handleKey($event)', '(window:focus)': 'refreshAvailability()', '(document:visibilitychange)': 'refreshAvailability()' },
})
export class AnkiStudyPage implements OnInit, OnDestroy {
  private readonly tasks = inject(PendingTasks);
  private readonly study = inject(DeckStudyService);
  private readonly undoPendingStore=inject(DeckUndoPendingService);
  private readonly dayPresentation = inject(DeckDayPresentation);
  readonly dayEvents = signal<readonly DeckReviewEvent[]>([]);
  readonly presentationNow = signal(new Date());
  readonly difficulties = computed(() => deckDayDifficulties(this.dayEvents(),this.deck?.id??'',this.presentationNow()));
  readonly summary = computed(() => deckLearningSummary(this.resource.content?.index ?? [], this.snapshot()?.progress ?? [], this.dayEvents(), this.deck?.id ?? '', this.presentationNow()));
  readonly reinforcement = computed(() => this.difficulties().filter(row => !!this.summaryEntry(row.entryId)));
  readonly selected = signal<readonly string[]>([]);
  readonly practiceEntries = signal<readonly DeckStudyEntryView[]|null>(null);
  private readonly practiceStart=viewChild<ElementRef<HTMLButtonElement>>('practiceStart');
  private readonly returnToSummary=signal(false);
  closePractice():void{this.practiceEntries.set(null);this.returnToSummary.set(true);}
  toggleSelected(id:string):void{this.selected.update(ids=>ids.includes(id)?ids.filter(x=>x!==id):[...ids,id]);}
  startPractice():void{const entries=this.difficulties().filter(row=>this.selected().includes(row.entryId)).map(row=>this.summaryEntry(row.entryId)).filter((e):e is DeckStudyEntryView=>e!==null);if(!entries.length)return;this.clock.pause();this.practiceEntries.set(entries);}

  startAllPractice():void{
    const entries=[...new Set(this.dayEvents().filter(e=>getLocalStudyDayKey(new Date(e.reviewedAt))===getLocalStudyDayKey(new Date())).map(e=>e.entryId))].map(id=>this.summaryEntry(id)).filter((e):e is DeckStudyEntryView=>e!==null);
    if(entries.length){this.clock.pause();this.practiceEntries.set(entries);}
  }
  async finishToday():Promise<void>{
    if(!this.deck||!this.resource.content||this.saving()||this.retryRating()||this.pendingUndo())return;
    const resource=this.resource.state();this.finishAt??=new Date();this.pendingFinish.set(true);this.saving.set(true);this.error.set(false);this.clock.pause();
    try{await this.study.completeSession(this.deck,this.resource.content.index,this.finishAt,true);
      if(resource!==this.resource.state()||this.destroyed)return;
      this.finishAt=null;this.pendingFinish.set(false);this.setCurrent(null);await this.loadNext();
    }catch{this.error.set(true);}finally{this.saving.set(false);}
  }

  summaryEntry(id:string):DeckStudyEntryView|null{return this.resource.content?.entry(id)??null;}
  readonly dayCounts = computed(() => this.snapshot() ? deckDayCounts(this.snapshot()!, this.dayEvents(), this.deck?.id ?? '', this.presentationNow(), this.choice()) : {new:0,repeat:0,review:0});

  private cursor: DeckMixedCursor = { debt: 0 };
  readonly clock = createStudyClock();
  private destroyed = false;
  private timerId: ReturnType<typeof setInterval> | null = null;
  private day = getLocalStudyDayKey(new Date());
  private availabilityGeneration=0;

  readonly i18n = inject(TranslationService);
  readonly resource = createDeckRouteResource(BUILTIN_DECK_CONTENT);
  get deck() { return this.resource.deck; }
  readonly isCustom = isCustomEntry;
  title(): string { return this.resource.title(this.i18n); }
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal(false);
  private finishAt:Date|null=null;
  readonly pendingFinish=signal(false);
  readonly pendingUndo=signal(false);
  private lastEventResource:unknown;
  readonly retryRating=signal<DeckRating|null>(null);
  readonly previewChanged=signal(false);
  readonly queueCounts=computed(()=>{const s=this.snapshot();return {new:s?.newAvailable??0,learning:s?.learningEntries.filter(p=>p.card.state===1).length??0,review:s?.reviewDue??0,relearning:s?.learningEntries.filter(p=>p.card.state===3).length??0};});
  retrySave():void{if(this.pendingUndo()){void this.undo();return;}if(this.pendingFinish()){void this.finishToday();return;}const rating=this.retryRating();if(rating)void this.rate(rating);else this.refreshAvailability();}
  readonly snapshot = signal<DeckQueueSnapshot | null>(null);
  readonly choice = signal<DeckQueueChoice | null>(null);
  readonly entry = signal<DeckStudyEntryView | null>(null);
  readonly revealed = signal(false);
  readonly translationOpen = signal(false);
  readonly preview = signal<DeckSchedulePreview | null>(null);
  readonly lastEvent = signal<DeckReviewEvent | null>(null);
  readonly canUndoClosed=computed(()=>this.snapshot()?.closureOrigin==='automatic'&&this.snapshot()?.closedByReviewId===this.lastEvent()?.id&&!!this.lastEvent()&&getLocalStudyDayKey(new Date(this.lastEvent()!.reviewedAt))===getLocalStudyDayKey(new Date()));
  private undoReopen=false;
  readonly elapsedSeconds = this.clock.seconds;
  readonly elapsedLabel = this.clock.label;

  private routeKey: string | null = null;
  private choiceState: unknown;
  private lastEventOwner: string | null = null;
  constructor() {
    this.i18n.useStudyCopy?.(studyCopy);
    afterRenderEffect(()=>{const target=this.practiceStart();if(this.returnToSummary()&&target){this.returnToSummary.set(false);target.nativeElement.focus({preventScroll:true});}});
    effect(()=>{const rows=this.difficulties();untracked(()=>this.selected.set(rows.slice(0,10).map(row=>row.entryId)));});
    effect(() => {
      const state=this.resource.state();
      const key=this.resource.catalog.owner()+':'+this.resource.catalog.epoch()+':'+(this.deck?.id??'');
      if(this.routeKey!==null&&this.routeKey!==key) untracked(() => {
        this.finishAt=null;this.pendingFinish.set(false);this.pendingUndo.set(false);this.retryRating.set(null);this.lastEvent.set(null);this.choice.set(null);this.entry.set(null);this.snapshot.set(null);
        this.returnToSummary.set(false);this.practiceEntries.set(null);this.dayEvents.set([]);this.cursor={debt:0};this.clock.discardAppearance();this.clock.pause();
        if(state.status==='ready')void this.tasks.run(()=>this.loadNext());
      });
      this.routeKey=key;
    });
  }

  ngOnInit(): void {
    void this.tasks.run(() => this.loadNext());
  }

  ngOnDestroy(): void {
    this.destroyed = true; ++this.availabilityGeneration; this.clock.detach();
    if (this.timerId) clearTimeout(this.timerId);
  }

  refreshAvailability(): void {
    if(document.hidden){this.clock.pause();if(this.timerId)clearTimeout(this.timerId);return;}
    if(this.practiceEntries())return;
    if(this.retryRating()||this.pendingFinish()||this.pendingUndo())return;
    if (this.saving() || this.loading() || document.hidden) return;
    this.day = getLocalStudyDayKey(new Date());
    // A foreground/day refresh may update counts, never replace a card or its
    // frozen preview while the user is answering it.
    if(this.choice()){
      this.clock.resume();void this.refreshCounts();return;
    }
    void this.loadNext(true);
  }

  private async refreshCounts():Promise<void>{
    if(!this.deck||!this.resource.content)return;
    const resource=this.resource.state(),generation=++this.availabilityGeneration;
    try{const snapshot=await this.study.snapshot(this.deck,this.resource.content.index);
      const events=await this.dayPresentation.events(this.deck);
      if(!this.destroyed&&resource===this.resource.state()&&generation===this.availabilityGeneration){this.snapshot.set(snapshot);if(snapshot.completedToday)this.setCurrent(null);this.dayEvents.set(events);this.presentationNow.set(new Date());this.error.set(false);this.scheduleAvailability();}
    }catch{if(!this.destroyed&&generation===this.availabilityGeneration)this.error.set(true);}
  }

  reveal(): void {
    if(this.pendingUndo())return;
    if (this.choiceState!==this.resource.state() || !this.deck || !this.choice() || this.revealed() || this.loading() || this.saving()) return;
    this.preview.set(this.study.preview(this.deck, this.choice()!));
    this.translationOpen.set(false);
    this.revealed.set(true);
  }

  async rate(rating: DeckRating): Promise<void> {
    if(this.pendingUndo()||this.pendingFinish()||this.snapshot()?.completedToday)return;
    if(this.retryRating()&&this.retryRating()!==rating)return;
    if (this.choiceState!==this.resource.state() || !this.deck || !this.choice() || !this.preview() || !this.revealed() || this.saving() || this.loading()) return;
    if(!this.retryRating()&&deckPreviewExpired(this.preview()!,new Date())){this.preview.set(this.study.preview(this.deck,this.choice()!));this.previewChanged.set(true);return;}
    const resourceState=this.resource.state(),owner=this.resource.catalog.owner();
    ++this.availabilityGeneration;this.retryRating.set(rating);this.saving.set(true); this.error.set(false); this.clock.pause();
    try {
      const event = await this.study.rate(
        this.deck, this.choice()!, this.preview()!, rating, this.clock.appearanceMilliseconds(),
      );
      if(resourceState!==this.resource.state()||owner!==this.resource.catalog.owner())return;
      this.clock.commitAppearance(); this.lastEvent.set(event);this.lastEventOwner=owner;this.lastEventResource=resourceState;
      this.retryRating.set(null);this.choice.set(null); this.revealed.set(false);
      await this.loadNext();
    } catch { this.error.set(true); }
    finally { this.saving.set(false); if (!this.destroyed && this.choice()&&!this.retryRating()) this.clock.resume(); }
  }

  async undo(): Promise<void> {
    const event = this.lastEvent();
    if (this.lastEventResource!==this.resource.state() || !event || getLocalStudyDayKey(new Date(event.reviewedAt))!==getLocalStudyDayKey(new Date()) || !this.deck || event.deckId!==this.deck.id || this.lastEventOwner!==this.resource.catalog.owner() || this.saving()||this.retryRating()||(this.snapshot()?.completedToday&&!this.canUndoClosed())) return;
    const resourceState=this.resource.state(),owner=this.resource.catalog.owner();
    ++this.availabilityGeneration;this.undoReopen ||= !!this.snapshot()?.completedToday;this.pendingUndo.set(true);
    this.saving.set(true); this.error.set(false); this.clock.pause();
    try {
      this.undoPendingStore.begin(event,this.undoReopen);
      await this.study.undo(event,this.undoReopen);
      if(resourceState!==this.resource.state()||owner!==this.resource.catalog.owner())return;
      const snapshot = await this.study.snapshot(this.deck, this.resource.content!.index);
      const events=await this.dayPresentation.events(this.deck);
      if(this.destroyed||resourceState!==this.resource.state()||owner!==this.resource.catalog.owner())return;
      const restored=snapshot.progress.find(p=>p.entryId===event.entryId)?.card??null;
      if(snapshot.completedToday)throw Error('Closed session cannot resume');
      if(JSON.stringify(restored)!==JSON.stringify(event.cardBefore))throw Error('Undo state no longer matches');
      this.undoPendingStore.clear(event);
      this.clock.discardAppearance();this.clock.undo(event.elapsedAnswerMs);
      this.snapshot.set(snapshot);this.dayEvents.set(events);this.presentationNow.set(new Date());
      const progress = snapshot.progress.find(item => item.entryId === event.entryId) ?? null;
      this.setCurrent(this.study.restoreAfterUndo(snapshot, this.deck, {
        entryId: event.entryId,
        kind: progress ? (progress.card.state === 2 ? 'review' : 'learning') : 'new',
        progress,
      }));
      this.lastEvent.set(null);this.pendingUndo.set(false);this.undoReopen=false;
    } catch { this.error.set(true); }
    finally { this.saving.set(false); if (!this.destroyed && this.choice()&&!this.pendingUndo()) this.clock.resume(); }
  }

  intervalLabel(rating: DeckRating): string {
    const preview = this.preview();
    if (!preview) return '';
    const branch = rating === 'again' ? preview.again : preview.good;
    const formatted = formatStudyInterval(branch.card.state===2&&branch.card.scheduledDays>0?branch.card.scheduledDays*86_400_000:Math.max(0, branch.card.due - preview.generatedAt));
    return this.i18n.t(`anki.interval.${formatted.unit}`, formatted.value === null ? undefined : { count: formatted.value });
  }

  meaning(entry: DeckStudyEntryView): string { return entryMeaning(entry, this.i18n.language()); }
  meaningForReinforcement(entry: DeckStudyEntryView): string { return entryMeaning(entry, 'es'); }
  customMeaning(entry: DeckStudyEntryView): string {
    if (!isCustomEntry(entry)) return this.meaning(entry);
    const gloss = entry.glosses.find(g => g.language === this.i18n.language()) ?? entry.glosses[0];
    return gloss ? `${gloss.text} (${gloss.language.toUpperCase()})` : '';
  }
  sentenceMeaning(entry: DeckStudyEntryView): string { return isCustomEntry(entry) ? '' : entry.sentenceMeaning[deckContentLanguage(this.i18n.language())]; }
  note(entry: DeckStudyEntryView): string | null { return isCustomEntry(entry) ? null : entry.notes[deckContentLanguage(this.i18n.language())] ?? null; }

  endTitleKey(snapshot: DeckQueueSnapshot): string {
    if (snapshot.completedToday) return 'anki.daily.completed';
    if (snapshot.nextLearningDue) return 'anki.studyPage.finishedForNow';
    if (snapshot.remainingUnseen && snapshot.newAvailable === 0) return 'anki.studyPage.dailyLimit';
    if (snapshot.progress.length >= (this.deck?.cardCount ?? Infinity)) return 'anki.studyPage.allCaughtUp';
    return 'anki.studyPage.upToDate';
  }

  nextDueLabel(snapshot: DeckQueueSnapshot): string | null {
    if (!snapshot.nextDue&&!snapshot.completedToday) return null;
    return this.i18n.t(snapshot.completedToday?'anki.day.nextSession':'anki.scheduler.nextDueAt',{date:new Intl.DateTimeFormat(this.i18n.language(),{timeZone:'Europe/Madrid',dateStyle:'short',timeStyle:'short'}).format(new Date(snapshot.completedToday?(snapshot.nextRefreshAt??nextLocalStudyDayStart(new Date())):snapshot.nextDue!))});
  }

  handleKey(event: KeyboardEvent): void {
    if (this.practiceEntries())return;
    if (event.repeat || event.isComposing || event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) return;
    if (event.composedPath().some(node => node instanceof Element && node.matches('button,a,input,textarea,select,summary,[contenteditable]:not([contenteditable=false]),[role=button],[role=slider],[role=checkbox]'))) return;
    if (event.code === 'Space' && !this.revealed() && this.choice()) { event.preventDefault(); this.reveal(); }
    else if (this.revealed() && event.key === '1') { event.preventDefault(); void this.rate('again'); }
    else if (this.revealed() && event.key === '2') { event.preventDefault(); void this.rate('good'); }
  }

  private async loadNext(preserveAppearance = false): Promise<void> {
    const generation=++this.availabilityGeneration;
    this.clock.pause();this.loading.set(true);
    if(this.resource.state().status==='loading') await this.resource.ready();
    if (!this.deck) { this.error.set(this.resource.state().status === 'error'); this.loading.set(false); return; }
    this.error.set(false);
    try {
      const loaded=this.resource.state();
      const pending=this.undoPendingStore.read(this.deck.id);
      if(pending){this.lastEvent.set(pending.event);this.lastEventOwner=this.resource.catalog.owner();this.lastEventResource=loaded;this.undoReopen=pending.reopen;this.pendingUndo.set(true);this.error.set(true);return;}
      let snapshot = await this.study.snapshot(this.deck, this.resource.content!.index);
      if(!snapshot.completedToday&&!snapshot.startedToday){await this.study.startSession(this.deck);snapshot=await this.study.snapshot(this.deck,this.resource.content!.index);}
      if(this.resource.state()!==loaded||generation!==this.availabilityGeneration)return;
      const decision = snapshot.completedToday ? { choice: null, cursor: this.cursor } : this.study.chooseNext(snapshot, this.deck, this.cursor);
      const event = this.lastEvent();
      if (!decision.choice && !snapshot.completedToday ) {
        await this.study.completeSession(this.deck, this.resource.content!.index);
        snapshot = await this.study.snapshot(this.deck, this.resource.content!.index);
      }
      const events=await this.dayPresentation.events(this.deck);
      if (this.destroyed || this.resource.state()!==loaded||generation!==this.availabilityGeneration) return;
      this.cursor = decision.cursor;
      this.snapshot.set(snapshot);this.dayEvents.set(events);this.presentationNow.set(new Date());
      if(snapshot.completedToday&&snapshot.closureOrigin==='automatic'&&!this.lastEvent()){
        const last=events.find(e=>e.id===snapshot.closedByReviewId);
        if(last){this.lastEvent.set(last);this.lastEventOwner=this.resource.catalog.owner();this.lastEventResource=loaded;}
      }
      if (preserveAppearance && decision.choice?.entryId === this.choice()?.entryId && this.choice()) this.clock.resume();
      else this.setCurrent(decision.choice);
    } catch { this.error.set(true); }
    finally { this.loading.set(false);this.scheduleAvailability(); }
  }

  private scheduleAvailability():void{
    if(this.timerId)clearTimeout(this.timerId);
    const at=this.snapshot()?.nextRefreshAt;
    if(!this.destroyed&&!document.hidden&&!this.error()&&at!=null)this.timerId=setTimeout(()=>this.refreshAvailability(),Math.max(1,at-Date.now()));
  }

  private setCurrent(choice: DeckQueueChoice | null): void {
    this.previewChanged.set(false);
    this.retryRating.set(null);
    this.choiceState=this.resource.state();
    this.choice.set(choice);
    this.entry.set(choice ? this.resource.content?.entry(choice.entryId) ?? null : null);
    this.revealed.set(false); this.translationOpen.set(false); this.preview.set(null);
    if (choice && this.entry()) this.clock.startAppearance();
    else { this.clock.discardAppearance(); this.clock.pause(); }
  }
}
