import {validateConjugationAnswer as validate} from './conjugation-answer-validator';
import {CONJUGATION_ADJECTIVES as words} from '../../data/conjugation-adjectives';
describe('Exact conjugation membership validator',()=>{
  const past=words.find(w=>w.id==='muzukashii')!.conjugations.past;
  it('accepts registered romaji, kana, kanji, case, outer whitespace and NFKC',()=>{for(const answer of ['muzukashikatta','むずかしかった','難しかった',' MUZUKASHIKATTA\n','ｍｕｚｕｋａｓｈｉｋａｔｔａ','　難しかった　'])expect(validate(answer,past)).toBe(true);});
  it('does not transliterate, fuzzy-match, discard internal spaces or repair a different transformation',()=>{for(const answer of ['',' ','muzukashikata','muzukashikunai','muzukashikatta desu','muzukashi katta','ムズカシカッタ','難しい','難しかた'])expect(validate(answer,past)).toBe(false);});
  it('preserves long vowels and double consonants',()=>{const a=words.find(w=>w.id==='yuumei')!.conjugations.past;expect(validate('yuumeidatta',a)).toBe(true);for(const answer of ['yumeidatta','yuumeidata','yūmeidatta'])expect(validate(answer,a)).toBe(false);});
  it('accepts explicit ja/dewa alternatives only in their own forms and family',()=>{const a=words.find(w=>w.id==='shizuka')!;for(const answer of ['shizukajanai','shizukadewanai','静かではない','しずかじゃない'])expect(validate(answer,a.conjugations.negative)).toBe(true);for(const answer of ['静かではなかった','shizukakunai','静かじゃありません'])expect(validate(answer,a.conjugations.negative)).toBe(false);expect(validate('shizukadewanakatta',a.conjugations.negativePast)).toBe(true);expect(validate('shizukani',a.conjugations.te)).toBe(false);});
  it('only accepts explicitly registered alternatives, including empty orthography lists',()=>{expect(validate('x',{romaji:[],kana:[],kanji:[]})).toBe(false);expect(validate('second',{romaji:['first','second'],kana:[],kanji:[]})).toBe(true);});
  it('normalizes decomposed Japanese dakuten without changing scripts',()=>{const a=words.find(w=>w.id==='genki')!.conjugations.past;expect(validate('け\u3099んきた\u3099った',a)).toBe(true);expect(validate('ゲンキダッタ',a)).toBe(false);});
});
