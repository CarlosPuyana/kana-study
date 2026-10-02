export interface MangaReaderPreferences {
  ocrVisible: boolean; dictionaryEnabled: boolean; sideClicks: boolean;
  pauseHidden: boolean; idleMinutes: number; pauseDictionary: boolean;
  fitMode: 'height' | 'width' | 'actual'; manualZoom: number | null;
}
export const MANGA_READER_PREFERENCES_KEY = 'kana-study.manga-reader-preferences.v1';
export const DEFAULT_READER_PREFERENCES: MangaReaderPreferences = {
  ocrVisible: false, dictionaryEnabled: true, sideClicks: true,
  pauseHidden: true, idleMinutes: 5, pauseDictionary: true,
  fitMode: 'height', manualZoom: null,
};
export function readMangaReaderPreferences(key: string): MangaReaderPreferences {
  const result = {...DEFAULT_READER_PREFERENCES};
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? '{}') as Record<string, unknown>;
    for (const field of ['ocrVisible','dictionaryEnabled','sideClicks','pauseHidden','pauseDictionary'] as const) if (typeof saved?.[field] === 'boolean') result[field] = saved[field];
    if (typeof saved?.['idleMinutes'] === 'number' && Number.isFinite(saved['idleMinutes'])) result.idleMinutes = Math.min(60, Math.max(0, Math.floor(saved['idleMinutes'])));
    if (saved?.['fitMode'] === 'height' || saved?.['fitMode'] === 'width' || saved?.['fitMode'] === 'actual') result.fitMode = saved['fitMode'];
    if (typeof saved?.['manualZoom'] === 'number' && Number.isFinite(saved['manualZoom'])) result.manualZoom = Math.min(300, Math.max(50, saved['manualZoom']));
  } catch { /* Defaults when local storage is unavailable or invalid. */ }
  return result;
}
