import { Routes } from '@angular/router';

export const ANKI_ROUTES: Routes = [
  {
    path: '', data: {titleKey: 'anki.title'},
    loadComponent: () => import('./anki.page').then(module => module.AnkiPage),
  },
  {
    path: ':deckId/cards', data: {titleKey: 'cards.title'},
    loadComponent: () => import('../anki-cards/anki-cards.page').then(module => module.AnkiCardsPage),
  },
  {
    path: ':deckId/stats', data: {titleKey: 'stats.title'},
    loadComponent: () => import('../anki-stats/anki-stats.page').then(module => module.AnkiStatsPage),
  },
  {
    path: ':deckId/settings', data: {titleKey: 'settings.title'},
    loadComponent: () => import('../anki-settings/anki-settings.page').then(module => module.AnkiSettingsPage),
  },
  {
    path: ':deckId/study', data: {titleKey: 'anki.title'},
    loadComponent: () => import('../anki-study/anki-study.page').then(module => module.AnkiStudyPage),
  },
];
