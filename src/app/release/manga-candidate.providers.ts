import {Provider,signal} from '@angular/core';
import {CUSTOM_DECKS_ENABLED,CUSTOM_DECK_SYNC_ENABLED,CUSTOM_REMOTE_UPLOAD_APPROVED} from '../core/services/custom-deck-gates';
import {MANGA_DECK_ASSISTED_ENABLED} from '../core/services/manga-deck-gate';
import {CUSTOM_DECK_GUEST_ONLY} from '../core/services/custom-deck-access';

/** Real app services and Auth, no Guest forcing, stubs, debug hooks or public switches. */
export const MANGA_CANDIDATE_PROVIDERS:Provider[]=[
 {provide:CUSTOM_DECKS_ENABLED,useFactory:()=>signal(true).asReadonly()},
 {provide:MANGA_DECK_ASSISTED_ENABLED,useFactory:()=>signal(true).asReadonly()},
 {provide:CUSTOM_DECK_SYNC_ENABLED,useFactory:()=>signal(false).asReadonly()},
 {provide:CUSTOM_REMOTE_UPLOAD_APPROVED,useValue:false},
 {provide:CUSTOM_DECK_GUEST_ONLY,useValue:true},
];
