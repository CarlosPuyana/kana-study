import { StudyRating, StudyUnit } from './progress.model';
import { FlagQuestionType, FlagRegion } from './country.model';
import { KanjiQuestionType } from './kanji.model';
import { VocabularyQuestionType, VocabularyStudyCategory } from './vocabulary.model';

export type LearningMode = 'quick-practice' | 'self-assessment';

export interface SessionItem {
  readonly studyKey: string;
  attempts: number;
  appearances: number;
  initialRating: StudyRating | null;
  resolved: boolean;
  needsPractice: boolean;
}

export interface LearningSession {
  readonly id: string;
  readonly startedAt: string;
  completedAt: string | null;
  readonly mode: LearningMode;
  readonly sessionSize: number;
  readonly units: readonly StudyUnit[];
  readonly items: SessionItem[];
  attempts: number;
}

export interface SessionFeedback {
  readonly correct: boolean;
  readonly selected: string;
  readonly answer: string;
}

export interface CompletedSessionSummary {
  readonly sessionId: string;
  readonly completedAt: string;
  readonly mode: LearningMode;
  readonly exercisesCompleted: number;
  readonly firstTrySuccesses: number;
  readonly attempts: number;
  readonly needsPracticeCount: number;
  readonly durationSeconds: number;
  readonly module?: 'kana' | 'flags' | 'kanji' | 'vocabulary' | 'grammar' | 'manga';
  readonly mangaResult?: import('./manga-review.model').MangaReviewResult;
  readonly questionTypes?: readonly (FlagQuestionType | KanjiQuestionType | VocabularyQuestionType)[];
  readonly grammarTopicIds?: readonly string[];
  readonly grammarLessonIds?: readonly string[];
  readonly grammarExerciseIds?: readonly string[];
  readonly countryIds?: readonly string[];
  readonly studyRegions?: readonly FlagRegion[];
  readonly kanjiIds?: readonly string[];
  readonly vocabularyEntryIds?: readonly string[];
  readonly vocabularyCategories?: readonly VocabularyStudyCategory[];
}
