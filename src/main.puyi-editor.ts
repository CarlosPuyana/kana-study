import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withHashLocation, withInMemoryScrolling } from '@angular/router';
import { PhraseAuthoringPreferences } from './app/core/services/phrase-authoring-preferences.service';
import { SettingsService } from './app/core/services/settings.service';
import { PuyiEditorPage, PuyiEditorSession } from './app/features/puyi-editor/puyi-editor.page';
import { PuyiDemoShell, PuyiIslandPage } from './app/features/puyi-islands/puyi-island-pages';
import { PUYI_LIBRARY_SOURCE } from './app/features/puyi-islands/puyi-library-source';

bootstrapApplication(PuyiDemoShell, {
  providers: [
    provideRouter([
      { path: '', pathMatch: 'full', component: PuyiEditorPage },
      { path: 'island/:id', component: PuyiIslandPage },
      { path: '**', redirectTo: '' },
    ], withHashLocation(), withInMemoryScrolling({ scrollPositionRestoration: 'enabled' })),
    PhraseAuthoringPreferences,
    { provide: SettingsService, useExisting: PhraseAuthoringPreferences },
    { provide: PUYI_LIBRARY_SOURCE, useFactory: (session: PuyiEditorSession) => session.source, deps: [PuyiEditorSession] },
  ],
}).catch(() => console.error('Local editor could not start.'));
