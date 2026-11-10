import { KANJI_N5 } from './kanji-n5.generated';

describe('Kanji dataset',()=>{
  const expected='一 七 万 三 上 下 中 九 二 五 人 今 休 何 先 入 八 六 円 出 分 前 北 十 千 午 半 南 友 右 名 四 国 土 外 大 天 女 子 学 小 山 川 左 年 後 日 時 書 月 木 本 来 東 校 母 毎 気 水 火 父 生 男 白 百 聞 行 西 見 話 語 読 車 金 長 間 雨 電 食 高'.split(' ');
  it('contains exactly the requested 80 unique enabled N5 kanji',()=>{expect(KANJI_N5).toHaveLength(80);expect(KANJI_N5.map(k=>k.character)).toEqual(expected);expect(new Set(KANJI_N5.map(k=>k.id)).size).toBe(80);expect(new Set(KANJI_N5.map(k=>k.character)).size).toBe(80);expect(KANJI_N5.every(k=>k.enabled&&k.jlptApproxLevel==='N5')).toBe(true)});
  it('has complete localized meanings and KANJIDIC metadata',()=>expect(KANJI_N5.every(k=>k.meanings.es.length&&k.meanings.en.length&&k.meanings.ca.length&&k.strokeCount>0&&k.schoolGrade!==undefined&&k.frequencyRank!==undefined)).toBe(true));
  it('always exposes reading and example arrays',()=>expect(KANJI_N5.every(k=>Array.isArray(k.onyomi)&&Array.isArray(k.kunyomi)&&Array.isArray(k.examples))).toBe(true));
  it('has at least one fully localized teaching example per kanji',()=>expect(KANJI_N5.every(k=>k.examples.length>=1&&k.examples.every(e=>e.word&&e.reading&&e.romaji&&e.targetReading&&e.translations.es&&e.translations.en&&e.translations.ca&&['on','kun','irregular'].includes(e.readingType)))).toBe(true));
  it('has one principal real-word example containing its kanji, with a kana reading',()=>{
    for(const kanji of KANJI_N5){
      expect(kanji.examples,kanji.id).toHaveLength(1);
      expect(kanji.examples[0].word,kanji.id).toContain(kanji.character);
      expect(kanji.examples[0].reading,kanji.id).toMatch(/^[ぁ-ゖー]+$/u);
    }
  });
  it.each([
    ['十','十月','じゅうがつ','octubre','October','octubre'],
    ['千','千円','せんえん','mil yenes','one thousand yen','mil iens'],
    ['百','百円','ひゃくえん','cien yenes','one hundred yen','cent iens'],
    ['土','土曜日','どようび','sábado','Saturday','dissabte'],
    ['東','東口','ひがしぐち','salida este','east exit','sortida est'],
  ])('keeps the checked spelling, reading and sense for %s', (id,word,reading,es,en,ca)=>{
    expect(KANJI_N5.find(k=>k.id===id)!.examples[0]).toMatchObject({word,reading,translations:{es,en,ca}});
  });
});
