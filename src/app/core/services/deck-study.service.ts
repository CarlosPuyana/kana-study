import { inject, Injectable } from '@angular/core';
import { State } from 'ts-fsrs';
import { StudyDeck } from '../models/deck.model';
import {
  DeckCardProgress, DeckDailyState, DeckEntryIndexItem, DeckMixedCursor, DeckQueueChoice,
  DeckQueueDecision, DeckQueueSnapshot, DeckRating, DeckReviewEvent, DeckStudyStatistics,
} from '../models/deck-study.model';
import { DeckDatabaseService } from './deck-database.service';
import { DeckSchedulePreview, DeckSchedulerService } from './deck-scheduler.service';
import { DeckSettingsService } from './deck-settings.service';
import { getLocalStudyDayKey } from './deck-study-time';

export const DECK_NEW_LIMIT_STEP = 5;

@Injectable({ providedIn: 'root' })
export class DeckStudyService {
  private readonly database = inject(DeckDatabaseService);
  private readonly scheduler = inject(DeckSchedulerService);
  private readonly settings = inject(DeckSettingsService);

  async snapshot(deck: StudyDeck, index: readonly DeckEntryIndexItem[], now = new Date()): Promise<DeckQueueSnapshot> {
    const localDate = getLocalStudyDayKey(now);
    const [progress, storedDaily] = await Promise.all([
      this.database.getDeckProgress(deck.id),
      this.database.getDailyState(deck.id, localDate),
    ]);
    const daily = storedDaily ?? emptyDailyState(deck.id, localDate);
    const settings = this.settings.settingsFor(deck);
    const byEntry = new Map(progress.map(item => [item.entryId, item]));
    const unseen = index.filter(item => !byEntry.has(item.id)).sort((a, b) => a.order - b.order);
    const effectiveNewLimit = daily.newLimitOverride ?? settings.newCardsPerDay;
    const newAvailable = Math.min(unseen.length, Math.max(0, effectiveNewLimit - daily.introducedEntryIds.length));
    const learning = progress
      .filter(item => isLearning(item) && item.due <= now.getTime())
      .sort((a, b) => a.due - b.due);
    const reviews = progress
      .filter(item => item.card.state === State.Review && item.due <= now.getTime())
      .sort((a, b) => {
        const risk = this.scheduler.retrievability(a, now, settings.desiredRetention)
          - this.scheduler.retrievability(b, now, settings.desiredRetention);
        return risk || a.due - b.due;
      });
    const future = progress.filter(item => item.due > now.getTime());
    const futureLearning = future.filter(isLearning);
    return {
      progress,
      newEntries: unseen.slice(0, newAvailable),
      learningEntries: learning,
      reviewEntries: reviews,
      newAvailable,
      learningDue: learning.length,
      reviewDue: reviews.length,
      introducedToday: daily.introducedEntryIds.length,
      effectiveNewLimit,
      nextLearningDue: minimumDue(futureLearning),
      nextDue: minimumDue(future),
      remainingUnseen: unseen.length,
    };
  }

  chooseNext(snapshot: DeckQueueSnapshot, deck: StudyDeck, cursor: DeckMixedCursor): DeckQueueDecision {
    const learning = snapshot.learningEntries[0];
    if (learning) return { choice: choiceFromProgress(learning, 'learning'), cursor };
    const nextNew = snapshot.newEntries[0];
    const review = snapshot.reviewEntries[0];
    if (!nextNew && !review) return { choice: null, cursor };
    const order = this.settings.settingsFor(deck).newCardOrder;
    if (order === 'before-reviews') {
      return { choice: nextNew ? choiceFromNew(nextNew) : choiceFromProgress(review!, 'review'), cursor };
    }
    if (order === 'after-reviews') {
      return { choice: review ? choiceFromProgress(review, 'review') : choiceFromNew(nextNew!), cursor };
    }
    if (!nextNew) return { choice: choiceFromProgress(review!, 'review'), cursor };
    if (!review) return { choice: choiceFromNew(nextNew), cursor };
    const debt = cursor.debt + snapshot.newEntries.length
      / (snapshot.newEntries.length + snapshot.reviewEntries.length);
    return debt >= 1
      ? { choice: choiceFromNew(nextNew), cursor: { debt: debt - 1 } }
      : { choice: choiceFromProgress(review, 'review'), cursor: { debt } };
  }

  preview(deck: StudyDeck, choice: DeckQueueChoice, now = new Date()): DeckSchedulePreview {
    return this.scheduler.preview(choice.progress, this.settings.settingsFor(deck).desiredRetention, now);
  }

  async rate(
    deck: StudyDeck,
    choice: DeckQueueChoice,
    preview: DeckSchedulePreview,
    rating: DeckRating,
    elapsedAnswerMs: number,
    reviewedAt = new Date(),
  ): Promise<DeckReviewEvent> {
    const branch = this.scheduler.branch(preview, rating);
    const localDate = getLocalStudyDayKey(reviewedAt);
    const daily = await this.database.getDailyState(deck.id, localDate) ?? emptyDailyState(deck.id, localDate);
    const firstIntroduction = choice.progress === null;
    const introducedEntryIds = firstIntroduction && !daily.introducedEntryIds.includes(choice.entryId)
      ? [...daily.introducedEntryIds, choice.entryId]
      : [...daily.introducedEntryIds];
    const nextDaily = { ...daily, introducedEntryIds };
    const progress: DeckCardProgress = {
      deckId: deck.id, entryId: choice.entryId, due: branch.card.due,
      state: branch.card.state, card: branch.card,
    };
    const event: DeckReviewEvent = {
      id: reviewEventId(), deckId: deck.id, entryId: choice.entryId,
      reviewedAt: reviewedAt.getTime(), rating,
      fsrsRating: branch.log.rating,
      stateBefore: preview.cardBefore.state, stateAfter: branch.card.state,
      dueBefore: preview.cardBefore.due, dueAfter: branch.card.due,
      stabilityBefore: preview.cardBefore.stability, stabilityAfter: branch.card.stability,
      difficultyBefore: preview.cardBefore.difficulty, difficultyAfter: branch.card.difficulty,
      retrievabilityBefore: preview.retrievabilityBefore,
      desiredRetention: preview.desiredRetention,
      elapsedAnswerMs: Math.max(0, Math.round(elapsedAnswerMs)),
      fsrsLog: branch.log,
      cardBefore: choice.progress?.card ?? null,
    };
    await this.database.commitReview(progress, event, nextDaily);
    return event;
  }

  async undo(event: DeckReviewEvent): Promise<void> {
    const localDate = getLocalStudyDayKey(new Date(event.reviewedAt));
    const daily = await this.database.getDailyState(event.deckId, localDate)
      ?? emptyDailyState(event.deckId, localDate);
    const introducedEntryIds = event.cardBefore === null
      ? daily.introducedEntryIds.filter(entryId => entryId !== event.entryId)
      : [...daily.introducedEntryIds];
    await this.database.undoReview(event, { ...daily, introducedEntryIds });
  }

  async adjustTodayNewLimit(deck: StudyDeck, delta: number, now = new Date()): Promise<DeckDailyState> {
    const localDate = getLocalStudyDayKey(now);
    const daily = await this.database.getDailyState(deck.id, localDate) ?? emptyDailyState(deck.id, localDate);
    const current = daily.newLimitOverride ?? this.settings.settingsFor(deck).newCardsPerDay;
    const next = { ...daily, newLimitOverride: Math.max(0, current + delta) };
    await this.database.writeDailyState(next);
    return next;
  }

  async statistics(deck: StudyDeck, total: number, now = new Date()): Promise<DeckStudyStatistics> {
    const [progress, events] = await Promise.all([
      this.database.getDeckProgress(deck.id), this.database.getDeckReviewEvents(deck.id),
    ]);
    const learning = progress.filter(isLearning).length;
    const review = progress.filter(item => item.card.state === State.Review).length;
    const dueNow = progress.filter(item => item.due <= now.getTime()).length;
    const again = events.filter(event => event.rating === 'again').length;
    const good = events.length - again;
    const firstPerCardDay = firstReviewPerCardAndLocalDay(events);
    const trueGood = firstPerCardDay.filter(event => event.rating === 'good').length;
    return {
      total, unseen: Math.max(0, total - progress.length), learning, review, dueNow,
      totalReviews: events.length, again, good,
      observedRetention: events.length ? good / events.length : null,
      trueRetention: firstPerCardDay.length ? trueGood / firstPerCardDay.length : null,
    };
  }
}

export function emptyDailyState(deckId: string, localDate: string): DeckDailyState {
  return { deckId, localDate, introducedEntryIds: [], newLimitOverride: null };
}

export function firstReviewPerCardAndLocalDay(events: readonly DeckReviewEvent[]): DeckReviewEvent[] {
  const first = new Map<string, DeckReviewEvent>();
  for (const event of [...events].sort((a, b) => a.reviewedAt - b.reviewedAt)) {
    const key = `${event.entryId}\0${getLocalStudyDayKey(new Date(event.reviewedAt))}`;
    if (!first.has(key)) first.set(key, event);
  }
  return [...first.values()];
}

function isLearning(progress: DeckCardProgress): boolean {
  return progress.card.state === State.Learning || progress.card.state === State.Relearning;
}

function minimumDue(progress: readonly DeckCardProgress[]): number | null {
  return progress.length ? Math.min(...progress.map(item => item.due)) : null;
}

function choiceFromNew(entry: DeckEntryIndexItem): DeckQueueChoice {
  return { entryId: entry.id, kind: 'new', progress: null };
}

function choiceFromProgress(progress: DeckCardProgress, kind: 'learning' | 'review'): DeckQueueChoice {
  return { entryId: progress.entryId, kind, progress };
}

function reviewEventId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `review-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
