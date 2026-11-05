import {PublicDeckImage} from '../../shared/components/public-deck-image/public-deck-image';
import {LocalDeckNotice} from '../../shared/components/local-deck-notice/local-deck-notice';
import { ChangeDetectionStrategy, Component, computed, effect, inject, untracked, signal, DestroyRef, PendingTasks } from '@angular/core';
import * as studyCopy from '../../../assets/i18n/deck-study.generated';
import { DeckCardProgress, DeckReviewEvent } from '../../core/models/deck-study.model';
import { DeckScheduleReader } from '../../core/services/deck-schedule-reader';
import { deckTimeGroups, latestDeckRating } from '../../core/services/deck-learning-presentation';
import { formatStudyInterval } from '../../core/services/deck-study-time';
import { RouterLink } from '@angular/router';
import { JapaneseWordDeckEntry } from '../../core/models/japanese-word-deck-entry.model';
import { deckContentLanguage } from '../../core/services/deck-content-language';
import { TranslationService } from '../../core/services/translation.service';
import { BUILTIN_DECK_CONTENT } from '../../core/services/builtin-deck-content';
import { createDeckRouteResource, entryMeaning } from '../../core/services/deck-route-resource';
import { isCustomEntry, DeckStudyEntryView } from '../../core/models/deck-catalog.model';
import { FuriganaText } from '../../shared/components/furigana-text/furigana-text';
import { DeckSentenceText } from './components/deck-sentence-text/deck-sentence-text';
import { ModalFocusDirective } from '../../shared/directives/modal-focus.directive';
import { DeckCardHistory } from '../../shared/components/deck-card-history/deck-card-history';
import { DeckSettingsService } from '../../core/services/deck-settings.service';

@Component({
  selector: 'app-anki-cards-page',
  imports: [DeckCardHistory,ModalFocusDirective,PublicDeckImage,LocalDeckNotice,RouterLink, FuriganaText, DeckSentenceText],
  templateUrl: './anki-cards.page.html',
  styleUrl: './anki-cards.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'closeOverlay()', '(window:focus)': 'refreshSchedule()', '(document:visibilitychange)': 'refreshSchedule()' },
})
export class AnkiCardsPage {
  readonly i18n = inject(TranslationService);
  readonly resource = createDeckRouteResource(BUILTIN_DECK_CONTENT);
  get deck() { return this.resource.deck; }
  readonly isCustom = isCustomEntry;
  title(): string { return this.resource.title(this.i18n); }
  readonly query = signal('');
  readonly visibleLimit = signal(120);
  readonly selected = signal<DeckStudyEntryView | null>(null);
  readonly mode = signal<'all' | 'time'>('all');
  readonly now = signal(new Date());
  readonly schedule = signal<readonly DeckCardProgress[]>([]);
  readonly events = signal<readonly DeckReviewEvent[]>([]);
  readonly scheduleLoading = signal(false);
  readonly scheduleError = signal(false);
  readonly expanded = signal<ReadonlySet<string>>(new Set());
  readonly groupLimits = signal<Record<string, number>>({});
  private readonly reader = inject(DeckScheduleReader);
  readonly deckSettings = inject(DeckSettingsService);
  private readonly tasks = inject(PendingTasks);
  private generation = 0;
  private destroyed = false;
  readonly groups = computed(() => deckTimeGroups(this.cards(), this.schedule(), this.deck?.id ?? '', this.now()));
  readonly selectedProgress = computed(() => this.schedule().find(p => p.deckId === this.deck?.id && p.entryId === this.selected()?.id) ?? null);
  readonly selectedRating = computed(() => latestDeckRating(this.events(), this.selectedProgress()));
  toggleGroup(key: string): void { this.expanded.update(s => { const next = new Set(s); next.has(key) ? next.delete(key) : next.add(key); return next; }); }
  groupEntries(ids: readonly string[], key: string): DeckStudyEntryView[] {
    return ids.slice(0, this.groupLimits()[key] ?? 60).map(id => this.resource.content?.entry(id)).filter((e): e is DeckStudyEntryView => !!e);
  }
  moreInGroup(key: string): void { this.groupLimits.update(v => ({ ...v, [key]: (v[key] ?? 60) + 60 })); }
  exactDate(due: number): string { return new Intl.DateTimeFormat(this.i18n.language(), { timeZone: 'Europe/Madrid', dateStyle: 'full', timeStyle: 'short' }).format(new Date(due)); }
  isoDate(due: number): string { return new Date(due).toISOString(); }
  remaining(due: number): string {
    if (due <= this.now().getTime()) return this.i18n.t('anki.results.time.due');
    const minutes = Math.floor((due - this.now().getTime()) / 60_000);
    if (minutes === 0) return this.i18n.t('anki.interval.underMinute');
    const days = Math.floor(minutes / 1440), hours = Math.floor(minutes % 1440 / 60), rest = minutes % 60;
    // Exact duration, not rounded months or ceil(25h/24h) = "two days" at autumn DST.
    return ([['day', days], ['hour', hours], ['minute', days ? 0 : rest]] as const)
      .filter(([, count]) => count > 0).map(([unit, count]) => this.i18n.t(`anki.interval.${unit}${count === 1 ? '' : 's'}`, { count })).join(' · ');
  }
  interval(p: DeckCardProgress): string | null {
    const c = p.card;
    if (c.state === 0 || c.lastReview === null) return null;
    if (c.scheduledDays > 0) return this.i18n.t('anki.interval.days', { count: c.scheduledDays });
    const ms = c.due - c.lastReview;
    if (!Number.isFinite(ms) || ms < 0) return null;
    const f = formatStudyInterval(ms); return this.i18n.t(`anki.interval.${f.unit}`, f.value === null ? undefined : { count: f.value });
  }
  validDue(p: DeckCardProgress): boolean { return p.card.state !== 0 && Number.isFinite(p.card.due); }
  async refreshSchedule(): Promise<void> {
    this.now.set(new Date());
    if ((this.mode() !== 'time' && !this.selected()) || !this.deck || document.hidden) return;
    const state = this.resource.state(), owner = this.resource.catalog.owner(), epoch = this.resource.catalog.epoch(), id = this.deck.id, generation = ++this.generation;
    this.scheduleLoading.set(true); this.scheduleError.set(false);
    try {
      const data = await this.reader.read(id);
      if (!this.destroyed && generation === this.generation && state === this.resource.state() && owner === this.resource.catalog.owner() && epoch === this.resource.catalog.epoch()) {
        this.schedule.set(data.progress); this.events.set(data.events);
      }
    } catch { if (!this.destroyed && generation === this.generation) this.scheduleError.set(true); }
    finally { if (!this.destroyed && generation === this.generation) this.scheduleLoading.set(false); }
  }
  readonly cards = computed(() => (this.resource.content?.entries() ?? []).filter(entry =>
    isCustomEntry(entry) ? [entry.word,entry.reading,...entry.glosses.map(g=>g.text),entry.context?.text ?? ''].some(v=>normalizeDeckSearch(v).includes(normalizeDeckSearch(this.query()))) : japaneseDeckEntryMatchesQuery(entry, this.query()),
  ));
  readonly visibleCards = computed(() => this.cards().slice(0, this.visibleLimit()));
  readonly hasMore = computed(() => this.visibleLimit() < this.cards().length);

  constructor(){
    this.i18n.useStudyCopy?.(studyCopy);
    const timer = setInterval(() => { if ((this.mode() === 'time' || this.selected()) && !document.hidden) this.now.set(new Date()); }, 1000);
    inject(DestroyRef).onDestroy(() => { this.destroyed = true; ++this.generation; clearInterval(timer); });
    effect(() => {
      this.reader.revision(); this.resource.state(); this.resource.catalog.owner(); this.resource.catalog.epoch(); const mode = this.mode(), selected = mode === 'all' ? this.selected() : null;
      untracked(() => { ++this.generation; this.schedule.set([]); this.events.set([]);
        if (mode === 'time' || selected) void this.tasks.run(() => this.refreshSchedule()); });
    });
    let state=this.resource.state(),owner=this.resource.catalog.owner();
    effect(()=>{
      const nextState=this.resource.state(),nextOwner=this.resource.catalog.owner();
      if(state!==nextState||owner!==nextOwner)untracked(()=>this.selected.set(null));
      state=nextState;owner=nextOwner;
    });
  }

  updateQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
    this.visibleLimit.set(120);
  }

  showMore(): void {
    this.visibleLimit.update(limit => limit + 120);
  }

  closeOverlay(): void {
    this.selected.set(null);
  }

  meaning(entry: DeckStudyEntryView): string {
    return entryMeaning(entry, this.i18n.language());
  }

  sentenceMeaning(entry: DeckStudyEntryView): string {
    return isCustomEntry(entry) ? '' : entry.sentenceMeaning[deckContentLanguage(this.i18n.language())];
  }

  note(entry: DeckStudyEntryView): string | null {
    return isCustomEntry(entry) ? null : entry.notes[deckContentLanguage(this.i18n.language())] ?? null;
  }
}

export function japaneseDeckEntryMatchesQuery(entry: JapaneseWordDeckEntry, query: string): boolean {
  const normalized = normalizeDeckSearch(query);
  if (!normalized) return true;
  if (/^#\d+$/.test(normalized)) return entry.order === Number(normalized.slice(1));
  const sentence = entry.sentenceSegments.map(segment => segment.text).join('');
  return [
    entry.word,
    entry.reading,
    entry.meaning.es,
    entry.meaning.en,
    sentence,
    entry.sentenceMeaning.es,
    entry.sentenceMeaning.en,
  ].some(value => normalizeDeckSearch(value).includes(normalized));
}

function normalizeDeckSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}
