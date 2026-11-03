import { CatalogDeck } from './deck-catalog.model';
import { JapaneseWordDeckEntry } from './japanese-word-deck-entry.model';

export const PUYI_DECK_ID = 'mazo-puyi';
export const PUYI_DECK: CatalogDeck = {
  id: PUYI_DECK_ID, kind: 'public', displayName: {kind: 'literal', text: 'Mazo Puyi'},
  contentType: 'japanese-word', cardCount: 0,
  settings: {desiredRetention: .9, newCardsPerDay: 10, newCardOrder: 'mixed'},
};
export const PUYI_LIMITS = {word: 200, kana: 200, meaning: 1000, exampleSentence: 2000, exampleTranslation: 2000} as const;
export type PuyiField = keyof typeof PUYI_LIMITS;
export const PUYI_FIELDS = Object.keys(PUYI_LIMITS) as PuyiField[];
export type PuyiDraft = Record<PuyiField, string>;
export interface PuyiCard extends PuyiDraft {
  readonly id: string;
  readonly position: number;
  readonly version: number;
  readonly image_path: string | null;
  readonly created_at: string;
  readonly updated_at: string;
  readonly author_id: string;
}
export function emptyPuyiDraft(): PuyiDraft {return {word:'',kana:'',meaning:'',exampleSentence:'',exampleTranslation:''};}
/** Count Unicode code points, matching PostgreSQL char_length rather than UTF-16 units. */
export function validatePuyiDraft(draft:PuyiDraft):boolean {
  return PUYI_FIELDS.every(key=>typeof draft[key]==='string' && draft[key].trim().length>0 &&
    [...draft[key].trim()].length<=PUYI_LIMITS[key] && !/[\u0000-\u001f\u007f\uD800-\uDFFF]/u.test(draft[key])) &&
    /^[ぁ-ゖゝゞァ-ヺヽヾー・ 　]+$/u.test(draft.kana.trim());
}
export function puyiEntry(card:PuyiCard,imageUrl?:string):JapaneseWordDeckEntry {
  return {id:`puyi-${card.id}`,guid:card.id,order:card.position,word:card.word,reading:card.kana,
    meaning:{es:card.meaning,en:card.meaning},wordFurigana:card.word,wordSegments:[{text:card.word}],
    sentenceHtml:'',sentenceFuriganaHtml:'',sentenceSegments:[{text:card.exampleSentence,highlighted:false}],
    sentenceMeaning:{es:card.exampleTranslation,en:card.exampleTranslation},notes:{},frequencyRank:0,media:{},source:'Mazo Puyi',
    ...(imageUrl?{publicImageUrl:imageUrl}:{})};
}
