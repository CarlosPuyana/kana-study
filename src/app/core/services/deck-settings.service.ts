import { inject, Injectable } from '@angular/core';
import { DeckSettings, NewCardOrder } from '../models/deck.model';
import { DeckDefinition } from '../models/deck-catalog.model';
import { StorageService, workspaceStorageSignal } from './storage.service';
import {validDeckLearningOptions} from './deck-learning-options';

const STORAGE_KEY = 'kana-study.deck-settings.v1';
const ORDERS: readonly NewCardOrder[] = ['mixed', 'after-reviews', 'before-reviews'];
type StoredDeckSettings = Record<string, DeckSettings>;

@Injectable({ providedIn: 'root' })
export class DeckSettingsService {
  private readonly storage = inject(StorageService);
  private readonly state = workspaceStorageSignal<StoredDeckSettings>(() => this.storage.get(STORAGE_KEY, {}));
  readonly all = this.state.asReadonly();

  settingsFor(deck: DeckDefinition): DeckSettings {
    return deck.id.startsWith('md-') ? deck.settings : this.state()[deck.id] ?? deck.settings;
  }

  save(deckId: string, settings: DeckSettings): boolean {
    if (
      !validDeckLearningOptions(settings)
      || !Number.isFinite(settings.desiredRetention)
      || settings.desiredRetention <= 0
      || settings.desiredRetention >= 1
      || !ORDERS.includes(settings.newCardOrder)
      || !Number.isFinite(settings.newCardsPerDay)
      || settings.newCardsPerDay < 0
    ) {
      return false;
    }
    const next = {
      ...this.state(),
      [deckId]: { ...settings, newCardsPerDay: Math.floor(settings.newCardsPerDay) },
    };
    try { this.storage.set(STORAGE_KEY, next, { strict: true }); }
    catch { return false; }
    this.state.set(next);
    return true;
  }
}
