import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { KanaType, KanaVariant } from '../models/kana.model';
import {
  AppLanguage,
  AppSettings,
  ContentSettings,
  DEFAULT_LEARNING_SELECTION,
  LearningSelection,
  LearningSettings,
  ThemePreference,
  VariantSettings,
} from '../models/settings.model';
import { QUESTION_TYPES, QuestionType } from '../models/progress.model';
import { StorageService } from './storage.service';

const SETTINGS_KEY = 'kana-study.settings.v1';
const TYPES: readonly KanaType[] = ['hiragana', 'katakana'];
const VARIANTS: readonly KanaVariant[] = ['basic', 'dakuten', 'handakuten', 'combination'];
const AVAILABLE_QUESTION_TYPES: readonly QuestionType[] = ['kana-to-romaji', 'romaji-to-kana'];

const DEFAULT_SETTINGS: AppSettings = {
  language: 'es',
  theme: 'dark',
  learning: DEFAULT_LEARNING_SELECTION,
};

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly storage = inject(StorageService);
  private readonly state = signal<AppSettings>(
    this.normalize(this.storage.get<unknown>(SETTINGS_KEY, DEFAULT_SETTINGS)),
  );
  private readonly systemDarkQuery = window.matchMedia('(prefers-color-scheme: dark)');

  readonly settings = this.state.asReadonly();
  readonly language = computed(() => this.state().language);
  readonly theme = computed(() => this.state().theme);
  readonly selection = computed(() => this.state().learning);
  readonly learning = computed<LearningSettings>(() => {
    const selection = this.selection();
    return {
      content: {
        hiragana: Object.values(selection.categories.hiragana).some(Boolean),
        katakana: Object.values(selection.categories.katakana).some(Boolean),
        kanji: false,
        vocabulary: false,
      },
      variants: {
        basic: TYPES.some(type => selection.categories[type].basic),
        dakuten: TYPES.some(type => selection.categories[type].dakuten),
        handakuten: TYPES.some(type => selection.categories[type].handakuten),
        combination: TYPES.some(type => selection.categories[type].combination),
      },
      questionTypes: Object.fromEntries(
        QUESTION_TYPES.map(type => [type, selection.questionTypes.includes(type)]),
      ) as Record<QuestionType, boolean>,
    };
  });

  constructor() {
    effect(() => {
      const settings = this.state();
      this.storage.set(SETTINGS_KEY, settings);
      this.applyTheme(settings.theme);
      document.documentElement.lang = settings.language;
    });

    this.systemDarkQuery.addEventListener('change', () => {
      if (this.state().theme === 'system') this.applyTheme('system');
    });
  }

  setLanguage(language: AppLanguage): void {
    this.patch({ language });
  }

  setTheme(theme: ThemePreference): void {
    this.patch({ theme });
  }

  saveLearningSelection(selection: LearningSelection): void {
    this.state.update(current => ({
      ...current,
      learning: {
        categories: structuredClone(selection.categories),
        questionTypes: selection.questionTypes.filter(type => AVAILABLE_QUESTION_TYPES.includes(type)),
      },
    }));
  }

  setContent(key: keyof ContentSettings, enabled: boolean): void {
    if (key !== 'hiragana' && key !== 'katakana') return;
    const selection = structuredClone(this.selection());
    for (const variant of VARIANTS) selection.categories[key][variant] = enabled;
    this.saveLearningSelection(selection);
  }

  setVariant(key: keyof VariantSettings, enabled: boolean): void {
    const selection = structuredClone(this.selection());
    for (const type of TYPES) selection.categories[type][key] = enabled;
    this.saveLearningSelection(selection);
  }

  reset(): void {
    this.state.set(structuredClone(DEFAULT_SETTINGS));
  }

  private patch(partial: Partial<AppSettings>): void {
    this.state.update(current => ({ ...current, ...partial }));
  }

  private normalize(stored: unknown): AppSettings {
    const record = this.asRecord(stored);
    return {
      language: record['language'] === 'en' || record['language'] === 'ca'
        ? record['language'] : 'es',
      theme: record['theme'] === 'light' || record['theme'] === 'system'
        ? record['theme'] : 'dark',
      learning: this.normalizeSelection(record['learning']),
    };
  }

  private normalizeSelection(value: unknown): LearningSelection {
    const learning = this.asRecord(value);
    const categories = this.asRecord(learning['categories']);
    if (Object.keys(categories).length) {
      return {
        categories: {
          hiragana: this.normalizeCategory(categories['hiragana'], 'hiragana'),
          katakana: this.normalizeCategory(categories['katakana'], 'katakana'),
        },
        questionTypes: this.normalizeQuestionTypes(learning['questionTypes']),
      };
    }

    const content = this.asRecord(learning['content']);
    const variants = this.asRecord(learning['variants']);
    if (Object.keys(content).length || Object.keys(variants).length) {
      return {
        categories: {
          hiragana: this.migrateCategory(content, variants, 'hiragana'),
          katakana: this.migrateCategory(content, variants, 'katakana'),
        },
        questionTypes: this.normalizeQuestionTypes(learning['questionTypes']),
      };
    }
    return structuredClone(DEFAULT_LEARNING_SELECTION);
  }

  private normalizeCategory(value: unknown, type: KanaType) {
    const category = this.asRecord(value);
    const fallback = DEFAULT_LEARNING_SELECTION.categories[type];
    return {
      basic: typeof category['basic'] === 'boolean' ? category['basic'] : fallback.basic,
      dakuten: typeof category['dakuten'] === 'boolean' ? category['dakuten'] : fallback.dakuten,
      handakuten: typeof category['handakuten'] === 'boolean' ? category['handakuten'] : fallback.handakuten,
      combination: typeof category['combination'] === 'boolean' ? category['combination'] : fallback.combination,
    };
  }

  private migrateCategory(content: Record<string, unknown>, variants: Record<string, unknown>, type: KanaType) {
    const enabled = content[type] === true;
    return {
      basic: enabled && variants['basic'] === true,
      dakuten: enabled && variants['dakuten'] === true,
      handakuten: enabled && variants['handakuten'] === true,
      combination: enabled && variants['combination'] === true,
    };
  }

  private normalizeQuestionTypes(value: unknown): QuestionType[] {
    if (Array.isArray(value)) {
      const normalized = value.filter((type): type is QuestionType =>
        AVAILABLE_QUESTION_TYPES.includes(type as QuestionType),
      );
      return normalized.length ? normalized : ['kana-to-romaji'];
    }
    const record = this.asRecord(value);
    const migrated = AVAILABLE_QUESTION_TYPES.filter(type => record[type] === true);
    return migrated.length ? migrated : ['kana-to-romaji'];
  }

  private asRecord(value: unknown): Record<string, unknown> {
    return typeof value === 'object' && value !== null
      ? value as Record<string, unknown> : {};
  }

  private applyTheme(preference: ThemePreference): void {
    const effectiveTheme = preference === 'system'
      ? this.systemDarkQuery.matches ? 'dark' : 'light'
      : preference;
    document.documentElement.dataset['theme'] = effectiveTheme;
  }
}
