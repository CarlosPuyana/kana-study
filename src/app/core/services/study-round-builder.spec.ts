import { FsrsProgress, StudyProgress, StudyUnit } from '../models/progress.model';
import { buildStudyRound } from './study-round-builder';

const NOW = new Date('2026-01-15T12:00:00.000Z');

function units(count: number, offset = 0): StudyUnit[] {
  return Array.from({ length: count }, (_, index) => ({
    key: `kana-${index + offset}:kana-to-romaji`,
    kanaId: `kana-${index + offset}`,
    questionType: 'kana-to-romaji',
  }));
}

function stored(unit: StudyUnit, due: string): StudyProgress {
  const fsrs: FsrsProgress = {
    due, stability: 2, difficulty: 5, elapsedDays: 1, scheduledDays: 2,
    learningSteps: 0, reps: 1, lapses: 0, state: 'review', lastReview: due,
  };
  return {
    ...unit, fsrs, firstSeenAt: due, lastSeenAt: due, totalAttempts: 1,
    totalFirstTrySuccesses: 1, totalFailures: 0, lastRating: 'good',
  };
}

function build(
  all: readonly StudyUnit[],
  progress: Record<string, StudyProgress>,
  random: () => number = () => 0.999,
) {
  return buildStudyRound({
    units: all, progress, now: NOW, limit: 10,
    random,
  });
}

describe('buildStudyRound', () => {
  it('creates 10 new units when there are no due reviews', () => {
    const result = build(units(46), {});
    expect(result).toHaveLength(10);
    expect(result.every(unit => unit.key.startsWith('kana-'))).toBe(true);
  });

  it('creates 3 due reviews followed by 7 new units', () => {
    const due = units(3);
    const fresh = units(46, 100);
    const progress = Object.fromEntries(due.map(unit => [unit.key, stored(unit, '2026-01-10T00:00:00.000Z')]));
    const result = build([...due, ...fresh], progress);
    expect(result.slice(0, 3).map(unit => unit.key)).toEqual(due.map(unit => unit.key));
    expect(result.filter(unit => progress[unit.key] === undefined)).toHaveLength(7);
  });

  it('creates 10 reviews when at least 10 are due', () => {
    const due = units(12);
    const fresh = units(46, 100);
    const progress = Object.fromEntries(due.map(unit => [unit.key, stored(unit, '2026-01-10T00:00:00.000Z')]));
    const result = build([...due, ...fresh], progress);
    expect(result).toHaveLength(10);
    expect(result.every(unit => progress[unit.key] !== undefined)).toBe(true);
  });

  it('creates a short round when only 2 reviews and 3 new units are available', () => {
    const due = units(2);
    const fresh = units(3, 100);
    const progress = Object.fromEntries(due.map(unit => [unit.key, stored(unit, '2026-01-10T00:00:00.000Z')]));
    expect(build([...due, ...fresh], progress)).toHaveLength(5);
  });

  it('orders due reviews from the oldest due date', () => {
    const due = units(3);
    const dates = ['2026-01-14T00:00:00.000Z', '2026-01-01T00:00:00.000Z', '2026-01-08T00:00:00.000Z'];
    const progress = Object.fromEntries(due.map((unit, index) => [unit.key, stored(unit, dates[index])]));
    expect(build(due, progress).map(unit => unit.key)).toEqual([
      due[1].key, due[2].key, due[0].key,
    ]);
  });

  it('does not use future reviews to fill a round', () => {
    const future = units(8);
    const fresh = units(2, 100);
    const progress = Object.fromEntries(future.map(unit => [unit.key, stored(unit, '2026-02-01T00:00:00.000Z')]));
    expect(build([...future, ...fresh], progress).map(unit => unit.key)).toEqual(fresh.map(unit => unit.key));
  });

  it('avoids duplicate kana when enough distinct kana exist', () => {
    const distinct = units(10);
    const duplicate: StudyUnit = {
      key: `${distinct[0].kanaId}:romaji-to-kana`,
      kanaId: distinct[0].kanaId,
      questionType: 'romaji-to-kana',
    };
    const result = build([distinct[0], duplicate, ...distinct.slice(1)], {});
    expect(new Set(result.map(unit => unit.kanaId)).size).toBe(10);
    expect(result).not.toContain(duplicate);
  });

  it('allows duplicate kana only as a fallback', () => {
    const sameKana: StudyUnit[] = [
      { key: 'kana-0:kana-to-romaji', kanaId: 'kana-0', questionType: 'kana-to-romaji' },
      { key: 'kana-0:romaji-to-kana', kanaId: 'kana-0', questionType: 'romaji-to-kana' },
    ];
    expect(build(sameKana, {})).toEqual(sameKana);
  });

  it('randomizes new candidates before taking the round limit', () => {
    const all = units(20);
    const result = build(all, {}, () => 0);
    expect(result).toHaveLength(10);
    expect(result.map(unit => unit.key)).not.toEqual(all.slice(0, 10).map(unit => unit.key));
    expect(new Set(result.map(unit => unit.key)).size).toBe(10);
    expect(result.every(unit => all.includes(unit))).toBe(true);
  });
});
