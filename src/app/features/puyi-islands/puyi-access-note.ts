import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslationService } from '../../core/services/translation.service';
import { PUYI_LIBRARY_SOURCE } from './puyi-library-source';

@Component({
  selector: 'app-puyi-access-note',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (source.status?.(); as status) {
      <p role="status">{{ copy.t('puyiIslands.access.' + status) }}</p>
      @if (status === 'login') {
        <a routerLink="/auth" [queryParams]="{return: router.url}">{{ copy.t('auth.signIn') }}</a>
      } @else if (status === 'unavailable' || status === 'denied') {
        <button type="button" (click)="source.refresh?.()">{{ copy.t('common.retry') }}</button>
      }
    }
  `,
})
export class PuyiAccessNote {
  readonly source = inject(PUYI_LIBRARY_SOURCE);
  readonly copy = inject(TranslationService);
  readonly router = inject(Router);
}
