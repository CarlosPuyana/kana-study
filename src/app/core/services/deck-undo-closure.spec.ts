import {undoDailyState,preserveClosure} from './deck-undo-closure';
import {DeckReviewEvent,DeckDailyState} from '../models/deck-study.model';

describe('Undo closure authorization',()=>{
  const now=new Date('2026-11-10T18:00:00Z');
  const event={id:'last',deckId:'d',entryId:'a',reviewedAt:now.getTime(),cardBefore:null} as DeckReviewEvent;
  const closed:DeckDailyState={deckId:'d',localDate:'2026-11-10',introducedEntryIds:['a'],newLimitOverride:null,completedAt:now.getTime(),closureOrigin:'automatic',closedByReviewId:'last'};
  it('restores quota and opens the existing day only with a matching automatic receipt',()=>{
    expect(undoDailyState(event,closed,{...closed,completedAt:null},[event],now)).toMatchObject({completedAt:null,introducedEntryIds:[]});
  });
  it.each(['voluntary',undefined] as const)('does not reopen a %s or historical closure',origin=>{
    expect(()=>undoDailyState(event,{...closed,closureOrigin:origin},{...closed,completedAt:null},[event],now)).toThrow();
  });
  it('rejects an old receipt, another day and a later revision',()=>{
    for(const c of [{...closed,closedByReviewId:'other'},closed]){
      expect(()=>undoDailyState(event,c,{...closed,completedAt:null},[{...event,id:'newer',reviewedAt:now.getTime()+2}],now)).toThrow();
    }
    expect(()=>undoDailyState(event,closed,{...closed,completedAt:null},[event],new Date('2026-11-11T18:00:00Z'))).toThrow();
  });
  it('cannot relabel a historic or voluntary closure through a later daily write',()=>{
    expect(preserveClosure({...closed,closureOrigin:'voluntary'},closed).closureOrigin).toBe('voluntary');
    expect(preserveClosure({...closed,closureOrigin:undefined,closedByReviewId:undefined},closed).closureOrigin).toBeUndefined();
  });
});
