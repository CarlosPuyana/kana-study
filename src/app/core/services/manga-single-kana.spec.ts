import {filterMangaWords,isSingleMangaKana,mangaLexicalWords} from './manga-vocabulary-presentation';
import {rushWord,rushIndex} from './manga-rush.fixture';
import {mangaRushPool,MANGA_RUSH_DEFAULTS} from './manga-rush';
describe('Manga lexical surface filter',()=>{
 it.each(['は','の','に','と','あ','ア','ｱ','ｶﾞ','か\u3099','𛀁'])('excludes a single kana %s',s=>expect(isSingleMangaKana(s)).toBe(true));
 it.each(['人','山','本','する','見る','いる','うん','お母さん','ー','。','゛','㋐','㌔'])('preserves non-single-kana %s',s=>expect(isSingleMangaKana(s)).toBe(false));
 it('filters occurrences rather than lemmas, preserves grammar/unclassified and M1 totals',()=>{
  const mixed=rushWord('いる','いる',1,2);mixed.entry.occurrences[0]={...mixed.entry.occurrences[0],surface:'い',context:'い。',end:1};
  const words=[mixed,rushWord('あ','あ',2),rushWord('は','は',3,1,'functional'),rushWord('の','の',4,1,'unclassified')],original=JSON.stringify(words),index=rushIndex(words);
  const lexical=filterMangaWords(words,'lexical');expect(lexical).toHaveLength(1);expect(lexical[0].entry.occurrences).toHaveLength(1);
  expect(filterMangaWords(words,'functional')).toHaveLength(1);expect(filterMangaWords(words,'unclassified')).toHaveLength(1);
  const pool=mangaRushPool(index,words,MANGA_RUSH_DEFAULTS);expect(pool.distinct).toBe(1);expect(pool.occurrences).toBe(1);
  expect(mangaRushPool(index,words,{...MANGA_RUSH_DEFAULTS,category:'functional'}).distinct).toBe(1);
  expect(mangaLexicalWords(words)).toHaveLength(3);expect(index.occurrences).toBe(7);expect(JSON.stringify(words)).toBe(original);
 });
});
