import { inject, Injectable } from '@angular/core';
import { State } from 'ts-fsrs';
import { DeckDefinition } from '../models/deck-catalog.model';
import {
  DeckCardProgress, DeckDailyState, DeckEntryIndexItem, DeckMixedCursor, DeckQueueChoice,
  DeckQueueDecision, DeckQueueSnapshot, DeckRating, DeckReviewEvent, DeckStudyStatistics,
} from '../models/deck-study.model';
import { DeckPersistenceRouter } from './deck-persistence-router';
import { DeckSchedulePreview, DeckSchedulerService } from './deck-scheduler.service';
import { DeckSettingsService } from './deck-settings.service';
import { DECK_LEARNING_AHEAD_MS, deckCardEligible, getLocalStudyDayKey, localStudyDayStart, nextLocalStudyDayStart } from './deck-study-time';

export const DECK_NEW_LIMIT_STEP = 5;
export { DECK_LEARNING_AHEAD_MS } from './deck-study-time';

@Injectable({ providedIn: 'root' })
export class DeckStudyService {
  private readonly database = inject(DeckPersistenceRouter);
  private readonly scheduler = inject(DeckSchedulerService);
  private readonly settings = inject(DeckSettingsService);

  private readonly retries = new WeakMap<DeckSchedulePreview, Map<string, DeckReviewEvent>>();

  async snapshot(deck: DeckDefinition, index: readonly DeckEntryIndexItem[], now = new Date()): Promise<DeckQueueSnapshot> {
    const database = this.database.bind(deck.id);
    const localDate = getLocalStudyDayKey(now);
    const [progress, storedDaily] = await Promise.all([
      database.getDeckProgress(deck.id),
      database.getDailyState(deck.id, localDate),
    ]);
    const daily = storedDaily ?? emptyDailyState(deck.id, localDate);
    const settings = this.settings.settingsFor(deck);
    const byEntry = new Map(progress.map(item => [item.entryId, item]));
    const unseen = index.filter(item => !byEntry.has(item.id)).sort((a, b) => a.order - b.order);
    const effectiveNewLimit = daily.newLimitOverride ?? settings.newCardsPerDay;
    // Historical completion closes new introductions, but must never hide valid
    // Learning/Relearning or daily reviews arriving from old state or sync.
    const newAvailable = daily.completedAt != null ? 0 : Math.min(unseen.length, Math.max(0, effectiveNewLimit - new Set(daily.introducedEntryIds).size));
    const learning = progress
      .filter(item => isLearning(item) && item.due <= now.getTime())
      .sort(dueOrder);
    const reviews = progress
      .filter(item => item.card.state === State.Review && getLocalStudyDayKey(new Date(item.due)) <= localDate)
      .sort((a, b) => {
        const risk = this.scheduler.retrievability(a, now, settings.desiredRetention)
          - this.scheduler.retrievability(b, now, settings.desiredRetention);
        return risk || dueOrder(a,b);
      });
    const futureLearning = progress.filter(item=>isLearning(item)&&item.due>now.getTime()).sort(dueOrder);
    const pendingToday=futureLearning.filter(item=>getLocalStudyDayKey(new Date(item.due))===localDate);
    const advanceEntries=pendingToday.filter(item=>item.due<=now.getTime()+DECK_LEARNING_AHEAD_MS);
    const futureReviews=progress.filter(item=>item.card.state===State.Review&&getLocalStudyDayKey(new Date(item.due))>localDate);
    const nextDue=Math.min(...futureLearning.map(item=>item.due),...futureReviews.map(item=>localStudyDayStart(new Date(item.due))));
    const completedToday=daily.completedAt!=null&&!learning.length&&!reviews.length&&!pendingToday.length;
    const nextRefreshAt=Math.min(nextLocalStudyDayStart(now),...pendingToday.map(item=>item.due>now.getTime()+DECK_LEARNING_AHEAD_MS?item.due-DECK_LEARNING_AHEAD_MS:item.due));
    return {
      completedToday,
      progress,
      newEntries: unseen.slice(0, newAvailable),
      learningEntries: learning,
      reviewEntries: reviews,
      newAvailable,
      learningDue: learning.length,
      learningPending:pendingToday.length,
      learningAhead:advanceEntries.length,
      advanceEntries,
      nextRefreshAt,
      reviewDue: reviews.length,
      introducedToday: new Set(daily.introducedEntryIds).size,
      effectiveNewLimit,
      nextLearningDue: minimumDue(futureLearning),
      nextDue: Number.isFinite(nextDue)?nextDue:null,
      remainingUnseen: unseen.length,
    };
  }

  chooseNext(snapshot: DeckQueueSnapshot, deck: DeckDefinition, cursor: DeckMixedCursor): DeckQueueDecision {
    if (snapshot.completedToday) return { choice: null, cursor };
    const learning = snapshot.learningEntries[0];
    if(learning)return {choice:choiceFromProgress(learning,'learning'),cursor};
    const nextNew = snapshot.newEntries[0];
    const review = snapshot.reviewEntries[0];
    const reviewChoice = review ? choiceFromProgress(review,'review') : null;
    if (!nextNew && !review) {
      const ahead=snapshot.advanceEntries?.[0];
      return { choice:ahead?{...choiceFromProgress(ahead,'learning'),advanced:true}:null,cursor };
    }
    const order = this.settings.settingsFor(deck).newCardOrder;
    if (order === 'before-reviews') {
      return { choice: nextNew ? choiceFromNew(nextNew) : reviewChoice, cursor };
    }
    if (order === 'after-reviews') {
      return { choice: reviewChoice ?? choiceFromNew(nextNew!), cursor };
    }
    if (!nextNew) return { choice: reviewChoice, cursor };
    if (!review) return { choice: choiceFromNew(nextNew), cursor };
    const debt = cursor.debt + snapshot.newEntries.length
      / (snapshot.newEntries.length + snapshot.reviewEntries.length + snapshot.learningEntries.length);
    return debt >= 1
      ? { choice: choiceFromNew(nextNew), cursor: { debt: debt - 1 } }
      : { choice: reviewChoice, cursor: { debt } };
  }

  preview(deck: DeckDefinition, choice: DeckQueueChoice, now = new Date()): DeckSchedulePreview {
    return this.scheduler.preview(choice.progress, this.settings.settingsFor(deck).desiredRetention, now);
  }

  async rate(
    deck: DeckDefinition,
    choice: DeckQueueChoice,
    preview: DeckSchedulePreview,
    rating: DeckRating,
    elapsedAnswerMs: number,
    reviewedAt = new Date(),
  ): Promise<DeckReviewEvent> {
    const database = this.database.bind(deck.id);
    const retryKey=JSON.stringify([database.workspace,deck.id,choice.entryId,rating]);
    const cached = deck.id.startsWith('md-') ? this.retries.get(preview)?.get(retryKey) : undefined;
    const branch = this.scheduler.branch(preview, rating, cached?new Date(cached.reviewedAt):reviewedAt);
    const localDate = getLocalStudyDayKey(cached ? new Date(cached.reviewedAt) : reviewedAt);
    const daily = await database.getDailyState(deck.id, localDate) ?? emptyDailyState(deck.id, localDate);
    const answerAt=cached?new Date(cached.reviewedAt):reviewedAt;
    const validPending=choice.progress&&deckCardEligible(choice.progress.card,answerAt,true);
    if (daily.completedAt != null && !validPending && !cached) throw new Error('Daily deck session is completed.');
    const firstIntroduction = choice.progress === null;
    if (!cached && firstIntroduction && !daily.introducedEntryIds.includes(choice.entryId)
      && new Set(daily.introducedEntryIds).size >= (daily.newLimitOverride ?? this.settings.settingsFor(deck).newCardsPerDay)) {
      throw new Error('Daily new-card limit reached.');
    }
    const introducedEntryIds = firstIntroduction && !daily.introducedEntryIds.includes(choice.entryId)
      ? [...daily.introducedEntryIds, choice.entryId]
      : [...daily.introducedEntryIds];
    const nextDaily = { ...daily, introducedEntryIds };
    const progress: DeckCardProgress = {
      deckId: deck.id, entryId: choice.entryId, due: branch.card.due,
      state: branch.card.state, card: branch.card,
    };
    const event: DeckReviewEvent = cached ?? {
      id: reviewEventId(), deckId: deck.id, entryId: choice.entryId,
      reviewedAt: reviewedAt.getTime(), rating,
      fsrsRating: branch.log.rating,
      stateBefore: preview.cardBefore.state, stateAfter: branch.card.state,
      dueBefore: preview.cardBefore.due, dueAfter: branch.card.due,
      stabilityBefore: preview.cardBefore.stability, stabilityAfter: branch.card.stability,
      difficultyBefore: preview.cardBefore.difficulty, difficultyAfter: branch.card.difficulty,
      retrievabilityBefore: preview.retrievabilityBefore,
      desiredRetention: preview.desiredRetention,
      elapsedAnswerMs: Math.min(10_000, Math.max(0, Math.round(elapsedAnswerMs))),
      fsrsLog: branch.log,
      cardBefore: choice.progress?.card ?? null,
    };
    if (deck.id.startsWith('md-')) { const ratings = this.retries.get(preview) ?? new Map(); ratings.set(retryKey, event); this.retries.set(preview, ratings); }
    database.assertOwner();
    await database.commitReview(progress, event, nextDaily);
    return event;
  }

  async undo(event: DeckReviewEvent): Promise<void> {
    const database = this.database.bind(event.deckId);
    const localDate = getLocalStudyDayKey(new Date(event.reviewedAt));
    const daily = await database.getDailyState(event.deckId, localDate)
      ?? emptyDailyState(event.deckId, localDate);
    const introducedEntryIds = event.cardBefore === null
      ? daily.introducedEntryIds.filter(entryId => entryId !== event.entryId)
      : [...daily.introducedEntryIds];
    await database.undoReview(event, { ...daily, completedAt:null, introducedEntryIds });
  }

  async adjustTodayNewLimit(deck: DeckDefinition, delta: number, now = new Date()): Promise<DeckDailyState> {
    const database = this.database.bind(deck.id);
    const localDate = getLocalStudyDayKey(now);
    const daily = await database.getDailyState(deck.id, localDate) ?? emptyDailyState(deck.id, localDate);
    const current = daily.newLimitOverride ?? this.settings.settingsFor(deck).newCardsPerDay;
    const next = { ...daily, ...(delta>0&&daily.completedAt!=null?{completedAt:null}:{}), newLimitOverride: Math.max(0, current + delta) };
    await database.writeDailyState(next);
    return next;
  }

  async completeSession(deck: DeckDefinition, index: readonly DeckEntryIndexItem[], now = new Date()): Promise<void> {
    const database = this.database.bind(deck.id);
    const snapshot = await this.snapshot(deck, index, now);
    if (snapshot.completedToday || snapshot.newAvailable || snapshot.learningDue || snapshot.reviewDue || snapshot.learningPending) return;
    database.assertOwner();
    const localDate = getLocalStudyDayKey(now);
    const daily = await database.getDailyState(deck.id, localDate) ?? emptyDailyState(deck.id, localDate);
    await database.writeDailyState({ ...daily, completedAt: now.getTime() });
  }

  async statistics(deck: DeckDefinition, total: number, now = new Date()): Promise<DeckStudyStatistics> {
    const database = this.database.bind(deck.id);
    const [progress, events] = await Promise.all([
      database.getDeckProgress(deck.id), database.getDeckReviewEvents(deck.id),
    ]);
    const learning = progress.filter(isLearning).length;
    const review = progress.filter(item => item.card.state === State.Review).length;
    const dueNow = progress.filter(item => eligibleExisting(item,now)).length;
    const futureLearning=progress.filter(item=>isLearning(item)&&item.due>now.getTime());
    const again = events.filter(event => event.rating === 'again').length;
    const good = events.length - again;
    const firstPerCardDay = firstReviewPerCardAndLocalDay(events);
    const trueGood = firstPerCardDay.filter(event => event.rating === 'good').length;
    return {
      total, unseen: Math.max(0, total - progress.length), learning, review, dueNow,
      learningPending:futureLearning.filter(item=>getLocalStudyDayKey(new Date(item.due))===getLocalStudyDayKey(now)).length,
      nextRefreshAt:Math.min(nextLocalStudyDayStart(now),...futureLearning.map(item=>item.due)),
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

function eligibleExisting(progress:DeckCardProgress,now:Date):boolean {
  return deckCardEligible(progress.card,now);
}
function dueOrder(a:DeckCardProgress,b:DeckCardProgress):number {return a.due-b.due||a.entryId.localeCompare(b.entryId);}

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
