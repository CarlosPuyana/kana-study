import { Routes } from '@angular/router';
export const MANGA_ROUTES: Routes = [
  { path: '', data: {titleKey: 'more.manga.title'}, loadComponent: () => import('./manga.page').then(m => m.MangaPage) },
  { path: 'study', data: {titleKey:'manga.saved.title'}, loadComponent:()=>import('./manga-study.page').then(m=>m.MangaStudyPage) },
  { path: 'guide', data: {titleKey: 'manga.guide.title'}, loadComponent: () => import('./manga-guide.page').then(m => m.MangaGuidePage) },
  { path: 'read/:volumeId', data: {titleKey: 'more.manga.title'}, loadComponent: () => import('./manga-reader.page').then(m => m.MangaReaderPage) },
];
