import {lessonExercises} from './grammar-n5-expansion.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {completeGrammarCourse} from './complete-grammar-n5.mjs';
import {auditGrammarCourse} from './grammar-language-audit.mjs';
const course=()=>{const s=JSON.parse(fs.readFileSync('scripts/grammar-n5-foundation.json','utf8'));s.sessions=completeGrammarCourse(s.topics,s.lessons,s.practices,s.copy);return s;};
const lesson=(s,id)=>s.lessons.find(l=>`${l.topicId}.${l.id}`===id);
const audit=s=>auditGrammarCourse(s.lessons,s.practices,s.sessions,s.copy,s.topics);
test('editorial targets retain tense, register, stem and duration instructions',()=>{
 const s=course();for(const [id,fragments]of Object.entries({'02.5':['おいしい','pasado afirmativo cortés','です'],'03.2':['raíz','おきる','sin añadir ます'],'04.12':['duración aproximada','tres horas','sin verbo'],'05.4':['せんせい','pasado afirmativo simple']})){
  const q=s.copy[lesson(s,id).exercise.questionKey];for(const text of fragments)assert.ok(q.includes(text),`${id}: ${text}`);
 }
 for(const e of [...s.lessons.flatMap(lessonExercises),...s.practices.flatMap(p=>p.exercises)].filter(e=>e.kind==='fill-gap')){assert.doesNotMatch(s.copy[e.questionKey],/completa esta actividad/);assert.match(s.copy[e.questionKey],/en kana/);assert.match(s.copy[e.questionKey],/solo/);}
});
test('explicit equivalent answers preserve the intended Japanese meaning',()=>{
 const s=course();for(const [id,answers]of Object.entries({'04.12':['さんじかんくらい','さんじかんぐらい'],'05.8':['いそがしいんです','いそがしいのです'],'03.11':['に','へ'],'08.1':['から','ので']}))for(const answer of answers)assert.ok(lesson(s,id).exercise.acceptedAnswers.includes(answer));
 assert.ok(s.practices.flatMap(p=>p.exercises).find(e=>e.id==='practice-02-1').acceptedAnswers.includes('たかくありませんでした'));
});
test('comparison and mada accept the authored natural alternative orders',()=>{
 const s=course();for(const [id,expected]of Object.entries({'09.4':'ケーキのほうがパンよりたかいです','08.10':'まだそのえいがはみていません'})){
  const e=lesson(s,id).exercise;assert.ok(e.acceptedOrders.some(order=>order.map(i=>s.copy[e.tokenKeys[i]]).join('')===expected));
 }
});
test('permission builds exactly temoii and the single error is an indivisible unit',()=>{
 const s=course(),permission=lesson(s,'06.13').exercise,error=lesson(s,'10.9').exercise;
 assert.equal(permission.solution.map(i=>s.copy[permission.tokenKeys[i]]).join(''),'みずをのんでもいいですか');
 assert.match(s.copy[permission.successKey],/のんでもいいですか/);
 assert.deepEqual(error.optionKeys.map(k=>s.copy[k]),['きのうは','さむいでした']);assert.equal(error.answer,1);assert.match(s.copy[error.successKey],/さむかったです/);
});
test('kana banks include plausible original-form errors and both duration variants',()=>{
 const s=course();for(const [id,kana]of Object.entries({'03.6':['く','き','ま','す'],'06.2':['る','っ','て'],'06.5':['ぐ','い','で'],'04.12':['く','ぐ','ご','ろ']}))for(const c of kana)assert.ok(lesson(s,id).exercise.kanaBank.includes(c),`${id}: ${c}`);
});
test('practical information does not interpret the notice before the answer; reading distractors are contextual',()=>{
 const s=course();for(const e of [lesson(s,'10.8').exercise,...s.practices.find(p=>p.topicId==='10').exercises.filter(e=>e.contextKey===lesson(s,'10.8').exercise.contextKey)]){
  const context=s.copy[e.contextKey];assert.doesNotMatch(context,/El aviso permite|pide no traer|no traer comida/);assert.match(context,/たべもの = comida/);assert.match(s.copy[e.successKey],/domingo/);
 }
 const e=lesson(s,'10.7').exercise;assert.deepEqual(e.optionKeys.map(k=>s.copy[k]),['Porque la biblioteca cierra el domingo.','Porque la biblioteca abre por la tarde el domingo.','Porque ya han estudiado allí antes.']);
});
test('authored lexical controls cover company, dates and actual practice words',()=>{
 const s=course(),l=lesson(s,'03.15');for(const word of ['ともだち','あね','べんきょうする']){assert.ok(l.prerequisites.intendedVocabulary.includes(word));assert.ok(l.exercise.controlledVocabulary.includes(word));}
 assert.ok(s.practices.flatMap(p=>p.exercises).filter(e=>e.controlledVocabulary).length>=11);
 assert.deepEqual(audit(s).modes,{recognition:10,manipulation:3,production:59});
});
const mutations={
 'kanji in topic goal':s=>s.copy[s.topics[0].goal.bodyKey]+='未',
 'kanji in practice introduction':s=>s.copy[s.practices[0].intro.bodyKey]+='未',
 'missing translation':s=>delete s.copy[lesson(s,'01.1').ideaKey],
 'duplicate session':s=>s.sessions.push(structuredClone(s.sessions[0])),
 'duplicate concept ID':s=>s.lessons.push(structuredClone(s.lessons[0])),
 'duplicate exercise ID':s=>s.practices[0].exercises[1].id=s.practices[0].exercises[0].id,
 'missing session concept':s=>s.sessions[0].lessonIds.push('999'),
 'invalid exercise concept':s=>s.practices[0].exercises[0].conceptId='00.999',
 'invalid choice answer':s=>lesson(s,'10.9').exercise.answer=99,
 'invalid block reference':s=>lesson(s,'06.13').exercise.solution[0]=99,
 'invalid matching reference':s=>lesson(s,'04.6').exercise.rightOrder=[0,0,99],
 'undeclared practice vocabulary':s=>s.practices[0].exercises[0].controlledVocabulary=['みせ'],
 'dishonest learning mode':s=>s.sessions[0].learningMode='production',
};
for(const [name,mutate]of Object.entries(mutations))test(`audit rejects ${name} (in-memory mutation)`,()=>{const s=course();mutate(s);assert.throws(()=>audit(s),/Grammar language audit failed/);});
test('historical importer fails safely before writing maintained files',()=>{
 const p='src/app/features/grammar/data/grammar-n5.generated.ts',before=fs.readFileSync(p,'utf8');
 const result=spawnSync(process.execPath,['scripts/import-grammar-prototype.mjs'],{encoding:'utf8'});
 assert.notEqual(result.status,0);assert.match(result.stderr,/Historical prototype importer disabled/);assert.equal(fs.readFileSync(p,'utf8'),before);
});
test('in-memory fixture mutations never alter the canonical authored arrays',()=>{
 const s=course();lesson(s,'01.12').exercise.acceptedAnswers.push('不正');lesson(s,'06.13').exercise.solution[0]=99;
 const fresh=course();assert.deepEqual(lesson(fresh,'01.12').exercise.acceptedAnswers,['でした']);assert.equal(lesson(fresh,'06.13').exercise.solution[0],0);
});
test('selected foreground contrasts with tinted surfaces in all five themes',()=>{
 const css=fs.readFileSync('src/styles.scss','utf8'),blocks=[...css.matchAll(/:root(?:\[data-theme='([^']+)'\])?\s*\{([^}]+)\}/g)],base=Object.fromEntries([...blocks[0][2].matchAll(/--([\w-]+):\s*([^;]+);/g)].map(m=>[m[1],m[2].trim()]));
 const rgb=s=>s.match(/\w\w/g).map(v=>parseInt(v,16));
 const luminance=channels=>channels.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
 for(const block of blocks.slice(0,5)){
  const tokens={...base,...Object.fromEntries([...block[2].matchAll(/--([\w-]+):\s*([^;]+);/g)].map(m=>[m[1],m[2].trim()]))};assert.equal(tokens['selected-foreground'],'var(--text-primary)');
  const foreground=rgb(tokens['text-primary'].slice(1)),soft=tokens['primary-soft'].match(/[\d.]+/g).map(Number);
  for(const surface of ['surface','surface-raised']){const background=rgb(tokens[surface].slice(1)).map((v,i)=>v*(1-soft[3])+soft[i]*soft[3]),a=luminance(foreground),b=luminance(background);assert.ok((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5,block[1]??'dark');}
 }
 assert.match(fs.readFileSync('src/app/features/grammar/pages/grammar.page.scss','utf8'),/\.subnav-item\.selected\{[^}]*color:var\(--selected-foreground\)/);
});
