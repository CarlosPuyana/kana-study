import {inject,Injectable} from '@angular/core';
import {WorkspaceService} from './workspace.service';
import {DeckReviewEvent} from '../models/deck-study.model';
import {eventValid} from './custom-deck-validation';
import {DeckUndoStateError} from './deck-undo-reconciliation';

@Injectable({providedIn:'root'})
export class DeckUndoPendingService {
  private readonly workspace=inject(WorkspaceService);
  private key(deck:string){return this.workspace.storageKey('kana-study.deck-undo-pending.v1.'+deck);}
  read(deck:string):{event:DeckReviewEvent;reopen:boolean}|null {
    const raw=localStorage.getItem(this.key(deck));if(raw===null)return null;
    let value;try{value=JSON.parse(raw);}catch{throw new DeckUndoStateError('invalid');}
    if(!value||!eventValid(value.event)||value.event.deckId!==deck||typeof value.reopen!=='boolean'
      )throw new DeckUndoStateError('invalid');
    return value;
  }
  begin(event:DeckReviewEvent,reopen:boolean){
    if(!eventValid(event))throw Error('Invalid undo event');
    const existing=this.read(event.deckId),value={event,reopen};
    if(existing&&JSON.stringify(existing)!==JSON.stringify(value))throw Error('Another undo is pending');
    localStorage.setItem(this.key(event.deckId),JSON.stringify(value));
  }
  clear(event:DeckReviewEvent){
    const current=this.read(event.deckId);
    if(current&&JSON.stringify(current.event)!==JSON.stringify(event))throw Error('Pending undo changed');
    localStorage.removeItem(this.key(event.deckId));
  }
  retire(event:DeckReviewEvent){
    const current=this.read(event.deckId);if(!current||JSON.stringify(current.event)!==JSON.stringify(event))throw new DeckUndoStateError('inconsistent');
    // Expiry cancels only the request, never a confirmed answer. Keep the original evidence.
    localStorage.setItem(this.key(event.deckId)+'.retired.'+event.id,JSON.stringify(current));this.clear(event);
  }
}
