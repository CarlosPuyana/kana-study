import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { manualMangaProviders } from './app/development/manga-manual.providers';

// Separate CLI entry point: never imported by the normal or production bootstrap.
bootstrapApplication(App, {
  providers: [...appConfig.providers, ...manualMangaProviders()],
}).catch(error => console.error(error));
