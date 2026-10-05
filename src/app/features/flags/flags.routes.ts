import { Routes } from '@angular/router';

export const FLAGS_ROUTES: Routes = [
  { path: '', data: {titleKey: 'flags.title'}, loadComponent: () => import('./flags.page').then(module => module.FlagsPage) },
  { path: 'selection', data: {titleKey: 'flags.selection.title'}, loadComponent: () => import('../flags-selection/flags-selection.page').then(module => module.FlagsSelectionPage) },
  { path: 'play', data: {titleKey: 'flags.play'}, loadComponent: () => import('../flags-play/flags-play.page').then(module => module.FlagsPlayPage) },
  { path: 'countries', data: {titleKey: 'flags.countries.title'}, loadComponent: () => import('../flag-countries/flag-countries.page').then(module => module.FlagCountriesPage) },
  { path: 'medals', data: {titleKey: 'medals.title'}, loadComponent: () => import('../flag-medals/flag-medals.page').then(module => module.FlagMedalsPage) },
];
