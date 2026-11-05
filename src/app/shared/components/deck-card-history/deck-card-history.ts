import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { dateDiffInDays, default_w, forgetting_curve } from 'ts-fsrs';
import { DeckCardProgress, DeckReviewEvent } from '../../../core/models/deck-study.model';
import { deckCardHistory } from '../../../core/services/deck-card-history';
import { latestDeckRating } from '../../../core/services/deck-learning-presentation';
import { DECK_SCHEDULER_ENABLE_FUZZ } from '../../../core/services/deck-scheduler.service';
import { TranslationService } from '../../../core/services/translation.service';

@Component({ selector: 'app-deck-card-history', templateUrl: './deck-card-history.html', styleUrl: './deck-card-history.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class DeckCardHistory {
  readonly deckId = input.required<string>(); readonly entryId = input.required<string>();
  readonly progress = input<DeckCardProgress | null>(null); readonly events = input<readonly DeckReviewEvent[]>([]);
  readonly now = input.required<Date>(); readonly retention = input<number | null>(null);
  readonly i18n = inject(TranslationService); readonly fuzz = inject(DECK_SCHEDULER_ENABLE_FUZZ);
  readonly offset = signal(0); readonly advanced = signal(false);
  readonly history = computed(() => deckCardHistory(this.events(), this.progress(), this.deckId(), this.entryId()));
  readonly last = computed(() => latestDeckRating(this.events(), this.progress()));
  readonly pageOffset = computed(() => Math.min(this.offset(), Math.max(0, Math.floor((this.history().rows.length - 1) / 20) * 20)));
  readonly page = computed(() => this.history().rows.slice(this.pageOffset(), this.pageOffset() + 20));
  readonly chart = computed(() => [...this.page()].reverse());
  readonly hasIntervals = computed(() => this.chart().some(r => r.waitMs !== null));
  readonly maxLog = computed(() => Math.max(1, ...this.chart().map(r => Math.log1p((r.waitMs ?? 0) / 60_000))));
  readonly maxWait = computed(() => Math.max(0, ...this.chart().map(r => r.waitMs ?? 0)));
  readonly retrievability = computed(() => {
    const c = this.progress()?.card;
    if (!c || c.state === 0 || c.lastReview === null || c.lastReview > this.now().getTime() || !(c.stability > 0)) return null;
    return forgetting_curve(default_w, dateDiffInDays(new Date(c.lastReview), this.now()), c.stability);
  });
  date(value: number): string { return new Intl.DateTimeFormat(this.i18n.language(), { timeZone: 'Europe/Madrid', dateStyle: 'medium', timeStyle: 'medium' }).format(value); }
  state(value: number | undefined): string { return this.i18n.t(`anki.results.history.state.${value !== undefined && [0,1,2,3].includes(value) ? value : 'unknown'}`); }
  duration(ms: number | null): string {
    if (ms === null) return this.i18n.t('anki.results.history.unavailable');
    if (ms === 0) return this.i18n.t('anki.interval.minutes',{count:0});
    const minutes = Math.floor(ms / 60_000), days = Math.floor(minutes / 1440), hours = Math.floor(minutes % 1440 / 60), rest = minutes % 60;
    if (!minutes) return this.i18n.t('anki.interval.underMinute');
    return ([['day', days], ['hour', hours], ['minute', rest]] as const).filter(([, count]) => count > 0)
      .map(([unit, count]) => this.i18n.t(`anki.interval.${unit}${count === 1 ? '' : 's'}`, { count })).join(' · ');
  }
  height(ms: number): number { return Math.log1p(ms / 60_000) / this.maxLog() * 100; }
  remaining(): string | null { const c = this.progress()?.card; return c && c.state !== 0 ? c.due <= this.now().getTime() ? this.i18n.t('anki.results.time.due') : this.duration(c.due - this.now().getTime()) : null; }
  finite(v: unknown): v is number { return typeof v === 'number' && Number.isFinite(v); }
}
