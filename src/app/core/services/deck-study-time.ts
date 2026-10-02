import { getSpainDayKey } from './daily-learning.service';

export const getLocalStudyDayKey = getSpainDayKey;

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
