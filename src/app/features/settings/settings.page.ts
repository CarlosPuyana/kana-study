import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContentSettings, VariantSettings } from '../../core/models/settings.model';
import { ProgressService } from '../../core/services/progress.service';
import { SettingsService } from '../../core/services/settings.service';
import { TranslationService } from '../../core/services/translation.service';

@Component({
  selector: 'app-settings-page',
  imports: [RouterLink],
  templateUrl: './settings.page.html',
  styleUrl: './settings.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPage {
  readonly settings = inject(SettingsService);
  readonly progress = inject(ProgressService);
  readonly i18n = inject(TranslationService);

  setContent(key: keyof ContentSettings, enabled: boolean): void {
    this.settings.setContent(key, enabled);
  }

  setVariant(key: keyof VariantSettings, enabled: boolean): void {
    this.settings.setVariant(key, enabled);
  }

  confirmResetProgress(): void {
    if (window.confirm(this.i18n.t('settings.resetProgressConfirm'))) {
      this.progress.resetProgress();
    }
  }
}
