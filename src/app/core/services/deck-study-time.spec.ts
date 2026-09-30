import { formatStudyInterval, getLocalStudyDayKey } from './deck-study-time';

describe('deck study time helpers', () => {
  it('uses the browser local calendar day rather than UTC slicing', () => {
    const date = new Date(2026, 8, 30, 23, 59, 0);
    expect(getLocalStudyDayKey(date)).toBe('2026-09-30');
    const tomorrow = new Date(2026, 9, 1, 0, 1, 0);
    expect(getLocalStudyDayKey(tomorrow)).toBe('2026-10-01');
  });

  it('formats scheduler intervals without absolute timestamps', () => {
    expect(formatStudyInterval(30_000)).toEqual({ value: null, unit: 'underMinute' });
    expect(formatStudyInterval(60_000)).toEqual({ value: 1, unit: 'minute' });
    expect(formatStudyInterval(8 * 60_000)).toEqual({ value: 8, unit: 'minutes' });
    expect(formatStudyInterval(24 * 3_600_000)).toEqual({ value: 1, unit: 'day' });
    expect(formatStudyInterval(90 * 86_400_000)).toEqual({ value: 3, unit: 'months' });
  });
});
