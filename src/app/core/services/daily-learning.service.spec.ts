import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CompletedSessionSummary } from '../models/learning-session.model';
import { DailyLearningService, getSpainDayKey } from './daily-learning.service';
import { SessionHistoryService } from './session-history.service';

function summary(
  module: 'kana' | 'kanji' | 'vocabulary',
  completedAt: string,
): CompletedSessionSummary {
  return {
    module,
    sessionId: `${module}-${completedAt}`,
    completedAt,
    mode: 'quick-practice',
    exercisesCompleted: 10,
    firstTrySuccesses: 8,
    attempts: 12,
    needsPracticeCount: 2,
    durationSeconds: 90,
  };
}

describe('DailyLearningService', () => {
  const sessions = signal<readonly CompletedSessionSummary[]>([]);
  let service: DailyLearningService;

  beforeEach(() => {
    sessions.set([]);
    TestBed.configureTestingModule({
      providers: [
        DailyLearningService,
        { provide: SessionHistoryService, useValue: { sessions: sessions.asReadonly() } },
      ],
    });
    service = TestBed.inject(DailyLearningService);
  });

  afterEach(() => TestBed.resetTestingModule());

  it('locks only the module completed on the current Spain day', () => {
    sessions.set([summary('kana', '2026-07-01T10:00:00.000Z')]);
    service.refresh(new Date('2026-07-01T18:00:00.000Z'));

    expect(service.isCompletedToday('kana')).toBe(true);
    expect(service.isCompletedToday('kanji')).toBe(false);
    expect(service.isCompletedToday('vocabulary')).toBe(false);

    sessions.update(items => [...items, summary('kanji', '2026-07-01T19:00:00.000Z')]);
    expect(service.isCompletedToday('kana')).toBe(true);
    expect(service.isCompletedToday('kanji')).toBe(true);
    expect(service.isCompletedToday('vocabulary')).toBe(false);
  });

  it('unlocks at midnight in Madrid during daylight saving time', () => {
    sessions.set([summary('kana', '2026-06-30T12:00:00.000Z')]);
    service.refresh(new Date('2026-06-30T21:59:59.000Z'));
    expect(service.spainDay()).toBe('2026-06-30');
    expect(service.isCompletedToday('kana')).toBe(true);

    service.refresh(new Date('2026-06-30T22:00:01.000Z'));
    expect(service.spainDay()).toBe('2026-07-01');
    expect(service.isCompletedToday('kana')).toBe(false);
  });

  it('uses the completion day when a session crosses Madrid midnight', () => {
    expect(getSpainDayKey(new Date('2026-06-30T21:55:00.000Z'))).toBe('2026-06-30');
    const completedAt = '2026-06-30T22:05:00.000Z';
    expect(getSpainDayKey(new Date(completedAt))).toBe('2026-07-01');
    sessions.set([summary('vocabulary', completedAt)]);
    service.refresh(new Date(completedAt));
    expect(service.isCompletedToday('vocabulary')).toBe(true);
  });

  it('refreshes the open application when focus returns after Madrid midnight', () => {
    sessions.set([summary('kana', '2026-06-30T12:00:00.000Z')]);
    service.refresh(new Date('2026-06-30T21:59:00.000Z'));
    expect(service.isCompletedToday('kana')).toBe(true);

    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2026-06-30T22:01:00.000Z'));
      window.dispatchEvent(new Event('focus'));
      expect(service.spainDay()).toBe('2026-07-01');
      expect(service.isCompletedToday('kana')).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it('ignores empty summaries', () => {
    sessions.set([{ ...summary('kana', '2026-07-01T10:00:00.000Z'), exercisesCompleted: 0 }]);
    service.refresh(new Date('2026-07-01T12:00:00.000Z'));
    expect(service.isCompletedToday('kana')).toBe(false);
  });
});
