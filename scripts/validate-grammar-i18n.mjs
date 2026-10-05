import fs from 'node:fs';
import {fileURLToPath} from 'node:url';

// Japanese examples, linguistic labels and identical Catalan vocabulary are reviewed explicitly.
export const sharedGrammarCopy = Object.fromEntries(Object.entries(JSON.parse(fs.readFileSync(new URL('./grammar-i18n-shared.json',import.meta.url),'utf8'))).map(([lang,values])=>[lang,new Set(values)]));
const html = text => text.match(/<[^>]*>/gu) ?? [];
const placeholders = text => (text.match(/\{\{[^}]+\}\}/gu) ?? []).sort();
const japanese = text => (text.match(/[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}ー々]+/gu) ?? []).sort();
const same = (a,b) => JSON.stringify(a) === JSON.stringify(b);
export function validateGrammarTranslations(dictionaries, allowed=sharedGrammarCopy) {
  const errors=[];
  for(const lang of ['en','ca']) {
    for(const [key,source] of Object.entries(dictionaries.es).filter(([key])=>key.startsWith('grammar.'))) {
      const value=dictionaries[lang][key];
      if(typeof value!=='string'){errors.push(`${lang} ${key}: missing translation`);continue;}
      if(!same(html(source),html(value)))errors.push(`${lang} ${key}: HTML changed`);
      if(!same(placeholders(source),placeholders(value)))errors.push(`${lang} ${key}: placeholders changed`);
      if(!same(japanese(source),japanese(value)))errors.push(`${lang} ${key}: Japanese changed`);
      const prose=source.replace(/<[^>]*>/gu,'').replace(/\{\{[^}]+\}\}/gu,'');
      if(value===source&&/[A-Za-zÀ-ÿ]/u.test(prose)&&!allowed[lang].has(source))errors.push(`${lang} ${key}: copied Spanish prose ${JSON.stringify(source)}`);
      const markers=lang==='en'?/\b(?:aprendizaje|escritura|oración|oraciones|pregunta|respuesta|respuestas|elige|construye|completa|recuerda|significado|hablante|ejercicio|ejercicios|expresa|español|ninguna|solamente|también|después|podemos|tenemos|vuelve|pasado|pasada|subordinación|negación|posesión|comparación|conjugación|afirmación|vocales|sonidos|tienes|puedes|utiliza)\b/iu
        :/\b(?:aprendizaje|escritura|oración|oraciones|respuesta|respuestas|elige|construye|recuerda|significado|hablante|ejercicio|ejercicios|español|ninguna|solamente|también|después|podemos|tenemos|vuelve|pasado|pasada|subordinación|negación|posesión|comparación|conjugación|afirmación|vocales|sonidos|tienes|puedes|utiliza)\b/iu;
      if(markers.test(value.replace(/<[^>]*>/gu,'')))errors.push(`${lang} ${key}: Spanish marker ${JSON.stringify(value)}`);
    }
  }
  return errors;
}
export function readDictionaries(){return Object.fromEntries(['es','en','ca'].map(lang=>[lang,JSON.parse(fs.readFileSync(`src/assets/i18n/${lang}.json`,'utf8'))]));}
if(process.argv[1]&&fileURLToPath(import.meta.url)===fs.realpathSync(process.argv[1])) {
  const errors=validateGrammarTranslations(readDictionaries());
  if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}
  else console.log('Grammar ES/EN/CA: complete keys, preserved HTML/placeholders/Japanese, no known Spanish residual.');
}
