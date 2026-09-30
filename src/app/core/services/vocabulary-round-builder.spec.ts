import { VocabularyStudyUnit } from '../models/vocabulary.model';
import { VocabularyStudyProgress } from '../models/vocabulary-study.model';
import { buildVocabularyRound } from './vocabulary-round-builder';

const now = new Date('2026-01-10T12:00:00Z');
function unit(id: string, type: VocabularyStudyUnit['questionType'] = 'japanese-to-meaning'): VocabularyStudyUnit {
  return { key: `vocab:${id}:${type}`, entryId: id, questionType: type };
}
function stored(value: VocabularyStudyUnit, due: string): VocabularyStudyProgress {
  return { ...value, fsrs: { due, stability: 1, difficulty: 5, elapsedDays: 0,
    scheduledDays: 1, learningSteps: 0, reps: 1, lapses: 0, state: 'learning',
    lastReview: null }, firstSeenAt: due, lastSeenAt: due, totalAttempts: 1,
    totalFirstTrySuccesses: 0, totalFailures: 1, lastRating: 'again' };
}
function build(
  units: VocabularyStudyUnit[],
  items: VocabularyStudyProgress[] = [],
  limit = 10,
  random: () => number = () => 0.999,
) {
  return buildVocabularyRound({ units,
    progress: Object.fromEntries(items.map(item => [item.key, item])), now, limit, random });
}

describe('Vocabulary round builder', () => {
  it('puts the most overdue reviews before new units', () => {
    const a = unit('a'), b = unit('b'), fresh = unit('c');
    expect(build([fresh, b, a], [stored(a, '2026-01-01T00:00:00Z'),
      stored(b, '2026-01-05T00:00:00Z')]).slice(0, 2)).toEqual([a, b]);
  });
  it('does not use future reviews as filler', () => {
    const future = unit('a');
    expect(build([future, unit('b')], [stored(future, '2027-01-01T00:00:00Z')]))
      .toEqual([unit('b')]);
  });
  it('caps randomized rounds at ten unique eligible units', () => {
    const source = Array.from({ length: 20 }, (_, index) => unit(String(index)));
    const result = build(source, [], 10, () => 0);
    expect(result).toHaveLength(10);
    expect(new Set(result.map(item => item.key)).size).toBe(10);
    expect(result.every(item => source.includes(item))).toBe(true);
    expect(result.map(item => item.key)).not.toEqual(source.slice(0, 10).map(item => item.key));
  });
  it('avoids the same entry when enough distinct entries exist', () => {
    const values = [unit('a'), unit('a', 'meaning-to-japanese'),
      ...Array.from({ length: 9 }, (_, index) => unit(String(index)))];
    expect(new Set(build(values).map(item => item.entryId)).size).toBe(10);
  });
  it('falls back to a second direction for a small selection', () => {
    expect(build([unit('a'), unit('a', 'meaning-to-japanese')])).toHaveLength(2);
  });
  it('keeps question types as independent units', () => {
    expect(unit('a').key).not.toBe(unit('a', 'meaning-to-japanese').key);
  });
});
