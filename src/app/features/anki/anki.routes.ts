import {customDeckRouteGuard,guestCustomRouteGuard} from '../../core/services/custom-deck-route.guard';
import { Routes } from '@angular/router';
import {inject} from '@angular/core';
import {CUSTOM_DECKS_ENABLED} from '../../core/services/custom-deck-gates';

export const ANKI_ROUTES: Routes = [
  {path:'backups',canMatch:[()=>inject(CUSTOM_DECKS_ENABLED)()],canActivate:[guestCustomRouteGuard],data:{titleKey:'settings.data'},loadComponent:()=>import('../anki-backup/anki-backup.page').then(m=>m.AnkiBackupPage)},
  {
    path: '', data: {titleKey: 'anki.title'},
    loadComponent: () => import('./anki.page').then(module => module.AnkiPage),
  },
  {
    canActivate:[customDeckRouteGuard], path: ':deckId/cards', data: {titleKey: 'cards.title'},
    loadComponent: () => import('../anki-cards/anki-cards.page').then(module => module.AnkiCardsPage),
  },
  {
    canActivate:[customDeckRouteGuard], path: ':deckId/stats', data: {titleKey: 'stats.title'},
    loadComponent: () => import('../anki-stats/anki-stats.page').then(module => module.AnkiStatsPage),
  },
  {
    canActivate:[customDeckRouteGuard], path: ':deckId/settings', data: {titleKey: 'settings.title'},
    loadComponent: () => import('../anki-settings/anki-settings.page').then(module => module.AnkiSettingsPage),
  },
  {
    canActivate:[customDeckRouteGuard], path: ':deckId/study', data: {titleKey: 'anki.title'},
    loadComponent: () => import('../anki-study/anki-study.page').then(module => module.AnkiStudyPage),
  },
];
