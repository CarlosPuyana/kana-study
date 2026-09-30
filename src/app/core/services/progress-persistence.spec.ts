import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StudyUnit } from '../models/progress.model';
import { DEFAULT_LEARNING_SELECTION, LearningSelection } from '../models/settings.model';
import { ProgressService } from './progress.service';
import { SettingsService } from './settings.service';
import { SpacedRepetitionService } from './spaced-repetition.service';
import { StorageService } from './storage.service';

const PROGRESS_KEY = 'kana-study.study-progress.v2';
const EVENTS_KEY = 'kana-study.review-events.v1';
const selectionState = signal<LearningSelection>(structuredClone(DEFAULT_LEARNING_SELECTION));

function configure(): ProgressService {
  TestBed.configureTestingModule({
    providers: [
      ProgressService,
      StorageService,
      SpacedRepetitionService,
      { provide: SettingsService, useValue: { selection: selectionState.asReadonly() } },
    ],
  });
  return TestBed.inject(ProgressService);
}

describe('Progress persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    selectionState.set(structuredClone(DEFAULT_LEARNING_SELECTION));
  });
  afterEach(() => TestBed.resetTestingModule());

  it('does not create empty progress records before a unit is studied', () => {
    configure();
    expect(localStorage.getItem(PROGRESS_KEY)).toBeNull();
    expect(localStorage.getItem(EVENTS_KEY)).toBeNull();
  });

  it('persists StudyProgress and ReviewEvents and restores ISO dates for FSRS', () => {
    const unit: StudyUnit = {
      key: 'hira-vowel-a:kana-to-romaji',
      kanaId: 'hira-vowel-a',
      questionType: 'kana-to-romaji',
    };
    const reviewedAt = new Date('2026-01-15T12:00:00.000Z');
    let service = configure();
    service.recordReview(unit, 'again', false, 'session-1', reviewedAt);

    const rawProgress = JSON.parse(localStorage.getItem(PROGRESS_KEY)!) as Record<string, unknown>;
    const rawEvents = JSON.parse(localStorage.getItem(EVENTS_KEY)!) as unknown[];
    expect(Object.keys(rawProgress)).toEqual([unit.key]);
    expect(rawEvents).toHaveLength(1);
    expect(service.reviewEvents()[0].reviewedAt).toBe(reviewedAt.toISOString());

    const stored = service.get(unit.key)!;
    expect(stored.fsrs.due).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(stored.fsrs.lastReview).toBe(reviewedAt.toISOString());

    TestBed.resetTestingModule();
    service = configure();
    expect(service.get(unit.key)).toEqual(stored);
    expect(service.reviewEvents()).toHaveLength(1);

    const scheduler = TestBed.inject(SpacedRepetitionService);
    const next = scheduler.review(
      service.get(unit.key)!.fsrs,
      'good',
      new Date('2026-01-16T12:00:00.000Z'),
    );
    expect(next.lastReview).toBe('2026-01-16T12:00:00.000Z');
    expect(next.due).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('keeps an out-of-selection review stored and makes it eligible when reactivated', () => {
    const katakanaUnit: StudyUnit = {
      key: 'kata-vowel-a:kana-to-romaji',
      kanaId: 'kata-vowel-a',
      questionType: 'kana-to-romaji',
    };
    const service = configure();
    service.recordReview(
      katakanaUnit,
      'again',
      false,
      'session-katakana',
      new Date('2026-01-15T12:00:00.000Z'),
    );

    const later = new Date('2026-01-16T12:00:00.000Z');
    expect(service.buildRound(later).some(unit => unit.key === katakanaUnit.key)).toBe(false);
    expect(service.get(katakanaUnit.key)).not.toBeNull();
    expect(service.reviewEvents()).toHaveLength(1);

    selectionState.set({
      categories: {
        hiragana: { basic: false, dakuten: false, handakuten: false, combination: false },
        katakana: { basic: true, dakuten: false, handakuten: false, combination: false },
      },
      questionTypes: ['kana-to-romaji'],
    });

    expect(service.buildRound(later)[0].key).toBe(katakanaUnit.key);
    expect(service.get(katakanaUnit.key)).not.toBeNull();
  });

  it('stores independent progress for both directions of the same kana', () => {
    const forward: StudyUnit = {
      key: 'hira-h-ho:kana-to-romaji',
      kanaId: 'hira-h-ho',
      questionType: 'kana-to-romaji',
    };
    const reverse: StudyUnit = {
      key: 'hira-h-ho:romaji-to-kana',
      kanaId: 'hira-h-ho',
      questionType: 'romaji-to-kana',
    };
    const service = configure();

    service.recordReview(forward, 'good', true, 'session-forward');
    service.recordReview(reverse, 'again', false, 'session-reverse');

    expect(service.get(forward.key)?.lastRating).toBe('good');
    expect(service.get(reverse.key)?.lastRating).toBe('again');
    expect(service.get(forward.key)).not.toEqual(service.get(reverse.key));
    expect(service.reviewEvents().map(event => event.key)).toEqual([forward.key, reverse.key]);
  });
});
