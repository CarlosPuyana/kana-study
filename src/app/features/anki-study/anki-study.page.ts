import { createStudyClock } from '../../core/services/study-clock';
import { StudyTimer } from '../../shared/components/study-timer/study-timer';
import { ChangeDetectionStrategy, Component, effect, inject, untracked, OnDestroy, OnInit, PendingTasks, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DeckMixedCursor, DeckQueueChoice, DeckQueueSnapshot, DeckRating, DeckReviewEvent } from '../../core/models/deck-study.model';
import { DeckSchedulePreview } from '../../core/services/deck-scheduler.service';
import { deckContentLanguage } from '../../core/services/deck-content-language';
import { DeckStudyService } from '../../core/services/deck-study.service';
import { formatStudyInterval, getLocalStudyDayKey } from '../../core/services/deck-study-time';
import { TranslationService } from '../../core/services/translation.service';
import { BUILTIN_DECK_CONTENT } from '../../core/services/builtin-deck-content';

import { createDeckRouteResource, entryMeaning } from '../../core/services/deck-route-resource';
import { isCustomEntry, DeckStudyEntryView } from '../../core/models/deck-catalog.model';
import { FuriganaText } from '../../shared/components/furigana-text/furigana-text';
import { DeckSentenceText } from '../anki-cards/components/deck-sentence-text/deck-sentence-text';

@Component({
  selector: 'app-anki-study-page',
  imports: [StudyTimer, RouterLink, FuriganaText, DeckSentenceText],
  templateUrl: './anki-study.page.html',
  styleUrl: './anki-study.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown)': 'handleKey($event)', '(window:focus)': 'refreshAvailability()', '(document:visibilitychange)': 'refreshAvailability()' },
})
export class AnkiStudyPage implements OnInit, OnDestroy {
  private readonly tasks = inject(PendingTasks);
  private readonly study = inject(DeckStudyService);

  private cursor: DeckMixedCursor = { debt: 0 };
  readonly clock = createStudyClock();
  private destroyed = false;
  private timerId: ReturnType<typeof setInterval> | null = null;
  private day = getLocalStudyDayKey(new Date());

  readonly i18n = inject(TranslationService);
  readonly resource = createDeckRouteResource(BUILTIN_DECK_CONTENT);
  get deck() { return this.resource.deck; }
  readonly isCustom = isCustomEntry;
  title(): string { return this.resource.title(this.i18n); }
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal(false);
  readonly snapshot = signal<DeckQueueSnapshot | null>(null);
  readonly choice = signal<DeckQueueChoice | null>(null);
  readonly entry = signal<DeckStudyEntryView | null>(null);
  readonly revealed = signal(false);
  readonly translationOpen = signal(false);
  readonly preview = signal<DeckSchedulePreview | null>(null);
  readonly lastEvent = signal<DeckReviewEvent | null>(null);
  readonly elapsedSeconds = this.clock.seconds;
  readonly elapsedLabel = this.clock.label;

  private routeKey: string | null = null;
  private choiceState: unknown;
  private lastEventOwner: string | null = null;
  constructor() {
    effect(() => {
      const state=this.resource.state();
      const key=this.resource.catalog.owner()+':'+(this.deck?.id??'');
      if(this.routeKey!==null&&this.routeKey!==key) untracked(() => {
        this.lastEvent.set(null);this.choice.set(null);this.entry.set(null);this.snapshot.set(null);
        this.cursor={debt:0};this.clock.discardAppearance();this.clock.pause();
        if(state.status==='ready')void this.tasks.run(()=>this.loadNext());
      });
      this.routeKey=key;
    });
  }

  ngOnInit(): void {
    this.timerId = setInterval(() => {
      if (getLocalStudyDayKey(new Date()) !== this.day) this.refreshAvailability();
    }, 1000);
    void this.tasks.run(() => this.loadNext());
  }

  ngOnDestroy(): void {
    this.destroyed = true; this.clock.detach();
    if (this.timerId) clearInterval(this.timerId);
  }

  refreshAvailability(): void {
    if (this.saving() || this.loading() || document.hidden) return;
    this.clock.pause();
    this.day = getLocalStudyDayKey(new Date());
    void this.loadNext(true);
  }

  reveal(): void {
    if (this.choiceState!==this.resource.state() || !this.deck || !this.choice() || this.revealed() || this.loading() || this.saving()) return;
    this.preview.set(this.study.preview(this.deck, this.choice()!));
    this.translationOpen.set(false);
    this.revealed.set(true);
  }

  async rate(rating: DeckRating): Promise<void> {
    if (this.choiceState!==this.resource.state() || !this.deck || !this.choice() || !this.preview() || !this.revealed() || this.saving() || this.loading()) return;
    const resourceState=this.resource.state(),owner=this.resource.catalog.owner();
    this.saving.set(true); this.error.set(false); this.clock.pause();
    try {
      const event = await this.study.rate(
        this.deck, this.choice()!, this.preview()!, rating, this.clock.appearanceMilliseconds(),
      );
      if(resourceState!==this.resource.state()||owner!==this.resource.catalog.owner())return;
      this.clock.commitAppearance(); this.lastEvent.set(event);this.lastEventOwner=owner;
      this.choice.set(null); this.revealed.set(false);
      await this.loadNext();
    } catch { this.error.set(true); }
    finally { this.saving.set(false); if (!this.destroyed && this.choice()) this.clock.resume(); }
  }

  async undo(): Promise<void> {
    const event = this.lastEvent();
    if (!event || !this.deck || event.deckId!==this.deck.id || this.lastEventOwner!==this.resource.catalog.owner() || this.saving() || this.snapshot()?.completedToday) return;
    const resourceState=this.resource.state(),owner=this.resource.catalog.owner();
    this.saving.set(true); this.error.set(false); this.clock.pause();
    try {
      await this.study.undo(event);
      if(resourceState!==this.resource.state()||owner!==this.resource.catalog.owner())return;
      this.clock.discardAppearance(); this.clock.undo(event.elapsedAnswerMs); this.lastEvent.set(null);
      this.choice.set(null);
      const snapshot = await this.study.snapshot(this.deck, this.resource.content!.index);
      this.snapshot.set(snapshot);
      const progress = snapshot.progress.find(item => item.entryId === event.entryId) ?? null;
      this.setCurrent({
        entryId: event.entryId,
        kind: progress ? (progress.card.state === 2 ? 'review' : 'learning') : 'new',
        progress,
      });
      this.lastEvent.set(null);
    } catch { this.error.set(true); }
    finally { this.saving.set(false); if (!this.destroyed && this.choice()) this.clock.resume(); }
  }

  intervalLabel(rating: DeckRating): string {
    const preview = this.preview();
    if (!preview) return '';
    const branch = rating === 'again' ? preview.again : preview.good;
    const formatted = formatStudyInterval(Math.max(0, branch.card.due - preview.generatedAt));
    return this.i18n.t(`anki.interval.${formatted.unit}`, formatted.value === null ? undefined : { count: formatted.value });
  }

  meaning(entry: DeckStudyEntryView): string { return entryMeaning(entry, this.i18n.language()); }
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
    if (!snapshot.nextDue) return null;
    const formatted = formatStudyInterval(Math.max(0, snapshot.nextDue - Date.now()));
    return this.i18n.t('anki.studyPage.nextIn', {
      interval: this.i18n.t(`anki.interval.${formatted.unit}`, formatted.value === null ? undefined : { count: formatted.value }),
    });
  }

  handleKey(event: KeyboardEvent): void {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.repeat) return;
    if (event.code === 'Space' && !this.revealed() && this.choice()) { event.preventDefault(); this.reveal(); }
    else if (this.revealed() && event.key === '1') { event.preventDefault(); void this.rate('again'); }
    else if (this.revealed() && event.key === '2') { event.preventDefault(); void this.rate('good'); }
  }

  private async loadNext(preserveAppearance = false): Promise<void> {
    this.clock.pause();this.loading.set(true);
    if(this.resource.state().status==='loading') await this.resource.ready();
    if (!this.deck) { this.error.set(this.resource.state().status === 'error'); this.loading.set(false); return; }
    this.error.set(false);
    try {
      const loaded=this.resource.state();
      let snapshot = await this.study.snapshot(this.deck, this.resource.content!.index);
      if(this.resource.state()!==loaded)return;
      const decision = snapshot.completedToday ? { choice: null, cursor: this.cursor } : this.study.chooseNext(snapshot, this.deck, this.cursor);
      const event = this.lastEvent();
      if (!decision.choice && !snapshot.completedToday && event && getLocalStudyDayKey(new Date(event.reviewedAt)) === getLocalStudyDayKey(new Date())) {
        await this.study.completeSession(this.deck, this.resource.content!.index);
        snapshot = await this.study.snapshot(this.deck, this.resource.content!.index);
      }
      if (this.destroyed || this.resource.state()!==loaded) return;
      this.cursor = decision.cursor;
      this.snapshot.set(snapshot);
      if (preserveAppearance && decision.choice?.entryId === this.choice()?.entryId && this.choice()) this.clock.resume();
      else this.setCurrent(decision.choice);
    } catch { this.error.set(true); }
    finally { this.loading.set(false); }
  }

  private setCurrent(choice: DeckQueueChoice | null): void {
    this.choiceState=this.resource.state();
    this.choice.set(choice);
    this.entry.set(choice ? this.resource.content?.entry(choice.entryId) ?? null : null);
    this.revealed.set(false); this.translationOpen.set(false); this.preview.set(null);
    if (choice && this.entry()) this.clock.startAppearance();
    else { this.clock.discardAppearance(); this.clock.pause(); }
  }
}
