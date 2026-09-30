import { Kana } from '../models/kana.model';
import { Kanji, KANJI_QUESTION_TYPES } from '../models/kanji.model';
import { RushConfiguration, RushUnit } from '../models/rush.model';
import { LearningSelection } from '../models/settings.model';
import { VocabularyEntry, VOCABULARY_QUESTION_TYPES } from '../models/vocabulary.model';
import { KanjiSelection } from '../models/kanji-study.model';
import { VocabularySelection } from '../models/vocabulary-study.model';
import { isReadingQuestionEligible } from './vocabulary-selection';

export const KANA_RUSH_TYPES = ['kana-to-romaji', 'romaji-to-kana'] as const;

export function kanaRushConfiguration(selection: LearningSelection): RushConfiguration {
  const selectedContentIds = Object.entries(selection.categories).flatMap(([type, variants]) =>
    Object.entries(variants).filter(([, enabled]) => enabled).map(([variant]) => `${type}:${variant}`));
  return { selectedContentIds, questionTypes: selection.questionTypes.filter(type => KANA_RUSH_TYPES.includes(type as never)) };
}

export function kanjiRushConfiguration(selection: KanjiSelection): RushConfiguration {
  return { selectedContentIds: selection.levels.N5 ? ['N5'] : [], questionTypes: [...selection.questionTypes] };
}

export function vocabularyRushConfiguration(selection: VocabularySelection): RushConfiguration {
  return { selectedContentIds: Object.entries(selection.categories).filter(([, enabled]) => enabled).map(([id]) => id), questionTypes: [...selection.questionTypes] };
}

export function buildKanaRushUnits(kana: readonly Kana[], config: RushConfiguration): RushUnit[] {
  const selected = new Set(config.selectedContentIds); const types = config.questionTypes.filter(type => KANA_RUSH_TYPES.includes(type as never));
  return kana.filter(item => selected.has(`${item.type}:${item.variant}`)).flatMap(item => types.map(questionType => ({
    key: `rush:kana:${item.id}:${questionType}`, module: 'kana' as const, contentId: item.id, questionType,
  })));
}

export function buildKanjiRushUnits(kanji: readonly Kanji[], config: RushConfiguration): RushUnit[] {
  if (!config.selectedContentIds.includes('N5')) return [];
  const types = config.questionTypes.filter(type => KANJI_QUESTION_TYPES.includes(type as never));
  return kanji.filter(item => item.enabled && item.jlptApproxLevel === 'N5').flatMap(item => types.map(questionType => ({
    key: `rush:kanji:${item.id}:${questionType}`, module: 'kanji' as const, contentId: item.id, questionType,
  })));
}

export function buildVocabularyRushUnits(entries: readonly VocabularyEntry[], config: RushConfiguration): RushUnit[] {
  const categories = new Set(config.selectedContentIds);
  const types = config.questionTypes.filter(type => VOCABULARY_QUESTION_TYPES.includes(type as never));
  return entries.filter(entry => entry.enabled && entry.jlptApproxLevel === 'N5' && categories.has(entry.studyCategory)).flatMap(entry =>
    types.filter(type => !type.includes('reading') || isReadingQuestionEligible(entry)).map(questionType => ({
      key: `rush:vocabulary:${entry.id}:${questionType}`, module: 'vocabulary' as const, contentId: entry.id, questionType,
    })));
}
