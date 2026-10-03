import {lessonExercises} from './grammar-n5-expansion.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { completeGrammarCourse } from './complete-grammar-n5.mjs';
import { auditGrammarCourse } from './grammar-language-audit.mjs';
const course=()=>{const source=JSON.parse(fs.readFileSync('scripts/grammar-n5-foundation.json','utf8'));source.sessions=completeGrammarCourse(source.topics,source.lessons,source.practices,source.copy);return source;};
const lesson=(s,id)=>s.lessons.find(l=>`${l.topicId}.${l.id}`===id);
const audit=s=>auditGrammarCourse(s.lessons,s.practices,s.sessions,s.copy,s.topics);

test('local config and review artifact are ignored and absent from the Git index; production generation remains',()=>{
  const files=['public/supabase-config.js','grammar-corrections.patch','grammar-exercise-expansion.patch'];
  const ignore=fs.readFileSync('.gitignore','utf8').split(/\r?\n/);assert.ok(ignore.includes('/public/supabase-config.js'));assert.ok(ignore.includes('/grammar-*.patch'));
  const args=['-c',`safe.directory=${process.cwd().replaceAll('\\','/')}`];
  assert.equal(execFileSync('git',[...args,'ls-files','--',...files],{encoding:'utf8'}).trim(),'');
  const ignored=execFileSync('git',[...args,'check-ignore','--no-index',...files],{encoding:'utf8'}).trim().split(/\r?\n/);
  assert.deepEqual(ignored,files);
  assert.match(fs.readFileSync('.github/workflows/deploy-pages.yml','utf8'),/public\/supabase-config\.js/);
});
test('learning modes distinguish written production from block manipulation and recognition; volume stays stable',()=>{
  const s=course(),report=audit(s);assert.equal(report.activeSessions,71);assert.equal(s.sessions.length,72);
  assert.equal(s.lessons.flatMap(lessonExercises).length+s.practices.reduce((n,p)=>n+p.exercises.length,0),542);
  for(const group of s.sessions){
    const exercises=group.lessonIds.flatMap(id=>lessonExercises(lesson(s,`${group.topicId}.${id}`)));
    if(group.learningMode==='production')assert.ok(exercises.some(e=>e.kind==='fill-gap'),group.id);
    else if(group.learningMode==='manipulation')assert.ok(exercises.some(e=>['sentence-builder','sentence-order'].includes(e.kind)),group.id);
    else assert.ok(s.copy[group.recognitionReasonKey],group.id);
  }
  assert.ok(s.sessions.filter(g=>g.topicId==='06').every(g=>g.learningMode!=='recognition'));
  assert.equal(lesson(s,'08.7').exercise.kind,'sentence-builder');
  for(const id of ['09.4','09.6','09.12'])assert.notEqual(lesson(s,id).exercise.kind,'multiple-choice');
});
test('every kana gap has a reusable contextual bank including all answer characters without spelling out its answer',()=>{
  const s=course();for(const e of [...s.lessons.flatMap(lessonExercises),...s.practices.flatMap(p=>p.exercises)].filter(e=>e.kind==='fill-gap')){
    assert.ok(e.kanaBank.length);assert.equal(new Set(e.kanaBank).size,e.kanaBank.length);
    for(const answer of e.acceptedAnswers){assert.doesNotMatch(answer,/[a-z]/i);for(const c of answer)assert.ok(e.kanaBank.includes(c),`${e.id}: ${c}`);assert.notEqual(e.kanaBank.join(''),answer);}
  }
});
test('kanji are introduced with readings in 03–05 and reused afterwards, with vocabulary scoped per session',()=>{
  const s=course();assert.equal(audit(s).kanji.length,18);
  for(const l of s.lessons){if(l.prerequisites.introducedKanji.length)assert.ok(+l.topicId>=3&&+l.topicId<=5);if(+l.topicId<3)assert.deepEqual(l.prerequisites.allowedKanji,[]);}
  assert.notDeepEqual(lesson(s,'03.1').prerequisites.intendedVocabulary,lesson(s,'03.10').prerequisites.intendedVocabulary);
  assert.ok(lesson(s,'06.9').kanjiExamples.some(e=>e.segments.some(s=>s.text==='読'&&s.reading==='よ')));
});
test('Topic 10 keeps original reading formats while using only introduced basic kanji',()=>{
  const s=course(),known=new Set(audit(s).kanji);for(const id of ['10.6','10.7','10.8','10.10']){
    const text=s.copy[lesson(s,id).exercise.contextKey],kanji=text.match(/\p{Script=Han}/gu)??[];
    assert.ok(kanji.length,id);assert.ok(kanji.every(c=>known.has(c)),id);
  }
  assert.match(s.copy[lesson(s,'10.8').exercise.contextKey],/<table>/);
  assert.match(s.copy[lesson(s,'10.7').exercise.contextKey],/本を読みます/);
  assert.match(s.copy[lesson(s,'10.10').exercise.contextKey],/べんきょうしています/);
  assert.doesNotMatch(s.copy[lesson(s,'10.10').exercise.contextKey],/して今す/);
});
test('audit rejects unknown kanji in visible content',()=>{
  const s=course();s.copy[lesson(s,'03.1').ideaKey]+='未';assert.throws(()=>audit(s),/undeclared kanji 未/);
});
test('audit rejects allowed kanji before their actual introduction and introductions without reading help',()=>{
  const s=course();lesson(s,'01.1').prerequisites.allowedKanji.push('本');assert.throws(()=>audit(s),/before introduction: 本/);
  const t=course();lesson(t,'03.1').kanjiExamples=[];assert.throws(()=>audit(t),/lacks a reading example: 飲/);
});
test('audit checks explicitly controlled vocabulary, with authored inline explanations as exceptions',()=>{
  const s=course(),l=lesson(s,'01.7');l.exercise.controlledVocabulary=['とけい'];assert.throws(()=>audit(s),/controlled vocabulary not allowed: とけい/);
  l.prerequisites.inlineExplanations=[{term:'とけい',reading:'とけい',meaningKey:'grammar.test.clock'}];s.copy['grammar.test.clock']='Reloj.';assert.doesNotThrow(()=>audit(s));
  delete l.prerequisites.inlineExplanations[0].reading;assert.throws(()=>audit(s),/incomplete inline explanation/);
});
test('inline exceptions cover only the explained word, not unrestricted characters',()=>{
  const s=course();assert.doesNotThrow(()=>audit(s));s.copy[lesson(s,'00.1').ideaKey]+='漢';assert.throws(()=>audit(s),/undeclared kanji 漢/);
});
test('Anime primary and hover keep white text at WCAG AA normal-text contrast',()=>{
  const block=fs.readFileSync('src/styles.scss','utf8').split(":root[data-theme='anime'] {")[1].split('}')[0];
  const luminance=hex=>{const rgb=hex.match(/\w\w/g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;};
  for(const token of ['primary','primary-hover']){const hex=block.match(new RegExp(`--${token}: #([0-9a-f]{6})`))[1];assert.ok(1.05/(luminance(hex)+.05)>=4.5,token);}
});
