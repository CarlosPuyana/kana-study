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

/** Server versions are independent of device clocks and local outbox revisions. */
export interface MangaSavedRemoteRow {
  item_id: string;
  payload: MangaStudySavedItem | null;
  deleted_at: string | null;
  revision: number;
  last_operation: string | null;
}
export interface MangaSavedChange {
  token: string;
  baseRevision: number;
  kind: 'explicit' | 'bootstrap' | 'import';
  item: MangaStudySavedItem | null;
}
export interface MangaSavedSyncState {
  id: string;
  revision: number;
  pending?: MangaSavedChange;
}

// dictionary: + JSON.stringify([expression, reading]); each 1600-unit string
// can expand sixfold through JSON escapes. Never truncate a persistence ID.
export const MANGA_SAVED_ID_MAX_BYTES = 11 + 7 + 2 * 1600 * 6;
export const MANGA_SAVED_PAYLOAD_MAX_BYTES = 65536;
const utf8 = new TextEncoder();
function postgresText(value: string): boolean {
  for(let i=0;i<value.length;i++) {
    const unit=value.charCodeAt(i);
    if(unit===0)return false; // PostgreSQL jsonb rejects U+0000.
    if(unit>=0xd800&&unit<=0xdbff) {
      const next=value.charCodeAt(++i);
      if(!(next>=0xdc00&&next<=0xdfff))return false;
    } else if(unit>=0xdc00&&unit<=0xdfff)return false;
  }
  return true;
}

/** jsonb::text adds one space after each structural colon/comma. Key order
 * does not affect size; safe integer metadata serializes identically in SQL. */
export function mangaSavedPayloadBytes(item: MangaStudySavedItem): number {
  const fields=Object.keys(item).length+Object.keys(item.source).length;
  return utf8.encode(JSON.stringify(item)).length+2*fields-2+Math.max(0,item.kanji.length-1);
}

/** Project only lightweight fields; never persist dictionary entries or blobs. */
export function validateMangaSavedItem(value: unknown): MangaStudySavedItem {
  const v = value as MangaStudySavedItem;
  if (!v || v.schemaVersion !== 1 || typeof v.id !== 'string' || !v.id || utf8.encode(v.id).length > MANGA_SAVED_ID_MAX_BYTES
    || typeof v.expression !== 'string' || !v.expression || v.expression.length > 1600
    || !v.source || typeof v.source.volumeId !== 'string' || !v.source.volumeId
    || !Number.isSafeInteger(v.source.pageNumber) || v.source.pageNumber < 1
    || !Number.isSafeInteger(v.createdAt) || !Array.isArray(v.kanji) || v.kanji.length > 64
    || v.kanji.some(k => typeof k !== 'string' || k.length > 64)) throw new Error('Invalid saved item');
  const item: MangaStudySavedItem = {schemaVersion:1,id:v.id,expression:v.expression,kanji:[...v.kanji],
    source:{volumeId:v.source.volumeId,pageNumber:v.source.pageNumber},createdAt:v.createdAt};
  for (const [key,limit] of [['reading',1600],['baseForm',1600],['vocabularyId',256],['meaning',300],['surface',160],['context',1200]] as const) {
    if (v[key] !== undefined) {
      if (typeof v[key] !== 'string' || v[key]!.length > limit) throw new Error('Invalid saved item');
      item[key] = v[key];
    }
  }
  if (v.source.volumeId.length > 1024) throw new Error('Invalid saved item');
  if (v.source.volumeTitle !== undefined) {
    if (typeof v.source.volumeTitle !== 'string' || v.source.volumeTitle.length > 160) throw new Error('Invalid saved item');
    item.source.volumeTitle=v.source.volumeTitle;
  }
  const strings=[item.id,item.expression,...item.kanji,...[item.reading,item.baseForm,item.vocabularyId,item.meaning,item.surface,item.context],item.source.volumeId,item.source.volumeTitle];
  if(strings.some(text=>text!==undefined&&!postgresText(text))||mangaSavedPayloadBytes(item)>MANGA_SAVED_PAYLOAD_MAX_BYTES)throw new Error('Invalid saved item');
  return item;
}
