import {AcceptedConjugationAnswers} from '../models/conjugation-practice.model';

export function normalizeConjugationAnswer(value:string):string {return value.normalize('NFKC').trim();}
/** Exact membership only: no transliteration, grammar, spell correction or fuzzy match. */
export function validateConjugationAnswer(value:string,accepted:AcceptedConjugationAnswers):boolean {
  const answer=normalizeConjugationAnswer(value);
  if(!answer)return false;
  return accepted.romaji.some(candidate=>normalizeConjugationAnswer(candidate).toLowerCase()===answer.toLowerCase())||
    [...accepted.kana,...accepted.kanji].some(candidate=>normalizeConjugationAnswer(candidate)===answer);
}
