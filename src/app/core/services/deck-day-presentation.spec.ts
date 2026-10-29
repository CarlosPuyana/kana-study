import { deckDayCounts, deckDayDifficulties } from './deck-day-presentation';
import { DeckQueueSnapshot, DeckReviewEvent } from '../models/deck-study.model';

const deckId='japanese-1500';
const event=(id:string,at:string,deck=deckId)=>({entryId:id,reviewedAt:Date.parse(at),deckId:deck} as DeckReviewEvent);
function snapshot(due:string,state=1):DeckQueueSnapshot {
 return {newAvailable:9,newEntries:Array.from({length:9},(_,i)=>({id:`n${i}`,order:i})),
 progress:[{entryId:'a',due:Date.parse(due),card:{state}}]} as unknown as DeckQueueSnapshot;
}
describe('daily presentation without scheduler changes',()=>{
 it('keeps future steps orange including Good and never counts answers instead of cards',()=>{
  const s=snapshot('2026-10-29T11:10:00Z'),now=new Date('2026-10-29T11:00:00Z');
  expect(deckDayCounts(s,[],deckId,now)).toEqual({new:9,repeat:0,review:1});
  expect(deckDayCounts(s,[event('a','2026-10-29T10:00:00Z'),event('a','2026-10-29T10:50:00Z')],deckId,now)).toEqual({new:9,repeat:1,review:0});
  expect(deckDayCounts({...s,newAvailable:0},[event('a','2026-10-29T10:00:00Z')],deckId,now)).toEqual({new:0,repeat:1,review:0});
 });
 it('undo/reload reconstruct from effective history and tomorrow removes pending cards',()=>{
  const now=new Date('2026-10-29T11:00:00Z');
  expect(deckDayCounts(snapshot('2026-10-28T10:00:00Z'),[],deckId,now).review).toBe(1);
  expect(deckDayCounts(snapshot('2026-10-30T00:00:00Z',2),[event('a','2026-10-29T10:00:00Z')],deckId,now).repeat).toBe(0);
  expect(deckDayCounts(snapshot('2026-10-29T11:10:00Z'),[event('a','2026-10-28T10:00:00Z'),event('a','2026-10-29T10:00:00Z','other')],deckId,now).review).toBe(1);
 });
 it.each(['2026-03-29T01:30:00Z','2026-10-25T01:30:00Z'])('Madrid DST classifies both sides of clock changes in the same day: %s',at=>{
  const now=new Date(at),s=snapshot(at),e=event('a',new Date(now.getTime()-3600000).toISOString());
  expect(deckDayCounts(s,[e],deckId,now).repeat).toBe(1);
 });
 it('uses Madrid midnight rather than UTC and keeps active/new within a changed quota',()=>{
  const s=snapshot('2026-10-29T23:00:00Z');
  expect(deckDayCounts(s,[event('a','2026-10-29T23:01:00Z')],deckId,new Date('2026-10-29T23:02:00Z')).repeat).toBe(1);
  expect(deckDayCounts({...s,newAvailable:0},[],deckId,new Date('2026-10-29T23:02:00Z'),{entryId:'active',kind:'new',progress:null}).new).toBe(1);
 });
});

describe('daily failure ranking',()=>{
 const now=new Date('2026-10-29T11:00:00Z');
 const e=(id:string,entryId:string,at='2026-10-29T10:00:00Z',rating='again')=>({...event(entryId,at),id,rating} as DeckReviewEvent);
 it('groups effective daily failures, includes eventual successes, deduplicates receipts and has stable ties',()=>{
  const events=[e('1','a'),e('2','a'),e('3','b'),e('4','a',undefined,'good'),e('3','b'),e('5','c'),e('6','y','2026-10-28T10:00:00Z')];
  const rows=deckDayDifficulties(events,deckId,now);expect(rows.map(r=>[r.entryId,r.failures])).toEqual([['a',2],['b',1],['c',1]]);
  expect(deckDayDifficulties(events.filter(e=>e.id!=='2'),deckId,now)[0].failures).toBe(1);
  expect(deckDayDifficulties([],deckId,now)).toEqual([]);
  expect(deckDayDifficulties(events,'other',now)).toEqual([]);
 });
});
