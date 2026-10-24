import { InjectionToken, signal } from '@angular/core';

/** No URL, localStorage preference or public control enables this development gate. */
export const MANGA_DECK_ASSISTED_ENABLED = new InjectionToken('manga assisted deck development gate', {
  providedIn: 'root', factory: () => signal(false),
});
