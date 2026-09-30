import { KanjiQuestionType, KanjiStudyUnit } from './kanji.model';
import { FsrsProgress, StudyRating } from './progress.model';

export interface KanjiSelection { readonly levels: Readonly<Record<'N5', boolean>>; readonly questionTypes: readonly KanjiQuestionType[]; }
export interface KanjiStudyProgress extends KanjiStudyUnit { readonly fsrs: FsrsProgress; readonly firstSeenAt:string; readonly lastSeenAt:string; readonly totalAttempts:number; readonly totalFirstTrySuccesses:number; readonly totalFailures:number; readonly lastRating:StudyRating|null; }
export interface KanjiReviewEvent extends KanjiStudyUnit { readonly id:string; readonly sessionId:string; readonly rating:StudyRating; readonly reviewedAt:string; readonly fsrsBefore:FsrsProgress|null; readonly fsrsAfter:FsrsProgress; }
export interface KanjiRoundSummary { readonly enabledLevels:number; readonly totalLevels:number; readonly enabledQuestionTypes:number; readonly totalQuestionTypes:number; readonly available:number; readonly due:number; readonly newCount:number; readonly roundSize:number; readonly roundDue:number; readonly roundNew:number; }
