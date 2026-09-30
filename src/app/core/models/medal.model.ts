export type MedalCategory = 'learning' | 'mastery' | 'accuracy' | 'consistency' | 'rush';
export type MedalIcon = 'sessions' | 'practice' | 'hiragana' | 'katakana'
  | 'mastery' | 'directions' | 'perfect' | 'calendar' | 'recovery' | 'rush';

export interface MedalDefinition {
  readonly module: 'kana' | 'flags' | 'kanji' | 'vocabulary' | 'rush';
  readonly id: string;
  readonly titleKey: string;
  readonly descriptionKey: string;
  readonly category: MedalCategory;
  readonly secret: boolean;
  readonly order: number;
  readonly icon: MedalIcon;
}

export interface MedalUnlock {
  readonly medalId: string;
  readonly unlockedAt: string;
}

export type MedalProgress =
  | { readonly type: 'counter'; readonly current: number; readonly target: number }
  | { readonly type: 'boolean'; readonly completed: boolean };

export interface MedalState {
  readonly definition: MedalDefinition;
  readonly progress: MedalProgress;
  readonly unlock: MedalUnlock | null;
  readonly unlocked: boolean;
}

export interface MedalPresentation {
  readonly state: MedalState;
  readonly titleKey: string;
  readonly descriptionKey: string;
  readonly progress: MedalProgress | null;
}
