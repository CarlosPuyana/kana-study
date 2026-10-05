import {LocalizedTitleStrategy} from './core/services/localized-title.strategy';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, TitleStrategy, withHashLocation } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    {provide:TitleStrategy,useClass:LocalizedTitleStrategy},
    provideRouter(routes, withHashLocation()),
  ],
};
