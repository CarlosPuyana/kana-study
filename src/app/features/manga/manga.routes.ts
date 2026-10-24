import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { CUSTOM_DECKS_ENABLED } from '../../core/services/custom-deck-gates';
import { MANGA_DECK_ASSISTED_ENABLED } from '../../core/services/manga-deck-gate';
export const MANGA_ROUTES: Routes = [
  { path:'vocabulary/:volumeId',canMatch:[()=>inject(CUSTOM_DECKS_ENABLED)()&&inject(MANGA_DECK_ASSISTED_ENABLED)()],
    data:{titleKey:'mangaVocab.title'},loadComponent:()=>import('./manga-volume-vocabulary.page').then(m=>m.MangaVolumeVocabularyPage) },
  { path: 'study/fsrs', data: {titleKey:'manga.fsrs.title'}, loadComponent:()=>import('./manga-fsrs.page').then(m=>m.MangaFsrsPage) },
  { path: 'study/review', data: {titleKey:'manga.review.title'}, loadComponent:()=>import('./manga-review.page').then(m=>m.MangaReviewPage) },
  { path: '', data: {titleKey: 'more.manga.title'}, loadComponent: () => import('./manga.page').then(m => m.MangaPage) },
  { path: 'study', data: {titleKey:'manga.saved.title'}, loadComponent:()=>import('./manga-study.page').then(m=>m.MangaStudyPage) },
  { path: 'guide', data: {titleKey: 'manga.guide.title'}, loadComponent: () => import('./manga-guide.page').then(m => m.MangaGuidePage) },
  { path: 'read/:volumeId', data: {titleKey: 'more.manga.title'}, loadComponent: () => import('./manga-reader.page').then(m => m.MangaReaderPage) },
];
