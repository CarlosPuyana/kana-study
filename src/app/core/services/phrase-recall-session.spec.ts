import { PhraseRecallSession } from './phrase-recall-session';

describe('Phrase RUSH rounds in memory', () => {
  function create(ids = ['a','b','c']) { const s = new PhraseRecallSession(); s.initialize(ids); return s; }
  it('keeps unanswered distinct from false and records immutable round/order by stable ID', () => {
    const s=create(['a','a','b']); expect(s.round().ids).toEqual(['a','b']);expect(s.round().answers['a']).toBeUndefined();
    s.answer('b',false); expect(s.round().answers['b']).toEqual({phraseId:'b',known:false,round:1,order:2}); expect(s.correct()).toBe(0);expect(s.evaluated()).toHaveLength(1);expect(s.complete()).toBe(false);
  });
  it('rejects duplicate and unknown answers without inflating totals',()=>{
    const s=create();expect(s.answer('other',true)).toBe(false);s.answer('a',true);expect(s.answer('a',false)).toBe(false);expect(s.correct()).toBe(1);expect(s.evaluated()).toHaveLength(1);
  });
  it('summarizes only actual answers and never repeats before completion',()=>{
    const s=create();s.answer('c',false);expect(s.repeatFailures()).toBe(false);s.answer('a',true);s.answer('b',true);expect(s.complete()).toBe(true);expect(s.correct()).toBe(2);expect(s.failedIds()).toEqual(['c']);expect(s.percent()).toBe(67);
  });
  it('repeats only failures in original order with fresh per-round answers',()=>{
    const s=create();s.answer('c',false);s.answer('a',false);s.answer('b',true);expect(s.repeatFailures()).toBe(true);expect(s.round().ids).toEqual(['a','c']);expect(s.round().number).toBe(2);expect(s.evaluated()).toHaveLength(0);expect(s.rounds()[0].answers['b']?.known).toBe(true);
    s.answer('a',true);s.answer('c',false);s.repeatFailures();expect(s.round().ids).toEqual(['c']);expect(s.round().number).toBe(3);s.answer('c',true);expect(s.percent()).toBe(100);expect(s.repeatFailures()).toBe(false);
  });
  it('undoes the last evaluation rather than the current navigation position',()=>{
    const s=create();s.answer('c',true);s.answer('a',false);const record=s.undo();expect(record?.phraseId).toBe('a');expect(s.round().answers['a']).toBeUndefined();expect(s.round().answers['c']?.known).toBe(true);expect(s.evaluated()).toHaveLength(1);s.answer('a',true);expect(s.correct()).toBe(2);
  });
  it('undo after starting a new round restores the prior round without stale derived failures',()=>{
    const s=create(['a']);s.answer('a',false);s.repeatFailures();expect(s.round().number).toBe(2);s.undo();expect(s.round().number).toBe(1);expect(s.complete()).toBe(false);expect(s.evaluated()).toHaveLength(0);expect(s.canUndo()).toBe(false);
  });
  it('undo within later rounds preserves the previous round',()=>{
    const s=create(['a']);s.answer('a',false);s.repeatFailures();s.answer('a',true);s.undo();expect(s.round().number).toBe(2);expect(s.round().answers['a']).toBeUndefined();expect(s.rounds()[0].answers['a']?.known).toBe(false);
  });
  it('handles zero failures, all failures, one phrase and empty selections',()=>{
    const s=create(['a']);s.answer('a',true);expect(s.complete()).toBe(true);expect(s.repeatFailures()).toBe(false);s.initialize(['a','b']);s.answer('a',false);s.answer('b',false);expect(s.percent()).toBe(0);s.repeatFailures();expect(s.round().ids).toEqual(['a','b']);s.initialize([]);expect(s.canUndo()).toBe(false);expect(s.complete()).toBe(false);expect(s.percent()).toBe(0);expect(s.rounds()).toEqual([]);
  });
});
