import { COUNTRIES } from './countries.generated';
import { FLAG_REGIONS } from '../core/models/country.model';

describe('Countries dataset', () => {
  it('contains the expected 195 states', () => expect(COUNTRIES).toHaveLength(195));
  it('has unique stable ids', () => expect(new Set(COUNTRIES.map(item => item.id)).size).toBe(195));
  it('has unique ISO2 codes', () => expect(new Set(COUNTRIES.map(item => item.iso2)).size).toBe(195));
  it('has unique ISO3 codes', () => expect(new Set(COUNTRIES.map(item => item.iso3)).size).toBe(195));
  it('has non-empty names in every supported language', () => {
    expect(COUNTRIES.every(item => item.names.es && item.names.en && item.names.ca)).toBe(true);
  });
  it('uses one valid study region and a packaged flag code', () => {
    expect(COUNTRIES.every(item => FLAG_REGIONS.includes(item.studyRegion))).toBe(true);
    expect(COUNTRIES.every(item => item.flagCode === item.iso2.toLowerCase())).toBe(true);
  });
  it('has fully localized capitals whenever capital quiz is enabled', () => {
    expect(COUNTRIES.every(item => !item.capitalQuizEnabled || (item.capitals.length > 0
      && item.capitals.every(capital => capital.es && capital.en && capital.ca)))).toBe(true);
  });
});
