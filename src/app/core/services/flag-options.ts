import { AppLanguage, Country, FlagStudyUnit } from '../models/country.model';
import { FlagQuestionOption } from '../models/flag-session.model';

export function buildFlagOptions(
  unit: FlagStudyUnit,
  countries: readonly Country[],
  language: AppLanguage,
  seed: string,
): readonly FlagQuestionOption[] {
  const answer = countries.find(country => country.id === unit.countryId);
  if (!answer) return [];
  const eligible = countries.filter(country => country.enabled && country.id !== answer.id
    && (unit.questionType !== 'country-to-capital' || country.capitalQuizEnabled));
  const sameRegion = seeded(eligible.filter(country => country.studyRegion === answer.studyRegion), seed);
  const fallback = seeded(eligible.filter(country => country.studyRegion !== answer.studyRegion), `${seed}:fallback`);
  const chosen: Country[] = [];
  const visualKeys = new Set<string>([optionKey(answer, unit, language)]);
  for (const country of [...sameRegion, ...fallback]) {
    const key = optionKey(country, unit, language);
    if (!key || visualKeys.has(key)) continue;
    chosen.push(country);
    visualKeys.add(key);
    if (chosen.length === 3) break;
  }
  return seeded([answer, ...chosen], `${seed}:options`).map(country => ({
    id: country.id,
    label: optionLabel(country, unit, language),
    flagCode: unit.questionType === 'country-to-flag' ? country.flagCode : null,
    correct: country.id === answer.id,
  }));
}

function optionKey(country: Country, unit: FlagStudyUnit, language: AppLanguage): string {
  return unit.questionType === 'country-to-capital'
    ? country.capitals[0]?.[language]?.toLocaleLowerCase(language) ?? ''
    : country.id;
}

function optionLabel(country: Country, unit: FlagStudyUnit, language: AppLanguage): string {
  if (unit.questionType === 'country-to-capital') return country.capitals[0]?.[language] ?? '';
  if (unit.questionType === 'country-to-flag') return '';
  return country.names[language];
}

function seeded<T>(items: readonly T[], seed: string): T[] {
  const result = [...items];
  let value = hash(seed);
  for (let index = result.length - 1; index > 0; index--) {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    const target = value % (index + 1);
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

function hash(value: string): number {
  let result = 2166136261;
  for (const character of value) result = Math.imul(result ^ character.charCodeAt(0), 16777619);
  return result >>> 0;
}
