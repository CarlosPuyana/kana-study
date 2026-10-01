import { Routes } from '@angular/router';
import { HomePage } from './features/home/home.page';
import { SettingsPage } from './features/settings/settings.page';
import { CardsPage } from './features/cards/cards.page';
import { LearnPage } from './features/learn/learn.page';
import { SelectionPage } from './features/selection/selection.page';
import { MedalsPage } from './features/medals/medals.page';
import { MorePage } from './features/more/more.page';

export const routes: Routes = [
  { path: '', component: HomePage, title: 'Kana Study' },
  { path: 'settings', component: SettingsPage, title: 'Settings · Kana Study' },
  {
    path: 'learn',
    component: LearnPage,
  },
  {
    path: 'cards',
    component: CardsPage,
  },
  {
    path: 'selection',
    component: SelectionPage,
  },
  {
    path: 'medals',
    component: MedalsPage,
  },
  {
    path: 'more',
    component: MorePage,
  },
  { path: 'auth', loadComponent: () => import('./features/auth/auth.page').then(module => module.AuthPage) },
  { path: 'profile', loadComponent: () => import('./features/profile/profile.page').then(module => module.ProfilePage) },
  {
    path: 'flags',
    loadChildren: () => import('./features/flags/flags.routes').then(module => module.FLAGS_ROUTES),
  },
  {
    path: 'kanji',
    loadChildren: () => import('./features/kanji/kanji.routes').then(module => module.KANJI_ROUTES),
  },
  {
    path: 'vocabulary',
    loadChildren: () => import('./features/vocabulary/vocabulary.routes').then(module => module.VOCABULARY_ROUTES),
  },
  {
    path: 'anki',
    loadChildren: () => import('./features/anki/anki.routes').then(module => module.ANKI_ROUTES),
  },
  { path: 'rush/medals', loadComponent: () => import('./features/rush/rush-medals.page').then(module => module.RushMedalsPage) },
  { path: 'rush', loadComponent: () => import('./features/rush/kana-rush.page').then(module => module.KanaRushPage) },
  { path: '**', redirectTo: '' },
];
