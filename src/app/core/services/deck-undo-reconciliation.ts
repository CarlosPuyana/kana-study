import {DeckReviewEvent,DeckCardProgress,DeckDailyState} from '../models/deck-study.model';
export type UndoCanonicalState='committed'|'not-executed'|'inconsistent';
export class DeckUndoStateError extends Error {constructor(readonly reason:'invalid'|'inconsistent'|'expired'){super('Deck undo '+reason);}}
export class DeckUndoPublicationError extends Error {constructor(cause:unknown){super('Local undo committed; outbox publication deferred',{cause});this.name='DeckUndoPublicationError';}}
/** Read-only classification. Never infer a reversal from the missing event alone. */
export function classifyDeckUndo(event:DeckReviewEvent,progress:readonly DeckCardProgress[],events:readonly DeckReviewEvent[],daily:DeckDailyState|null):UndoCanonicalState{
 const record=events.find(e=>e.id===event.id),card=progress.find(p=>p.entryId===event.entryId)?.card??null;
 if(record)return !events.some(e=>e.id!==event.id&&e.reviewedAt>=event.reviewedAt)&&JSON.stringify(record)===JSON.stringify(event)&&card?.lastReview===event.reviewedAt&&card.due===event.dueAfter&&card.state===event.stateAfter&&card.stability===event.stabilityAfter?'not-executed':'inconsistent';
 if(events.some(e=>e.reviewedAt>=event.reviewedAt)||JSON.stringify(card)!==JSON.stringify(event.cardBefore))return 'inconsistent';
 if(!daily||(event.cardBefore===null||event.cardBefore.state===0)&&daily.introducedEntryIds.includes(event.entryId))return 'inconsistent';
 return 'committed';
}
