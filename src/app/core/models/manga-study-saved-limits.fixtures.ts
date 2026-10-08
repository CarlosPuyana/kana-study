import type {MangaStudySavedItem} from './manga-study-saved.model';

/** Shared local/SQL boundary fixtures: preserve the generator's exact JSON ID. */
export function dictionaryLimitItem(expression: string, reading: string): MangaStudySavedItem {
  return {schemaVersion:1,id:'dictionary:'+JSON.stringify([expression,reading]),expression,reading,
    kanji:[],source:{volumeId:'volume',pageNumber:1},createdAt:100};
}
export function payloadLimitItem(bytes:(item:MangaStudySavedItem)=>number,target:number):MangaStudySavedItem {
  const item={...dictionaryLimitItem('\u0001'.repeat(1600),'\u0001'.repeat(1600)),
    baseForm:'x'.repeat(1600),kanji:Array.from({length:64},()=> '\u0001'.repeat(64)),context:''};
  // Remove six-byte control escapes, then fill the remaining bytes with ASCII.
  let index=63;
  while(bytes(item)>target) {
    if(!item.kanji[index].length){index--;continue;}
    item.kanji[index]=item.kanji[index].slice(1);
  }
  item.context='x'.repeat(target-bytes(item));
  return item;
}
