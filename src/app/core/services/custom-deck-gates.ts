import {InjectionToken,signal} from '@angular/core';
/** Internal release gates. No route, preference or public provider enables them. */
export const CUSTOM_DECKS_ENABLED=new InjectionToken('custom decks enabled',{providedIn:'root',factory:()=>signal(false)});
export const CUSTOM_DECK_SYNC_ENABLED=new InjectionToken('custom cloud opt-in, internal only',{providedIn:'root',factory:()=>signal(false)});
export const CUSTOM_REMOTE_UPLOAD_APPROVED=new InjectionToken<boolean>('custom real-account upload release approval',{providedIn:'root',factory:()=>false});
