import { Country, FlagStudyUnit } from './country.model';
import { StudyRating } from './progress.model';

export interface FlagSessionItem {
  readonly studyKey: string;
  attempts: number;
  appearances: number;
  initialRating: StudyRating | null;
  resolved: boolean;
  needsPractice: boolean;
}

export interface FlagLearningSession {
  readonly id: string;
  readonly startedAt: string;
  completedAt: string | null;
  readonly sessionSize: number;
  readonly units: readonly FlagStudyUnit[];
  readonly items: readonly FlagSessionItem[];
  attempts: number;
}

export interface FlagQuestionOption {
  readonly id: string;
  readonly label: string;
  readonly flagCode: string | null;
  readonly correct: boolean;
}

export interface FlagSessionFeedback {
  readonly correct: boolean;
  readonly selectedId: string;
  readonly correctId: string;
}

export interface FlagQuestion {
  readonly country: Country;
  readonly options: readonly FlagQuestionOption[];
}
