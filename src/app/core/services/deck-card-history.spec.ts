import { deckCardHistory } from './deck-card-history';
import { DeckCardProgress, DeckReviewEvent } from '../models/deck-study.model';
const NOW=Date.parse('2026-11-05T11:00:00Z');
const event=(id:string,at:number,wait:number,rating:'again'|'good'='good',reps=0):DeckReviewEvent=>({id,deckId:'mazo-puyi',entryId:'word',reviewedAt:at,rating,dueAfter:at+wait,stateBefore:reps?2:0,stateAfter:rating==='again'?3:2,cardBefore:reps?{reps}:null} as DeckReviewEvent);
describe('Private card history projection',()=>{
 it('uses only effective matching records, deduplicates IDs, and never mutates input',()=>{
  const one=event('a',NOW,600000),two=event('b',NOW+86400000,61*86400000,'good',1),failed=event('c',NOW+62*86400000,600000,'again',2);
  const data=[two,failed,one,one,{...one,id:'other',deckId:'different'},{...one,id:'another',entryId:'different'}],before=JSON.stringify(data);
  const h=deckCardHistory(data,null,'mazo-puyi','word');
  expect(h.rows.map(r=>r.event.id)).toEqual(['c','b','a']);expect(h.rows.map(r=>r.waitMs)).toEqual([600000,61*86400000,600000]);
  expect(h.rows.map(r=>r.ordinal)).toEqual([3,2,1]);expect(h.incomplete).toBe(false);expect(JSON.stringify(data)).toBe(before);
 });
 it('does not use the old fsrsLog interval as the interval after answering',()=>{
  const e={...event('a',NOW,300000),fsrsLog:{scheduledDays:90}} as DeckReviewEvent;
  expect(deckCardHistory([e],null,e.deckId,e.entryId).rows[0].waitMs).toBe(300000);
 });
 it('keeps partial records and marks missing history instead of inventing old answers',()=>{
  const e={...event('a',NOW,1),dueAfter:undefined} as unknown as DeckReviewEvent;
  const h=deckCardHistory([e],{card:{reps:8}} as DeckCardProgress,'mazo-puyi','word');
  expect(h.rows).toHaveLength(1);expect(h.rows[0].waitMs).toBeNull();expect(h.incomplete).toBe(true);
  expect(deckCardHistory([], {card:{reps:8}} as DeckCardProgress,'mazo-puyi','word')).toEqual({rows:[],incomplete:true});
 });
 it('orders same-millisecond reviews by their persisted before counter, not random UUID',()=>{
  const h=deckCardHistory([event('zzz',NOW,60000,'again'),event('aaa',NOW,600000,'good',1)],null,'mazo-puyi','word');
  expect(h.rows.map(r=>r.event.id)).toEqual(['aaa','zzz']);
 });
 it('uses timestamp durations across midnight and DST without calendar rounding',()=>{
  const at=Date.parse('2026-10-24T22:00:00Z'),due=Date.parse('2026-10-25T23:00:00Z');
  expect(deckCardHistory([event('a',at,due-at)],null,'mazo-puyi','word').rows[0].waitMs).toBe(25*3600000);
  expect(deckCardHistory([event('b',NOW,-1)],null,'mazo-puyi','word').rows[0].waitMs).toBeNull();
 });
});
