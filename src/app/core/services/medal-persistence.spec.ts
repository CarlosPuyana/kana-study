import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CompletedSessionSummary } from '../models/learning-session.model';
import { ProgressService } from './progress.service';
import { FlagProgressService } from './flag-progress.service';
import { KanjiProgressService } from './kanji-progress.service';
import { MedalService } from './medal.service';
import { SessionHistoryService } from './session-history.service';
import { StorageService } from './storage.service';

const SESSIONS_KEY = 'kana-study.completed-sessions.v1';
const UNLOCKS_KEY = 'kana-study.medal-unlocks.v1';
const emptyProgress = signal({});
const emptyEvents = signal([]);

function completedSession(id = 'round-1'): CompletedSessionSummary {
  return {
    sessionId: id,
    completedAt: '2026-01-01T12:00:00.000Z',
    mode: 'self-assessment',
    exercisesCompleted: 10,
    firstTrySuccesses: 8,
    attempts: 11,
    needsPracticeCount: 0,
    durationSeconds: 75,
  };
}

function configure(): void {
  TestBed.configureTestingModule({
    providers: [
      MedalService,
      SessionHistoryService,
      StorageService,
      {
        provide: ProgressService,
        useValue: {
          allProgress: emptyProgress.asReadonly(),
          reviewEvents: emptyEvents.asReadonly(),
        },
      },
      { provide: FlagProgressService, useValue: { allProgress: emptyProgress.asReadonly() } },
      { provide: KanjiProgressService, useValue: { allProgress: emptyProgress.asReadonly(), reviewEvents: emptyEvents.asReadonly() } },
    ],
  });
}

describe('Medal persistence', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => TestBed.resetTestingModule());

  it('restores the generic completed-session history after the service is recreated', () => {
    configure();
    let history = TestBed.inject(SessionHistoryService);
    history.record(completedSession());
    expect(JSON.parse(localStorage.getItem(SESSIONS_KEY)!)).toEqual([completedSession()]);

    TestBed.resetTestingModule();
    configure();
    history = TestBed.inject(SessionHistoryService);
    expect(history.sessions()).toEqual([{ ...completedSession(), module: 'kana' }]);
  });

  it('persists only medal id and unlock date and never relocks it after recreation', () => {
    configure();
    TestBed.inject(SessionHistoryService).record(completedSession());
    let medals = TestBed.inject(MedalService);
    const firstUnlock = medals.unlocks().find(unlock => unlock.medalId === 'first-step')!;
    const stored = JSON.parse(localStorage.getItem(UNLOCKS_KEY)!) as Record<string, unknown>[];
    expect(Object.keys(stored[0]).sort()).toEqual(['medalId', 'unlockedAt']);

    localStorage.removeItem(SESSIONS_KEY);
    TestBed.resetTestingModule();
    configure();
    medals = TestBed.inject(MedalService);
    expect(medals.medals().find(item => item.definition.id === 'first-step')?.unlocked).toBe(true);
    expect(medals.unlocks().find(unlock => unlock.medalId === 'first-step')).toEqual(firstUnlock);
  });
});
