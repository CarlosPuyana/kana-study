import { emptyGrammarProgress, GrammarConceptProgress } from '../models/grammar-progress.model';
import { mergeGrammarProgress } from './sync-merge';

const early = '2026-10-03T10:00:00.000Z', late = '2026-10-03T11:00:00.000Z';
const concept = (id: string, updatedAt = early): GrammarConceptProgress => ({conceptId: id, topicId: id.split('.')[0], startedAt: early, updatedAt, status: 'in-progress', lastExerciseIndex: 0, answers: {[id]: {correct: false, answeredAt: updatedAt}}});
describe('Grammar two-device conflict merge', () => {
  it('unions independently studied concepts rather than choosing one payload', () => {
    const local = emptyGrammarProgress(), remote = emptyGrammarProgress(); local.concepts['00.1'] = concept('00.1'); remote.concepts['06.1'] = concept('06.1', late);
    const merged = mergeGrammarProgress(local, remote); expect(Object.keys(merged.concepts)).toEqual(['00.1', '06.1']);
    expect(mergeGrammarProgress(remote, local)).toEqual(merged); expect(local.concepts['06.1']).toBeUndefined();
  });
  it('preserves completed and completedAt from either device while retaining newer answers', () => {
    const local = emptyGrammarProgress(), remote = emptyGrammarProgress(); local.concepts['06.1'] = {...concept('06.1'), status: 'completed', completedAt: early}; remote.concepts['06.1'] = concept('06.1', late);
    expect(mergeGrammarProgress(local, remote).concepts['06.1']).toMatchObject({status: 'completed', completedAt: early, updatedAt: late});
  });
  it('unions answers and uses answeredAt independently of concept updatedAt', () => {
    const local = emptyGrammarProgress(), remote = emptyGrammarProgress();
    local.concepts['06.1'] = {...concept('06.1', late), answers: {a: {correct: false, answeredAt: early}, b: {correct: true, answeredAt: late}}};
    remote.concepts['06.1'] = {...concept('06.1'), answers: {a: {correct: true, answeredAt: late}, c: {correct: false, answeredAt: early}}};
    expect(mergeGrammarProgress(local, remote).concepts['06.1'].answers).toEqual({a: {correct: true, answeredAt: late}, b: {correct: true, answeredAt: late}, c: {correct: false, answeredAt: early}});
  });
  it('a newer cleared difficulty beats an older active mark in both directions', () => {
    const local = emptyGrammarProgress(), remote = emptyGrammarProgress();
    local.review['06.1'] = {conceptId: '06.1', topicId: '06', active: true, updatedAt: early, flaggedAt: early};
    remote.review['06.1'] = {conceptId: '06.1', topicId: '06', active: false, updatedAt: late, clearedAt: late};
    expect(mergeGrammarProgress(local, remote).review['06.1']).toEqual(remote.review['06.1']);
    expect(mergeGrammarProgress(remote, local).review['06.1'].active).toBe(false);
  });
  it('a new error after clearing reactivates the difficulty', () => {
    const local = emptyGrammarProgress(), remote = emptyGrammarProgress();
    local.review['06.1'] = {conceptId: '06.1', topicId: '06', active: false, updatedAt: early, clearedAt: early};
    remote.review['06.1'] = {conceptId: '06.1', topicId: '06', active: true, updatedAt: late, flaggedAt: late};
    expect(mergeGrammarProgress(local, remote).review['06.1'].active).toBe(true);
  });
  it('keeps the latest complete practice separately for each topic', () => {
    const local = emptyGrammarProgress(), remote = emptyGrammarProgress();
    local.practices['00'] = {topicId: '00', attemptedAt: early, updatedAt: early, score: 8, total: 10, errorConceptIds: ['00.1']};
    remote.practices['00'] = {...local.practices['00'], score: 10, updatedAt: late, errorConceptIds: []};
    expect(mergeGrammarProgress(local, remote).practices['00'].score).toBe(10);
  });
  it('restores the most recent resume across devices', () => {
    const local = emptyGrammarProgress(), remote = emptyGrammarProgress();
    local.resume = {conceptId: '00.1', path: '/grammar/n5/00/1', exerciseIndex: 1, updatedAt: early};
    remote.resume = {conceptId: '06.1', path: '/grammar/n5/06/1', exerciseIndex: 2, updatedAt: late};
    expect(mergeGrammarProgress(local, remote).resume).toEqual(remote.resume);
  });
  it('handles corrupt versions and invalid records without throwing', () => {
    expect(mergeGrammarProgress(null, {version: 99})).toEqual(emptyGrammarProgress());
    expect(mergeGrammarProgress({version: 1, concepts: {bad: null}, review: {bad: []}, practices: {bad: {score: NaN}}, resume: {}}, 'broken')).toEqual(emptyGrammarProgress());
  });
  it('is idempotent and merges cleared markers deterministically on timestamp ties', () => {
    const local = emptyGrammarProgress(), remote = emptyGrammarProgress();
    local.review['06.1'] = {conceptId: '06.1', topicId: '06', active: true, updatedAt: early};
    remote.review['06.1'] = {conceptId: '06.1', topicId: '06', active: false, updatedAt: early, clearedAt: early};
    const merged = mergeGrammarProgress(local, remote);
    expect(merged.review['06.1'].active).toBe(false); expect(mergeGrammarProgress(merged, merged)).toEqual(merged);
  });
});
