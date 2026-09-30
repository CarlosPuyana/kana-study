import { MedalDefinition } from '../core/models/medal.model';

const medal = (id: string, order: number, secret = false): MedalDefinition => ({
  module: 'rush', id, order, secret, category: 'rush', icon: 'rush',
  titleKey: `rush.medals.${id}.title`, descriptionKey: `rush.medals.${id}.description`,
});

export const RUSH_MEDAL_DEFINITIONS: readonly MedalDefinition[] = [
  medal('rush-first', 1), medal('rush-10-sessions', 2), medal('rush-100-cards', 3),
  medal('rush-1000-cards', 4), medal('rush-5000-cards', 5), medal('rush-30-minutes', 6),
  medal('rush-5-hours', 7), medal('rush-25-hours', 8), medal('rush-all-modules', 9),
  medal('rush-kana-all', 10), medal('rush-kanji-all', 11), medal('rush-vocabulary-all', 12),
  medal('rush-secret-triple-day', 13, true), medal('rush-secret-marathon', 14, true),
  medal('rush-secret-double-cycle', 15, true),
];
