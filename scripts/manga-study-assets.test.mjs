import {readFileSync} from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
const source=readFileSync('src/app/data/vocabulary-n5.generated.ts','utf8');
const entries=JSON.parse('['+source.split('=[')[1].trim().replace(/;$/,''));
const glyphs=['public/vocabulary-writing/kanji.json','public/vocabulary-writing/kana-extra.json','public/kana-writing/strokes.json'].flatMap(path=>JSON.parse(readFileSync(path,'utf8')));
const supported=new Set(glyphs.filter(g=>g.strokes.length).map(g=>g.character));
test('every single Japanese primary form offered by Manga has existing local writing glyphs',()=>{
  const writable=entries.filter(e=>e.enabled&&/^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}ー々]+$/u.test(e.primaryWrittenForm));
  assert.ok(writable.length>600);
  for(const entry of writable)for(const character of entry.primaryWrittenForm)assert.ok(supported.has(character),`${entry.id}: missing ${character}`);
});
test('Manga study UI keys exist and preserve placeholders in all lazy UI dictionaries',()=>{
  const dictionaries=['es','en','ca'].map(lang=>JSON.parse(readFileSync(`src/assets/i18n/${lang}.json`,'utf8')));
  const keys=Object.keys(dictionaries[0]).filter(key=>key.startsWith('manga.study.'));assert.equal(keys.length,9);
  for(const key of keys)for(const dictionary of dictionaries){assert.ok(dictionary[key]);assert.deepEqual(dictionary[key].match(/\{\w+\}/g),dictionaries[0][key].match(/\{\w+\}/g));}
});
