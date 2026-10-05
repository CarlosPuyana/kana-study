import {lessonExercises} from './grammar-n5-expansion.mjs';
import {compiledTranslations} from './compile-i18n.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { completeGrammarCourse } from './complete-grammar-n5.mjs';
import { GRAMMAR_UI_TRANSLATIONS } from './grammar-n5-audit.mjs';

const generate=()=>{
  const source=JSON.parse(fs.readFileSync('scripts/grammar-n5-foundation.json','utf8'));
  const sessions=completeGrammarCourse(source.topics,source.lessons,source.practices,source.copy);
  return {...source,sessions};
};
test('authored sources reproduce every checked-in generated export without reading generated data as input',()=>{
  const source=generate(),raw=fs.readFileSync('src/app/features/grammar/data/grammar-n5.generated.ts','utf8');
  for(const [name,value]of Object.entries({GRAMMAR_TOPICS:source.topics,GRAMMAR_LESSONS:source.lessons,GRAMMAR_PRACTICES:source.practices,GRAMMAR_ROADMAP:source.roadmap,GRAMMAR_SESSIONS:source.sessions})){
    const match=raw.match(new RegExp(`export const ${name}:[^=]+= ([\\s\\S]*?);\\r?\\n`));
    assert.ok(match,name);assert.deepEqual(JSON.parse(match[1]),value,name);
  }
  assert.deepEqual(generate(),source,'Repeated generation is deterministic.');
  assert.equal(fs.readFileSync('src/assets/i18n/dictionaries.generated.ts','utf8'),compiledTranslations());
});
test('generated exercise solutions and alternate orders reference valid unique blocks',()=>{
  const source=generate(),exercises=[...source.lessons.flatMap(lessonExercises),...source.practices.flatMap(p=>p.exercises)];
  assert.equal(exercises.length,542);
  for(const e of exercises){
    if(e.optionKeys)assert.ok(Number.isInteger(e.answer)&&e.answer>=0&&e.answer<e.optionKeys.length,e.id);
    if(e.tokenKeys)for(const order of [e.solution,...e.acceptedOrders??[]]){
      assert.equal(order.length,e.solution.length,e.id);assert.equal(new Set(order).size,order.length,e.id);
      assert.ok(order.every(i=>Number.isInteger(i)&&i>=0&&i<e.tokenKeys.length),e.id);
    }
    if(e.acceptedAnswers)assert.ok(e.acceptedAnswers.length&&e.acceptedAnswers.every(s=>s.trim()),e.id);
    if(e.pairs)assert.ok(e.pairs.length>1,e.id);
  }
});
test('all generated keys exist in ES/EN/CA and Spanish agrees with the authored source',()=>{
  const source=generate(),keys=new Set();
  function visit(value){
    if(typeof value==='string'&&value.startsWith('grammar.'))keys.add(value);
    else if(Array.isArray(value))value.forEach(visit);
    else if(value&&typeof value==='object')Object.values(value).forEach(visit);
  }
  visit([source.topics,source.lessons,source.practices,source.sessions,source.roadmap]);
  for(const lang of ['es','en','ca']){
    const dictionary=JSON.parse(fs.readFileSync(`src/assets/i18n/${lang}.json`,'utf8'));
    for(const key of keys){assert.ok(Object.hasOwn(dictionary,key),`${lang}: ${key}`);if(lang==='es')assert.equal(dictionary[key],GRAMMAR_UI_TRANSLATIONS[lang]?.[key]??source.copy[key],`${lang}: ${key}`);else assert.equal(typeof dictionary[key],'string',`${lang}: ${key}`);}
  }
});
test('groups preserve all original IDs and all seven kinds remain authored after regeneration',()=>{
  const {lessons,sessions,practices}=generate();assert.equal(lessons.length,131);assert.equal(sessions.length,72);
  const ids=sessions.flatMap(s=>s.lessonIds.map(id=>`${s.topicId}.${id}`));assert.equal(new Set(ids).size,131);
  assert.deepEqual(ids.sort(),lessons.map(l=>`${l.topicId}.${l.id}`).sort());
  assert.equal(new Set([...lessons.map(l=>l.exercise.kind),...practices.flatMap(p=>p.exercises.map(e=>e.kind))]).size,7);
});
