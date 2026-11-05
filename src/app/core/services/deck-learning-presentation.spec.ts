import { deckDayOffset, deckLearningSummary, deckTimeGroups, latestDeckRating } from './deck-learning-presentation';
import { deckDayDifficulties } from './deck-day-presentation';
import { DeckCardProgress, DeckReviewEvent } from '../models/deck-study.model';

const NOW = new Date('2026-11-05T11:00:00Z'), DAY = 86_400_000;
function progress(id: string, due: number, state: 0 | 1 | 2 | 3 = 2, deckId = 'japanese-1500'): DeckCardProgress {
  return { deckId, entryId: id, due, state, card: { due, state, stability: 30, difficulty: 5, elapsedDays: 25, scheduledDays: 30,
    learningSteps: 0, reps: 5, lapses: 0, lastReview: NOW.getTime() - 25 * DAY } };
}
function event(id: string, entryId: string, rating: 'again' | 'good', time = NOW.getTime(), deckId = 'japanese-1500'): DeckReviewEvent {
  return { id, entryId, rating, reviewedAt: time, deckId } as DeckReviewEvent;
}
describe('Deck learning presentation: persisted dates and effective study-day events', () => {
  it('covers every remaining-time boundary once, never creates empty groups and preserves chronology', () => {
    const days = [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 14, 15, 21, 22, 30, 31, 60, 61, 90, 91, 3000];
    const entries = days.map((_, i) => ({ id: String(i), order: i }));
    const rows = entries.map((e, i) => progress(e.id, NOW.getTime() + days[i] * DAY));
    const groups = deckTimeGroups([...entries, { id: 'new', order: 99 }], rows.reverse(), 'japanese-1500', NOW);
    expect(groups.map(g => [g.key, g.ids.length])).toEqual([
      ['due', 2], ['day1', 1], ['day2', 1], ['day3', 1], ['day4', 1], ['day5', 1], ['day6', 1], ['day7', 1],
      ['week2', 2], ['week3', 2], ['month1', 2], ['month2', 2], ['month3', 2], ['later', 2], ['new', 1],
    ]);
    expect(new Set(groups.flatMap(g => g.ids)).size).toBe(22);
    expect(groups.flatMap(g => g.ids)).toEqual([...entries.map(e => e.id), 'new']);
  });
  it('separates later today, an unscheduled persisted New and a malformed historical date', () => {
    const entries = ['today', 'new', 'invalid'].map((id, order) => ({ id, order }));
    const rows = [progress('today', NOW.getTime() + 60_000, 1), progress('new', 0, 0), progress('invalid', NaN)];
    expect(deckTimeGroups(entries, rows, 'japanese-1500', NOW).map(g => g.key)).toEqual(['today', 'new', 'unknown']);
    expect(deckTimeGroups(entries, rows, 'japanese-1500', new Date(NOW.getTime() + 60_000))[0].key).toBe('due');
  });
  it('uses remaining due, not the original 30-day interval, and moves after a persisted review', () => {
    const entry = [{ id: 'one', order: 0 }], p = progress('one', NOW.getTime() + 5 * DAY);
    expect(deckTimeGroups(entry, [p], p.deckId, NOW)[0].key).toBe('day5');
    expect(deckTimeGroups(entry, [{ ...p, card: { ...p.card, due: NOW.getTime() + 60 * DAY } }], p.deckId, NOW)[0].key).toBe('month2');
    expect(p.card.scheduledDays).toBe(30);
  });
  it.each([
    ['2026-03-28T23:00:00Z', '2026-03-29T22:00:00Z', 23],
    ['2026-10-24T22:00:00Z', '2026-10-25T23:00:00Z', 25],
  ])('uses Madrid calendar days across DST from %s', (before, due, hours) => {
    expect((Date.parse(due) - Date.parse(before)) / 3_600_000).toBe(hours);
    expect(deckDayOffset(Date.parse(due), new Date(before))).toBe(1);
    expect(deckTimeGroups([{ id: 'a', order: 1 }], [progress('a', Date.parse(due))], 'japanese-1500', new Date(before))[0].key).toBe('day1');
  });
  it('changes at Madrid midnight rather than UTC midnight or 24 elapsed hours', () => {
    const entries = [{ id: 'one', order: 1 }], rows = [progress('one', Date.parse('2026-11-06T10:00:00Z'))];
    expect(deckTimeGroups(entries, rows, 'japanese-1500', new Date('2026-11-05T22:59:59Z'))[0].key).toBe('day1');
    expect(deckTimeGroups(entries, rows, 'japanese-1500', new Date('2026-11-05T23:00:00Z'))[0].key).toBe('today');
    expect(deckDayOffset(Date.parse('2026-11-06T10:00:00+09:00'), new Date('2026-11-05T20:00:00-03:00'))).toBe(0);
  });
  it('counts unique cards separately from attempts, respects undo and preserves difficulty criteria', () => {
    const events = [event('1', 'a', 'again'), event('2', 'a', 'again'), event('3', 'a', 'good'), event('4', 'b', 'good')];
    const s = deckLearningSummary([], [], [...events, events[0], event('other', 'x', 'good', NOW.getTime(), 'mazo-puyi'), event('old', 'y', 'good', NOW.getTime() - DAY)], 'japanese-1500', NOW);
    expect(s).toMatchObject({ unique: 2, attempts: 4, accuracy: 50 });
    expect(deckLearningSummary([], [], events.slice(0, 3), 'japanese-1500', NOW)).toMatchObject({ unique: 1, attempts: 3, accuracy: 33 });
    expect(deckDayDifficulties([...events, events[0]], 'japanese-1500', NOW)).toEqual([{ entryId: 'a', failures: 2, lastFailure: NOW.getTime() }]);
  });
  it('leaves no-answer accuracy undefined and derives the forecast only from each active card’s current saved date', () => {
    const entries = ['a', 'b', 'c', 'd', 'new', 'oldDue', 'today'].map((id, order) => ({ id, order }));
    const rows = [progress('a', NOW.getTime() + DAY), progress('b', NOW.getTime() + 7 * DAY, 3),
      progress('c', NOW.getTime() + 8 * DAY), progress('d', NOW.getTime() + 30 * DAY), progress('oldDue', NOW.getTime() - DAY),
      progress('today', NOW.getTime() + 60_000, 1), progress('deleted', NOW.getTime() + DAY), progress('new', NOW.getTime() + DAY, 0)];
    const s = deckLearningSummary(entries, rows, [], 'japanese-1500', NOW);
    expect(s).toMatchObject({ unique: 0, attempts: 0, accuracy: null, new: 1, learning: 2, review: 4, overdue: 1, laterToday: 1, beyond: 2 });
    expect(s.future.map(d => d.count)).toEqual([1, 0, 0, 0, 0, 0, 1]);
  });
  it('does not reuse another deck’s memory or unrelated old rating, including for public Puyi', () => {
    const p = progress('same', NOW.getTime() + DAY, 2, 'mazo-puyi');
    const entries = [{ id: 'same', order: 1 }];
    expect(deckTimeGroups(entries, [p], 'japanese-1500', NOW)[0].key).toBe('new');
    expect(deckLearningSummary(entries, [p], [], 'japanese-1500', NOW).new).toBe(1);
    expect(latestDeckRating([event('old', 'same', 'again', 0, 'mazo-puyi')], p)).toBeNull();
    const matching = { ...event('real', 'same', 'good', p.card.lastReview!, 'mazo-puyi'), dueAfter: p.card.due, stateAfter: p.card.state, stabilityAfter: p.card.stability, difficultyAfter: p.card.difficulty };
    expect(latestDeckRating([matching], p)?.rating).toBe('good');
    expect(latestDeckRating([{ ...matching, id: 'zzz', rating: 'again', dueAfter: 0 }, matching], p)?.rating).toBe('good');
  });
});
