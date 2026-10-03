// Canonical generation: foundation + course -> authored audit/stabilization -> validation -> generated/i18n.
// Usage: npm run generate:grammar, then npm run audit:grammar and the generation tests.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { N5_COURSE, N5_PRACTICE } from './grammar-n5-course.mjs';
import { applyGrammarAudit, GRAMMAR_UI_TRANSLATIONS } from './grammar-n5-audit.mjs';
import { stabilizeGrammarCourse } from './grammar-n5-stabilize.mjs';
import { auditGrammarCourse } from './grammar-language-audit.mjs';
import { expandGrammarExercises } from './grammar-n5-expansion.mjs';
import { compileTranslations } from './compile-i18n.mjs';

export function completeGrammarCourse(topics, lessons, practices, copy) {
  const key = (name, value) => {const id=`grammar.n5.${name}`;copy[id]=value;return id;};
  const summary = (base, eyebrow, title, body) => ({eyebrowKey:key(`${base}.eyebrow`,eyebrow),titleKey:key(`${base}.title`,title),bodyKey:key(`${base}.body`,body)});
  const exercise = (base, authored, topicId, id) => ({
    id,kind:'multiple-choice',labelKey:key('exercise','EJERCICIO'),topicKey:key(`topic.${topicId}`,`Tema ${topicId}`),
    questionKey:key(`${base}.question`,authored.question),promptKey:key(`${base}.prompt`,authored.prompt),
    optionKeys:authored.options.map((v,i)=>key(`${base}.option.${i}`,v)),answer:authored.answer,
    successKey:key(`${base}.success`,authored.feedback),errorKey:key(`${base}.error`, `Revisa la relación entre la forma y el significado. ${authored.feedback}`),
  });
  lessons.splice(0,lessons.length,...lessons.filter(l=>Number(l.topicId)<2));
  practices.splice(0,practices.length,...practices.filter(p=>Number(p.topicId)<2));
  // The nominal topic already has real exercises; remove its obsolete prototype notice.
  topics.find(t=>t.id==='01').goal.bodyKey=key('01.overview.goal','Construye tus primeras frases, comprueba cada idea en las microlecciones y combina lo aprendido en la práctica acumulativa.');
  for(const topic of topics.filter(t=>Number(t.id)>=2)) {
    const id=topic.id, authored=N5_COURSE[id], route=`/grammar/n5/${id}`;
    if(!authored?.length || !N5_PRACTICE[id]?.length) throw new Error(`Missing content for ${id}`);
    const originalCards=topic.lessons;
    topic.lessons=authored.map((item,index)=>{
      const position=index+1, base=`${id}.${position}`, original=originalCards[index]??originalCards[0];
      const titleKey=key(`${base}.title`,item.title), descriptionKey=key(`${base}.goal`,item.goal);
      lessons.push({id:String(position),topicId:id,position,total:authored.length,titleKey,descriptionKey,icon:original.icon,
        theory:[{symbol:'文',titleKey:key('rule','Cómo funciona'),bodyKey:key(`${base}.rule`,item.rule)},
          ...item.examples.map((value,i)=>({symbol:String(i+1),titleKey:key(`example.${i}`,`Ejemplo ${i+1}`),bodyKey:key(`${base}.example.${i}`,value)}))],
        ideaKey:key(`${base}.idea`,item.idea),notes:[],previousPath:position===1?route:`${route}/${position-1}`,
        nextPath:position===authored.length?`${route}/practice`:`${route}/${position+1}`,
        exercise:exercise(`${base}.exercise`,item.exercise,id,`${id}.${position}`),
      });
      return {...original,id:`${Number(id)}.${position}`,titleKey,bodyKey:descriptionKey,examplesKey:key(`${base}.preview`,item.examples[0]),path:`${route}/${position}`};
    });
    topic.metaKeys=[key(`${id}.count`,`${authored.length} microlecciones`),key('practice.available','Teoría · ejercicios · práctica acumulativa')];
    topic.goal.bodyKey=key(`${id}.overview.goal`, `Aprende los conceptos en orden, comprueba cada idea con un ejercicio y combínalos en el repaso del tema.`);
    topic.visualKey=key(`${id}.overview.visual`,`<div class="script-pill">TEMA ${id}</div><div class="arrow-mini">→</div><div class="script-pill">Comprender</div>`);
    topic.journey={...summary(`${id}.journey`,'DE LA IDEA A LA PRÁCTICA','Aprende paso a paso','Empieza por la primera microlección o mezcla los conceptos en la práctica acumulativa.'),links:[
      {labelKey:key('start.lesson','Empezar microlecciones →'),path:`${route}/1`},
      {labelKey:key('start.practice','Práctica acumulativa →'),path:`${route}/practice`},
    ]};
    const questions=N5_PRACTICE[id];
    practices.push({topicId:id,icon:topic.icon,intro:summary(`${id}.practice`,'PRÁCTICA ACUMULATIVA',`Repaso del Tema ${id}`,'Mezcla lo aprendido con ejemplos nuevos. Lee la frase completa antes de elegir; el feedback explica cada respuesta.'),
      stats:[{value:String(questions.length),labelKey:key('questions','preguntas')},{value:'N5',labelKey:key('level','nivel')},{value:'✓',labelKey:key('feedback','feedback inmediato')}],
      philosophyKeys:[key('practice.mix','Conceptos mezclados'),key('practice.context','Ejemplos nuevos en contexto'),key('practice.memory','Resultado de esta ronda, sin guardar progreso')],
      tip:summary('practice.tip','IDEA CLAVE','Lee antes de elegir','Comprueba qué pide la consigna, qué significa la frase y cómo se enlazan sus partes.'),
      resultEyebrowKey:key('practice.result','RESULTADO DE LA PRÁCTICA'),
      areas:[{symbol:'文',titleKey:topic.titleKey,bodyKey:key('practice.review','El feedback de cada pregunta ayuda a decidir qué idea revisar antes de continuar.')}],
      nextPath:id==='10'?'/grammar':`/grammar/n5/${String(Number(id)+1).padStart(2,'0')}`,nextLabelKey:key(`${id}.next`,id==='10'?'Volver al ROADMAP →':`Continuar al Tema ${String(Number(id)+1).padStart(2,'0')} →`),
      exercises:questions.map((item,i)=>exercise(`${id}.practice.${i}`,item,id,`practice-${id}-${i}`)),
    });
  }
  copy['grammar.scorePerfect']='Perfecto. Has reconocido todos los conceptos del Tema {{number}} en esta ronda.';
  copy['grammar.scoreBase']='Hay una base útil, pero aún conviene reforzar varios conceptos del Tema {{number}}.';
  copy['settings.themeNoraDark']='Nora 😈';copy['settings.themeAnime']='Anime 🌸';
  const sessions=stabilizeGrammarCourse(topics,lessons,practices,applyGrammarAudit(topics,lessons,practices,copy),copy);
  expandGrammarExercises(lessons,sessions,copy);
  copy['grammar.exerciseStep']='Ejercicio {{current}} de {{total}}';
  auditGrammarCourse(lessons,practices,sessions,copy,topics);
  return sessions;
}

// Remove only obsolete generated Grammar copy. All authored sources and live concept content remain intact.
export function pruneGrammarTranslations(dictionary,course) {
  const used=new Set();
  function visit(value){
    if(typeof value==='string')used.add(value);
    else if(Array.isArray(value))value.forEach(visit);
    else if(value&&typeof value==='object')Object.values(value).forEach(visit);
  }
  visit(course);
  for(const key of Object.keys(dictionary))if(/^grammar\.(content|n5|audit|stable|expansion)\./.test(key)&&!used.has(key))delete dictionary[key];
  return dictionary;
}

if(process.argv[1] && fileURLToPath(import.meta.url)===fs.realpathSync(process.argv[1])) {
  const target='src/app/features/grammar/data/grammar-n5.generated.ts';
  const {topics,lessons,practices,roadmap,copy}=JSON.parse(fs.readFileSync('scripts/grammar-n5-foundation.json','utf8'));
  const sessions=completeGrammarCourse(topics,lessons,practices,copy);
  let result="// Generated from grammar-n5-foundation.json, grammar-n5-course.mjs and grammar-n5-audit.mjs.\n// Run node scripts/complete-grammar-n5.mjs. Do not edit this file directly.\nimport { GrammarTopic, GrammarLesson, GrammarPractice, GrammarRoadmap, GrammarStudySession } from '../models/grammar.model';\n";
  for(const [name,type,value]of [['GRAMMAR_TOPICS','readonly GrammarTopic[]',topics],['GRAMMAR_LESSONS','readonly GrammarLesson[]',lessons],['GRAMMAR_PRACTICES','readonly GrammarPractice[]',practices],['GRAMMAR_ROADMAP','GrammarRoadmap',roadmap],['GRAMMAR_SESSIONS','readonly GrammarStudySession[]',sessions]])
    result+=`export const ${name}: ${type} = ${JSON.stringify(value,null,2)};\n`;
  fs.writeFileSync(target,result);
  for(const lang of ['es','en','ca']){const p=`src/assets/i18n/${lang}.json`;const dictionary=pruneGrammarTranslations({...JSON.parse(fs.readFileSync(p,'utf8')),...copy,...GRAMMAR_UI_TRANSLATIONS[lang]},[topics,lessons,practices,roadmap,sessions]);fs.writeFileSync(p,JSON.stringify(dictionary,null,2)+'\n');}
  compileTranslations();
  console.log(`${lessons.length} microconceptos, ${sessions.length} sesiones, ${practices.reduce((n,p)=>n+p.exercises.length,0)} preguntas de práctica.`);
}
