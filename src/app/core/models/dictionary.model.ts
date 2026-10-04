export interface DictionaryTerm {
  id: string; dictionaryId: string; expression: string; reading: string; glossaries: string[];
  definitionTags: string; rules: string; score: number; sequence: number; termTags: string;
}
export interface DictionaryMetadata {
  id: string; dictionaryId: string; title: string; revision: string; count: number;
  status: 'installing' | 'ready'; updatedAt: string;
}
export interface OcrLookupPoint {
  text: string; offset: number; x: number; y: number;
  mode?: 'selection' | 'caret'; startOffset?: number; endOffset?: number;
  endBlockIndex?: number; endLineIndex?: number;
  blockIndex?: number; lineIndex?: number; selectedText?: string;
  previousText?: string; nextText?: string; pageTexts?: string[];
}
export interface DictionaryLookup {
  query: string; terms: DictionaryTerm[]; installed: boolean;
  mode?: 'selection' | 'caret'; requestedText?: string; selectedText?: string; matchedQuery?: string;
  surface?: string; principal?: DictionaryTerm; alternatives?: DictionaryTerm[];
  baseForm?: string; reading?: string; surfaceReading?: string; reasons?: string[];
}
