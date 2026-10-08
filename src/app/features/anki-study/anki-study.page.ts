import { createStudyClock } from '../../core/services/study-clock';
import { StudyTimer } from '../../shared/components/study-timer/study-timer';
import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { JapaneseWordDeckEntry } from '../../core/models/japanese-word-deck-entry.model';
import { DeckMixedCursor, DeckQueueChoice, DeckQueueSnapshot, DeckRating, DeckReviewEvent } from '../../core/models/deck-study.model';
import { DeckSchedulePreview } from '../../core/services/deck-scheduler.service';
import { deckContentLanguage } from '../../core/services/deck-content-language';
import { DeckStudyService } from '../../core/services/deck-study.service';
import { formatStudyInterval, getLocalStudyDayKey } from '../../core/services/deck-study-time';
import { TranslationService } from '../../core/services/translation.service';
import { JAPANESE_1500_ENTRIES } from '../../data/japanese-1500.generated';
import { JAPANESE_1500_INDEX } from '../../data/japanese-1500.index.generated';
import { findStudyDeck } from '../../data/study-decks';
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
  private readonly route = inject(ActivatedRoute);
  private readonly study = inject(DeckStudyService);
  private readonly entriesById = new Map(JAPANESE_1500_ENTRIES.map(entry => [entry.id, entry]));
  private cursor: DeckMixedCursor = { debt: 0 };
  readonly clock = createStudyClock();
  private destroyed = false;
  private timerId: ReturnType<typeof setInterval> | null = null;
  private day = getLocalStudyDayKey(new Date());

  readonly i18n = inject(TranslationService);
  readonly deck = findStudyDeck(this.route.snapshot.paramMap.get('deckId'));
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal(false);
  readonly snapshot = signal<DeckQueueSnapshot | null>(null);
  readonly choice = signal<DeckQueueChoice | null>(null);
  readonly entry = signal<JapaneseWordDeckEntry | null>(null);
  readonly revealed = signal(false);
  readonly translationOpen = signal(false);
  readonly preview = signal<DeckSchedulePreview | null>(null);
  readonly lastEvent = signal<DeckReviewEvent | null>(null);
  readonly elapsedSeconds = this.clock.seconds;
  readonly elapsedLabel = this.clock.label;

  ngOnInit(): void {
    this.timerId = setInterval(() => {
      if (getLocalStudyDayKey(new Date()) !== this.day) this.refreshAvailability();
    }, 1000);
    void this.loadNext();
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
    if (!this.deck || !this.choice() || this.revealed() || this.loading() || this.saving()) return;
    this.preview.set(this.study.preview(this.deck, this.choice()!));
    this.translationOpen.set(false);
    this.revealed.set(true);
  }

  async rate(rating: DeckRating): Promise<void> {
    if (!this.deck || !this.choice() || !this.preview() || !this.revealed() || this.saving() || this.loading()) return;
    this.saving.set(true); this.error.set(false); this.clock.pause();
    try {
      const event = await this.study.rate(
        this.deck, this.choice()!, this.preview()!, rating, this.clock.appearanceMilliseconds(),
      );
      this.clock.commitAppearance(); this.lastEvent.set(event);
      this.choice.set(null); this.revealed.set(false);
      await this.loadNext();
    } catch { this.error.set(true); }
    finally { this.saving.set(false); if (!this.destroyed && this.choice()) this.clock.resume(); }
  }

  async undo(): Promise<void> {
    const event = this.lastEvent();
    if (!event || !this.deck || this.saving() || this.snapshot()?.completedToday) return;
    this.saving.set(true); this.error.set(false); this.clock.pause();
    try {
      await this.study.undo(event);
      this.clock.discardAppearance(); this.clock.undo(event.elapsedAnswerMs); this.lastEvent.set(null);
      this.choice.set(null);
      const snapshot = await this.study.snapshot(this.deck, JAPANESE_1500_INDEX);
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

  meaning(entry: JapaneseWordDeckEntry): string { return entry.meaning[deckContentLanguage(this.i18n.language())]; }
  sentenceMeaning(entry: JapaneseWordDeckEntry): string { return entry.sentenceMeaning[deckContentLanguage(this.i18n.language())]; }
  note(entry: JapaneseWordDeckEntry): string | null { return entry.notes[deckContentLanguage(this.i18n.language())] ?? null; }

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
    if (!this.deck) { this.loading.set(false); return; }
    this.error.set(false);
    try {
      let snapshot = await this.study.snapshot(this.deck, JAPANESE_1500_INDEX);
      const decision = snapshot.completedToday ? { choice: null, cursor: this.cursor } : this.study.chooseNext(snapshot, this.deck, this.cursor);
      const event = this.lastEvent();
      if (!decision.choice && !snapshot.completedToday && event && getLocalStudyDayKey(new Date(event.reviewedAt)) === getLocalStudyDayKey(new Date())) {
        await this.study.completeSession(this.deck, JAPANESE_1500_INDEX);
        snapshot = await this.study.snapshot(this.deck, JAPANESE_1500_INDEX);
      }
      if (this.destroyed) return;
      this.cursor = decision.cursor;
      this.snapshot.set(snapshot);
      if (preserveAppearance && decision.choice?.entryId === this.choice()?.entryId && this.choice()) this.clock.resume();
      else this.setCurrent(decision.choice);
    } catch { this.error.set(true); }
    finally { this.loading.set(false); }
  }

  private setCurrent(choice: DeckQueueChoice | null): void {
    this.choice.set(choice);
    this.entry.set(choice ? this.entriesById.get(choice.entryId) ?? null : null);
    this.revealed.set(false); this.translationOpen.set(false); this.preview.set(null);
    if (choice && this.entry()) this.clock.startAppearance();
    else { this.clock.discardAppearance(); this.clock.pause(); }
  }
}
