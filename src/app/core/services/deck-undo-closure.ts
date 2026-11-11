import {DeckCardProgress,DeckDailyState,DeckReviewEvent} from '../models/deck-study.model';
import {getLocalStudyDayKey} from './deck-study-time';

export function assertClosureSnapshot(expected:{progress:readonly DeckCardProgress[];entryIds:readonly string[]},current:readonly DeckCardProgress[]){
  const ids=new Set(expected.entryIds),sort=(rows:readonly DeckCardProgress[])=>[...rows].filter(p=>ids.has(p.entryId)).sort((a,b)=>a.entryId.localeCompare(b.entryId));
  if(JSON.stringify(sort(expected.progress))!==JSON.stringify(sort(current)))throw Error('Deck changed during automatic closure');
}

/** Must be evaluated against canonical rows inside the write transaction. */
export function undoDailyState(event:DeckReviewEvent,stored:DeckDailyState,requested:DeckDailyState,events:readonly DeckReviewEvent[],now=new Date()):DeckDailyState {
  if(stored.deckId!==event.deckId||requested.deckId!==event.deckId||stored.localDate!==getLocalStudyDayKey(new Date(event.reviewedAt))
    ||events.some(e=>e.deckId===event.deckId&&e.id!==event.id&&e.reviewedAt>event.reviewedAt))throw Error('Stale undo');
  if(requested.completedAt===null&&stored.completedAt!=null){
    if(stored.closureOrigin!=='automatic'||stored.closedByReviewId!==event.id
      ||requested.closureOrigin!=='automatic'||requested.closedByReviewId!==event.id
      ||stored.localDate!==getLocalStudyDayKey(now)
      ||stored.completedAt<event.reviewedAt||stored.completedAt>now.getTime()
      ||getLocalStudyDayKey(new Date(stored.completedAt))!==stored.localDate
      ||events.some(e=>e.deckId===event.deckId&&e.id!==event.id&&e.reviewedAt>=event.reviewedAt))throw Error('Unsafe closed-session undo');
    stored={...stored,completedAt:null};
  }
  return {...stored,introducedEntryIds:event.cardBefore===null||event.cardBefore.state===0?stored.introducedEntryIds.filter(id=>id!==event.entryId):stored.introducedEntryIds};
}

export {preserveClosure} from './deck-closure-state';
