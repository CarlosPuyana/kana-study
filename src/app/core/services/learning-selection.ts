import { Kana, KanaType, KanaVariant } from '../models/kana.model';
import { LearningSelection } from '../models/settings.model';

export const KANA_TYPES: readonly KanaType[] = ['hiragana', 'katakana'];
export const KANA_VARIANTS: readonly KanaVariant[] = [
  'basic', 'dakuten', 'handakuten', 'combination',
];

export function countSelectedCategories(selection: LearningSelection): number {
  return KANA_TYPES.reduce((total, type) =>
    total + KANA_VARIANTS.filter(variant => selection.categories[type][variant]).length, 0);
}

export function countAvailableExercises(
  selection: LearningSelection,
  kana: readonly Kana[],
): number {
  const selectedKana = kana.filter(item => selection.categories[item.type][item.variant]).length;
  return selectedKana * selection.questionTypes.length;
}

export function isLearningSelectionValid(selection: LearningSelection): boolean {
  return countSelectedCategories(selection) > 0 && selection.questionTypes.length > 0;
}
