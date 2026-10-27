import {inject} from '@angular/core';
import {CanActivateFn,Router} from '@angular/router';
import {CustomDeckAccess} from './custom-deck-access';

/** Builtin decks remain available; candidate account custom routes explain scope in Mazos. */
export const customDeckRouteGuard:CanActivateFn=route=>
 !route.paramMap.get('deckId')?.startsWith('md-')||inject(CustomDeckAccess).permitted()||inject(Router).createUrlTree(['/anki']);
export const guestCustomRouteGuard:CanActivateFn=()=>
 inject(CustomDeckAccess).permitted()||inject(Router).createUrlTree(['/anki']);
