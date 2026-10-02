import { inject, Injectable, InjectionToken } from '@angular/core';
import { Card, createEmptyCard, fsrs, generatorParameters, Rating, State } from 'ts-fsrs';
import { DeckCardProgress, DeckRating, SerializedFsrsCard, SerializedFsrsReviewLog } from '../models/deck-study.model';
import { deserializeDeckCard, deserializeDeckReviewLog, serializeDeckCard, serializeDeckReviewLog } from './deck-study-serialization';

export const DECK_SCHEDULER_ENABLE_FUZZ = new InjectionToken<boolean>('DECK_SCHEDULER_ENABLE_FUZZ', {
  providedIn: 'root', factory: () => true,
});

export const DECK_LEARNING_STEPS = ['1m', '10m'] as const;
export const DECK_RELEARNING_STEPS = ['10m'] as const;
export const DECK_MAXIMUM_INTERVAL = 36_500;

export interface DeckScheduleBranch {
  readonly card: SerializedFsrsCard;
  readonly log: SerializedFsrsReviewLog;
}

export interface DeckSchedulePreview {
  readonly generatedAt: number;
  readonly desiredRetention: number;
  readonly cardBefore: SerializedFsrsCard;
  readonly retrievabilityBefore: number | null;
  readonly again: DeckScheduleBranch;
  readonly good: DeckScheduleBranch;
}

@Injectable({ providedIn: 'root' })
export class DeckSchedulerService {
  private readonly enableFuzz = inject(DECK_SCHEDULER_ENABLE_FUZZ);

  preview(progress: DeckCardProgress | null, desiredRetention: number, now = new Date()): DeckSchedulePreview {
    const scheduler = this.scheduler(desiredRetention);
    const card = progress ? deserializeDeckCard(progress.card) : createEmptyCard(now);
    const result = scheduler.repeat(card, now);
    const good = result[Rating.Good];
    // Only the initial graduation uses a one-day interval; FSRS retains its memory parameters.
    if ((card.state === State.New || card.state === State.Learning) && good.card.state === State.Review) {
      good.card = { ...good.card, due: new Date(now.getTime() + 86_400_000), scheduled_days: 1 };
    }
    return {
      generatedAt: now.getTime(),
      desiredRetention,
      cardBefore: serializeDeckCard(card as Card),
      retrievabilityBefore: progress?.card.state === State.New
        ? null
        : progress ? scheduler.get_retrievability(card, now, false) : null,
      again: { card: serializeDeckCard(result[Rating.Again].card), log: serializeDeckReviewLog(result[Rating.Again].log) },
      good: { card: serializeDeckCard(result[Rating.Good].card), log: serializeDeckReviewLog(result[Rating.Good].log) },
    };
  }

  branch(preview: DeckSchedulePreview, rating: DeckRating): DeckScheduleBranch {
    return rating === 'again' ? preview.again : preview.good;
  }

  rollback(after: SerializedFsrsCard, log: SerializedFsrsReviewLog, desiredRetention: number): SerializedFsrsCard {
    const previous = this.scheduler(desiredRetention).rollback(
      deserializeDeckCard(after),
      deserializeDeckReviewLog(log),
    );
    return serializeDeckCard(previous);
  }

  retrievability(progress: DeckCardProgress, now = new Date(), desiredRetention = 0.9): number {
    if (progress.card.state === State.New) return 1;
    return this.scheduler(desiredRetention).get_retrievability(deserializeDeckCard(progress.card), now, false);
  }

  private scheduler(desiredRetention: number) {
    return fsrs(generatorParameters({
      request_retention: desiredRetention,
      enable_short_term: false,
      learning_steps: DECK_LEARNING_STEPS,
      relearning_steps: DECK_RELEARNING_STEPS,
      maximum_interval: DECK_MAXIMUM_INTERVAL,
      enable_fuzz: this.enableFuzz,
    }));
  }
}
