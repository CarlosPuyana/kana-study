import { Routes } from '@angular/router';
export const VOCABULARY_ROUTES:Routes=[
  {path:'',loadComponent:()=>import('./vocabulary.page').then(m=>m.VocabularyPage)},
  {path:'selection',loadComponent:()=>import('../vocabulary-selection/vocabulary-selection.page').then(m=>m.VocabularySelectionPage)},
  {path:'play',loadComponent:()=>import('../vocabulary-play/vocabulary-play.page').then(m=>m.VocabularyPlayPage)},
  {path:'all',loadComponent:()=>import('../vocabulary-all/vocabulary-all.page').then(m=>m.VocabularyAllPage)},
  {path:'medals',loadComponent:()=>import('../vocabulary-medals/vocabulary-medals.page').then(m=>m.VocabularyMedalsPage)},
  {path:'rush',loadComponent:()=>import('../rush/vocabulary-rush.page').then(m=>m.VocabularyRushPage)},
  {path:'writing',loadComponent:()=>import('../vocabulary-writing/vocabulary-writing.page').then(m=>m.VocabularyWritingPage)},
  {path:'listening',loadComponent:()=>import('../vocabulary-listening/vocabulary-listening.page').then(m=>m.VocabularyListeningPage)},
];
