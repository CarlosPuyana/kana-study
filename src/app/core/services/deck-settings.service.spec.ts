import { TestBed } from '@angular/core/testing';
import { STUDY_DECKS } from '../../data/study-decks';
import { DeckSettingsService } from './deck-settings.service';
import { StorageService } from './storage.service';
import {parseDeckSteps} from './deck-learning-options';

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
  it('persists optional steps without altering defaults or progress and restores them per workspace',()=>{
    const service=TestBed.inject(DeckSettingsService),settings={...STUDY_DECKS[0].settings,learningSteps:[2,20,60],relearningSteps:[5,15]};
    expect(service.save('japanese-1500',settings)).toBe(true);expect(service.settingsFor(STUDY_DECKS[0])).toEqual(settings);
    TestBed.resetTestingModule();expect(TestBed.inject(DeckSettingsService).settingsFor(STUDY_DECKS[0])).toEqual(settings);
  });
  it.each([[],[0],[-1],[1.5],[1440],Array(11).fill(1)].map(v=>[v]))('rejects invalid learning steps %j without saving',learningSteps=>{
    const service=TestBed.inject(DeckSettingsService);expect(service.save('japanese-1500',{...STUDY_DECKS[0].settings,learningSteps})).toBe(false);expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
  it('parses only bounded explicit minute/hour steps, not arbitrary intervals or expressions',()=>{
    expect(parseDeckSteps('1m 10m')).toEqual([1,10]);expect(parseDeckSteps('2m 1h')).toEqual([2,60]);for(const s of ['','10','1d','0m','1.5m','24h','Infinitym','<script>'])expect(parseDeckSteps(s)).toBeNull();
  });
});
