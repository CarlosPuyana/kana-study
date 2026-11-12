// Compact build representation only. The three JSON dictionaries remain the editable source of truth.
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
export const GRAMMAR_COPY_KEY=/^grammar\.(content|n5|audit|stable|expansion|v2)\./;
export const STUDY_COPY_KEY=/^(kanji\.(availability|stats)\.|vocabulary\.daily\.|anki\.(day|results|rush|scheduler|undo)\.|kaishi\.(sentenceVolume|autoAudio|preparing|playing|autoplayBlocked|audioFailed)$)/;
export const MANGA_ANALYSIS_COPY_KEY=/^mangaM1\.(?!title$)/;
// Keep cross-module dictionary, deck-context and Daily labels synchronous.
export const MANGA_READER_COPY_KEY=/^(?:ocrExplorer\.(?!title$)|mangaVocab\.(?!title$)|manga\.(?!(?:title$|.*\.title$|page$|assist\.|reason\.|grammar\.|study\.|saved\.|deck\.|catalog\.retry$)))/;
export function compiledDomain(grammar){
 const languages=['es','en','ca'],dictionaries=Object.fromEntries(languages.map(lang=>[lang,Object.fromEntries(Object.entries(JSON.parse(fs.readFileSync(`src/assets/i18n/${lang}.json`,'utf8'))).filter(([key])=>grammar==='manga-reader'?MANGA_READER_COPY_KEY.test(key):!MANGA_READER_COPY_KEY.test(key)&&(grammar==='manga-rush'?key.startsWith('mangaM2.'):!key.startsWith('mangaM2.')&&(grammar==='manga-analysis'?MANGA_ANALYSIS_COPY_KEY.test(key):!MANGA_ANALYSIS_COPY_KEY.test(key)&&(grammar==='conjugations'?key.startsWith('conjugations.'):!key.startsWith('conjugations.')&&(grammar==='puyi'?key.startsWith('puyi.'):grammar==='study'?STUDY_COPY_KEY.test(key):grammar==='local'?key.startsWith('localDeck.'):grammar==='backup'?key.startsWith('deckBackup.'):!key.startsWith('puyi.')&&!STUDY_COPY_KEY.test(key)&&!key.startsWith('localDeck.')&&!key.startsWith('deckBackup.')&&GRAMMAR_COPY_KEY.test(key)===grammar))))))]));
 const shared=Object.fromEntries(Object.entries(dictionaries.es).filter(([key,value])=>languages.every(lang=>Object.hasOwn(dictionaries[lang],key)&&dictionaries[lang][key]===value)));
 return '// Generated from es.json, en.json and ca.json. Do not edit.\n'+
  `const shared:Record<string,string> = ${JSON.stringify(shared,null,2)};\n`+
  languages.map(lang=>`export const ${lang}:Record<string,string> = {...shared,...${JSON.stringify(Object.fromEntries(Object.entries(dictionaries[lang]).filter(([key])=>!Object.hasOwn(shared,key))),null,2)}};\n`).join('');
}
export function compiledTranslations(){return '// Generated translation aggregate for tooling/tests. Runtime imports core only.\n'+
 "import * as mangaRush from './manga-rush.generated';\nimport * as mangaAnalysis from './manga-analysis.generated';\nimport * as mangaReader from './manga-reader.generated';\nimport * as study from './deck-study.generated';\nimport * as core from './core.generated';\nimport * as grammar from './grammar.generated';\nimport * as backup from './deck-backup.generated';\nimport * as puyi from './puyi.generated';\nimport * as local from './local-decks.generated';\nimport * as conjugations from './conjugations.generated';\n"+
 ['es','en','ca'].map(lang=>`export const ${lang}:Record<string,string> = {...mangaRush.${lang},...mangaAnalysis.${lang},...mangaReader.${lang},...puyi.${lang},...study.${lang},...core.${lang},...grammar.${lang},...backup.${lang},...local.${lang},...conjugations.${lang}};\n`).join('');}
export function compileTranslations(){
 fs.writeFileSync('src/assets/i18n/manga-rush.generated.ts',compiledDomain('manga-rush'));
 fs.writeFileSync('src/assets/i18n/manga-analysis.generated.ts',compiledDomain('manga-analysis'));
 fs.writeFileSync('src/assets/i18n/manga-reader.generated.ts',compiledDomain('manga-reader'));
 fs.writeFileSync('src/assets/i18n/conjugations.generated.ts',compiledDomain('conjugations'));
 fs.writeFileSync('src/assets/i18n/puyi.generated.ts',compiledDomain('puyi'));
 fs.writeFileSync('src/assets/i18n/deck-study.generated.ts',compiledDomain('study'));
 fs.writeFileSync('src/assets/i18n/local-decks.generated.ts',compiledDomain('local'));
 fs.writeFileSync('src/assets/i18n/core.generated.ts',compiledDomain(false));
 fs.writeFileSync('src/assets/i18n/grammar.generated.ts',compiledDomain(true));
 fs.writeFileSync('src/assets/i18n/deck-backup.generated.ts',compiledDomain('backup'));
 fs.writeFileSync('src/assets/i18n/dictionaries.generated.ts',compiledTranslations());
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===fs.realpathSync(process.argv[1]))compileTranslations();
