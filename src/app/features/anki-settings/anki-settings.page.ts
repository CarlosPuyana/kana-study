import * as studyCopy from '../../../assets/i18n/deck-study.generated';
import {DEFAULT_DECK_LEARNING_STEPS,DEFAULT_DECK_RELEARNING_STEPS,parseDeckSteps} from '../../core/services/deck-learning-options';
import { DeckStudyCounts } from '../../core/models/deck-study.model';
import { DeckStudyService } from '../../core/services/deck-study.service';
import { DailyLearningService } from '../../core/services/daily-learning.service';
import {KaishiMediaSettings} from '../../shared/components/kaishi-media-settings/kaishi-media-settings';
import {LocalDeckNotice} from '../../shared/components/local-deck-notice/local-deck-notice';
import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterRenderEffect, effect, inject, untracked, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CUSTOM_DECK_NEW_CARDS_MAX, DeckSettings, DesiredRetention, NewCardOrder } from '../../core/models/deck.model';
import { DeckSettingsService } from '../../core/services/deck-settings.service';
import { TranslationService } from '../../core/services/translation.service';
import { createDeckRouteResource } from '../../core/services/deck-route-resource';
import { PuyiAdmin } from '../puyi/puyi-admin';

interface RetentionOption {
  readonly value: DesiredRetention;
  readonly labelKey: string;
}

interface OrderOption {
  readonly value: NewCardOrder;
  readonly labelKey: string;
}

@Component({
  selector: 'app-anki-settings-page',
  imports: [PuyiAdmin,LocalDeckNotice,RouterLink,KaishiMediaSettings],
  templateUrl: './anki-settings.page.html',
  styleUrl: './anki-settings.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(window:focus)': 'refreshDaily()' },
})
export class AnkiSettingsPage {
  private readonly settingsService = inject(DeckSettingsService);
  private readonly study = inject(DeckStudyService);
  private readonly calendar = inject(DailyLearningService);
  readonly daily = signal<DeckStudyCounts | null>(null);
  readonly dailyError = signal(false);
  readonly saving = signal(false);
  readonly error = signal(false);
  private scope = '';
  private generation = 0;
  private readonly saveAction = viewChild<ElementRef<HTMLButtonElement>>('saveAction');
  private readonly restoreSaveFocus = signal(false);
  get newCardsMax(): number { return this.deck?.kind === 'custom' ? CUSTOM_DECK_NEW_CARDS_MAX : Number.MAX_SAFE_INTEGER; }

  readonly i18n = inject(TranslationService);
  readonly resource = createDeckRouteResource();
  get deck() { return this.resource.deck; }
  title(): string { return this.resource.title(this.i18n); }
  readonly retentions: readonly RetentionOption[] = [
    { value: 0.8, labelKey: 'anki.settings.retention.80' },
    { value: 0.85, labelKey: 'anki.settings.retention.85' },
    { value: 0.9, labelKey: 'anki.settings.retention.90' },
    { value: 0.95, labelKey: 'anki.settings.retention.95' },
    { value: 0.97, labelKey: 'anki.settings.retention.97' },
  ];
  readonly orders: readonly OrderOption[] = [
    { value: 'mixed', labelKey: 'anki.settings.order.mixed' },
    { value: 'after-reviews', labelKey: 'anki.settings.order.afterReviews' },
    { value: 'before-reviews', labelKey: 'anki.settings.order.beforeReviews' },
  ];
  readonly draft = signal<DeckSettings>(
    this.deck ? { ...this.settingsService.settingsFor(this.deck) } : {
      desiredRetention: 0.9,
      newCardsPerDay: 0,
      newCardOrder: 'mixed',
    },
  );
  readonly newCardsValid = signal(true);
  readonly saved = signal(false);
  readonly stepInputs=signal({learning:'1m 10m',relearning:'10m'});
  readonly stepsValid=signal(true);
  setSteps(kind:'learning'|'relearning',event:Event):void{
    this.stepInputs.update(v=>({...v,[kind]:(event.target as HTMLInputElement).value}));
    const values=this.stepInputs(),learningSteps=parseDeckSteps(values.learning),relearningSteps=parseDeckSteps(values.relearning);
    this.stepsValid.set(!!learningSteps&&!!relearningSteps);this.saved.set(false);
    if(learningSteps&&relearningSteps)this.update({learningSteps,relearningSteps});
  }

  constructor() {
    this.i18n.useStudyCopy?.(studyCopy);
    inject(DestroyRef).onDestroy(() => { ++this.generation; });
    afterRenderEffect(() => {
      const button = this.saveAction();
      if (this.restoreSaveFocus() && !this.saving() && button) {
        this.restoreSaveFocus.set(false); button.nativeElement.focus({ preventScroll: true });
      }
    });
    effect(() => {
      const state = this.resource.state(), owner = this.resource.catalog.owner(), epoch = this.resource.catalog.epoch();
      this.calendar.spainDay();
      untracked(() => {
        if (state.status !== 'ready' || !this.deck) { this.daily.set(null); ++this.generation; return; }
        const scope = JSON.stringify([owner, epoch, this.deck.id]);
        if (scope !== this.scope) {
          this.scope = scope; this.draft.set({ ...this.settingsService.settingsFor(this.deck) });
          const settings=this.draft();this.stepInputs.set({learning:(settings.learningSteps??DEFAULT_DECK_LEARNING_STEPS).map(n=>`${n}m`).join(' '),relearning:(settings.relearningSteps??DEFAULT_DECK_RELEARNING_STEPS).map(n=>`${n}m`).join(' ')});this.stepsValid.set(true);
          this.newCardsValid.set(true); this.saved.set(false); this.error.set(false); this.saving.set(false); this.restoreSaveFocus.set(false);
        }
        void this.refreshDaily();
      });
    });
  }

  async refreshDaily(): Promise<void> {
    const deck = this.deck, state = this.resource.state(), owner = this.resource.catalog.owner();
    if (!deck) return;
    const generation = ++this.generation;
    try {
      const index = await this.resource.catalog.index(deck.id);
      if (generation !== this.generation || state !== this.resource.state() || owner !== this.resource.catalog.owner()) return;
      const value = await this.study.snapshot(deck, index);
      if (generation === this.generation && state === this.resource.state() && owner === this.resource.catalog.owner()) {
        this.daily.set(value); this.dailyError.set(false);
      }
    } catch {
      if (generation === this.generation && state === this.resource.state()) { this.daily.set(null); this.dailyError.set(true); }
    }
  }

  setRetention(value: DesiredRetention): void {
    this.update({ desiredRetention: value });
  }

  setOrder(value: NewCardOrder): void {
    this.update({ newCardOrder: value });
  }

  setNewCards(event: Event): void {
    const rawValue = (event.target as HTMLInputElement).value;
    const value = Number(rawValue);
    const valid = rawValue.trim() !== '' && Number.isSafeInteger(value) && value >= 0 && value <= this.newCardsMax;
    this.newCardsValid.set(valid);
    this.saved.set(false); this.error.set(false);
    if (valid) this.update({ newCardsPerDay: value });
  }

  async save(): Promise<void> {
    const deck = this.deck;
    if (!deck || !this.newCardsValid() || !this.stepsValid() || this.saving()) return;
    const owner = this.resource.catalog.owner(), scope = this.scope, epoch = this.resource.catalog.epoch();
    const draft = { ...this.draft() };
    const restoreFocus = document.activeElement === this.saveAction()?.nativeElement;
    this.saving.set(true); this.saved.set(false); this.error.set(false);
    try {
      if (deck.kind === 'custom') await this.resource.catalog.repository.saveSettings(crypto.randomUUID(), deck.id, draft, owner);
      else if (!this.settingsService.save(deck.id, draft)) throw new Error('Settings write failed');
      if (scope === this.scope && owner === this.resource.catalog.owner() && epoch === this.resource.catalog.epoch()) {
        this.saved.set(true); this.error.set(false); await this.refreshDaily();
      }
    } catch {
      if (scope === this.scope && owner === this.resource.catalog.owner() && epoch === this.resource.catalog.epoch()) this.error.set(true);
    } finally {
      if (scope === this.scope && owner === this.resource.catalog.owner() && epoch === this.resource.catalog.epoch()) {
        this.saving.set(false); this.restoreSaveFocus.set(restoreFocus);
      }
    }
  }

  private update(patch: Partial<DeckSettings>): void {
    this.error.set(false);
    this.draft.update(current => ({ ...current, ...patch }));
    this.saved.set(false);
  }
}
