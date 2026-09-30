import { MedalDefinition } from '../core/models/medal.model';

export const MEDAL_DEFINITIONS: readonly MedalDefinition[] = [
  { module: 'kana', id: 'first-step', titleKey: 'medals.firstStep.title', descriptionKey: 'medals.firstStep.description', category: 'learning', secret: false, order: 1, icon: 'sessions' },
  { module: 'kana', id: 'getting-started', titleKey: 'medals.gettingStarted.title', descriptionKey: 'medals.gettingStarted.description', category: 'learning', secret: false, order: 2, icon: 'sessions' },
  { module: 'kana', id: 'century', titleKey: 'medals.century.title', descriptionKey: 'medals.century.description', category: 'learning', secret: false, order: 3, icon: 'practice' },
  { module: 'kana', id: 'thousand-steps', titleKey: 'medals.thousandSteps.title', descriptionKey: 'medals.thousandSteps.description', category: 'learning', secret: false, order: 4, icon: 'practice' },
  { module: 'kana', id: 'hiragana-started', titleKey: 'medals.hiraganaStarted.title', descriptionKey: 'medals.hiraganaStarted.description', category: 'learning', secret: false, order: 5, icon: 'hiragana' },
  { module: 'kana', id: 'hiragana-mastered', titleKey: 'medals.hiraganaMastered.title', descriptionKey: 'medals.hiraganaMastered.description', category: 'mastery', secret: false, order: 6, icon: 'hiragana' },
  { module: 'kana', id: 'katakana-started', titleKey: 'medals.katakanaStarted.title', descriptionKey: 'medals.katakanaStarted.description', category: 'learning', secret: false, order: 7, icon: 'katakana' },
  { module: 'kana', id: 'katakana-mastered', titleKey: 'medals.katakanaMastered.title', descriptionKey: 'medals.katakanaMastered.description', category: 'mastery', secret: false, order: 8, icon: 'katakana' },
  { module: 'kana', id: 'dakuten-mastered', titleKey: 'medals.dakutenMastered.title', descriptionKey: 'medals.dakutenMastered.description', category: 'mastery', secret: false, order: 9, icon: 'mastery' },
  { module: 'kana', id: 'handakuten-mastered', titleKey: 'medals.handakutenMastered.title', descriptionKey: 'medals.handakutenMastered.description', category: 'mastery', secret: false, order: 10, icon: 'mastery' },
  { module: 'kana', id: 'combinations-mastered', titleKey: 'medals.combinationsMastered.title', descriptionKey: 'medals.combinationsMastered.description', category: 'mastery', secret: false, order: 11, icon: 'mastery' },
  { module: 'kana', id: 'both-directions', titleKey: 'medals.bothDirections.title', descriptionKey: 'medals.bothDirections.description', category: 'mastery', secret: false, order: 12, icon: 'directions' },
  { module: 'kana', id: 'hiragana-bidirectional', titleKey: 'medals.hiraganaBidirectional.title', descriptionKey: 'medals.hiraganaBidirectional.description', category: 'mastery', secret: false, order: 13, icon: 'directions' },
  { module: 'kana', id: 'katakana-bidirectional', titleKey: 'medals.katakanaBidirectional.title', descriptionKey: 'medals.katakanaBidirectional.description', category: 'mastery', secret: false, order: 14, icon: 'directions' },
  { module: 'kana', id: 'perfect-round', titleKey: 'medals.perfectRound.title', descriptionKey: 'medals.perfectRound.description', category: 'accuracy', secret: false, order: 15, icon: 'perfect' },
  { module: 'kana', id: 'perfectionist', titleKey: 'medals.perfectionist.title', descriptionKey: 'medals.perfectionist.description', category: 'accuracy', secret: false, order: 16, icon: 'perfect' },
  { module: 'kana', id: 'consistent', titleKey: 'medals.consistent.title', descriptionKey: 'medals.consistent.description', category: 'consistency', secret: false, order: 17, icon: 'calendar' },
  { module: 'kana', id: 'second-chance', titleKey: 'medals.secondChance.title', descriptionKey: 'medals.secondChance.description', category: 'consistency', secret: true, order: 18, icon: 'recovery' },
];

