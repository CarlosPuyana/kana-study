import { DeckIntensiveSession } from './deck-intensive-session';
describe('memory-only intensive deck practice',()=>{
 it('deduplicates selection, interleaves repetitions and requires two cumulative correct answers',()=>{
  const s=new DeckIntensiveSession(['a','b','a']);expect(s.current).toBe('a');s.answer(false);expect(s.current).toBe('b');s.answer(true);s.answer(true);s.answer(true);
  expect(s.current).toBe('a');s.answer(true);expect(s.current).toBeNull();expect(s.failures.get('a')).toBe(1);expect(s.answers).toBe(5);
 });
 it('bounds each block at twenty, allows an early finish and an explicit continuation',()=>{
  const s=new DeckIntensiveSession(['a']);for(let i=0;i<30;i++)s.answer(false);
  expect(s.answers).toBe(20);expect(s.current).toBeNull();expect(s.remaining).toBe(1);s.continueBlock();expect(s.answers).toBe(0);expect(s.current).toBe('a');
  s.answer(true);s.finish();expect(s.current).toBeNull();s.continueBlock();s.answer(true);expect(s.remaining).toBe(0);s.continueBlock();expect(s.current).toBeNull();
 });
 it('handles an empty selection without fabricated cards or results',()=>{const s=new DeckIntensiveSession([]);s.answer(true);expect(s.answers).toBe(0);expect(s.current).toBeNull();});
});
