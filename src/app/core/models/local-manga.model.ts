export type MangaLanguage = 'ja' | 'es';
export type MangaReadingDirection = 'rtl' | 'ltr';
export interface LocalMangaPage {
  id: string;
  width: number;
  height: number;
  images: Partial<Record<MangaLanguage, string>>;
}
/** Asset paths are relative to this manga's metadata.json, not to the domain root. */
export interface LocalManga {
  schemaVersion: 1;
  id: string;
  titles: {ja: string; es?: string};
  reading?: string;
  description?: Partial<Record<'es' | 'en' | 'ca', string>>;
  cover?: string;
  originalLanguage: 'ja';
  availableLanguages: MangaLanguage[];
  readingDirection: MangaReadingDirection;
  status: 'draft' | 'published';
  pages: LocalMangaPage[];
  mokuro?: Partial<Record<MangaLanguage, string>>;
  dialogue?: string;
}
export interface MangaDialogueBubble {
  pageId: string;
  bubbleId: string;
  speaker?: string;
  jp: string;
  reading?: string;
  es?: string;
  studyTargets?: string[];
}
