import { inject, Injectable, signal } from '@angular/core';
import { DeckSettings, NewCardOrder, StudyDeck } from '../models/deck.model';
import { StorageService } from './storage.service';

const STORAGE_KEY = 'kana-study.deck-settings.v1';
const ORDERS: readonly NewCardOrder[] = ['mixed', 'after-reviews', 'before-reviews'];
type StoredDeckSettings = Record<string, DeckSettings>;

@Injectable({ providedIn: 'root' })
export class DeckSettingsService {
  private readonly storage = inject(StorageService);
  private readonly state = signal<StoredDeckSettings>(this.storage.get(STORAGE_KEY, {}));
  readonly all = this.state.asReadonly();

  settingsFor(deck: StudyDeck): DeckSettings {
    return this.state()[deck.id] ?? deck.settings;
  }

  save(deckId: string, settings: DeckSettings): boolean {
    if (
      !Number.isFinite(settings.desiredRetention)
      || settings.desiredRetention <= 0
      || settings.desiredRetention >= 1
      || !ORDERS.includes(settings.newCardOrder)
      || !Number.isFinite(settings.newCardsPerDay)
      || settings.newCardsPerDay < 0
    ) {
      return false;
    }
    this.state.update(current => ({
      ...current,
      [deckId]: { ...settings, newCardsPerDay: Math.floor(settings.newCardsPerDay) },
    }));
    this.storage.set(STORAGE_KEY, this.state());
    return true;
  }
}
