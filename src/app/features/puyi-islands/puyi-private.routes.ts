import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet, type Routes } from '@angular/router';
import { TranslationService } from '../../core/services/translation.service';
import { puyiCopy } from './puyi-copy';
import { PuyiIslandPage, PuyiLibraryPage } from './puyi-island-pages';
import { PUYI_CLIP_LEASE, PUYI_CLIP_RESOLVER, PUYI_LIBRARY_SOURCE, type PuyiClipLease, type PuyiClipResolver } from './puyi-library-source';
import { PuyiPrivateCatalog } from './puyi-private-catalog';

@Component({
  selector: 'app-puyi-private',
  imports: [RouterOutlet],
  template: '<router-outlet />',
  providers: [
    PuyiPrivateCatalog,
    { provide: PUYI_LIBRARY_SOURCE, useExisting: PuyiPrivateCatalog },
    { provide: PUYI_CLIP_RESOLVER, useFactory: (): PuyiClipResolver => {
      const catalog = inject(PuyiPrivateCatalog);
      return (key, bytes, signal) => catalog.download(key, bytes, signal);
    } },
    { provide: PUYI_CLIP_LEASE, useFactory: (): PuyiClipLease => {
      const catalog = inject(PuyiPrivateCatalog);
      return (key, signal) => catalog.lease(key, signal);
    } },
  ],
  host: {
    '(window:focus)': 'catalog.refresh()',
    '(document:visibilitychange)': 'refreshVisible()',
    '(window:pageshow)': 'catalog.refresh()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class PuyiPrivateShell {
  readonly catalog = inject(PuyiPrivateCatalog);
  constructor() { inject(TranslationService).useStudyCopy(puyiCopy); }
  refreshVisible(): void { if (!document.hidden) this.catalog.refresh(); }
}

export const PUYI_PRIVATE_ROUTES: Routes = [{
  path: '',
  component: PuyiPrivateShell,
  children: [
    { path: '', pathMatch: 'full', component: PuyiLibraryPage, data: { titleKey: 'puyiIslands.title' } },
    { path: 'island/:id', component: PuyiIslandPage, data: { titleKey: 'puyiIslands.title' } },
  ],
}];
