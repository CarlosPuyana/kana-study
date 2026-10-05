import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {readDictionaries,validateGrammarTranslations} from './validate-grammar-i18n.mjs';
import {compiledDomain} from './compile-i18n.mjs';

test('all Grammar translations preserve content structure and contain no known Spanish residual',()=>{
  assert.deepEqual(validateGrammarTranslations(readDictionaries()),[]);
});
test('translation audit rejects copied prose, changed HTML, placeholders, Japanese and missing keys',()=>{
  const source='Elige <strong>かな</strong> {{count}} respuestas.';
  const valid='Choose <strong>かな</strong> {{count}} answers.';
  for(const bad of [source,valid.replace('strong','em'),valid.replace('count','total'),valid.replace('かな','カナ'),undefined]) {
    assert.ok(validateGrammarTranslations({es:{'grammar.example':source},en:{'grammar.example':bad},ca:{'grammar.example':valid}}).length>0);
  }
  assert.deepEqual(validateGrammarTranslations({es:{'grammar.example':source},en:{'grammar.example':valid},ca:{'grammar.example':valid}}),[]);
});
test('runtime translation entry excludes the pedagogical catalog and generated domains remain current',()=>{
  const runtime=fs.readFileSync('src/app/core/services/translation.service.ts','utf8');
  assert.ok(!runtime.includes('dictionaries.generated'));
  assert.match(runtime,/import\(['"]\.\.\/\.\.\/\.\.\/assets\/i18n\/grammar\.generated['"]\)/u);
  for(const [grammar,file]of [[false,'core'],[true,'grammar']])assert.equal(fs.readFileSync(`src/assets/i18n/${file}.generated.ts`,'utf8'),compiledDomain(grammar));
});
