import { formatStudyInterval, getLocalStudyDayKey } from './deck-study-time';

describe('deck study time helpers', () => {
  it('uses the Madrid calendar day rather than the browser timezone', () => {
    const date = new Date('2026-09-30T21:59:00Z');
    expect(getLocalStudyDayKey(date)).toBe('2026-09-30');
    const tomorrow = new Date('2026-09-30T22:00:00Z');
    expect(getLocalStudyDayKey(tomorrow)).toBe('2026-10-01');
  });

  it('uses winter and summer Madrid offsets across DST changes', () => {
    expect(getLocalStudyDayKey(new Date('2026-01-01T23:00:00Z'))).toBe('2026-01-02');
    expect(getLocalStudyDayKey(new Date('2026-07-01T22:00:00Z'))).toBe('2026-07-02');
    expect(getLocalStudyDayKey(new Date('2026-10-25T22:59:00Z'))).toBe('2026-10-25');
    expect(getLocalStudyDayKey(new Date('2026-10-25T23:00:00Z'))).toBe('2026-10-26');
  });

  it('formats scheduler intervals without absolute timestamps', () => {
    expect(formatStudyInterval(30_000)).toEqual({ value: null, unit: 'underMinute' });
    expect(formatStudyInterval(60_000)).toEqual({ value: 1, unit: 'minute' });
    expect(formatStudyInterval(8 * 60_000)).toEqual({ value: 8, unit: 'minutes' });
    expect(formatStudyInterval(24 * 3_600_000)).toEqual({ value: 1, unit: 'day' });
    expect(formatStudyInterval(90 * 86_400_000)).toEqual({ value: 3, unit: 'months' });
  });
});
