export type AppModuleId =
  | 'kana'
  | 'kanji'
  | 'vocabulary'
  | 'flags'
  | 'anki'
  | 'grammar'
  | 'manga'
  | 'extras';

export type AppModuleIcon = AppModuleId;

export interface AppModuleDefinition {
  readonly id: AppModuleId;
  readonly titleKey: string;
  readonly descriptionKey: string;
  readonly icon: AppModuleIcon;
  readonly route: string;
  readonly available: boolean;
  readonly order: number;
}
