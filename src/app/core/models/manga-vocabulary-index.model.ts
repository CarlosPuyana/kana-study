/** Derived content only: never contains workspace knowledge or scheduling state. */
export interface MangaLexeme {
  key: string;
  dictionaryId: string;
  sequence: number;
  lemma: string;
  reading: string;
  glosses: string[];
  /** Absent on legacy M1 caches: consumers must treat them as unclassified. */
  category?: MangaLexicalCategory;
  categoryReason?: 'dictionary-pos' | 'missing-pos' | 'conflicting-pos' | 'unsupported-pos';
  categoryEvidence?: MangaPosEvidence[];
  occurrences: MangaWordOccurrence[];
}
export type MangaLexicalCategory = 'lexical' | 'functional' | 'unclassified';
export interface MangaPosEvidence {
  definitionTags: string;
  rules: string;
  /** Exact dictionary-row fingerprint matched to pinned, explicit JMdict POS.
   * Alternatives widen uncertainty; never establish identity equivalence or contextual use. */
  alternatives?: {entryId: string; definitionTags: string}[];
  provenance?: string;
}
export interface MangaWordOccurrence {
  pageIndex: number;
  blockIndex: number;
  lineIndex: number;
  start: number;
  end: number;
  surface: string;
  context: string;
}
export interface MangaAnalysisIssue {
  pageIndex: number;
  reason: 'missing-ocr' | 'invalid-ocr' | 'read-error' | 'unresolved' | 'ambiguous' | 'segmenter' | 'limit';
  context?: string;
  blockIndex?: number;
  lineIndex?: number;
  start?: number;
  end?: number;
}
export interface MangaVocabularyIndex {
  schemaVersion: 1;
  volumeId: string;
  volumeTitle?: string;
  sourceStamp: string;
  analyzerStamp: string;
  pageCount: number;
  entries: MangaLexeme[];
  issues: MangaAnalysisIssue[];
  occurrences: number;
  status: 'complete' | 'partial' | 'no-ocr' | 'incomplete-import';
}
export type MangaWordKnowledge = 'known' | 'learning' | 'unknown' | 'unlinked';
export interface MangaProjectedWord {
  entry: MangaLexeme;
  state: MangaWordKnowledge;
}
