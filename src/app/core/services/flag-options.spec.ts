import { COUNTRIES } from '../../data/countries.generated';
import { FLAG_QUESTION_TYPES, FlagStudyUnit } from '../models/country.model';
import { buildFlagOptions } from './flag-options';

describe('Flag distractors', () => {
  for (const questionType of FLAG_QUESTION_TYPES) {
    it(`${questionType} returns four unique options with one correct answer and regional distractors`, () => {
      const unit: FlagStudyUnit = { key:`flags:jp:${questionType}`,countryId:'jp',questionType };
      const options=buildFlagOptions(unit,COUNTRIES,'es','test');
      expect(options).toHaveLength(4);
      expect(new Set(options.map(option=>option.id)).size).toBe(4);
      expect(options.filter(option=>option.correct)).toHaveLength(1);
      expect(options.filter(option=>!option.correct).every(option=>COUNTRIES.find(country=>country.id===option.id)?.studyRegion==='asia')).toBe(true);
      const visual=options.map(option=>option.flagCode??option.label);
      expect(new Set(visual).size).toBe(4);
    });
  }
});
