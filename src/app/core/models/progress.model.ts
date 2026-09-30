export type QuestionType =
  | 'kana-to-romaji'
  | 'romaji-to-kana'
  | 'audio-to-romaji'
  | 'audio-to-kana';

export const QUESTION_TYPES: readonly QuestionType[] = [
  'kana-to-romaji', 'romaji-to-kana', 'audio-to-romaji', 'audio-to-kana',
];

export type StudyRating = 'again' | 'hard' | 'good';
export type MemoryState = 'new' | 'learning' | 'review' | 'relearning';
export type LearningStatus = 'new' | 'learning' | 'memorized';

export interface StudyUnit {
  readonly key: string;
  readonly kanaId: string;
  readonly questionType: QuestionType;
}

export interface FsrsProgress {
  readonly due: string;
  readonly stability: number;
  readonly difficulty: number;
  readonly elapsedDays: number;
  readonly scheduledDays: number;
  readonly learningSteps: number;
  readonly reps: number;
  readonly lapses: number;
  readonly state: MemoryState;
  readonly lastReview: string | null;
}

export interface StudyProgress extends StudyUnit {
  readonly fsrs: FsrsProgress;
  readonly firstSeenAt: string;
  readonly lastSeenAt: string;
  readonly totalAttempts: number;
  readonly totalFirstTrySuccesses: number;
  readonly totalFailures: number;
  readonly lastRating: StudyRating | null;
}

export interface ReviewEvent extends StudyUnit {
  readonly id: string;
  readonly sessionId: string;
  readonly rating: StudyRating;
  readonly reviewedAt: string;
  readonly fsrsBefore: FsrsProgress | null;
  readonly fsrsAfter: FsrsProgress;
}

export interface ProgressStats {
  readonly total: number;
  readonly newCount: number;
  readonly pendingCount: number;
  readonly memorizedCount: number;
  readonly dueCount: number;
  readonly percentage: number;
}

export interface RoundSummary {
  readonly enabledCategories: number;
  readonly totalCategories: number;
  readonly enabledQuestionTypes: number;
  readonly totalQuestionTypes: number;
  readonly available: number;
  readonly due: number;
  readonly newCount: number;
  readonly roundSize: number;
  readonly roundDue: number;
  readonly roundNew: number;
}
