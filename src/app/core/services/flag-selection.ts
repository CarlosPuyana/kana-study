import { Country, FLAG_QUESTION_TYPES, FLAG_REGIONS, FlagStudyUnit } from '../models/country.model';
import { FlagSelection } from '../models/flag-study.model';

export const DEFAULT_FLAG_SELECTION: FlagSelection = {
  regions: {
    europe: true,
    asia: true,
    africa: true,
    'north-america': true,
    'south-america': true,
    oceania: true,
  },
  questionTypes: ['flag-to-country'],
};

export function flagStudyUnits(
  countries: readonly Country[],
  selection: FlagSelection,
): readonly FlagStudyUnit[] {
  return countries
    .filter(country => country.enabled && selection.regions[country.studyRegion])
    .flatMap(country => selection.questionTypes
      .filter(questionType => !isCapitalQuestion(questionType) || country.capitalQuizEnabled)
      .map(questionType => ({
        key: `flags:${country.id}:${questionType}`,
        countryId: country.id,
        questionType,
      })));
}

export function isCapitalQuestion(questionType: string): boolean {
  return questionType === 'country-to-capital' || questionType === 'capital-to-country';
}

export function isValidFlagSelection(selection: FlagSelection): boolean {
  return FLAG_REGIONS.some(region => selection.regions[region])
    && FLAG_QUESTION_TYPES.some(type => selection.questionTypes.includes(type));
}
