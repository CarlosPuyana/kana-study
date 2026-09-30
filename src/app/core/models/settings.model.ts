import { KanaType, KanaVariant } from './kana.model';
import { QuestionType } from './progress.model';

export type AppLanguage = 'es' | 'en' | 'ca';
export type ThemePreference = 'dark' | 'light' | 'nora' | 'system';

export interface ContentSettings {
  hiragana: boolean;
  katakana: boolean;
  kanji: boolean;
  vocabulary: boolean;
}

export interface VariantSettings {
  basic: boolean;
  dakuten: boolean;
  handakuten: boolean;
  combination: boolean;
}

export interface LearningSettings {
  content: ContentSettings;
  variants: VariantSettings;
  questionTypes: Record<QuestionType, boolean>;
}

export type CategorySelection = Record<KanaVariant, boolean>;

export interface LearningSelection {
  categories: Record<KanaType, CategorySelection>;
  questionTypes: QuestionType[];
}

export interface AppSettings {
  language: AppLanguage;
  theme: ThemePreference;
  learning: LearningSelection;
}

export const DEFAULT_LEARNING_SELECTION: LearningSelection = {
  categories: {
    hiragana: { basic: true, dakuten: false, handakuten: false, combination: false },
    katakana: { basic: false, dakuten: false, handakuten: false, combination: false },
  },
  questionTypes: ['kana-to-romaji'],
};
