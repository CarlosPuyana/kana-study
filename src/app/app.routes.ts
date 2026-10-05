import { Routes } from '@angular/router';
import { HomePage } from './features/home/home.page';

export const routes: Routes = [
  { path: '', data: {titleKey: 'navigation.home'}, component: HomePage, title: 'Kana Study' },
  { path: 'settings', data: {titleKey: 'settings.title'}, loadComponent: () => import('./features/settings/settings.page').then(module => module.SettingsPage), title: 'Settings · Kana Study' },
  {
    path: 'learn', data: {titleKey: 'navigation.learn'},
    loadComponent: () => import('./features/learn/learn.page').then(module => module.LearnPage),
  },
  {
    path: 'cards', data: {titleKey: 'cards.title'},
    loadComponent: () => import('./features/cards/cards.page').then(module => module.CardsPage),
  },
  {
    path: 'selection', data: {titleKey: 'selection.title'},
    loadComponent: () => import('./features/selection/selection.page').then(module => module.SelectionPage),
  },
  {
    path: 'medals', data: {titleKey: 'medals.title'},
    loadComponent: () => import('./features/medals/medals.page').then(module => module.MedalsPage),
  },
  {
    path: 'more', data: {titleKey: 'more.title'},
    loadComponent: () => import('./features/more/more.page').then(module => module.MorePage),
  },
  { path: 'auth', data: {titleKey: 'navigation.account'}, loadComponent: () => import('./features/auth/auth.page').then(module => module.AuthPage) },
  { path: 'profile', data: {titleKey: 'profile.title'}, loadComponent: () => import('./features/profile/profile.page').then(module => module.ProfilePage) },
  { path: 'writing', data: {titleKey: 'writing.title'}, loadComponent: () => import('./features/writing/kana-writing.page').then(module => module.KanaWritingPage) },
  { path: 'weaknesses', data: {titleKey: 'weaknesses.title'}, loadComponent: () => import('./features/weaknesses/weaknesses.page').then(module => module.WeaknessesPage) },
  { path: 'stats', data: {titleKey: 'stats.title'}, loadComponent: () => import('./features/stats/stats.page').then(module => module.StatsPage) },
  {
    path: 'flags', data: {titleKey: 'flags.title'},
    loadChildren: () => import('./features/flags/flags.routes').then(module => module.FLAGS_ROUTES),
  },
  {
    path: 'kanji', data: {titleKey: 'kanji.title'},
    loadChildren: () => import('./features/kanji/kanji.routes').then(module => module.KANJI_ROUTES),
  },
  {
    path: 'vocabulary', data: {titleKey: 'vocabulary.title'},
    loadChildren: () => import('./features/vocabulary/vocabulary.routes').then(module => module.VOCABULARY_ROUTES),
  },
  {
    path: 'anki', data: {titleKey: 'anki.title'},
    loadChildren: () => import('./features/anki/anki.routes').then(module => module.ANKI_ROUTES),
  },
  { path: 'rush/medals', data: {titleKey: 'medals.title'}, loadComponent: () => import('./features/rush/rush-medals.page').then(module => module.RushMedalsPage) },
  { path: 'rush', data: {titleKey: 'rush.title'}, loadComponent: () => import('./features/rush/kana-rush.page').then(module => module.KanaRushPage) },
  { path: 'manga', data: {titleKey: 'more.manga.title'}, loadChildren: () => import('./features/manga/manga.routes').then(module => module.MANGA_ROUTES) },
  { path: 'grammar', data: {titleKey: 'grammar.title'}, loadChildren: () => import('./features/grammar/grammar.routes').then(module => module.GRAMMAR_ROUTES) },
  { path: 'upload', data: {titleKey: 'manga.remote.title'}, loadComponent: () => import('./features/manga/mokuro-remote-import.page').then(module => module.MokuroRemoteImportPage) },
  { path: '**', redirectTo: '' },
];
