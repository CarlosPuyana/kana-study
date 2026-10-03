// One-time/repeatable content extraction. Runtime uses only the generated Angular data, not the prototype.
// Usage: node scripts/import-grammar-prototype.mjs <HTML directory> <CSS directory>
import fs from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import postcss from 'postcss';
import { completeGrammarCourse } from './complete-grammar-n5.mjs';

const [source, styles] = process.argv.slice(2);
if (!source || !styles) throw new Error('Expected HTML and CSS prototype directories.');
const output = 'src/app/features/grammar';
fs.mkdirSync(`${output}/data`, {recursive: true});
const copy = {}, keys = new Map();
function key(value = '') {
  const text = value.trim().replace(/[ \t\r\n]+/g, ' ');
  if (!keys.has(text)) { const id = `grammar.content.${keys.size + 1}`; keys.set(text, id); copy[id] = text; }
  return keys.get(text);
}
function doc(file) { return new JSDOM(fs.readFileSync(path.join(source, file), 'utf8')).window.document; }
const text = (el) => el?.textContent?.trim() ?? '';
const rich = (el) => el?.innerHTML?.trim() ?? '';
const summary = (el) => ({eyebrowKey:key(text(el?.querySelector('.eyebrow'))),titleKey:key(text(el?.querySelector('h1,h2,h3'))),bodyKey:key(rich(el?.querySelector('p')))});
function route(href) {
  if (href === 'index.html') return '/grammar';
  const match = /^tema(\d{2})(?:-(\d+|practica))?\.html$/.exec(href ?? '');
  if (!match) throw new Error(`Unsupported prototype link: ${href}`);
  return `/grammar/n5/${match[1]}${match[2] ? '/'+(match[2] === 'practica' ? 'practice' : match[2]) : ''}`;
}
const roadmapDoc = doc('index.html');
const topics = [], lessons = [], practices = [];
for (let number = 0; number <= 10; number++) {
  const id = String(number).padStart(2, '0');
  const d = doc(`tema${id}.html`), stage = roadmapDoc.querySelector(`[data-stage="${number}"]`);
  const topic = {
    id,level:'N5',titleKey:key(text(d.querySelector('.topic-title-wrap h2'))),descriptionKey:key(text(d.querySelector('.topic-title-wrap p'))),
    kickerKey:key(text(d.querySelector('.topic-kicker'))),icon:text(d.querySelector('.topic-icon-large')),
    metaKeys:[...d.querySelectorAll('.meta-chip')].map(el=>key(text(el))),goal:summary(d.querySelector('.topic-intro-card')),
    visualKey:key(rich(d.querySelector('.goal-visual'))),end:summary(d.querySelector('.topic-end-card')),journey:null,
    stage:{color:[...stage.classList].find(x=>!['stage-card','wide'].includes(x)),icon:text(stage.querySelector('.stage-illustration')),bulletKeys:[...stage.querySelectorAll('li')].map(el=>key(text(el)))},
    lessons:[...d.querySelectorAll('.lesson-card')].map(el=>({id:text(el.querySelector('.lesson-index')),titleKey:key(text(el.querySelector('h3'))),bodyKey:key(rich(el.querySelector('.lesson-copy p'))),icon:text(el.querySelector('.lesson-icon')),color:[...el.classList].find(x=>x.startsWith('lesson-')&&x!=='lesson-card'),examplesKey:key(rich(el.querySelector('.lesson-example,.particle-table'))),path:el.querySelector('a')?route(el.querySelector('a').getAttribute('href')):null})),
  };
  const journey=d.querySelector('.start-learning-card');
  if(journey)topic.journey={...summary(journey),links:[...journey.querySelectorAll('a')].map(el=>({labelKey:key(text(el)),path:route(el.getAttribute('href'))}))};
  topics.push(topic);
  if(number>1)continue;
  for(let position=1;position<=topic.lessons.length;position++) {
    const d=doc(`tema${id}-${position}.html`), e=d.querySelector('.exercise-block'), options=[...e.querySelectorAll('.exercise-option')];
    const exercise={id:`${id}.${position}`,kind:'multiple-choice',labelKey:key('EJERCICIO'),topicKey:key(`${number}.${position}`),questionKey:key(text(e.querySelector('h3'))),promptKey:key(text(e.querySelector('.exercise-prompt'))),optionKeys:options.map(el=>key(text(el))),answer:options.findIndex(el=>el.dataset.correct==='true'),successKey:key(e.dataset.success),errorKey:key(e.dataset.error)};
    lessons.push({id:String(position),topicId:id,position,total:topic.lessons.length,titleKey:key(text(d.querySelector('.lesson-heading-card h2'))),descriptionKey:key(text(d.querySelector('.lesson-heading-card p'))),icon:text(d.querySelector('.lesson-big-icon')),theory:[...d.querySelectorAll('.micro-theory-card')].map(el=>({symbol:text(el.querySelector('.micro-theory-kana')),titleKey:key(text(el.querySelector('h4'))),bodyKey:key(rich(el.querySelector('p')))})),ideaKey:key(rich(d.querySelector('.key-rule p'))),notes:[...d.querySelectorAll('.lesson-note')].map(el=>({...summary(el),icon:text(el.querySelector('.note-icon'))})),previousPath:route(d.querySelector('.lesson-back').getAttribute('href')),nextPath:route(e.querySelector('.continue-answer').getAttribute('href')),exercise});
  }
  {
  const d=doc(`tema${id}-practica.html`);
  const script=[...d.querySelectorAll('script')].map(el=>text(el)).find(s=>s.includes('PRACTICE_QUESTIONS'));
  const raw=JSON.parse(script.match(/PRACTICE_QUESTIONS\s*=\s*(\[[\s\S]*\]);/)[1]);
  const intro=d.querySelector('.practice-intro'), tip=d.querySelector('.practice-tip-card');
  practices.push({topicId:id,icon:text(intro.querySelector('.practice-intro-icon')),intro:summary(intro),stats:[...intro.querySelectorAll('.practice-intro-grid>div')].map(el=>({value:text(el.querySelector('span')),labelKey:key(text(el.querySelector('small')))})),philosophyKeys:[...intro.querySelectorAll('.practice-philosophy>div')].map(el=>key(text(el))),tip:summary(tip),resultEyebrowKey:key(text(d.querySelector('.practice-results .eyebrow'))),areas:[...d.querySelectorAll('.result-area')].map(el=>({symbol:text(el.querySelector('.result-area-icon')),titleKey:key(text(el.querySelector('strong'))),bodyKey:key(text(el.querySelector('p')))})),nextPath:route(d.querySelector('.results-actions a').getAttribute('href')),nextLabelKey:key(text(d.querySelector('.results-actions a'))),exercises:raw.map((q,i)=>({id:`practice-${id}-${i}`,kind:'multiple-choice',labelKey:key(q.type),topicKey:key(q.topic),questionKey:key(q.question),promptKey:key(q.prompt),optionKeys:q.options.map(key),answer:q.answer,successKey:key(q.feedback),errorKey:key(q.feedback)}))});
  }
}
const roadmap={subtitleKey:key(text(roadmapDoc.querySelector('.hero-title-row p'))),pillKeys:[...roadmapDoc.querySelectorAll('.pill')].map(el=>key(text(el))),panelKeys:[...roadmapDoc.querySelectorAll('.right-panel>.panel')].map(el=>key(rich(el)))};
const ui={title:'Gramática',subtitle:'Japonés paso a paso',home:'Inicio',roadmap:'ROADMAP',collapse:'Contraer menú',menu:'Menú',resources:'Recursos',settings:'Ajustes',topic:'TEMA {{number}}',continue:'Continuar',progress:'▥ Ver progreso',lab:'🧪 Laboratorio',learn:'QUÉ VAS A APRENDER',theory:'TEORÍA',theoryHeading:'Entiende la idea antes de practicar',idea:'Idea clave',exercise:'EJERCICIO',check:'Comprobar',next:'Continuar →',correct:'¡Correcto!',almost:'Casi',review:'Revisa esta idea',start:'Empezar práctica →',results:'Ver resultado →',completed:'Práctica completada',retry:'Repetir práctica',scorePerfect:'Perfecto. Has reconocido todos los conceptos del Tema 00 en esta ronda.',scoreGood:'Muy buen resultado. La base está asentada; conviene revisar los fallos antes de avanzar.',scoreBase:'Hay una base útil, pero aún conviene reforzar varios conceptos del Tema 00.',scoreLow:'Antes de avanzar, merece la pena volver a las microlecciones que más te hayan costado.'};
for(const [name,value]of Object.entries(ui))copy[`grammar.${name}`]=value;
copy['grammar.practice']='Práctica acumulativa';
completeGrammarCourse(topics, lessons, practices, copy);
fs.writeFileSync(`${output}/data/grammar-n5.generated.ts`,`// Extracted from prototype v8. Texts live in i18n; no runtime prototype dependency.\nimport { GrammarTopic, GrammarLesson, GrammarPractice, GrammarRoadmap } from '../models/grammar.model';\nexport const GRAMMAR_TOPICS: readonly GrammarTopic[] = ${JSON.stringify(topics,null,2)};\nexport const GRAMMAR_LESSONS: readonly GrammarLesson[] = ${JSON.stringify(lessons,null,2)};\nexport const GRAMMAR_PRACTICES: readonly GrammarPractice[] = ${JSON.stringify(practices,null,2)};\nexport const GRAMMAR_ROADMAP: GrammarRoadmap = ${JSON.stringify(roadmap,null,2)};\n`);
for(const lang of ['es','en','ca']){const p=`src/assets/i18n/${lang}.json`;const old=JSON.parse(fs.readFileSync(p,'utf8'));fs.writeFileSync(p,JSON.stringify({...old,...copy},null,2)+'\n');}

// Keep geometry/typography from v7, replacing its private palettes with application semantic tokens.
let css=fs.readFileSync(path.join(styles,'styles.css'),'utf8').split('/* ===== V7 · Exercise Lab')[0];
const tree=postcss.parse(css);
tree.walkRules(rule=>{
  if(rule.selector===':root'||rule.selector==='body'||rule.selector==='*'||rule.selector.startsWith('body.compact-sidebar')||/practice-placeholder|practice-card|practice-icon|placeholder-tags/.test(rule.selector)){rule.remove();return;}
  rule.selector=rule.selector.split(',').map(s=>`.grammar-shell ${s.trim()}`).join(',');
});
tree.walkDecls(decl=>{
  const tone=/green|correct|success/.test(decl.parent.selector??'')?'var(--success)':/red|wrong|error/.test(decl.parent.selector??'')?'var(--error)':/gold|orange/.test(decl.parent.selector??'')?'var(--warning)':'var(--accent)';
  const prop=decl.prop;
  decl.value=decl.value.replace(/#[\da-f]{3,8}\b|rgba?\([^)]*\)|\bwhite\b/gi,color=>{
    if(prop.includes('shadow'))return 'var(--primary-soft)';
    if(prop.includes('border'))return 'var(--border)';
    if(prop==='color')return /muted|copy| p\b|small|stats span|index/.test(decl.parent.selector??'')?'var(--text-secondary)':'var(--text-primary)';
    if(prop.startsWith('--')||prop==='background-color')return tone;
    if(prop==='background')return /stage-number|step\b|lesson-accent|progress-track div|snake|donut/.test(decl.parent.selector??'')?tone:'var(--surface)';
    return tone;
  });
});
fs.mkdirSync(`${output}/pages`,{recursive:true});
const parts=tree.toString().split(/\/\* ===== (?:Tema \/ Lesson static mockup|V5 · Microlecciones Tema 00|V6 · Práctica acumulativa Tema 00) ===== \*\//);
for(const [i,name]of ['roadmap','topic','lesson','practice'].entries())fs.writeFileSync(`${output}/pages/grammar-${name}.scss`,parts[i]+'\n');
console.log(`Extracted ${topics.length} topics, ${lessons.length} lessons, ${practices.reduce((s,p)=>s+p.exercises.length,0)} practice questions, ${Object.keys(copy).length} translations.`);
