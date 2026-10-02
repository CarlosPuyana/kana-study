export interface DictionaryTerm {
  id: string; dictionaryId: string; expression: string; reading: string; glossaries: string[];
  definitionTags: string; rules: string; score: number; sequence: number; termTags: string;
}
export interface DictionaryMetadata {
  id: string; dictionaryId: string; title: string; revision: string; count: number;
  status: 'installing' | 'ready'; updatedAt: string;
}
export interface OcrLookupPoint { text: string; offset: number; x: number; y: number }
export interface DictionaryLookup { query: string; terms: DictionaryTerm[]; installed: boolean }
