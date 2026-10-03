import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {completeGrammarCourse} from './complete-grammar-n5.mjs';
import {auditGrammarCourse} from './grammar-language-audit.mjs';
import {lessonExercises,CATEGORY_MINIMUM,exerciseCategory} from './grammar-n5-expansion.mjs';
import {N5_GROUPS} from './grammar-n5-audit.mjs';
const course=()=>{const s=JSON.parse(fs.readFileSync('scripts/grammar-n5-foundation.json','utf8'));s.sessions=completeGrammarCourse(s.topics,s.lessons,s.practices,s.copy);return s;};
const audit=s=>auditGrammarCourse(s.lessons,s.practices,s.sessions,s.copy,s.topics);
const lesson=(s,id)=>s.lessons.find(l=>`${l.topicId}.${l.id}`===id);
test('every concept meets its independently assigned category minimum with ordered distinct operations',()=>{
 const s=course();assert.equal(s.lessons.flatMap(lessonExercises).length,430);assert.equal(s.practices.flatMap(p=>p.exercises).length,112);
 for(const l of s.lessons){const id=`${l.topicId}.${l.id}`,ex=lessonExercises(l),category=exerciseCategory(id);
  assert.equal(l.exercisePlan.minimum,CATEGORY_MINIMUM[category],id);assert.ok(ex.length>=CATEGORY_MINIMUM[category],id);
  assert.ok(ex.every((e,i)=>!i||e.learningStage>=ex[i-1].learningStage),id);
  assert.equal(new Set(l.additionalExercises.map(e=>e.editorialIntent)).size,l.additionalExercises.length,id);
  assert.ok(l.additionalExercises.every(e=>Array.isArray(e.controlledVocabulary)),id);
 }
 assert.ok(s.lessons.filter(l=>l.exercisePlan.category==='fundamental').every(l=>lessonExercises(l).length>=4));
});
test('72 memberships, stable concept IDs and cumulative exercises remain canonical',()=>{
 const s=course();assert.equal(s.sessions.length,72);
 for(const [topicId,groups]of Object.entries(N5_GROUPS))assert.deepEqual(s.sessions.filter(s=>s.topicId===topicId).map(s=>s.lessonIds),groups.map(g=>g[1].map(String)));
 for(const l of s.lessons)assert.equal(l.exercise.id,`${l.topicId}.${l.id}`);
 assert.ok(s.practices.every(p=>p.exercises.length>=10&&p.exercises.length<=12));
});
test('te automation uses different verbs and operations and ends in contextual application',()=>{
 const s=course();for(let n=1;n<=7;n++){
  const ex=lessonExercises(lesson(s,'06.'+n));assert.equal(ex.length,5);assert.ok(new Set(ex.map(e=>e.kind)).size>=4);
  assert.equal(ex.at(-1).kind,'sentence-builder');assert.equal(ex.at(-1).learningStage,4);
 }
 const text=id=>JSON.stringify(lessonExercises(lesson(s,id)).map(e=>[s.copy[e.promptKey],e.optionKeys?.map(k=>s.copy[k]),e.tokenKeys?.map(k=>s.copy[k]),e.pairs?.map(p=>s.copy[p.leftKey]),e.controlledVocabulary]));
 for(const [id,verbs]of Object.entries({'06.1':['たべる','みる','ねる'],'06.2':['かう','まつ','かえる'],'06.3':['のむ','あそぶ','よむ'],'06.4':['かく','きく'],'06.5':['およぐ','いそぐ'],'06.6':['はなす','けす']}))for(const v of verbs)assert.ok(text(id).includes(v),`${id}: ${v}`);
 assert.doesNotMatch(text('06.3'),/しぬ/);
});
test('tari covers recognition, transformation, composition and contextual interpretation',()=>{
 const s=course(),ex=lessonExercises(lesson(s,'08.7'));
 assert.deepEqual(new Set(ex.map(e=>e.kind)),new Set(['multiple-choice','fill-gap','sentence-builder','select-segment']));
 assert.equal(ex.at(-1).learningStage,4);
});
test('integration remains moderate, contextual and retains all original reading passages',()=>{
 const s=course(),lessons=s.lessons.filter(l=>l.topicId==='10');assert.equal(lessons.flatMap(lessonExercises).length,22);
 for(const n of [6,7,8,10]){const l=lesson(s,'10.'+n);assert.equal(lessonExercises(l).length,2);assert.ok(s.copy[l.exercise.contextKey]);}
 assert.equal(lessons.flatMap(lessonExercises).filter(e=>e.kind==='fill-gap').length,2);
});
test('new gaps preserve authored equivalences and non-answer-ordered kana banks',()=>{
 const s=course();for(const e of s.lessons.flatMap(l=>l.additionalExercises).filter(e=>e.kind==='fill-gap')){
  for(const answer of e.acceptedAnswers)for(const c of answer)assert.ok(e.kanaBank.includes(c),e.id);
  assert.equal(new Set(e.kanaBank).size,e.kanaBank.length);assert.notEqual(e.kanaBank.join(''),e.acceptedAnswers[0]);
 }
 const variants=['04.12','05.8','09.12'].map(id=>lesson(s,id).additionalExercises.find(e=>e.acceptedAnswers?.length>1));
 assert.deepEqual(variants.map(e=>e.acceptedAnswers),[['くらい','ぐらい'],['んです','のです'],['に','から']]);
});
const mutations={
 'duplicate options':s=>{const e=lesson(s,'01.1').additionalExercises[0];e.optionKeys[1]=e.optionKeys[0];},
 'duplicate accepted answers':s=>{const e=lesson(s,'01.3').additionalExercises.find(e=>e.kind==='fill-gap');e.acceptedAnswers.push(e.acceptedAnswers[0]);},
 'missing feedback':s=>{s.copy[lesson(s,'01.1').additionalExercises[0].successKey]='';},
 'specific gap instruction required':s=>{s.copy[lesson(s,'01.3').additionalExercises.find(e=>e.kind==='fill-gap').questionKey]='Completa.';},
 'order alternatives or explicit constraint required':s=>{delete lesson(s,'04.5').additionalExercises.find(e=>e.kind==='sentence-order').orderPolicy;},
 'exact theory example reused':s=>{s.copy[lesson(s,'02.3').additionalExercises[0].promptKey]=s.copy[lesson(s,'02.3').theory[1].bodyKey];},
 'repeated or missing editorial operation':s=>{const es=lesson(s,'01.1').additionalExercises;es[1].editorialIntent=es[0].editorialIntent;},
 'exercise density below assigned minimum':s=>{lesson(s,'06.1').additionalExercises.pop();},
 'duplicate exercise':s=>{const e=structuredClone(lesson(s,'01.1').additionalExercises[0]);e.id='distinct-id';lesson(s,'01.2').additionalExercises.push(e);},
 'controlled vocabulary not allowed':s=>{lesson(s,'01.1').additionalExercises[0].controlledVocabulary.push('未習語');},
};
for(const [message,mutate]of Object.entries(mutations))test(`expansion gate rejects ${message}`,()=>{const s=course();mutate(s);assert.throws(()=>audit(s),new RegExp(message));});
