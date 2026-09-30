import { Routes } from '@angular/router';

export const ANKI_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./anki.page').then(module => module.AnkiPage),
  },
  {
    path: ':deckId/cards',
    loadComponent: () => import('../anki-cards/anki-cards.page').then(module => module.AnkiCardsPage),
  },
  {
    path: ':deckId/stats',
    loadComponent: () => import('../anki-stats/anki-stats.page').then(module => module.AnkiStatsPage),
  },
  {
    path: ':deckId/settings',
    loadComponent: () => import('../anki-settings/anki-settings.page').then(module => module.AnkiSettingsPage),
  },
  {
    path: ':deckId/study',
    loadComponent: () => import('../anki-study/anki-study.page').then(module => module.AnkiStudyPage),
  },
];
