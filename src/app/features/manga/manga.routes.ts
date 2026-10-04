import { Routes } from '@angular/router';
export const MANGA_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./manga.page').then(m => m.MangaPage) },
  { path: 'guide', loadComponent: () => import('./manga-guide.page').then(m => m.MangaGuidePage) },
  { path: 'read/:volumeId', loadComponent: () => import('./manga-reader.page').then(m => m.MangaReaderPage) },
];
