import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DeckSettings, DesiredRetention, NewCardOrder } from '../../core/models/deck.model';
import { DeckSettingsService } from '../../core/services/deck-settings.service';
import { TranslationService } from '../../core/services/translation.service';
import { findStudyDeck } from '../../data/study-decks';

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
  imports: [RouterLink],
  templateUrl: './anki-settings.page.html',
  styleUrl: './anki-settings.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnkiSettingsPage {
  private readonly route = inject(ActivatedRoute);
  private readonly settingsService = inject(DeckSettingsService);
  readonly i18n = inject(TranslationService);
  readonly deck = findStudyDeck(this.route.snapshot.paramMap.get('deckId'));
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

  setRetention(value: DesiredRetention): void {
    this.update({ desiredRetention: value });
  }

  setOrder(value: NewCardOrder): void {
    this.update({ newCardOrder: value });
  }

  setNewCards(event: Event): void {
    const rawValue = (event.target as HTMLInputElement).value;
    const value = Number(rawValue);
    const valid = rawValue !== '' && Number.isFinite(value) && value >= 0;
    this.newCardsValid.set(valid);
    this.saved.set(false);
    if (valid) this.update({ newCardsPerDay: value });
  }

  save(): void {
    if (!this.deck || !this.newCardsValid()) return;
    this.saved.set(this.settingsService.save(this.deck.id, this.draft()));
  }

  private update(patch: Partial<DeckSettings>): void {
    this.draft.update(current => ({ ...current, ...patch }));
    this.saved.set(false);
  }
}
