import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { APP_MODULES } from '../../data/app-modules';
import { TranslationService } from '../../core/services/translation.service';
import { ModuleCard } from '../../shared/components/module-card/module-card';

@Component({
  selector: 'app-more-page',
  imports: [ModuleCard, RouterLink],
  templateUrl: './more.page.html',
  styleUrl: './more.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MorePage {
  readonly i18n = inject(TranslationService);
  private readonly route = inject(ActivatedRoute);
  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  readonly currentModule = computed(() => {
    const requestedId = this.queryParams().get('from');
    return APP_MODULES.find(module => module.available && module.id === requestedId);
  });
  readonly modules = computed(() =>
    APP_MODULES.filter(module => module.id !== this.currentModule()?.id),
  );
  readonly returnRoute = computed(() => this.currentModule()?.route ?? '/');
}
