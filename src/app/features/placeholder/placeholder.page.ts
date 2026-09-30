import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslationService } from '../../core/services/translation.service';

@Component({
  selector: 'app-placeholder-page',
  imports: [RouterLink],
  templateUrl: './placeholder.page.html',
  styleUrl: './placeholder.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaceholderPage {
  private readonly route = inject(ActivatedRoute);
  readonly i18n = inject(TranslationService);

  readonly titleKey = this.route.snapshot.data['titleKey'] as string;
  readonly descriptionKey = this.route.snapshot.data['descriptionKey'] as string;
}
