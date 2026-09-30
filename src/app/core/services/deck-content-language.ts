import { AppLanguage } from '../models/settings.model';

/** Japanese deck content currently has ES/EN; Catalan intentionally falls back to Spanish. */
export function deckContentLanguage(language: AppLanguage): 'es' | 'en' {
  return language === 'en' ? 'en' : 'es';
}
