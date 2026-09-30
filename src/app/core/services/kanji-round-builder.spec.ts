import { KanjiStudyUnit } from '../models/kanji.model';
import { KanjiStudyProgress } from '../models/kanji-study.model';
import { buildKanjiRound } from './kanji-round-builder';

const now = new Date('2026-01-10T12:00:00.000Z');
function unit(id: string, type: KanjiStudyUnit['questionType'] = 'kanji-to-meaning'): KanjiStudyUnit {
  return { key: `kanji:${id}:${type}`, kanjiId: id, questionType: type };
}
function stored(value: KanjiStudyUnit, due: string): KanjiStudyProgress {
  return { ...value, fsrs: { due, stability: 1, difficulty: 5, elapsedDays: 0,
    scheduledDays: 1, learningSteps: 0, reps: 1, lapses: 0, state: 'learning',
    lastReview: null }, firstSeenAt: due, lastSeenAt: due, totalAttempts: 1,
    totalFirstTrySuccesses: 0, totalFailures: 1, lastRating: 'again' };
}
function build(
  units: KanjiStudyUnit[],
  items: KanjiStudyProgress[] = [],
  limit = 10,
  random: () => number = () => 0.999,
) {
  return buildKanjiRound({ units, progress: Object.fromEntries(items.map(item => [item.key, item])),
    now, limit, random });
}

describe('Kanji round builder', () => {
  it('prioritizes reviews from most overdue', () => {
    const a = unit('日'), b = unit('月');
    expect(build([unit('火'), b, a], [stored(a, '2026-01-01T00:00:00Z'),
      stored(b, '2026-01-05T00:00:00Z')]).slice(0, 2)).toEqual([a, b]);
  });
  it('never uses future reviews to fill a round', () => {
    const future = unit('日');
    expect(build([future, unit('月')], [stored(future, '2026-02-01T00:00:00Z')]))
      .toEqual([unit('月')]);
  });
  it('returns at most ten unique eligible units', () => {
    const source = Array.from({ length: 20 }, (_, index) => unit(String(index)));
    const result = build(source, [], 10, () => 0);
    expect(result).toHaveLength(10);
    expect(new Set(result.map(item => item.key)).size).toBe(10);
    expect(result.every(item => source.includes(item))).toBe(true);
    expect(result.map(item => item.key)).not.toEqual(source.slice(0, 10).map(item => item.key));
  });
  it('avoids duplicate kanji when enough distinct ones exist', () => {
    const values = [unit('日'), unit('日', 'meaning-to-kanji'),
      ...Array.from({ length: 9 }, (_, index) => unit(String(index)))];
    expect(new Set(build(values).map(item => item.kanjiId)).size).toBe(10);
  });
  it('uses the second direction as fallback', () => {
    expect(build([unit('日'), unit('日', 'meaning-to-kanji')])).toHaveLength(2);
  });
});
