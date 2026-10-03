import { grammarSessionMode } from './grammar-n5-stabilize.mjs';
import { lessonExercises, CATEGORY_MINIMUM, exerciseCategory } from './grammar-n5-expansion.mjs';
// Structural references and visible characters are checked; lexical validation is authored, not inferred.
export function auditGrammarCourse(lessons,practices,sessions,copy,topics=[],roadmap=null){
 const errors=[],known=new Set();
 const byId=id=>lessons.find(l=>`${l.topicId}.${l.id}`===id);
 const allExercises=[...lessons.flatMap(lessonExercises),...practices.flatMap(p=>p.exercises)];
 function unique(values,label){const seen=new Set();for(const id of values){if(!id||seen.has(id))errors.push(`${label}: duplicate or missing ID ${id}`);seen.add(id);}}
 unique(lessons.map(l=>`${l.topicId}.${l.id}`),'concept');unique(sessions.map(s=>s.id),'session');
 unique(topics.map(t=>t.id),'topic');unique(practices.map(p=>p.topicId),'practice');unique(allExercises.map(e=>e?.id),'exercise');
 const coverage=sessions.flatMap(s=>s.lessonIds.map(id=>`${s.topicId}.${id}`));unique(coverage,'session concept coverage');
 function references(value){
  if(Array.isArray(value)){value.forEach(references);return;}
  if(!value||typeof value!=='object')return;
  for(const [name,item]of Object.entries(value)){
   const keys=name.endsWith('Keys')?item:name.endsWith('Key')?[item]:[];
   for(const key of keys)if(typeof key!=='string'||!Object.hasOwn(copy,key)||typeof copy[key]!=='string')errors.push(`missing translation: ${key}`);
   references(item);
  }
 }
 references([topics,lessons,practices,sessions,roadmap]);
 const signatures=new Set();
 for(const e of allExercises){
  if(!e){errors.push('missing exercise');continue;}
  if(!byId(e.conceptId))errors.push(`${e.id}: invalid concept reference ${e.conceptId}`);
  if(!copy[e.successKey]?.trim()||!copy[e.errorKey]?.trim())errors.push(`${e.id}: missing feedback`);
  if(e.optionKeys&&new Set(e.optionKeys.map(k=>copy[k]?.trim())).size!==e.optionKeys.length)errors.push(`${e.id}: duplicate options`);
  if(e.acceptedAnswers&&new Set(e.acceptedAnswers.map(a=>a.normalize('NFKC').trim())).size!==e.acceptedAnswers.length)errors.push(`${e.id}: duplicate accepted answers`);
  if(e.editorialIntent){
   if(!Array.isArray(e.controlledVocabulary))errors.push(`${e.id}: missing controlled vocabulary metadata`);
   const signature=JSON.stringify([e.kind,copy[e.questionKey],copy[e.promptKey],e.optionKeys?.map(k=>copy[k]),e.tokenKeys?.map(k=>copy[k]),e.acceptedAnswers,e.pairs?.map(p=>[copy[p.leftKey],copy[p.rightKey]])]);
   if(signatures.has(signature))errors.push(`${e.id}: duplicate exercise`);signatures.add(signature);
   if(e.kind==='fill-gap'&&(!/en kana/.test(copy[e.questionKey])||!/solo/.test(copy[e.questionKey])||!copy[e.promptKey]?.includes('＿')))errors.push(`${e.id}: specific gap instruction required`);
   if(e.kind==='sentence-order'&&!e.acceptedOrders?.length&&!(e.orderPolicy==='constrained'&&/Empieza por/.test(copy[e.questionKey])))errors.push(`${e.id}: order alternatives or explicit constraint required`);
  }
  if(['multiple-choice','detect-error','select-segment'].includes(e.kind)){
   if(!e.optionKeys?.length||!Number.isInteger(e.answer)||e.answer<0||e.answer>=e.optionKeys.length)errors.push(`${e.id}: invalid answer reference`);
  }else if(['sentence-builder','sentence-order'].includes(e.kind)){
   for(const order of [e.solution,...e.acceptedOrders??[]])if(!e.tokenKeys?.length||!order?.length||order.length!==e.solution?.length||new Set(order).size!==order.length||order.some(i=>!Number.isInteger(i)||i<0||i>=e.tokenKeys.length))errors.push(`${e.id}: invalid block reference`);
  }else if(e.kind==='fill-gap'){
   if(!e.acceptedAnswers?.length||e.acceptedAnswers.some(a=>typeof a!=='string'||!a.trim()))errors.push(`${e.id}: invalid accepted answers`);
  }else if(e.kind==='matching'){
   if(!e.pairs?.length||e.rightOrder&&(e.rightOrder.length!==e.pairs.length||new Set(e.rightOrder).size!==e.pairs.length||e.rightOrder.some(i=>!Number.isInteger(i)||i<0||i>=e.pairs.length)))errors.push(`${e.id}: invalid matching references`);
  }else errors.push(`${e.id}: unknown exercise kind ${e.kind}`);
 }
 // Deliberately limited to exact authored examples and operation tags; this is not Japanese semantic analysis.
 const japanese=value=>(value??'').replace(/<[^>]*>/g,'').split(/\s*[—·]\s*/)[0].replace(/[^\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}ーっ]/gu,'');
 for(const l of lessons){
  const exercises=lessonExercises(l),id=`${l.topicId}.${l.id}`;
  if(l.exercisePlan&&(l.exercisePlan.category!==exerciseCategory(id)||l.exercisePlan.minimum!==CATEGORY_MINIMUM[exerciseCategory(id)]||exercises.length<l.exercisePlan.minimum))errors.push(`${id}: exercise density below assigned minimum or incorrect category`);
  const intents=(l.additionalExercises??[]).map(e=>e.editorialIntent);
  if(new Set(intents).size!==intents.length||intents.some(i=>!i))errors.push(`${id}: repeated or missing editorial operation; review trivial substitutions`);
  const examples=l.theory.filter(b=>/Ejemplo/.test(copy[b.titleKey]??'')).map(b=>japanese(copy[b.bodyKey])).filter(s=>s.length>=6);
  for(const e of l.additionalExercises??[]){
   const candidates=[copy[e.promptKey],copy[e.contextKey],...e.optionKeys?.map(k=>copy[k])??[]];
   if(e.tokenKeys)candidates.push(e.solution.map(i=>copy[e.tokenKeys[i]]).join(''));
   if(e.kind==='fill-gap')candidates.push(copy[e.promptKey]?.replace('＿',e.acceptedAnswers[0]));
   if(candidates.some(s=>examples.includes(japanese(s))))errors.push(`${e.id}: exact theory example reused`);
  }
 }
 function text(value){
  if(Array.isArray(value))return value.flatMap(text);
  if(value&&typeof value==='object')return Object.entries(value).flatMap(([name,item])=>{
   if(name==='prerequisites'||name==='controlledVocabulary')return [];
   if(name.endsWith('Key'))return [copy[item]??''];
   if(name.endsWith('Keys'))return Array.isArray(item)?item.map(k=>copy[k]??''):[];
   if(name==='symbol'||name==='text'||name==='reading'||name==='acceptedAnswers'||name==='kanaBank')return Array.isArray(item)?item:[item];
   return text(item);
  });
  return [];
 }
 function check(unit,policy,id){
  if(!policy||!Array.isArray(policy.allowedKanji)){errors.push(`${id}: missing language metadata`);return;}
  const exceptions=policy.inlineExplanations??[];
  for(const e of exceptions)if(!e.term||!e.reading||!copy[e.meaningKey])errors.push(`${id}: incomplete inline explanation`);
  for(const fragment of text(unit)){
   let visible=fragment.replace(/<[^>]*>/g,'');
   for(const e of exceptions)visible=visible.replaceAll(e.term,'');
   for(const c of new Set(visible.match(/\p{Script=Han}/gu)??[]))if(!policy.allowedKanji.includes(c))errors.push(`${id}: undeclared kanji ${c} in ${visible.slice(0,120)}`);
  }
  for(const exercise of unit.exercise?lessonExercises(unit):[unit])
   for(const word of exercise.controlledVocabulary??[])if(!policy.intendedVocabulary.includes(word)&&!exceptions.some(e=>e.term===word))errors.push(`${id}: controlled vocabulary not allowed: ${word}`);
 }
 const topicPolicies=new Map();
 for(const session of sessions){
  const grouped=session.lessonIds.map(id=>byId(`${session.topicId}.${id}`));
  if(grouped.some(l=>!l)){errors.push(`${session.id}: missing microconcept`);continue;}
  if(session.learningMode!==grammarSessionMode(grouped.flatMap(lessonExercises)))errors.push(`${session.id}: inconsistent learning mode`);
  if(session.learningMode==='recognition'&&!copy[session.recognitionReasonKey])errors.push(`${session.id}: recognition reason required`);
  if(!['production','manipulation','recognition'].includes(session.learningMode))errors.push(`${session.id}: learning mode required`);
  for(const l of grouped){
   const id=`${l.topicId}.${l.id}`,policy=l.prerequisites;
   if(!policy){errors.push(`${id}: missing language metadata`);continue;}
   for(const c of policy.introducedKanji??[])known.add(c);
   for(const c of policy.allowedKanji)if(!known.has(c))errors.push(`${id}: kanji allowed before introduction: ${c}`);
   for(const c of policy.introducedKanji??[])if(!policy.allowedKanji.includes(c)||!l.kanjiExamples?.some(e=>e.segments.some(s=>s.text.includes(c)&&s.reading)))errors.push(`${id}: introduced kanji lacks a reading example: ${c}`);
   check(l,policy,id);topicPolicies.set(l.topicId,policy);
  }
 }
 if(new Set(sessions.flatMap(s=>s.lessonIds.map(id=>`${s.topicId}.${id}`))).size!==lessons.length)errors.push('Session coverage differs from concept count');
 for(const topic of topics){
  const scope=topicPolicies.get(topic.id),exceptions=lessons.filter(l=>l.topicId===topic.id).flatMap(l=>l.prerequisites?.inlineExplanations??[]);
  check(topic,{...scope,inlineExplanations:exceptions},`topic-${topic.id}`);
 }
 for(const p of practices){
  const scope=topicPolicies.get(p.topicId);
  const {exercises,...intro}=p;check(intro,scope,`practice-${p.topicId}-intro`);
  for(const e of exercises){
  const concept=byId(e.conceptId),scope=topicPolicies.get(p.topicId);
  if(concept&&concept.topicId!==p.topicId)errors.push(`${e.id}: concept belongs to another topic`);
  check(e,{...scope,intendedVocabulary:concept?.prerequisites.intendedVocabulary??[],inlineExplanations:concept?.prerequisites.inlineExplanations??[]},e.id);
 }}
 if(errors.length)throw new Error(`Grammar language audit failed:\n${[...new Set(errors)].join('\n')}`);
 return {concepts:lessons.length,conceptExercises:lessons.flatMap(lessonExercises).length,sessions:sessions.length,activeSessions:sessions.filter(s=>s.lessonIds.some(id=>lessonExercises(byId(`${s.topicId}.${id}`)).some(e=>e.kind!=='multiple-choice'))).length,modes:Object.fromEntries(['recognition','manipulation','production'].map(mode=>[mode,sessions.filter(s=>s.learningMode===mode).length])),kanji:[...known]};
}
