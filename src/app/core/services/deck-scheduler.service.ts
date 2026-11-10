import { inject, Injectable, InjectionToken } from '@angular/core';
import { BasicLearningStepsStrategy, StrategyMode, Card, createEmptyCard, fsrs, generatorParameters, Rating, State } from 'ts-fsrs';
import { DeckCardProgress, DeckRating, SerializedFsrsCard, SerializedFsrsReviewLog } from '../models/deck-study.model';
import { deserializeDeckCard, deserializeDeckReviewLog, serializeDeckCard, serializeDeckReviewLog } from './deck-study-serialization';
import { DeckSettings } from '../models/deck.model';
import { DEFAULT_DECK_LEARNING_STEPS, DEFAULT_DECK_RELEARNING_STEPS,validDeckLearningOptions } from './deck-learning-options';
import {getLocalStudyDayKey} from './deck-study-time';

export function deckPreviewExpired(preview:DeckSchedulePreview,now:Date):boolean {
  return Math.floor(preview.generatedAt/86400000)!==Math.floor(now.getTime()/86400000)
    ||getLocalStudyDayKey(new Date(preview.generatedAt))!==getLocalStudyDayKey(now);
}

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

  preview(progress: DeckCardProgress | null, desiredRetention: number, now = new Date(), options:Pick<DeckSettings,'learningSteps'|'relearningSteps'>={}): DeckSchedulePreview {
    const scheduler = this.scheduler(desiredRetention,options);
    const card = progress ? deserializeDeckCard(progress.card) : createEmptyCard(now);
    const result = scheduler.repeat(card, now);
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

  branch(preview: DeckSchedulePreview, rating: DeckRating, reviewedAt?:Date): DeckScheduleBranch {
    if(reviewedAt&&deckPreviewExpired(preview,reviewedAt))throw new Error('Deck preview expired');
    const branch=rating === 'again' ? preview.again : preview.good;
    if(!reviewedAt||reviewedAt.getTime()===preview.generatedAt)return branch;
    // One FSRS/fuzz computation per reveal. Anchor its displayed interval to the real
    // response, including early steps; never pretend that the scheduled due time elapsed.
    const at=reviewedAt.getTime();
    const due=at+(branch.card.due-preview.generatedAt);
    return {card:{...branch.card,due,lastReview:at},log:{...branch.log,review:at}};
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

  private scheduler(desiredRetention: number,options:Pick<DeckSettings,'learningSteps'|'relearningSteps'>={}) {
    if(!validDeckLearningOptions(options))throw new Error('Invalid deck learning steps');
    return fsrs(generatorParameters({
      request_retention: desiredRetention,
      enable_short_term: true,
      learning_steps: (options.learningSteps??DEFAULT_DECK_LEARNING_STEPS).map(n=>`${n}m` as const),
      relearning_steps: (options.relearningSteps??DEFAULT_DECK_RELEARNING_STEPS).map(n=>`${n}m` as const),
      maximum_interval: DECK_MAXIMUM_INTERVAL,
      enable_fuzz: this.enableFuzz,
    })).useStrategy(StrategyMode.LEARNING_STEPS,(params,state,step)=>{
      // Anki clamps the effective step after options change. Preserve the stored
      // snapshot/log; only interpret the next answer against the current preset.
      const steps=state===State.Review||state===State.Relearning?params.relearning_steps:params.learning_steps;
      return BasicLearningStepsStrategy(params,state,state===State.Review?0:Math.min(step,steps.length-1));
    });
  }
}
