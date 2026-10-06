/** Lightweight snapshot; saving is not a learning attempt. */
export interface MangaStudySavedItem {
  schemaVersion: 1;
  id: string;
  expression: string;
  reading?: string;
  baseForm?: string;
  vocabularyId?: string;
  kanji: string[];
  meaning?: string;
  surface?: string;
  context?: string;
  source: {volumeId: string; pageNumber: number; volumeTitle?: string};
  createdAt: number;
}
