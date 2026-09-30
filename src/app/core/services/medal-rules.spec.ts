import { ALL_KANA } from '../../data/kana';
import { MEDAL_DEFINITIONS } from '../../data/medals';
import { CompletedSessionSummary } from '../models/learning-session.model';
import { MedalProgress, MedalState, MedalUnlock } from '../models/medal.model';
import { FsrsProgress, QuestionType, ReviewEvent, StudyProgress } from '../models/progress.model';
import {
  evaluateMedalStates, isMedalComplete, presentMedal, selectHomeMedals,
} from './medal-rules';

const EMPTY_FSRS: FsrsProgress = {
  due: '2026-01-02T12:00:00.000Z',
  stability: 1,
  difficulty: 5,
  elapsedDays: 0,
  scheduledDays: 1,
  learningSteps: 0,
  reps: 1,
  lapses: 0,
  state: 'learning',
  lastReview: '2026-01-01T12:00:00.000Z',
};

function session(
  sessionId: string,
  overrides: Partial<CompletedSessionSummary> = {},
): CompletedSessionSummary {
  return {
    sessionId,
    completedAt: '2026-01-01T12:00:00.000Z',
    mode: 'self-assessment',
    exercisesCompleted: 10,
    firstTrySuccesses: 8,
    attempts: 10,
    needsPracticeCount: 0,
    durationSeconds: 60,
    ...overrides,
  };
}

function studiedProgress(
  kanaId: string,
  questionType: QuestionType = 'kana-to-romaji',
  memorized = false,
): StudyProgress {
  return {
    key: `${kanaId}:${questionType}`,
    kanaId,
    questionType,
    fsrs: { ...EMPTY_FSRS, state: memorized ? 'review' : 'learning' },
    firstSeenAt: '2026-01-01T12:00:00.000Z',
    lastSeenAt: '2026-01-01T12:00:00.000Z',
    totalAttempts: 1,
    totalFirstTrySuccesses: memorized ? 1 : 0,
    totalFailures: memorized ? 0 : 1,
    lastRating: memorized ? 'good' : 'again',
  };
}

function progressRecord(items: readonly StudyProgress[]): Readonly<Record<string, StudyProgress>> {
  return Object.fromEntries(items.map(item => [item.key, item]));
}

function states(options: {
  progress?: readonly StudyProgress[];
  sessions?: readonly CompletedSessionSummary[];
  reviewEvents?: readonly ReviewEvent[];
  unlocks?: readonly MedalUnlock[];
} = {}): readonly MedalState[] {
  return evaluateMedalStates({
    definitions: MEDAL_DEFINITIONS,
    kana: ALL_KANA,
    progress: progressRecord(options.progress ?? []),
    sessions: options.sessions ?? [],
    reviewEvents: options.reviewEvents ?? [],
    unlocks: options.unlocks ?? [],
  });
}

function medal(items: readonly MedalState[], id: string): MedalState {
  return items.find(item => item.definition.id === id)!;
}

function counter(progress: MedalProgress): { current: number; target: number } {
  expect(progress.type).toBe('counter');
  return progress as { current: number; target: number };
}

function memorizedKana(ids: readonly string[], bothDirections = false): StudyProgress[] {
  return ids.flatMap(id => bothDirections
    ? [studiedProgress(id, 'kana-to-romaji', true), studiedProgress(id, 'romaji-to-kana', true)]
    : [studiedProgress(id, 'kana-to-romaji', true)]);
}

describe('Medal rules', () => {
  it('A: does not complete First step without a completed round', () => {
    expect(isMedalComplete(medal(states(), 'first-step').progress)).toBe(false);
  });

  it('B: completes First step after one completed round', () => {
    expect(isMedalComplete(medal(states({ sessions: [session('one')] }), 'first-step').progress)).toBe(true);
  });

  it('C: completes Getting started after ten completed rounds', () => {
    const sessions = Array.from({ length: 10 }, (_, index) => session(`round-${index}`));
    expect(isMedalComplete(medal(states({ sessions }), 'getting-started').progress)).toBe(true);
  });

  it('D: counts unique completed exercises instead of attempts for Century', () => {
    const value = medal(states({ sessions: [session('one', { attempts: 15 })] }), 'century').progress;
    expect(counter(value).current).toBe(10);
  });

  it('E: completes Century at one hundred completed exercises', () => {
    const sessions = Array.from({ length: 10 }, (_, index) => session(`round-${index}`));
    expect(isMedalComplete(medal(states({ sessions }), 'century').progress)).toBe(true);
  });

  it('F: considers every basic hiragana studied when progress exists in one visual direction', () => {
    const ids = ALL_KANA.filter(kana => kana.type === 'hiragana' && kana.variant === 'basic')
      .map(kana => kana.id);
    expect(isMedalComplete(medal(states({ progress: ids.map(id => studiedProgress(id)) }), 'hiragana-started').progress)).toBe(true);
  });

  it('G: considers every basic hiragana memorized when one visual direction is in review', () => {
    const ids = ALL_KANA.filter(kana => kana.type === 'hiragana' && kana.variant === 'basic')
      .map(kana => kana.id);
    expect(isMedalComplete(medal(states({ progress: memorizedKana(ids) }), 'hiragana-mastered').progress)).toBe(true);
  });

  it('H: does not complete Hiragana mastered with one basic kana missing', () => {
    const ids = ALL_KANA.filter(kana => kana.type === 'hiragana' && kana.variant === 'basic')
      .map(kana => kana.id);
    const value = medal(states({ progress: memorizedKana(ids.slice(0, -1)) }), 'hiragana-mastered').progress;
    expect(isMedalComplete(value)).toBe(false);
    expect(counter(value)).toMatchObject({ current: ids.length - 1, target: ids.length });
  });

  it('I: completes Both directions when one kana is memorized in both visual directions', () => {
    const kanaId = ALL_KANA[0].id;
    expect(isMedalComplete(medal(states({ progress: memorizedKana([kanaId], true) }), 'both-directions').progress)).toBe(true);
  });

  it('J: completes Hiragana bidirectional only when all basic hiragana are memorized both ways', () => {
    const ids = ALL_KANA.filter(kana => kana.type === 'hiragana' && kana.variant === 'basic')
      .map(kana => kana.id);
    expect(isMedalComplete(medal(states({ progress: memorizedKana(ids, true) }), 'hiragana-bidirectional').progress)).toBe(true);
  });

  it('K: completes Perfect round for ten first-try successes and no practice-needed unit', () => {
    const perfect = session('perfect', { firstTrySuccesses: 10, needsPracticeCount: 0 });
    expect(isMedalComplete(medal(states({ sessions: [perfect] }), 'perfect-round').progress)).toBe(true);
  });

  it('L: does not complete Perfect round with nine first-try successes', () => {
    const imperfect = session('imperfect', { firstTrySuccesses: 9 });
    expect(isMedalComplete(medal(states({ sessions: [imperfect] }), 'perfect-round').progress)).toBe(false);
  });

  it('M: completes Perfectionist after five perfect rounds', () => {
    const sessions = Array.from({ length: 5 }, (_, index) => session(`perfect-${index}`, {
      firstTrySuccesses: 10,
    }));
    expect(isMedalComplete(medal(states({ sessions }), 'perfectionist').progress)).toBe(true);
  });

  it('N: completes Consistent after studying on seven distinct local dates', () => {
    const sessions = Array.from({ length: 7 }, (_, index) => session(`day-${index}`, {
      completedAt: new Date(2026, 0, index + 1, 12).toISOString(),
    }));
    expect(isMedalComplete(medal(states({ sessions }), 'consistent').progress)).toBe(true);
  });

  it('O: counts several rounds on one local date as one consistency day', () => {
    const sessions = Array.from({ length: 7 }, (_, index) => session(`same-day-${index}`, {
      completedAt: new Date(2026, 0, 1, 8 + index).toISOString(),
    }));
    const value = medal(states({ sessions }), 'consistent').progress;
    expect(counter(value).current).toBe(1);
    expect(isMedalComplete(value)).toBe(false);
  });

  it('P: completes Second chance for a memorized unit with a historical Again event', () => {
    const progress = studiedProgress(ALL_KANA[0].id, 'kana-to-romaji', true);
    const event: ReviewEvent = {
      id: 'event-1',
      sessionId: 'round-1',
      key: progress.key,
      kanaId: progress.kanaId,
      questionType: progress.questionType,
      rating: 'again',
      reviewedAt: '2026-01-01T12:00:00.000Z',
      fsrsBefore: null,
      fsrsAfter: progress.fsrs,
    };
    expect(isMedalComplete(medal(states({ progress: [progress], reviewEvents: [event] }), 'second-chance').progress)).toBe(true);
  });

  it('Q: keeps an existing unlock even when current progress no longer meets its rule', () => {
    const unlocks = [{ medalId: 'first-step', unlockedAt: '2026-01-01T12:00:00.000Z' }];
    expect(medal(states({ unlocks }), 'first-step').unlocked).toBe(true);
  });

  it('R: redacts a locked secret medal title, description and progress', () => {
    const presentation = presentMedal(medal(states(), 'second-chance'));
    expect(presentation.titleKey).toBe('medals.secretTitle');
    expect(presentation.descriptionKey).toBe('medals.secretDescription');
    expect(presentation.progress).toBeNull();
  });

  it('S: Home selects the three most recently unlocked medals when at least three exist', () => {
    const unlocks: MedalUnlock[] = [
      { medalId: 'first-step', unlockedAt: '2026-01-01T12:00:00.000Z' },
      { medalId: 'getting-started', unlockedAt: '2026-01-03T12:00:00.000Z' },
      { medalId: 'century', unlockedAt: '2026-01-02T12:00:00.000Z' },
      { medalId: 'perfect-round', unlockedAt: '2026-01-04T12:00:00.000Z' },
    ];
    expect(selectHomeMedals(states({ unlocks })).map(item => item.definition.id))
      .toEqual(['perfect-round', 'getting-started', 'century']);
  });

  it('T: Home fills fewer than three unlocks with the closest normal locked medals', () => {
    const unlocks = [{ medalId: 'first-step', unlockedAt: '2026-01-01T12:00:00.000Z' }];
    const sessions = Array.from({ length: 9 }, (_, index) => session(`round-${index}`));
    const selected = selectHomeMedals(states({ sessions, unlocks }));
    expect(selected.map(item => item.definition.id)).toEqual(['first-step', 'getting-started', 'century']);
    expect(selected.some(item => item.definition.secret)).toBe(false);
  });
});
