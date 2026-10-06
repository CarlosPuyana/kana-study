export interface MokuroBlock { box: number[]; vertical: boolean; font_size: number; lines: string[]; lines_coords: number[][][] }
export interface MokuroPage { img_path: string; img_width: number; img_height: number; blocks: MokuroBlock[] }
export interface MokuroDocument { version: string; title: string; volume: string; title_uuid?: string; volume_uuid?: string; pages: MokuroPage[] }
export interface MangaVolume { id: string; seriesTitle: string; title: string; pageCount: number; storageBytes: number; mokuro: Omit<MokuroDocument, 'pages'>; createdAt: string; updatedAt: string; complete: boolean; remoteSource?: { archiveUrl: string; ocrUrl: string } }
export interface MangaPage { volumeId: string; pageIndex: number; image: Blob; ocr: MokuroPage }
export interface MangaProgress { volumeId: string; pageIndex: number; activeSeconds: number; completed: boolean; lastOpenedAt: string; updatedAt: string }

/** Runtime view shared by imported and bundled volumes; bundled metadata is not an IndexedDB record. */
export interface MangaReaderVolume extends Pick<MangaVolume,'id'|'title'|'seriesTitle'|'pageCount'|'complete'> {catalogId?:string;availableLanguages?:import('./local-manga.model').MangaLanguage[];originalLanguage?:'ja';readingDirection?:import('./local-manga.model').MangaReadingDirection}
