import {ALL_KANA} from '../../data/kana';
import {VocabularyEntry,VocabularyJlptApproxLevel} from '../models/vocabulary.model';

export const VOCABULARY_LEVEL_CAPABILITIES:Readonly<Record<VocabularyJlptApproxLevel,{readonly showRomaji:boolean}>>={
  N5:{showRomaji:true},N4:{showRomaji:false},N3:{showRomaji:false},N2:{showRomaji:false},N1:{showRomaji:false},
};
const ROMAJI=new Map(ALL_KANA.map(k=>[k.character,k.romaji]));
// Extend the existing Kana table only for small vowels/loanword syllables.
for(const [kana,romaji] of Object.entries({'ぁ':'a','ぃ':'i','ぅ':'u','ぇ':'e','ぉ':'o','ァ':'a','ィ':'i','ゥ':'u','ェ':'e','ォ':'o','ティ':'ti','ディ':'di','ファ':'fa','フィ':'fi','フェ':'fe','フォ':'fo','シェ':'she','チェ':'che','ジェ':'je','ヴ':'vu','ヴァ':'va','ヴィ':'vi','ヴェ':'ve','ヴォ':'vo'}))ROMAJI.set(kana,romaji);

/** Existing Hepburn syllables; preserve explicit long-vowel spellings (kyou, gakkou).
 * The katakana long-vowel mark repeats its preceding vowel (koohii).
 */
export function romanizeVocabularyReading(reading:string):string{
  const text=reading.normalize('NFKC');let result='';
  const syllable=(i:number)=>ROMAJI.get(text.slice(i,i+2))??ROMAJI.get(text[i])??'';
  for(let i=0;i<text.length;){
    const character=text[i],pair=text.slice(i,i+2);
    if(character==='っ'||character==='ッ'){const next=syllable(i+1);result+=next.startsWith('ch')?'t':/^[bcdfghjklmpqrstvwxyz]/.test(next)?next[0]:'';i++;continue;}
    if(character==='ー'){result+=/[aeiou]$/.test(result)?result.at(-1):'';i++;continue;}
    const mapped=syllable(i);
    if((character==='ん'||character==='ン') && /^[aeiouy]/.test(syllable(i+1)))result+="n'";
    else result+=mapped||character;
    i+=ROMAJI.has(pair)?2:1;
  }
  return result;
}
export function vocabularyRomaji(entry:VocabularyEntry,capabilities=VOCABULARY_LEVEL_CAPABILITIES):string|null{
  return capabilities[entry.jlptApproxLevel].showRomaji?romanizeVocabularyReading(entry.primaryReading):null;
}
