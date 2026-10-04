import { AppLanguage } from './settings.model';
export interface MangaTranslationRequest {
  selectedText: string; contextText?: string; selectedExpression?: string; previousText?: string;
  nextText?: string; pageTexts?: string[]; targetLanguage: AppLanguage;
}
export interface MangaTranslationResult { natural: string; literal?: string; notes?: string[] }
export interface MangaStudyExplanation {
  natural: string;
  notes?: string[];
  vocabulary: { expression: string; reading?: string; baseForm?: string; meaning: string }[];
  grammar: { expression: string; explanation: string }[];
}
export interface MangaContextLocation { volumeId: string; pageIndex: number; blockIndex: number }
export type MangaContextMode = 'translate' | 'study';
