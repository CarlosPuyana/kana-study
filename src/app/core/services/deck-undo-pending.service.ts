import {inject,Injectable} from '@angular/core';
import {WorkspaceService} from './workspace.service';
import {DeckReviewEvent} from '../models/deck-study.model';
import {eventValid} from './custom-deck-validation';
import {getLocalStudyDayKey} from './deck-study-time';

@Injectable({providedIn:'root'})
export class DeckUndoPendingService {
  private readonly workspace=inject(WorkspaceService);
  private key(deck:string){return this.workspace.storageKey('kana-study.deck-undo-pending.v1.'+deck);}
  read(deck:string):{event:DeckReviewEvent;reopen:boolean}|null {
    const raw=localStorage.getItem(this.key(deck));if(raw===null)return null;
    const value=JSON.parse(raw);
    if(!value||!eventValid(value.event)||value.event.deckId!==deck||typeof value.reopen!=='boolean'
      ||getLocalStudyDayKey(new Date(value.event.reviewedAt))!==getLocalStudyDayKey(new Date()))throw Error('Unverifiable pending undo');
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
}
