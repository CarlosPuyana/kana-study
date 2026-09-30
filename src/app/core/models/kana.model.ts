export type KanaType = 'hiragana' | 'katakana';
export type KanaVariant = 'basic' | 'dakuten' | 'handakuten' | 'combination';

export interface KanaExample {
  readonly japanese: string;
  readonly romaji: string;
  readonly translations: Readonly<Record<'es' | 'en' | 'ca', string>>;
}

export interface Kana {
  readonly id: string;
  readonly character: string;
  readonly romaji: string;
  readonly type: KanaType;
  readonly group: string;
  readonly variant: KanaVariant;
  readonly order: number;
  readonly examples: readonly KanaExample[];
}
