// Incremental runtime adapter. The legacy source remains canonical for Topics 03–10.
import * as legacy from './grammar-n5.generated';
import {GRAMMAR_V2_CONCEPTS, GRAMMAR_V2_REVIEW} from '../../../data/grammar/grammar-n5-v2.generated';
import {GrammarLesson, GrammarPractice, GrammarStudySession, GrammarTopic} from '../models/grammar.model';
export {GRAMMAR_ROADMAP} from './grammar-n5.generated';
export const grammarConceptId=(lesson: Pick<GrammarLesson,'id'|'topicId'|'concept'>):string=>lesson.concept?.id??`${lesson.topicId}.${lesson.id}`;
export const grammarSessionConceptId=(topicId:string,id:string):string=>GRAMMAR_V2_CONCEPTS.some(c=>c.topicId===topicId&&c.id===id)?id:`${topicId}.${id}`;
const K=(id:string)=>`grammar.v2.${id}`;
const prerequisites={requiredKana:[],intendedVocabulary:['学生（がくせい）','先生（せんせい）','元気（げんき）','静か（しずか）','誰（だれ）','私（わたし）','本（ほん）','日本（にほん）','日本語（にほんご）','車（くるま）','田中（たなか）','山田（やまだ）'],allowedKanji:[]};
const topic02Prerequisites={requiredKana:[],intendedVocabulary:['静か（しずか）','元気（げんき）','高い（たかい）','面白い（おもしろい）','かわいい','きれい','嫌い（きらい）','大きい（おおきい）','新しい（あたらしい）','おいしい','家（いえ）','本（ほん）','食べ物（たべもの）','町（まち）','部屋（へや）','人（ひと）','昨日（きのう）','好き（すき）','上手（じょうず）','下手（へた）','魚（さかな）','料理（りょうり）','私（わたし）','田中（たなか）'],allowedKanji:[]};
const lessons:GrammarLesson[]=GRAMMAR_V2_CONCEPTS.map(concept=>{
  const siblings=GRAMMAR_V2_CONCEPTS.filter(c=>c.topicId===concept.topicId),i=concept.order-1,base=`/grammar/n5/${concept.topicId}`;
  return {
  concept,id:concept.id,topicId:concept.topicId,titleKey:concept.titleKey,descriptionKey:concept.goalKey,
  icon:String(i+1),position:i+1,total:siblings.length,theory:[],ideaKey:concept.lesson.ideaKey,notes:[],prerequisites:concept.topicId==='02'?topic02Prerequisites:prerequisites,
  previousPath:i?`${base}/${siblings[i-1].id}`:base,
  nextPath:i+1<siblings.length?`${base}/${siblings[i+1].id}`:`${base}/practice`,
  exercise:concept.exercises[0],additionalExercises:concept.exercises.slice(1),
};});
export const GRAMMAR_LESSONS:readonly GrammarLesson[]=[...lessons,...legacy.GRAMMAR_LESSONS.filter(l=>Number(l.topicId)>=3)];
export const GRAMMAR_SESSIONS:readonly GrammarStudySession[]=[...lessons.map(l=>({id:`${l.topicId}-${l.id}`,topicId:l.topicId,position:l.position,titleKey:l.titleKey,lessonIds:[l.id],learningMode:'production' as const,prerequisites:l.prerequisites})),...legacy.GRAMMAR_SESSIONS.filter(s=>Number(s.topicId)>=3)];
const topicCopy=(id:string)=>id==='02'?{title:K('topic02'),goal:K('topic02Goal'),review:K('review02'),body:K('review02Body'),icon:'な'}:{title:K('topic'),goal:K('topicGoal'),review:K('review'),body:K('reviewBody'),icon:'だ'};
export const GRAMMAR_TOPICS:readonly GrammarTopic[]=legacy.GRAMMAR_TOPICS.map(topic=>topic.id==='00'?{
  ...topic,titleKey:K('before'),descriptionKey:K('prerequisite'),lessons:[],metaKeys:[],journey:null,
  stage:{...topic.stage,bulletKeys:[K('prerequisite')]},
}:topic.id==='01'||topic.id==='02'?{
  ...topic,icon:topicCopy(topic.id).icon,titleKey:topicCopy(topic.id).title,descriptionKey:topicCopy(topic.id).goal,metaKeys:[],
  goal:{eyebrowKey:K('goal'),titleKey:topicCopy(topic.id).title,bodyKey:topicCopy(topic.id).goal},visualKey:topicCopy(topic.id).goal,
  lessons:lessons.filter(l=>l.topicId===topic.id).map(l=>({id:l.id,titleKey:l.titleKey,bodyKey:l.descriptionKey,icon:l.icon,color:'cyan',examplesKey:l.ideaKey,path:`/grammar/n5/${topic.id}/${l.id}`})),
  end:{eyebrowKey:K('practice'),titleKey:topicCopy(topic.id).review,bodyKey:topicCopy(topic.id).body},
  journey:{eyebrowKey:K('practice'),titleKey:topicCopy(topic.id).review,bodyKey:topicCopy(topic.id).body,links:[{labelKey:topicCopy(topic.id).review,path:`/grammar/n5/${topic.id}/practice`}]},
  stage:{...topic.stage,icon:topicCopy(topic.id).icon,bulletKeys:[topicCopy(topic.id).goal]},
}:topic);
export const GRAMMAR_PRACTICES:readonly GrammarPractice[]=[...['01','02'].map(topicId=>({
  topicId,icon:'🎯',intro:{eyebrowKey:K('practice'),titleKey:topicCopy(topicId).review,bodyKey:topicCopy(topicId).body},
  stats:[{value:String(GRAMMAR_V2_REVIEW.filter(e=>e.topicId===topicId).length),labelKey:'grammar.exercise'}],philosophyKeys:[],
  tip:{eyebrowKey:K('idea'),titleKey:K('reviewTip'),bodyKey:K('reviewHelp')},resultEyebrowKey:topicCopy(topicId).review,areas:[],nextPath:topicId==='01'?'/grammar/n5/02':'/grammar/n5/03',nextLabelKey:K(topicId==='01'?'nextTopic':'nextTopic03'),exercises:GRAMMAR_V2_REVIEW.filter(e=>e.topicId===topicId),
})),...legacy.GRAMMAR_PRACTICES.filter(p=>Number(p.topicId)>=3)];
