import { TestBed } from '@angular/core/testing';
import { STUDY_DECKS } from '../../data/study-decks';
import { DeckSettingsService } from './deck-settings.service';
import { StorageService } from './storage.service';

const STORAGE_KEY = 'kana-study.deck-settings.v1';

describe('DeckSettingsService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [DeckSettingsService, StorageService] });
  });

  afterEach(() => TestBed.resetTestingModule());

  it('returns catalogue defaults before the deck has saved settings', () => {
    expect(TestBed.inject(DeckSettingsService).settingsFor(STUDY_DECKS[0]))
      .toEqual(STUDY_DECKS[0].settings);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('persists settings independently by deck id and restores them', () => {
    const service = TestBed.inject(DeckSettingsService);
    expect(service.save('japanese-1500', {
      desiredRetention: 0.95,
      newCardsPerDay: 24,
      newCardOrder: 'after-reviews',
    })).toBe(true);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [DeckSettingsService, StorageService] });
    expect(TestBed.inject(DeckSettingsService).settingsFor(STUDY_DECKS[0])).toEqual({
      desiredRetention: 0.95,
      newCardsPerDay: 24,
      newCardOrder: 'after-reviews',
    });
  });

  it('rejects negative daily values without changing storage', () => {
    const service = TestBed.inject(DeckSettingsService);
    expect(service.save('japanese-1500', {
      desiredRetention: 0.9,
      newCardsPerDay: -1,
      newCardOrder: 'mixed',
    })).toBe(false);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('stores valid custom retention internally for future expansion', () => {
    const service = TestBed.inject(DeckSettingsService);
    expect(service.save('japanese-1500', {
      desiredRetention: 0.91 as 0.9,
      newCardsPerDay: 10,
      newCardOrder: 'mixed',
    })).toBe(true);
  });

  it('rejects an invalid desired retention', () => {
    const service = TestBed.inject(DeckSettingsService);
    expect(service.save('japanese-1500', {
      desiredRetention: 1.1,
      newCardsPerDay: 10,
      newCardOrder: 'mixed',
    })).toBe(false);
  });
});
