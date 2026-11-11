import { MangaLexeme, MangaLexicalCategory, MangaProjectedWord, MangaWordOccurrence } from './manga-vocabulary-index.model';
import { MangaContextLocation, MangaTranslationRequest } from './manga-context.model';

export type MangaRushKnowledge = 'all' | 'known' | 'learning' | 'unknown' | 'unlinked' | 'familiar';
export type MangaRushCategory = 'lexical' | 'functional' | 'unclassified' | 'all';
export type MangaRushSelection = 'frequency' | 'random' | 'weighted';
export type MangaRushAmount = 10 | 20 | 50 | 'all';
export interface MangaRushConfiguration {
  knowledge: MangaRushKnowledge;
  category: MangaRushCategory;
  selection: MangaRushSelection;
  amount: MangaRushAmount;
}
export interface MangaRushDictionaryAnswer {
  kind: 'dictionary';
  meanings: readonly string[];
  contextualized: false;
}
/** Future context-service adapter boundary only. No provider is invoked by M2. */
export interface MangaRushMeaningRequest {
  isCurrent?: () => boolean;
  lexicalKey: string;
  location: MangaContextLocation;
  request: MangaTranslationRequest;
}
export interface MangaRushMeaningProvider {
  resolve(input: MangaRushMeaningRequest, signal: AbortSignal): Promise<MangaRushDictionaryAnswer | {
    kind: 'contextual'; meaning: string; provenance: string; notes?: string[]; literal?: string;
  }>;
}
export interface MangaRushCard {
  volumeId: string;
  lexicalKey: string;
  lemma: string;
  lemmaReading: string;
  surfaceReading?: string;
  occurrence: MangaWordOccurrence;
  answer: MangaRushDictionaryAnswer;
  category: MangaLexicalCategory;
}
export type MangaRushExclusion = 'identity' | 'reading' | 'meaning' | 'source';
export interface MangaRushPool {
  words: readonly MangaProjectedWord[];
  distinct: number;
  occurrences: number;
  availableCards: number;
  selectedCards: number;
  filteredOut: number;
  excluded: Readonly<Record<MangaRushExclusion, number>>;
  unresolvedSpans: number;
}
export interface MangaRushSession {
  volumeId: string;
  owner: string;
  epoch: number;
  cards: readonly MangaRushCard[];
  answers: readonly {lexicalKey: string; knew: boolean}[];
  revealed: boolean;
}
export type MangaRushEntry = Pick<MangaLexeme, 'key' | 'dictionaryId' | 'sequence' | 'lemma' | 'reading' | 'glosses' | 'occurrences'>;
