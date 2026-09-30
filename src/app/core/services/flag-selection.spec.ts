import { COUNTRIES } from '../../data/countries.generated';
import { FLAG_REGIONS } from '../models/country.model';
import { FlagSelection } from '../models/flag-study.model';
import { DEFAULT_FLAG_SELECTION, flagStudyUnits } from './flag-selection';

describe('Flag selection', () => {
  it('enables all six regions by default', () => {
    expect(FLAG_REGIONS.every(region => DEFAULT_FLAG_SELECTION.regions[region])).toBe(true);
  });
  it('enables only Flag to Country by default', () => {
    expect(DEFAULT_FLAG_SELECTION.questionTypes).toEqual(['flag-to-country']);
  });
  it('filters countries by selected region', () => {
    const selection: FlagSelection = { regions: { ...DEFAULT_FLAG_SELECTION.regions,
      asia: false, africa: false, 'north-america': false, 'south-america': false,
      oceania: false }, questionTypes: ['flag-to-country'] };
    const units = flagStudyUnits(COUNTRIES, selection);
    expect(units.every(unit => COUNTRIES.find(country => country.id === unit.countryId)?.studyRegion === 'europe')).toBe(true);
  });
  it('builds 195 units for the default selection', () => {
    expect(flagStudyUnits(COUNTRIES, DEFAULT_FLAG_SELECTION)).toHaveLength(195);
  });
  it('omits both capital directions for countries with capital quiz disabled', () => {
    const selection = { ...DEFAULT_FLAG_SELECTION,
      questionTypes: ['country-to-capital', 'capital-to-country'] as const };
    const units = flagStudyUnits(COUNTRIES, selection);
    const eligible = COUNTRIES.filter(country => country.capitalQuizEnabled).length;
    expect(units).toHaveLength(eligible * 2);
    expect(units.every(unit => COUNTRIES.find(country => country.id === unit.countryId)?.capitalQuizEnabled)).toBe(true);
  });
});
