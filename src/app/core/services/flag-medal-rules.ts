import { Country, FLAG_QUESTION_TYPES, FlagQuestionType, FlagRegion } from '../models/country.model';
import { FlagStudyProgress } from '../models/flag-study.model';
import { CompletedSessionSummary } from '../models/learning-session.model';
import { MedalDefinition, MedalProgress, MedalState, MedalUnlock } from '../models/medal.model';

export interface FlagMedalEvaluationInput {
  readonly definitions: readonly MedalDefinition[];
  readonly countries: readonly Country[];
  readonly progress: Readonly<Record<string, FlagStudyProgress>>;
  readonly sessions: readonly CompletedSessionSummary[];
  readonly unlocks?: readonly MedalUnlock[];
}

export function evaluateFlagMedals(input: FlagMedalEvaluationInput): readonly MedalState[] {
  const sessions = input.sessions.filter(session => session.module === 'flags');
  const eligible = input.countries.filter(country => country.enabled);
  const capitalEligible = eligible.filter(country => country.capitalQuizEnabled);
  const memorized = (countryId: string, type: FlagQuestionType) =>
    input.progress[`flags:${countryId}:${type}`]?.fsrs.state === 'review';
  const count = (countries: readonly Country[], type: FlagQuestionType) =>
    countries.filter(country => memorized(country.id, type)).length;
  const counter = (current: number, target: number): MedalProgress =>
    ({ type: 'counter', current, target });
  const boolean = (completed: boolean): MedalProgress => ({ type: 'boolean', completed });
  const allUnits = eligible.reduce((total, country) => total + 2
    + (country.capitalQuizEnabled ? 2 : 0), 0);
  const memorizedUnits = eligible.reduce((total, country) => total
    + FLAG_QUESTION_TYPES.filter(type => (!isCapital(type) || country.capitalQuizEnabled)
      && memorized(country.id, type)).length, 0);
  const fourWays = capitalEligible.some(country =>
    FLAG_QUESTION_TYPES.every(type => memorized(country.id, type)));
  const regionProgress = (region: FlagRegion) => {
    const countries = eligible.filter(country => country.studyRegion === region);
    return counter(count(countries, 'flag-to-country'), countries.length);
  };
  const perfectCapital = sessions.some(session => session.exercisesCompleted === 10
    && session.firstTrySuccesses === 10 && session.needsPracticeCount === 0
    && session.questionTypes?.length
    && session.questionTypes.every(type => isCapital(type)));
  const borderless = sessions.some(session => session.exercisesCompleted === 10
    && session.firstTrySuccesses === 10 && session.needsPracticeCount === 0
    && new Set(session.studyRegions ?? []).size >= 5);

  const calculated: Readonly<Record<string, MedalProgress>> = {
    'flags-first-trip': counter(sessions.length, 1),
    'flags-globetrotter': counter(sessions.length, 10),
    'flags-flag-eye': counter(count(eligible, 'flag-to-country'), 25),
    'flags-visual-atlas': counter(count(eligible, 'flag-to-country'), eligible.length),
    'flags-reverse-eye': counter(count(eligible, 'country-to-flag'), 25),
    'flags-flag-collector': counter(count(eligible, 'country-to-flag'), eligible.length),
    'flags-capital-hunter': counter(count(capitalEligible, 'country-to-capital'), 25),
    'flags-capitals-mastered': counter(count(capitalEligible, 'country-to-capital'), capitalEligible.length),
    'flags-capital-reverse-25': counter(count(capitalEligible, 'capital-to-country'), 25),
    'flags-capital-reverse-mastered': counter(count(capitalEligible, 'capital-to-country'), capitalEligible.length),
    'flags-four-ways': boolean(fourWays),
    'flags-world-mastery': counter(memorizedUnits, allUnits),
    'flags-europe-mastered': regionProgress('europe'),
    'flags-asia-mastered': regionProgress('asia'),
    'flags-africa-mastered': regionProgress('africa'),
    'flags-north-america-mastered': regionProgress('north-america'),
    'flags-south-america-mastered': regionProgress('south-america'),
    'flags-oceania-mastered': regionProgress('oceania'),
    'flags-secret-capital-lightning': boolean(Boolean(perfectCapital)),
    'flags-secret-borderless': boolean(borderless),
  };
  const unlockMap = new Map((input.unlocks ?? []).map(unlock => [unlock.medalId, unlock]));
  return input.definitions.map(definition => {
    const progress = calculated[definition.id] ?? boolean(false);
    const unlock = unlockMap.get(definition.id) ?? null;
    return { definition, progress, unlock, unlocked: unlock !== null };
  });
}

function isCapital(type: string): boolean {
  return type === 'country-to-capital' || type === 'capital-to-country';
}
