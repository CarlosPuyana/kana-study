import { Routes } from '@angular/router';
export const VOCABULARY_ROUTES:Routes=[
  {path:'', data: {titleKey: 'vocabulary.title'},loadComponent:()=>import('./vocabulary.page').then(m=>m.VocabularyPage)},
  {path:'selection', data: {titleKey: 'vocabulary.selection.title'},loadComponent:()=>import('../vocabulary-selection/vocabulary-selection.page').then(m=>m.VocabularySelectionPage)},
  {path:'play', data: {titleKey: 'vocabulary.learn'},loadComponent:()=>import('../vocabulary-play/vocabulary-play.page').then(m=>m.VocabularyPlayPage)},
  {path:'all', data: {titleKey: 'vocabulary.all.title'},loadComponent:()=>import('../vocabulary-all/vocabulary-all.page').then(m=>m.VocabularyAllPage)},
  {path:'medals', data: {titleKey: 'medals.title'},loadComponent:()=>import('../vocabulary-medals/vocabulary-medals.page').then(m=>m.VocabularyMedalsPage)},
  {path:'rush', data: {titleKey: 'rush.title'},loadComponent:()=>import('../rush/vocabulary-rush.page').then(m=>m.VocabularyRushPage)},
  {path:'writing', data: {titleKey: 'vocabularyWriting.title'},loadComponent:()=>import('../vocabulary-writing/vocabulary-writing.page').then(m=>m.VocabularyWritingPage)},
  {path:'listening', data: {titleKey: 'listening.title'},loadComponent:()=>import('../vocabulary-listening/vocabulary-listening.page').then(m=>m.VocabularyListeningPage)},
];
