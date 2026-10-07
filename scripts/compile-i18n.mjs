// Compact build representation only. The three JSON dictionaries remain the editable source of truth.
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
export const GRAMMAR_COPY_KEY=/^grammar\.(content|n5|audit|stable|expansion|v2)\./;
export function compiledDomain(grammar){
 const languages=['es','en','ca'],dictionaries=Object.fromEntries(languages.map(lang=>[lang,Object.fromEntries(Object.entries(JSON.parse(fs.readFileSync(`src/assets/i18n/${lang}.json`,'utf8'))).filter(([key])=>GRAMMAR_COPY_KEY.test(key)===grammar))]));
 const shared=Object.fromEntries(Object.entries(dictionaries.es).filter(([key,value])=>languages.every(lang=>Object.hasOwn(dictionaries[lang],key)&&dictionaries[lang][key]===value)));
 return '// Generated from es.json, en.json and ca.json. Do not edit.\n'+
  `const shared:Record<string,string> = ${JSON.stringify(shared,null,2)};\n`+
  languages.map(lang=>`export const ${lang}:Record<string,string> = {...shared,...${JSON.stringify(Object.fromEntries(Object.entries(dictionaries[lang]).filter(([key])=>!Object.hasOwn(shared,key))),null,2)}};\n`).join('');
}
export function compiledTranslations(){return '// Generated translation aggregate for tooling/tests. Runtime imports core only.\n'+
 "import * as core from './core.generated';\nimport * as grammar from './grammar.generated';\n"+
 ['es','en','ca'].map(lang=>`export const ${lang}:Record<string,string> = {...core.${lang},...grammar.${lang}};\n`).join('');}
export function compileTranslations(){
 fs.writeFileSync('src/assets/i18n/core.generated.ts',compiledDomain(false));
 fs.writeFileSync('src/assets/i18n/grammar.generated.ts',compiledDomain(true));
 fs.writeFileSync('src/assets/i18n/dictionaries.generated.ts',compiledTranslations());
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===fs.realpathSync(process.argv[1]))compileTranslations();
