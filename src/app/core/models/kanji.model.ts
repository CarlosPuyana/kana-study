export type KanjiReadingType = 'on' | 'kun' | 'irregular';
export type KanjiQuestionType = 'kanji-to-meaning' | 'meaning-to-kanji';
export type KanjiLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';

export interface KanjiExample {
  readonly word: string;
  readonly reading: string;
  readonly romaji: string;
  readonly translations: { readonly es: string; readonly en: string; readonly ca: string };
  readonly readingType: KanjiReadingType;
  readonly targetReading: string;
}

export interface Kanji {
  readonly id: string;
  readonly character: string;
  readonly meanings: { readonly es: readonly string[]; readonly en: readonly string[]; readonly ca: readonly string[] };
  readonly onyomi: readonly string[];
  readonly kunyomi: readonly string[];
  readonly strokeCount: number;
  readonly radical?: string;
  readonly schoolGrade: number | null;
  readonly frequencyRank: number | null;
  readonly jlptApproxLevel: KanjiLevel | null;
  readonly examples: readonly KanjiExample[];
  readonly enabled: boolean;
}

export interface KanjiStudyUnit {
  readonly key: string;
  readonly kanjiId: string;
  readonly questionType: KanjiQuestionType;
}

export const KANJI_QUESTION_TYPES: readonly KanjiQuestionType[] = [
  'kanji-to-meaning', 'meaning-to-kanji',
];
export const KANJI_LEVELS: readonly KanjiLevel[] = ['N5'];
