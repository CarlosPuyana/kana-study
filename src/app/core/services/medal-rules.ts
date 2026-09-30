import { Kana } from '../models/kana.model';
import { CompletedSessionSummary } from '../models/learning-session.model';
import {
  MedalDefinition, MedalPresentation, MedalProgress, MedalState, MedalUnlock,
} from '../models/medal.model';
import { QuestionType, ReviewEvent, StudyProgress } from '../models/progress.model';

const VISUAL_DIRECTIONS: readonly QuestionType[] = ['kana-to-romaji', 'romaji-to-kana'];

export interface MedalEvaluationInput {
  readonly definitions: readonly MedalDefinition[];
  readonly kana: readonly Kana[];
  readonly progress: Readonly<Record<string, StudyProgress>>;
  readonly reviewEvents: readonly ReviewEvent[];
  readonly sessions: readonly CompletedSessionSummary[];
  readonly unlocks?: readonly MedalUnlock[];
}

export function evaluateMedalStates(input: MedalEvaluationInput): readonly MedalState[] {
  const sessions = input.sessions.filter(session => (session.module ?? 'kana') === 'kana');
  const rounds = sessions.length;
  const exercises = sessions.reduce((total, session) => total + session.exercisesCompleted, 0);
  const perfectRounds = sessions.filter(isPerfectRound).length;
  const studyDays = new Set(sessions.map(session => localDayKey(session.completedAt))).size;
  const hiraBasic = input.kana.filter(kana => kana.type === 'hiragana' && kana.variant === 'basic');
  const kataBasic = input.kana.filter(kana => kana.type === 'katakana' && kana.variant === 'basic');
  const dakuten = input.kana.filter(kana => kana.variant === 'dakuten');
  const handakuten = input.kana.filter(kana => kana.variant === 'handakuten');
  const combinations = input.kana.filter(kana => kana.variant === 'combination');

  const studied = (kana: Kana) => VISUAL_DIRECTIONS.some(direction =>
    input.progress[`${kana.id}:${direction}`] !== undefined);
  const memorized = (kana: Kana, direction?: QuestionType) => direction
    ? input.progress[`${kana.id}:${direction}`]?.fsrs.state === 'review'
    : VISUAL_DIRECTIONS.some(item => input.progress[`${kana.id}:${item}`]?.fsrs.state === 'review');
  const bidirectional = (kana: Kana) => VISUAL_DIRECTIONS.every(direction => memorized(kana, direction));
  const count = (items: readonly Kana[], predicate: (kana: Kana) => boolean) =>
    items.filter(predicate).length;
  const counter = (current: number, target: number): MedalProgress => ({ type: 'counter', current, target });
  const boolean = (completed: boolean): MedalProgress => ({ type: 'boolean', completed });
  const secondChance = input.reviewEvents.some(event => event.rating === 'again'
    && input.progress[event.key]?.fsrs.state === 'review');

  const calculated: Readonly<Record<string, MedalProgress>> = {
    'first-step': counter(rounds, 1),
    'getting-started': counter(rounds, 10),
    century: counter(exercises, 100),
    'thousand-steps': counter(exercises, 1000),
    'hiragana-started': counter(count(hiraBasic, studied), hiraBasic.length),
    'hiragana-mastered': counter(count(hiraBasic, kana => memorized(kana)), hiraBasic.length),
    'katakana-started': counter(count(kataBasic, studied), kataBasic.length),
    'katakana-mastered': counter(count(kataBasic, kana => memorized(kana)), kataBasic.length),
    'dakuten-mastered': counter(count(dakuten, kana => memorized(kana)), dakuten.length),
    'handakuten-mastered': counter(count(handakuten, kana => memorized(kana)), handakuten.length),
    'combinations-mastered': counter(count(combinations, kana => memorized(kana)), combinations.length),
    'both-directions': boolean(input.kana.some(bidirectional)),
    'hiragana-bidirectional': counter(count(hiraBasic, bidirectional), hiraBasic.length),
    'katakana-bidirectional': counter(count(kataBasic, bidirectional), kataBasic.length),
    'perfect-round': boolean(perfectRounds >= 1),
    perfectionist: counter(perfectRounds, 5),
    consistent: counter(studyDays, 7),
    'second-chance': boolean(secondChance),
  };

  const unlocks = new Map((input.unlocks ?? []).map(unlock => [unlock.medalId, unlock]));
  return input.definitions.map(definition => {
    const progress = calculated[definition.id] ?? boolean(false);
    const unlock = unlocks.get(definition.id) ?? null;
    return { definition, progress, unlock, unlocked: unlock !== null };
  });
}

export function isMedalComplete(progress: MedalProgress): boolean {
  return progress.type === 'boolean'
    ? progress.completed
    : progress.target > 0 && progress.current >= progress.target;
}

export function medalCompletionRatio(progress: MedalProgress): number {
  if (progress.type === 'boolean') return progress.completed ? 1 : 0;
  return progress.target ? Math.min(progress.current / progress.target, 1) : 0;
}

export function selectHomeMedals(states: readonly MedalState[], limit = 3): readonly MedalState[] {
  const unlocked = states.filter(state => state.unlocked)
    .sort((left, right) => (right.unlock?.unlockedAt ?? '').localeCompare(left.unlock?.unlockedAt ?? '')
      || left.definition.order - right.definition.order);
  if (unlocked.length >= limit) return unlocked.slice(0, limit);
  const locked = states.filter(state => !state.unlocked && !state.definition.secret)
    .sort((left, right) => medalCompletionRatio(right.progress) - medalCompletionRatio(left.progress)
      || left.definition.order - right.definition.order);
  return [...unlocked, ...locked.slice(0, limit - unlocked.length)];
}

export function presentMedal(state: MedalState): MedalPresentation {
  if (state.definition.secret && !state.unlocked) {
    return {
      state,
      titleKey: 'medals.secretTitle',
      descriptionKey: 'medals.secretDescription',
      progress: null,
    };
  }
  return {
    state,
    titleKey: state.definition.titleKey,
    descriptionKey: state.definition.descriptionKey,
    progress: state.progress,
  };
}

export function isPerfectRound(session: CompletedSessionSummary): boolean {
  return session.exercisesCompleted === 10
    && session.firstTrySuccesses === 10
    && session.needsPracticeCount === 0;
}

function localDayKey(iso: string): string {
  const date = new Date(iso);
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}
