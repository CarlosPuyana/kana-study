import { MangaStudySavedItem } from './manga-study-saved.model';

export const MANGA_REVIEW_EVENTS_KEY = 'kana-study.manga-review-events.v1';
export type MangaExerciseType = 'meaning' | 'expression' | 'reading' | 'context';
export type MangaReviewMode = 'mixed' | 'contextual';
export interface MangaReviewEvent {
  readonly id: string;
  readonly key: string;
  readonly savedItemId: string;
  readonly sessionId: string;
  readonly reviewedAt: string;
  readonly exerciseType: MangaExerciseType;
  readonly correct: boolean;
  readonly repetition: boolean;
  readonly answerMode: 'automatic' | 'self-assessment';
  readonly rating: 'good' | 'again';
}
export interface MangaReviewQuestion {
  readonly item: MangaStudySavedItem;
  readonly type: MangaExerciseType;
  readonly answer: string;
  readonly prompt: string;
  readonly options: readonly string[];
  readonly originalMeaning: boolean;
  readonly context?: {before: string; surface: string; after: string};
}
export interface MangaReviewResult {
  readonly uniqueWords: number;
  readonly firstCorrect: number;
  readonly initialErrors: number;
  readonly recovered: number;
  readonly remainingErrors: number;
  readonly appearances: number;
  readonly accuracy: number;
}
