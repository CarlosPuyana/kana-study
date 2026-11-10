import {CARD_STUDY_LIMIT_MS} from './card-study-time';
import { compareDeckId } from './deck-daily-queue';
import { DeckMixCheckpointService, MixContext } from './deck-mix-checkpoint.service';
import {WorkspaceService} from './workspace.service';
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
import { deckCardEligible, getLocalStudyDayKey, localStudyDayStart, nextLocalStudyDayStart } from './deck-study-time';

export const DECK_NEW_LIMIT_STEP = 5;
export { DECK_LEARNING_AHEAD_MS } from './deck-study-time';

@Injectable({ providedIn: 'root' })
export class DeckStudyService {
  private readonly database = inject(DeckPersistenceRouter);
  private readonly workspace = inject(WorkspaceService);
  private readonly scheduler = inject(DeckSchedulerService);
  private readonly settings = inject(DeckSettingsService);
  private readonly mixing = inject(DeckMixCheckpointService);
  private readonly mixSnapshots = new WeakMap<DeckQueueSnapshot, MixContext & { owner: string }>();
  private readonly mixChoices = new WeakMap<DeckQueueChoice, { context: MixContext; before: number; after: number; owner: string }>();

  private readonly retries = new WeakMap<DeckSchedulePreview, Map<string, DeckReviewEvent>>();
  // Receipt order disambiguates live answers sharing a millisecond. It never changes
  // timestamps or persisted events; reload uses the deterministic historical tie policy.
  private readonly receiptOrders = new Map<string, Map<string, number>>();
  private orderFor(workspace: string, deckId: string, day: string): Map<string, number> {
    const scope = JSON.stringify([workspace, deckId, day]);
    let order = this.receiptOrders.get(scope);
    if (!order) {
      const prefix = JSON.stringify([workspace, deckId]).slice(0, -1) + ',';
      for (const key of this.receiptOrders.keys()) if (key.startsWith(prefix)) this.receiptOrders.delete(key);
      order = new Map(); this.receiptOrders.set(scope, order);
    }
    return order;
  }

  async snapshot(deck: DeckDefinition, index: readonly DeckEntryIndexItem[], now = new Date()): Promise<DeckQueueSnapshot> {
    const database = this.database.bind(deck.id);
    const localDate = getLocalStudyDayKey(now);
    const [storedProgress, storedDaily, events] = await Promise.all([
      database.getDeckProgress(deck.id),
      database.getDailyState(deck.id, localDate),
      database.getDeckReviewEvents(deck.id),
    ]);
    const active = new Set(index.map(entry => entry.id));
    const progress = storedProgress.filter(item => item.deckId === deck.id && active.has(item.entryId));
    const daily = storedDaily ?? emptyDailyState(deck.id, localDate);
    const settings = this.settings.settingsFor(deck);
    const byEntry = new Map(progress.map(item => [item.entryId, item]));
    const unseen = [...new Map(index.map(item => [item.id, item])).values()].filter(item => (!byEntry.has(item.id) || byEntry.get(item.id)!.card.state === State.New)).sort((a, b) => a.order - b.order || compareDeckId(a.id, b.id));
    const effectiveNewLimit = daily.newLimitOverride ?? settings.newCardsPerDay;
    // Historical completion closes new introductions, but must never hide valid
    // Learning/Relearning or daily reviews arriving from old state or sync.
    const newAvailable = Math.min(unseen.length, Math.max(0, effectiveNewLimit - new Set(daily.introducedEntryIds).size));
    const eligible = progress.filter(item => deckCardEligible(item.card, now)).sort(dueOrder);
    const learning = eligible.filter(isLearning);
    const reviews = eligible.filter(item => item.card.state === State.Review);
    const future = progress.filter(item => [State.Learning, State.Relearning, State.Review].includes(item.card.state)
      && !deckCardEligible(item.card, now));
    const futureLearning = future.filter(isLearning);
    const nextDue = Math.min(...future.map(item => isLearning(item)?item.due:localStudyDayStart(new Date(item.due))));
    const completedToday = daily.completedAt != null && !eligible.length && !futureLearning.length && !newAvailable;
    const nextRefreshAt = Math.min(nextLocalStudyDayStart(now),nextDue);
    const mix = await this.mixing.context(deck.id, localDate, [...new Set(events.filter(e => e.deckId === deck.id
      && e.reviewedAt <= now.getTime() && getLocalStudyDayKey(new Date(e.reviewedAt)) === localDate).map(e => e.id))]);
    database.assertOwner();
    const receiptOrder = this.orderFor(database.workspace, deck.id, localDate);
    for (const id of mix.receiptOrder) if (!receiptOrder.has(id)) receiptOrder.set(id, receiptOrder.size);
    const snapshot: DeckQueueSnapshot = {
      newLimitOverride: daily.newLimitOverride,
      introductionsClosed: false,
      mixedCursor: { debt: mix.debt },
      separation: [],
      completedToday,
      progress,
      newEntries: unseen.slice(0, newAvailable),
      learningEntries: learning,
      reviewEntries: reviews,
      newAvailable,
      learningDue: learning.length,
      learningPending:futureLearning.length,
      learningAhead:0,
      advanceEntries: [],
      nextRefreshAt,
      reviewDue: reviews.length,
      introducedToday: new Set(daily.introducedEntryIds).size,
      effectiveNewLimit,
      nextLearningDue: minimumDue(futureLearning),
      nextDue: Number.isFinite(nextDue)?nextDue:null,
      remainingUnseen: unseen.length,
    };
    this.mixSnapshots.set(snapshot, { ...mix, owner: database.workspace });
    return snapshot;
  }

  chooseNext(snapshot: DeckQueueSnapshot, deck: DeckDefinition, cursor: DeckMixedCursor): DeckQueueDecision {
    cursor = snapshot.mixedCursor ?? cursor;
    if (snapshot.completedToday) return { choice: null, cursor };
    const before = snapshot.mixedCursor?.debt ?? cursor.debt;
    if(snapshot.learningEntries.length){const choice=choiceFromProgress([...snapshot.learningEntries].sort(dueOrder)[0],'learning');this.rememberMix(snapshot,choice,before,before);return {choice,cursor};}
    const scheduled = [...snapshot.reviewEntries].sort(dueOrder)
      .map(progress => choiceFromProgress(progress, isLearning(progress) ? 'learning' : 'review'));
    const fresh = snapshot.newEntries.map(entry => ({...choiceFromNew(entry), progress: snapshot.progress.find(p => p.entryId === entry.id && p.card.state === State.New) ?? null}));
    const order = this.settings.settingsFor(deck).newCardOrder;
    let candidates: DeckQueueChoice[];
    let nextCursor = cursor;
    if (order === 'before-reviews') candidates = [...fresh, ...scheduled];
    else if (order === 'after-reviews' || !fresh.length || !scheduled.length) candidates = [...scheduled, ...fresh];
    else {
      const debt = cursor.debt + fresh.length / (fresh.length + scheduled.length);
      candidates = debt >= 1 ? [...fresh, ...scheduled] : [...scheduled, ...fresh];
      const choice = candidates[0] ?? null;
      nextCursor = { debt: debt - Number(choice?.kind === 'new') };
      this.rememberMix(snapshot, choice, cursor.debt, nextCursor.debt);
      return { choice, cursor: nextCursor };
    }
    const choice = candidates[0] ?? null;
    this.rememberMix(snapshot, choice, cursor.debt, nextCursor.debt);
    return { choice, cursor: nextCursor };
  }

  private rememberMix(snapshot: DeckQueueSnapshot, choice: DeckQueueChoice | null, before: number, after: number): void {
    const context = this.mixSnapshots.get(snapshot);
    if (choice && context) this.mixChoices.set(choice, { context, before, after, owner: context.owner });
  }

  restoreAfterUndo(snapshot: DeckQueueSnapshot, deck: DeckDefinition, choice: DeckQueueChoice): DeckQueueChoice {
    const before = snapshot.mixedCursor?.debt ?? 0;
    const scheduled = snapshot.learningEntries.length + snapshot.reviewEntries.length;
    const after = this.settings.settingsFor(deck).newCardOrder === 'mixed' && snapshot.newEntries.length && scheduled
      ? before + snapshot.newEntries.length / (snapshot.newEntries.length + scheduled) - Number(choice.kind === 'new') : before;
    this.rememberMix(snapshot, choice, before, after);
    return choice;
  }

  preview(deck: DeckDefinition, choice: DeckQueueChoice, now = new Date()): DeckSchedulePreview {
    const settings=this.settings.settingsFor(deck);
    return this.scheduler.preview(choice.progress, settings.desiredRetention, now,settings);
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
    const retryKey=JSON.stringify([database.workspace,this.workspace.activationRevision(),deck.id,choice.entryId,rating]);
    const cached = this.retries.get(preview)?.get(retryKey);
    const confirmed=cached?(await database.getDeckReviewEvents(deck.id)).some(e=>e.id===cached.id):false;
    const branch = this.scheduler.branch(preview, rating, cached?new Date(cached.reviewedAt):reviewedAt);
    const localDate = getLocalStudyDayKey(cached ? new Date(cached.reviewedAt) : reviewedAt);
    const daily = await database.getDailyState(deck.id, localDate) ?? emptyDailyState(deck.id, localDate);
    const answerAt=cached?new Date(cached.reviewedAt):reviewedAt;
    if(!cached&&choice.progress&&choice.progress.card.state!==State.New&&!deckCardEligible(choice.progress.card,answerAt))throw new Error('Deck card is not due');
    const firstIntroduction = choice.progress === null || choice.progress.card.state === State.New;
    if (!confirmed && firstIntroduction && !daily.introducedEntryIds.includes(choice.entryId)
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
      elapsedAnswerMs: Math.min(CARD_STUDY_LIMIT_MS, Math.max(0, Math.round(elapsedAnswerMs))),
      fsrsLog: branch.log,
      cardBefore: choice.progress?.card ?? null,
    };
    { const ratings = this.retries.get(preview) ?? new Map(); ratings.set(retryKey, event); this.retries.set(preview, ratings); }
    database.assertOwner();
    const mix = this.mixChoices.get(choice);
    if (mix) {
      if (mix.owner !== database.workspace) throw new Error('Deck workspace changed');
      await this.mixing.stage(deck.id, mix.context, event.id, mix.before, mix.after, database.assertOwner);
    }
    await database.commitReview(progress, event, nextDaily,this.settings.settingsFor(deck).newCardsPerDay);
    const order = this.orderFor(database.workspace, deck.id, localDate);
    if (!order.has(event.id)) order.set(event.id, order.size);
    return event;
  }

  async undo(event: DeckReviewEvent): Promise<void> {
    const database = this.database.bind(event.deckId);
    const localDate = getLocalStudyDayKey(new Date(event.reviewedAt));
    const daily = await database.getDailyState(event.deckId, localDate)
      ?? emptyDailyState(event.deckId, localDate);
    const introducedEntryIds = (event.cardBefore === null || event.cardBefore.state === State.New)
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
    const again = events.filter(event => event.rating === 'again').length;
    const good = events.length - again;
    const firstPerCardDay = firstReviewPerCardAndLocalDay(events);
    const trueGood = firstPerCardDay.filter(event => event.rating === 'good').length;
    return {
      total, unseen: Math.max(0, total - progress.filter(p => p.card.state !== State.New).length), learning, review, dueNow,
      learningPending:progress.filter(p=>isLearning(p)&&p.due>now.getTime()).length,
      nextRefreshAt:Math.min(nextLocalStudyDayStart(now),...progress.filter(p=>isLearning(p)&&p.due>now.getTime()).map(p=>p.due)),
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
function dueOrder(a:DeckCardProgress,b:DeckCardProgress):number {return a.due-b.due||compareDeckId(a.entryId,b.entryId);}

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
