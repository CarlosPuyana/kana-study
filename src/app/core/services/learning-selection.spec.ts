import { ALL_KANA } from '../../data/kana';
import { DEFAULT_LEARNING_SELECTION, LearningSelection } from '../models/settings.model';
import {
  countAvailableExercises,
  countSelectedCategories,
  isLearningSelectionValid,
} from './learning-selection';

function selection(): LearningSelection {
  return structuredClone(DEFAULT_LEARNING_SELECTION);
}

describe('LearningSelection', () => {
  it('starts with only Hiragana basic and Kana to Romaji selected', () => {
    const value = selection();
    expect(value.categories.hiragana.basic).toBe(true);
    expect(Object.values(value.categories.hiragana).filter(Boolean)).toHaveLength(1);
    expect(Object.values(value.categories.katakana).some(Boolean)).toBe(false);
    expect(value.questionTypes).toEqual(['kana-to-romaji']);
    expect(countSelectedCategories(value)).toBe(1);
  });

  it('counts Hiragana basic and dakuten as 2 of 8 categories', () => {
    const value = selection();
    value.categories.hiragana.dakuten = true;
    expect(countSelectedCategories(value)).toBe(2);
  });

  it('calculates exercises from selected kana multiplied by question types', () => {
    const value = selection();
    value.categories.hiragana.dakuten = true;
    value.questionTypes = ['kana-to-romaji', 'romaji-to-kana'];
    const selectedKana = ALL_KANA.filter(kana =>
      kana.type === 'hiragana'
      && (kana.variant === 'basic' || kana.variant === 'dakuten'),
    ).length;
    expect(countAvailableExercises(value, ALL_KANA)).toBe(selectedKana * 2);
  });

  it('is invalid with zero selected categories', () => {
    const value = selection();
    value.categories.hiragana.basic = false;
    expect(isLearningSelectionValid(value)).toBe(false);
  });

  it('is invalid with zero selected question types', () => {
    const value = selection();
    value.questionTypes = [];
    expect(isLearningSelectionValid(value)).toBe(false);
  });
});
