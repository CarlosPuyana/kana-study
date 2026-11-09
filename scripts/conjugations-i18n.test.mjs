import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {compiledDomain,compiledTranslations} from './compile-i18n.mjs';
test('Conjugations copy is a complete lazy domain with equal keys and placeholders',()=>{
 const dictionaries=['es','en','ca'].map(language=>JSON.parse(fs.readFileSync(`src/assets/i18n/${language}.json`,'utf8'))),keys=Object.keys(dictionaries[0]).filter(k=>k.startsWith('conjugations.')).sort();
 assert.equal(keys.length,68);
 for(const dictionary of dictionaries){assert.deepEqual(Object.keys(dictionary).filter(k=>k.startsWith('conjugations.')).sort(),keys);for(const key of keys){assert(dictionary[key].trim());assert.deepEqual([...dictionary[key].matchAll(/\{\{(\w+)\}\}/g)].map(m=>m[1]).sort(),[...dictionaries[0][key].matchAll(/\{\{(\w+)\}\}/g)].map(m=>m[1]).sort());}}
 const core=fs.readFileSync('src/assets/i18n/core.generated.ts','utf8');assert(!core.includes('"conjugations.'));assert(core.includes('more.conjugations.title'));
 assert.equal(fs.readFileSync('src/assets/i18n/conjugations.generated.ts','utf8'),compiledDomain('conjugations'));assert.equal(core,compiledDomain(false));assert.equal(fs.readFileSync('src/assets/i18n/dictionaries.generated.ts','utf8'),compiledTranslations());
});
