import { Card, CardInput, ReviewLog, ReviewLogInput, State } from 'ts-fsrs';
import { SerializedFsrsCard, SerializedFsrsReviewLog } from '../models/deck-study.model';

export function serializeDeckCard(card: Card): SerializedFsrsCard {
  return {
    due: card.due.getTime(), stability: card.stability, difficulty: card.difficulty,
    elapsedDays: card.elapsed_days, scheduledDays: card.scheduled_days,
    learningSteps: card.learning_steps, reps: card.reps, lapses: card.lapses,
    state: card.state, lastReview: card.last_review?.getTime() ?? null,
  };
}

export function deserializeDeckCard(card: SerializedFsrsCard): CardInput {
  return {
    due: new Date(card.due), stability: card.stability, difficulty: card.difficulty,
    elapsed_days: card.elapsedDays, scheduled_days: card.scheduledDays,
    learning_steps: card.learningSteps, reps: card.reps, lapses: card.lapses,
    state: card.state, last_review: card.lastReview === null ? null : new Date(card.lastReview),
  };
}

export function serializeDeckReviewLog(log: ReviewLog): SerializedFsrsReviewLog {
  return {
    rating: log.rating, state: log.state, due: log.due.getTime(), stability: log.stability,
    difficulty: log.difficulty, elapsedDays: log.elapsed_days,
    lastElapsedDays: log.last_elapsed_days, scheduledDays: log.scheduled_days,
    learningSteps: log.learning_steps, review: log.review.getTime(),
  };
}

export function deserializeDeckReviewLog(log: SerializedFsrsReviewLog): ReviewLogInput {
  return {
    rating: log.rating, state: log.state, due: new Date(log.due), stability: log.stability,
    difficulty: log.difficulty, elapsed_days: log.elapsedDays,
    last_elapsed_days: log.lastElapsedDays, scheduled_days: log.scheduledDays,
    learning_steps: log.learningSteps, review: new Date(log.review),
  };
}

export function isLearningState(state: State): boolean {
  return state === State.Learning || state === State.Relearning;
}
