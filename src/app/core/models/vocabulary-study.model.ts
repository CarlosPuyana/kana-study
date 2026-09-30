import { FsrsProgress, StudyRating } from './progress.model';
import { VocabularyQuestionType, VocabularyStudyCategory, VocabularyStudyUnit } from './vocabulary.model';

export interface VocabularySelection {
  readonly levels: Readonly<Record<'N5', boolean>>;
  readonly categories: Readonly<Record<VocabularyStudyCategory, boolean>>;
  readonly questionTypes: readonly VocabularyQuestionType[];
}
export interface VocabularyStudyProgress extends VocabularyStudyUnit { readonly fsrs:FsrsProgress; readonly firstSeenAt:string; readonly lastSeenAt:string; readonly totalAttempts:number; readonly totalFirstTrySuccesses:number; readonly totalFailures:number; readonly lastRating:StudyRating|null }
export interface VocabularyReviewEvent extends VocabularyStudyUnit { readonly id:string; readonly sessionId:string; readonly rating:StudyRating; readonly reviewedAt:string; readonly fsrsBefore:FsrsProgress|null; readonly fsrsAfter:FsrsProgress }
export interface VocabularyRoundSummary { readonly enabledLevels:number; readonly totalLevels:number; readonly enabledCategories:number; readonly totalCategories:number; readonly enabledQuestionTypes:number; readonly totalQuestionTypes:number; readonly available:number; readonly due:number; readonly newCount:number; readonly roundSize:number; readonly roundDue:number; readonly roundNew:number }
