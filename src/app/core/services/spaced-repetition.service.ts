import { Injectable } from '@angular/core';
import { Card, CardInput, createEmptyCard, fsrs, Rating, State } from 'ts-fsrs';
import { FsrsProgress, MemoryState, StudyRating } from '../models/progress.model';

const STATE_TO_MEMORY: Record<State, MemoryState> = {
  [State.New]: 'new',
  [State.Learning]: 'learning',
  [State.Review]: 'review',
  [State.Relearning]: 'relearning',
};

@Injectable({ providedIn: 'root' })
export class SpacedRepetitionService {
  private readonly scheduler = fsrs();

  createInitial(now = new Date()): FsrsProgress {
    return this.serialize(createEmptyCard(now));
  }

  review(current: FsrsProgress | null, rating: StudyRating, now = new Date()): FsrsProgress {
    const card = current ? this.toCard(current) : createEmptyCard(now);
    return this.serialize(this.scheduler.next(card, now, this.toFsrsRating(rating)).card);
  }

  isDue(progress: FsrsProgress, now = new Date()): boolean {
    return new Date(progress.due).getTime() <= now.getTime();
  }

  private toFsrsRating(rating: StudyRating): Rating.Again | Rating.Hard | Rating.Good {
    return rating === 'again' ? Rating.Again : rating === 'hard' ? Rating.Hard : Rating.Good;
  }

  private toCard(progress: FsrsProgress): CardInput {
    const state = ({ new: State.New, learning: State.Learning, review: State.Review,
      relearning: State.Relearning } as const)[progress.state];
    return {
      due: progress.due,
      stability: progress.stability,
      difficulty: progress.difficulty,
      elapsed_days: progress.elapsedDays,
      scheduled_days: progress.scheduledDays,
      learning_steps: progress.learningSteps,
      reps: progress.reps,
      lapses: progress.lapses,
      state,
      last_review: progress.lastReview,
    };
  }

  private serialize(card: Card): FsrsProgress {
    return {
      due: card.due.toISOString(),
      stability: card.stability,
      difficulty: card.difficulty,
      elapsedDays: card.elapsed_days,
      scheduledDays: card.scheduled_days,
      learningSteps: card.learning_steps,
      reps: card.reps,
      lapses: card.lapses,
      state: STATE_TO_MEMORY[card.state],
      lastReview: card.last_review?.toISOString() ?? null,
    };
  }
}
