import { Routes } from '@angular/router';

export const FLAGS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./flags.page').then(module => module.FlagsPage) },
  { path: 'selection', loadComponent: () => import('../flags-selection/flags-selection.page').then(module => module.FlagsSelectionPage) },
  { path: 'play', loadComponent: () => import('../flags-play/flags-play.page').then(module => module.FlagsPlayPage) },
  { path: 'countries', loadComponent: () => import('../flag-countries/flag-countries.page').then(module => module.FlagCountriesPage) },
  { path: 'medals', loadComponent: () => import('../flag-medals/flag-medals.page').then(module => module.FlagMedalsPage) },
];
