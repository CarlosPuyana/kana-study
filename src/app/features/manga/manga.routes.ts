import { Routes } from '@angular/router';
export const MANGA_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./manga.page').then(m => m.MangaPage) },
  { path: 'read/:volumeId', loadComponent: () => import('./manga-reader.page').then(m => m.MangaReaderPage) },
];
