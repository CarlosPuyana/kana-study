import { DeckIntensiveSession } from './deck-intensive-session';
describe('temporary circular intensive practice', () => {
 it('deduplicates ranking order and visits each word over three complete passes', () => {
  const s=new DeckIntensiveSession(['b','a','b','c']);expect(s.ids).toEqual(['b','a','c']);
  for(let pass=0;pass<3;pass++)for(const [i,id] of s.ids.entries()){
   expect(s.current).toBe(id);expect(s.position).toBe(i+1);s.next();
  }
  expect(s.current).toBe('b');expect(s.position).toBe(1);expect(s.total).toBe(3);
 });
 it('retains a single word through multiple appearances without a terminal state', () => {
  const s=new DeckIntensiveSession(['a']);
  for(let i=0;i<5;i++){expect(s.current).toBe('a');expect(s.position).toBe(1);s.next();}
  expect(s.total).toBe(1);
 });
 it('keeps empty selections coherent without modulo zero or invalid positions', () => {
  const s=new DeckIntensiveSession([]);for(let i=0;i<5;i++)s.next();expect(s.current).toBeNull();expect(s.total).toBe(0);expect(s.position).toBe(0);
 });
});
