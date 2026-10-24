import {guestHeadFamily,orderedGuestEvents} from './custom-guest-import-helpers';
import {CustomInventoryRow} from '../models/custom-guest-import.model';
describe('Guest import ancestry and atomic families',()=>{
 const row=(id:string,head:string|null):CustomInventoryRow=>({key:id,head,value:{entryId:'same-card',deckId:'same-deck'}});
 it('handles a 10000-event chain iteratively while preserving dependency order',()=>{const events=Array.from({length:10000},(_,i)=>row('event-'+i,i?'event-'+(i-1):null)).reverse();const ordered=orderedGuestEvents(events);expect(ordered[0].key).toBe('event-0');expect(ordered.at(-1)?.key).toBe('event-9999');expect(guestHeadFamily(ordered,'event-9990')).toHaveLength(10);});
 it('detects cycles, absent parents and cross-card references before upload',()=>{expect(()=>orderedGuestEvents([row('a','b'),row('b','a')])).toThrow('Cyclic');expect(()=>orderedGuestEvents([row('a','missing')])).toThrow('Missing');expect(()=>orderedGuestEvents([row('a',null),{...row('b','a'),value:{entryId:'foreign',deckId:'same-deck'}}])).toThrow('Foreign');});
 it('keeps the active head and all annulled siblings together, without dragging in earlier ancestors',()=>{const events=[row('ancestor',null),row('head','ancestor'),row('voided-1','head'),row('voided-2','head')];expect(guestHeadFamily(events,'head').map(r=>r.key)).toEqual(['head','voided-1','voided-2']);});
});
