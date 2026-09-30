import { Routes } from '@angular/router';

export const KANJI_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./kanji.page').then(module => module.KanjiPage) },
  { path: 'selection', loadComponent: () => import('../kanji-selection/kanji-selection.page').then(module => module.KanjiSelectionPage) },
  { path: 'play', loadComponent: () => import('../kanji-play/kanji-play.page').then(module => module.KanjiPlayPage) },
  { path: 'all', loadComponent: () => import('../kanji-all/kanji-all.page').then(module => module.KanjiAllPage) },
  { path: 'medals', loadComponent: () => import('../kanji-medals/kanji-medals.page').then(module => module.KanjiMedalsPage) },
  { path: 'rush', loadComponent: () => import('../rush/kanji-rush.page').then(module => module.KanjiRushPage) },
];
