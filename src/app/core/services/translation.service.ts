import { computed, inject, Injectable } from '@angular/core';
import ca from '../../../assets/i18n/ca.json';
import en from '../../../assets/i18n/en.json';
import es from '../../../assets/i18n/es.json';
import { AppLanguage } from '../models/settings.model';
import { SettingsService } from './settings.service';

type Dictionary = Record<string, string>;

const DICTIONARIES: Record<AppLanguage, Dictionary> = { es, en, ca };

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private readonly settingsService = inject(SettingsService);
  readonly language = this.settingsService.language;
  private readonly dictionary = computed(
    () => DICTIONARIES[this.settingsService.language()] ?? DICTIONARIES.es,
  );

  t(key: string, replacements?: Record<string, string | number>): string {
    let value = this.dictionary()[key] ?? DICTIONARIES.es[key] ?? key;

    if (replacements) {
      for (const [name, replacement] of Object.entries(replacements)) {
        value = value.replaceAll(`{{${name}}}`, String(replacement));
      }
    }

    return value;
  }
}
