import { getSpainDayKey } from './daily-learning.service';
import type { SerializedFsrsCard } from '../models/deck-study.model';

export const getLocalStudyDayKey = getSpainDayKey;
export const DECK_LEARNING_AHEAD_MS = 20 * 60_000;

/** Existing Review by Madrid day; Learning/Relearning by minutes, optionally early today. */
export function deckCardEligible(card: SerializedFsrsCard, now: Date, allowAhead = false): boolean {
  const day = getLocalStudyDayKey(now), dueDay = getLocalStudyDayKey(new Date(card.due));
  if (card.state === 2) return dueDay <= day;
  return [1, 3].includes(card.state) && (card.due <= now.getTime()
    || allowAhead && dueDay === day && card.due <= now.getTime() + DECK_LEARNING_AHEAD_MS);
}

/** Madrid calendar boundary (23/24/25-hour days), independent of the host timezone. */
export function nextLocalStudyDayStart(now:Date):number {
  const day=getLocalStudyDayKey(now);let low=now.getTime(),high=low+27*3_600_000;
  while(high-low>1){const middle=Math.floor((low+high)/2);if(getLocalStudyDayKey(new Date(middle))===day)low=middle;else high=middle;}
  return high;
}

export function localStudyDayStart(date:Date):number {
  const day=getLocalStudyDayKey(date);let low=date.getTime()-27*3_600_000,high=date.getTime();
  while(high-low>1){const middle=Math.floor((low+high)/2);if(getLocalStudyDayKey(new Date(middle))<day)low=middle;else high=middle;}
  return high;
}

export type IntervalUnit = 'underMinute' | 'minute' | 'minutes' | 'hour' | 'hours' | 'day' | 'days' | 'month' | 'months' | 'year' | 'years';
export interface FormattedStudyInterval { readonly value: number | null; readonly unit: IntervalUnit }

export function formatStudyInterval(milliseconds: number): FormattedStudyInterval {
  const minutes = milliseconds / 60_000;
  if (minutes < 1) return { value: null, unit: 'underMinute' };
  if (minutes < 60) return { value: Math.max(1, Math.round(minutes)), unit: Math.round(minutes) === 1 ? 'minute' : 'minutes' };
  const hours = milliseconds / 3_600_000;
  if (hours < 24) return { value: Math.round(hours), unit: Math.round(hours) === 1 ? 'hour' : 'hours' };
  const days = milliseconds / 86_400_000;
  if (days < 30) return { value: Math.round(days), unit: Math.round(days) === 1 ? 'day' : 'days' };
  const months = days / 30;
  if (days < 365) return { value: Math.round(months), unit: Math.round(months) === 1 ? 'month' : 'months' };
  const years = days / 365;
  return { value: Math.round(years), unit: Math.round(years) === 1 ? 'year' : 'years' };
}
