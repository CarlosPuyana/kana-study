import {DeckDailyState} from '../models/deck-study.model';
export function preserveClosure(stored:DeckDailyState|undefined,requested:DeckDailyState):DeckDailyState {
  const {closureOrigin,closedByReviewId,...base}=requested;
  if(stored?.completedAt!=null)return {...base,completedAt:stored.completedAt,...(stored.closureOrigin?{closureOrigin:stored.closureOrigin}:{}),...(stored.closedByReviewId?{closedByReviewId:stored.closedByReviewId}:{}),introducedEntryIds:stored.introducedEntryIds};
  return {...requested,...(stored?.completedAt===null&&requested.completedAt===undefined?{completedAt:null}:{}),introducedEntryIds:stored?.introducedEntryIds??requested.introducedEntryIds};
}
