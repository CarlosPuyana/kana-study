import { Routes } from '@angular/router';

export const KANJI_ROUTES: Routes = [
  { path: '', data: {titleKey: 'kanji.title'}, loadComponent: () => import('./kanji.page').then(module => module.KanjiPage) },
  { path: 'selection', data: {titleKey: 'kanji.selection.title'}, loadComponent: () => import('../kanji-selection/kanji-selection.page').then(module => module.KanjiSelectionPage) },
  { path: 'play', data: {titleKey: 'kanji.learn'}, loadComponent: () => import('../kanji-play/kanji-play.page').then(module => module.KanjiPlayPage) },
  { path: 'all', data: {titleKey: 'kanji.all.title'}, loadComponent: () => import('../kanji-all/kanji-all.page').then(module => module.KanjiAllPage) },
  { path: 'medals', data: {titleKey: 'medals.title'}, loadComponent: () => import('../kanji-medals/kanji-medals.page').then(module => module.KanjiMedalsPage) },
  { path: 'rush', data: {titleKey: 'rush.title'}, loadComponent: () => import('../rush/kanji-rush.page').then(module => module.KanjiRushPage) },
  { path: 'writing', data: {titleKey: 'kanjiWriting.title'}, loadComponent: () => import('../kanji-writing/kanji-writing.page').then(module => module.KanjiWritingPage) },
];
