import { inject, isDevMode, provideAppInitializer, Provider, EnvironmentProviders, signal } from '@angular/core';
import { CUSTOM_DECKS_ENABLED, CUSTOM_DECK_SYNC_ENABLED, CUSTOM_REMOTE_UPLOAD_APPROVED } from '../core/services/custom-deck-gates';
import { MANGA_DECK_ASSISTED_ENABLED } from '../core/services/manga-deck-gate';
import { SupabaseClientService } from '../core/services/supabase-client.service';
import { WorkspaceService } from '../core/services/workspace.service';
import { MANGA_ASSISTANT_ENDPOINT } from '../core/services/manga-context.service';

export function assertManualMangaHost(hostname: string, development: boolean): void {
  if (!development || (hostname !== 'localhost' && hostname !== '127.0.0.1')) {
    throw new Error('Manga manual development mode requires localhost or 127.0.0.1.');
  }
}

/** Only the explicit local CLI entry point imports these providers. No runtime opt-in. */
export function manualMangaProviders(): (Provider | EnvironmentProviders)[] {
  assertManualMangaHost(window.location.hostname, isDevMode());
  return [
    { provide: CUSTOM_DECKS_ENABLED, useFactory: () => signal(true).asReadonly() },
    { provide: MANGA_DECK_ASSISTED_ENABLED, useFactory: () => signal(true).asReadonly() },
    { provide: CUSTOM_DECK_SYNC_ENABLED, useFactory: () => signal(false).asReadonly() },
    { provide: CUSTOM_REMOTE_UPLOAD_APPROVED, useValue: false },
    { provide: MANGA_ASSISTANT_ENDPOINT, useValue: null },
    // Do not instantiate the real client, restore an account or contact Supabase,
    // even if this origin already has runtime config or a persisted auth session.
    { provide: SupabaseClientService, useValue: {
      config: { url: '', publishableKey: '', configured: false },
      getClient: () => Promise.resolve(null),
    } },
    provideAppInitializer(() => { inject(WorkspaceService).activateGuest(); }),
  ];
}
