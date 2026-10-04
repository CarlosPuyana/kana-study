import { inject, Injectable } from '@angular/core';
import { STUDY_DECKS } from '../../data/study-decks';
import { MEDAL_DEFINITIONS } from '../../data/medals';
import { FLAG_MEDAL_DEFINITIONS } from '../../data/flag-medals';
import { KANJI_MEDAL_DEFINITIONS } from '../../data/kanji-medals';
import { VOCABULARY_MEDAL_DEFINITIONS } from '../../data/vocabulary-medals';
import { RUSH_MEDAL_DEFINITIONS } from '../../data/rush-medals';
import { getSpainDayKey } from './daily-learning.service';
import { DeckDatabaseService } from './deck-database.service';
import { LocalRushRepository } from './rush-repository.service';
import { StorageService } from './storage.service';
import { MedalDefinition } from '../models/medal.model';
import { mergeMedalUnlocks } from './sync-merge';

export interface ProfileMedal {
  readonly medalId: string; readonly titleKey: string; readonly unlockedAt: string;
  readonly module: MedalDefinition['module']; readonly icon: MedalDefinition['icon'];
}

export interface ProfileStats {
  readonly streak: number; readonly studySeconds: number; readonly completedSessions: number;
  readonly reviews: number; readonly rushCards: number;
  readonly kana: number; readonly kanji: number; readonly vocabulary: number;
  readonly deckUnseen: number; readonly deckLearning: number; readonly deckReview: number;
  readonly medals: readonly ProfileMedal[];
}

@Injectable({ providedIn: 'root' })
export class ProfileStatsService {
  private readonly storage = inject(StorageService); private readonly decks = inject(DeckDatabaseService); private readonly rush = inject(LocalRushRepository);

  async load(now = new Date()): Promise<ProfileStats> {
    const sessions = this.storage.get<any[]>('kana-study.completed-sessions.v1', []);
    const eventKeys = ['kana-study.review-events.v1','kana-study.flags-review-events.v1','kana-study.kanji-review-events.v1','kana-study.vocabulary-review-events.v1'];
    const events = eventKeys.flatMap(key => this.storage.get<any[]>(key, []));
    const [deckProgress, deckEvents, rush] = await Promise.all([
      this.decks.getDeckProgress(STUDY_DECKS[0].id), this.decks.getDeckReviewEvents(STUDY_DECKS[0].id), this.rush.getStats(),
    ]);
    const finishedRush = rush.sessions.filter(session => session.endedAt !== null && session.cardsCompleted > 0);
    const activityDays = new Set<string>();
    for (const session of sessions) if (session.exercisesCompleted > 0) activityDays.add(getSpainDayKey(new Date(session.completedAt)));
    for (const event of deckEvents) activityDays.add(getSpainDayKey(new Date(event.reviewedAt)));
    for (const session of finishedRush) activityDays.add(getSpainDayKey(new Date(session.endedAt!)));
    const normalMedals = this.storage.get<any[]>('kana-study.medal-unlocks.v1', []);
    const rushMedals = this.storage.get<any[]>('kana-study.rush.medal-unlocks.v1', []);
    return {
      streak: currentStreak(activityDays, now),
      studySeconds: sessions.reduce((sum, item) => sum + Number(item.durationSeconds ?? 0), 0)
        + Math.round(deckEvents.reduce((sum, item) => sum + item.elapsedAnswerMs, 0) / 1000)
        + finishedRush.reduce((sum, item) => sum + item.activeSeconds, 0),
      completedSessions: sessions.length, reviews: events.length + deckEvents.length,
      rushCards: finishedRush.reduce((sum, item) => sum + item.cardsCompleted, 0),
      kana: uniqueProgress(this.storage.get('kana-study.study-progress.v2', {}), 'kanaId'),
      kanji: uniqueProgress(this.storage.get('kana-study.kanji-progress.v1', {}), 'kanjiId'),
      vocabulary: uniqueProgress(this.storage.get('kana-study.vocabulary-progress.v1', {}), 'entryId'),
      deckUnseen: Math.max(0, STUDY_DECKS[0].cardCount - deckProgress.length),
      deckLearning: deckProgress.filter(item => item.state !== 2).length,
      deckReview: deckProgress.filter(item => item.state === 2).length,
      medals: profileMedals(normalMedals, rushMedals),
    };
  }
}
const ALL_MEDALS = [...MEDAL_DEFINITIONS,...FLAG_MEDAL_DEFINITIONS,...KANJI_MEDAL_DEFINITIONS,...VOCABULARY_MEDAL_DEFINITIONS,...RUSH_MEDAL_DEFINITIONS];
export function profileMedals(normal: readonly {medalId:string; unlockedAt:string}[], rush: readonly {medalId:string; unlockedAt:string}[]): ProfileMedal[] {
  return mergeMedalUnlocks(normal, rush).flatMap(unlock => {
    const definition = ALL_MEDALS.find(item => item.id === unlock.medalId);
    return definition ? [{...unlock, titleKey:definition.titleKey, module:definition.module, icon:definition.icon}] : [];
  }).sort((a,b) => Date.parse(b.unlockedAt) - Date.parse(a.unlockedAt) || a.medalId.localeCompare(b.medalId));
}

function uniqueProgress(value: unknown, property: string): number {
  if (!value || typeof value !== 'object') return 0;
  return new Set(Object.values(value as Record<string, any>).map(item => item[property]).filter(Boolean)).size;
}
function currentStreak(days: ReadonlySet<string>, now: Date): number {
  let key = getSpainDayKey(now); let count = 0;
  if (!days.has(key)) key = previousCalendarDay(key);
  while (days.has(key)) { count++; key = previousCalendarDay(key); }
  return count;
}
function previousCalendarDay(key: string): string {
  const [year, month, day] = key.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day - 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}
