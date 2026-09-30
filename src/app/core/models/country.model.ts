export type AppLanguage = 'es' | 'en' | 'ca';

export type FlagRegion =
  | 'europe'
  | 'asia'
  | 'africa'
  | 'north-america'
  | 'south-america'
  | 'oceania';

export interface LocalizedText {
  readonly es: string;
  readonly en: string;
  readonly ca: string;
}

export interface Country {
  readonly id: string;
  readonly iso2: string;
  readonly iso3: string;
  readonly names: LocalizedText;
  readonly studyRegion: FlagRegion;
  readonly flagCode: string;
  readonly capitals: readonly LocalizedText[];
  readonly capitalQuizEnabled: boolean;
  readonly enabled: boolean;
}

export const FLAG_REGIONS: readonly FlagRegion[] = [
  'europe', 'asia', 'africa', 'north-america', 'south-america', 'oceania',
];

export type FlagQuestionType =
  | 'flag-to-country'
  | 'country-to-flag'
  | 'country-to-capital'
  | 'capital-to-country';

export const FLAG_QUESTION_TYPES: readonly FlagQuestionType[] = [
  'flag-to-country', 'country-to-flag', 'country-to-capital', 'capital-to-country',
];

export interface FlagStudyUnit {
  readonly key: string;
  readonly countryId: string;
  readonly questionType: FlagQuestionType;
}
