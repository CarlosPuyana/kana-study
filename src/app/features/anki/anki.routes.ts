import {customDeckRouteGuard,guestCustomRouteGuard} from '../../core/services/custom-deck-route.guard';
import { Routes } from '@angular/router';
import {inject} from '@angular/core';
import {CUSTOM_DECKS_ENABLED} from '../../core/services/custom-deck-gates';

export const ANKI_ROUTES: Routes = [
  {path:'islands/listen',data:{mode:'listen',titleKey:'phraseIslands.mode.listen.title'},loadComponent:()=>import('../phrase-islands/phrase-session.page').then(m=>m.PhraseSessionPage)},
  {path:'islands/shadowing',data:{mode:'shadowing',titleKey:'phraseIslands.mode.shadowing.title'},loadComponent:()=>import('../phrase-islands/phrase-session.page').then(m=>m.PhraseSessionPage)},
  {path:'islands/recall',data:{mode:'recall',titleKey:'phraseIslands.mode.recall.title'},loadComponent:()=>import('../phrase-islands/phrase-session.page').then(m=>m.PhraseSessionPage)},
  { path: 'islands/explore', data: { explore: true, titleKey: 'phraseIslands.browse' }, loadComponent: () => import('../phrase-islands/phrase-islands.page').then(m => m.PhraseIslandsPage) },
  { path: 'islands', data: { titleKey: 'phraseIslands.title' }, loadComponent: () => import('../phrase-islands/phrase-islands.page').then(m => m.PhraseIslandsPage) },
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
