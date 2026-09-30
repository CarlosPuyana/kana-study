import { FlagQuestionType, FlagRegion, FlagStudyUnit } from './country.model';
import { FsrsProgress, StudyRating } from './progress.model';

export interface FlagSelection {
  readonly regions: Readonly<Record<FlagRegion, boolean>>;
  readonly questionTypes: readonly FlagQuestionType[];
}

export interface FlagStudyProgress extends FlagStudyUnit {
  readonly fsrs: FsrsProgress;
  readonly firstSeenAt: string;
  readonly lastSeenAt: string;
  readonly totalAttempts: number;
  readonly totalFirstTrySuccesses: number;
  readonly totalFailures: number;
  readonly lastRating: StudyRating | null;
}

export interface FlagReviewEvent extends FlagStudyUnit {
  readonly id: string;
  readonly sessionId: string;
  readonly rating: StudyRating;
  readonly reviewedAt: string;
  readonly fsrsBefore: FsrsProgress | null;
  readonly fsrsAfter: FsrsProgress;
}

export interface FlagRoundSummary {
  readonly enabledRegions: number;
  readonly totalRegions: number;
  readonly enabledQuestionTypes: number;
  readonly totalQuestionTypes: number;
  readonly available: number;
  readonly due: number;
  readonly newCount: number;
  readonly roundSize: number;
  readonly roundDue: number;
  readonly roundNew: number;
}
