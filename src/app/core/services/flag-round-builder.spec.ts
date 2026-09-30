import { FlagStudyUnit } from '../models/country.model';
import { FlagStudyProgress } from '../models/flag-study.model';
import { buildFlagRound } from './flag-round-builder';

const now = new Date('2026-01-10T12:00:00.000Z');
function unit(countryId: string, type: FlagStudyUnit['questionType'] = 'flag-to-country'): FlagStudyUnit { return { key: `flags:${countryId}:${type}`, countryId, questionType: type }; }
function stored(value: FlagStudyUnit, due: string): FlagStudyProgress { return { ...value, fsrs: { due, stability:1,difficulty:5,elapsedDays:0,scheduledDays:1,learningSteps:0,reps:1,lapses:0,state:'learning',lastReview:null }, firstSeenAt:due,lastSeenAt:due,totalAttempts:1,totalFirstTrySuccesses:0,totalFailures:1,lastRating:'again' }; }
function build(units: FlagStudyUnit[], items: FlagStudyProgress[] = [], limit=10) { return buildFlagRound({ units, progress: Object.fromEntries(items.map(item => [item.key,item])), now, limit }); }

describe('Flag round builder', () => {
  it('prioritizes overdue reviews before new units', () => { const review=unit('jp'); const result=build([unit('fr'),review],[stored(review,'2026-01-01T00:00:00.000Z')]); expect(result[0]).toBe(review); });
  it('does not use future reviews to fill a round', () => { const future=unit('jp'); expect(build([future,unit('fr')],[stored(future,'2026-02-01T00:00:00.000Z')])).toEqual([unit('fr')]); });
  it('returns no more than ten units', () => expect(build(Array.from({length:20},(_,i)=>unit(`c${i}`)))).toHaveLength(10));
  it('avoids duplicate countries when enough distinct countries exist', () => { const units=[unit('jp'),unit('jp','country-to-flag'),...Array.from({length:9},(_,i)=>unit(`c${i}`))]; const result=build(units); expect(new Set(result.map(item=>item.countryId)).size).toBe(10); });
  it('uses another direction as fallback for a small selection', () => { const result=build([unit('jp'),unit('jp','country-to-flag')]); expect(result).toHaveLength(2); });
});
