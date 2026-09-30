import { NewCardOrder } from './deck.model';

export type DeckRating = 'again' | 'good';
export type SerializedDeckCardState = 0 | 1 | 2 | 3;

export interface SerializedFsrsCard {
  readonly due: number;
  readonly stability: number;
  readonly difficulty: number;
  readonly elapsedDays: number;
  readonly scheduledDays: number;
  readonly learningSteps: number;
  readonly reps: number;
  readonly lapses: number;
  readonly state: SerializedDeckCardState;
  readonly lastReview: number | null;
}

export interface SerializedFsrsReviewLog {
  readonly rating: number;
  readonly state: SerializedDeckCardState;
  readonly due: number;
  readonly stability: number;
  readonly difficulty: number;
  readonly elapsedDays: number;
  readonly lastElapsedDays: number;
  readonly scheduledDays: number;
  readonly learningSteps: number;
  readonly review: number;
}

export interface DeckCardProgress {
  readonly deckId: string;
  readonly entryId: string;
  readonly due: number;
  readonly state: SerializedDeckCardState;
  readonly card: SerializedFsrsCard;
}

export interface DeckReviewEvent {
  readonly id: string;
  readonly deckId: string;
  readonly entryId: string;
  readonly reviewedAt: number;
  readonly rating: DeckRating;
  readonly fsrsRating: number;
  readonly stateBefore: SerializedDeckCardState;
  readonly stateAfter: SerializedDeckCardState;
  readonly dueBefore: number;
  readonly dueAfter: number;
  readonly stabilityBefore: number;
  readonly stabilityAfter: number;
  readonly difficultyBefore: number;
  readonly difficultyAfter: number;
  readonly retrievabilityBefore: number | null;
  readonly desiredRetention: number;
  readonly elapsedAnswerMs: number;
  readonly fsrsLog: SerializedFsrsReviewLog;
  readonly cardBefore: SerializedFsrsCard | null;
}

export interface DeckDailyState {
  readonly deckId: string;
  readonly localDate: string;
  readonly introducedEntryIds: readonly string[];
  readonly newLimitOverride: number | null;
}

export interface DeckEntryIndexItem {
  readonly id: string;
  readonly order: number;
}

export interface DeckStudyCounts {
  readonly newAvailable: number;
  readonly learningDue: number;
  readonly reviewDue: number;
  readonly introducedToday: number;
  readonly effectiveNewLimit: number;
  readonly nextLearningDue: number | null;
}

export interface DeckQueueSnapshot extends DeckStudyCounts {
  readonly progress: readonly DeckCardProgress[];
  readonly newEntries: readonly DeckEntryIndexItem[];
  readonly learningEntries: readonly DeckCardProgress[];
  readonly reviewEntries: readonly DeckCardProgress[];
  readonly nextDue: number | null;
  readonly remainingUnseen: number;
}

export interface DeckQueueChoice {
  readonly entryId: string;
  readonly kind: 'new' | 'learning' | 'review';
  readonly progress: DeckCardProgress | null;
}

export interface DeckMixedCursor {
  readonly debt: number;
}

export interface DeckQueueDecision {
  readonly choice: DeckQueueChoice | null;
  readonly cursor: DeckMixedCursor;
}

export interface DeckStudyStatistics {
  readonly total: number;
  readonly unseen: number;
  readonly learning: number;
  readonly review: number;
  readonly dueNow: number;
  readonly totalReviews: number;
  readonly again: number;
  readonly good: number;
  readonly observedRetention: number | null;
  readonly trueRetention: number | null;
}

export interface DeckQueueOptions {
  readonly order: NewCardOrder;
  readonly cursor: DeckMixedCursor;
}
