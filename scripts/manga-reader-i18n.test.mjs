import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {compiledDomain,MANGA_READER_COPY_KEY} from './compile-i18n.mjs';
test('reader copy is a complete deferred domain without changing ES/EN/CA strings',()=>{
 const core=fs.readFileSync('src/assets/i18n/core.generated.ts','utf8'),reader=fs.readFileSync('src/assets/i18n/manga-reader.generated.ts','utf8');
 assert.equal(reader,compiledDomain('manga-reader'));assert.equal(core,compiledDomain(false));
 const dictionaries=['es','en','ca'].map(lang=>JSON.parse(fs.readFileSync(`src/assets/i18n/${lang}.json`,'utf8')));
 const keys=Object.keys(dictionaries[0]).filter(key=>MANGA_READER_COPY_KEY.test(key));assert(keys.length>100);
 for(const dictionary of dictionaries){assert.deepEqual(Object.keys(dictionary).filter(key=>MANGA_READER_COPY_KEY.test(key)),keys);for(const key of keys){assert(!core.includes(JSON.stringify(key)+':'));assert(reader.includes(JSON.stringify(dictionary[key])));}}
 for(const key of ['manga.page','manga.fsrs.title','manga.remote.title','mangaVocab.title','manga.assist.word','manga.reason.past','manga.grammar.return','manga.study.title','manga.saved.title','manga.deck.title','manga.catalog.retry'])assert(core.includes(JSON.stringify(key)+':'),key);
});
test('existing users outside Manga retain their synchronous translations, including dynamic prefixes',()=>{
 const dictionary=JSON.parse(fs.readFileSync('src/assets/i18n/es.json','utf8'));
 function visit(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())visit(file);else if(/\.(ts|html)$/.test(file)&&!file.includes('.spec.')&&!file.includes(path.join('features','manga'))){
  for(const match of fs.readFileSync(file,'utf8').matchAll(/["'`]((?:manga|mangaVocab|ocrExplorer)\.[\w.-]+)["'`]/g)){
   const key=match[1];if(file.endsWith('app.routes.ts')&&key==='manga.remote.title')continue; // /upload resolves reader copy before activation/title.
   for(const used of Object.keys(dictionary).filter(k=>k===key||key.endsWith('.')&&k.startsWith(key)))assert(!MANGA_READER_COPY_KEY.test(used),`${file}: ${used}`);
  }
 }}}
 visit('src/app');
});
