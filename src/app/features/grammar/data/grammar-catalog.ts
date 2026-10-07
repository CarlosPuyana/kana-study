// Incremental runtime adapter. The legacy source remains canonical for Topics 08–10.
import * as legacy from './grammar-n5.generated';
import {GRAMMAR_V2_CONCEPTS, GRAMMAR_V2_REVIEW} from '../../../data/grammar/grammar-n5-v2.generated';
import {GrammarLesson, GrammarPractice, GrammarStudySession, GrammarTopic} from '../models/grammar.model';
export {GRAMMAR_ROADMAP} from './grammar-n5.generated';
export const grammarConceptId=(lesson: Pick<GrammarLesson,'id'|'topicId'|'concept'>):string=>lesson.concept?.id??`${lesson.topicId}.${lesson.id}`;
export const grammarSessionConceptId=(topicId:string,id:string):string=>GRAMMAR_V2_CONCEPTS.some(c=>c.topicId===topicId&&c.id===id)?id:`${topicId}.${id}`;
const K=(id:string)=>`grammar.v2.${id}`;
const prerequisites={requiredKana:[],intendedVocabulary:['学生（がくせい）','先生（せんせい）','元気（げんき）','静か（しずか）','誰（だれ）','私（わたし）','本（ほん）','日本（にほん）','日本語（にほんご）','車（くるま）','田中（たなか）','山田（やまだ）'],allowedKanji:[]};
const topic02Prerequisites={requiredKana:[],intendedVocabulary:['静か（しずか）','元気（げんき）','高い（たかい）','面白い（おもしろい）','かわいい','きれい','嫌い（きらい）','大きい（おおきい）','新しい（あたらしい）','おいしい','家（いえ）','本（ほん）','食べ物（たべもの）','町（まち）','部屋（へや）','人（ひと）','昨日（きのう）','好き（すき）','上手（じょうず）','下手（へた）','魚（さかな）','料理（りょうり）','私（わたし）','田中（たなか）'],allowedKanji:[]};
const topic03Prerequisites={requiredKana:[],intendedVocabulary:['行く（いく）','読む（よむ）','毎日（まいにち）','明日（あした）','昨日（きのう）','食べる（たべる）','見る（みる）','起きる（おきる）','寝る（ねる）','帰る（かえる）','買う（かう）','書く（かく）','泳ぐ（およぐ）','話す（はなす）','待つ（まつ）','死ぬ（しぬ）','遊ぶ（あそぶ）','飲む（のむ）','する','来る（くる）','勉強する（べんきょうする）','運動する（うんどうする）','電話する（でんわする）','早い（はやい）','歩く（あるく）','静か（しずか）','人（ひと）','私（わたし）','田中（たなか）'],allowedKanji:[]};
const topic04Prerequisites={requiredKana:[],intendedVocabulary:['本（ほん）','パン','ドア','電気（でんき）','開く（あく）','開ける（あける）','学校（がっこう）','図書館（としょかん）','家（いえ）','日本（にほん）','友達（ともだち）','姉（あね）','猫（ねこ）','机（つくえ）','時間（じかん）','今日（きょう）','明日（あした）','毎日（まいにち）','月曜日（げつようび）','七時（しちじ）','五月三日（ごがつみっか）','一人（ひとり）','二人（ふたり）','一本（いっぽん）'],allowedKanji:[]};
const topic05Prerequisites={requiredKana:[],intendedVocabulary:['食べる（たべる）','見る（みる）','起きる（おきる）','買う（かう）','書く（かく）','泳ぐ（およぐ）','話す（はなす）','待つ（まつ）','死ぬ（しぬ）','遊ぶ（あそぶ）','飲む（のむ）','帰る（かえる）','来る（くる）','学生（がくせい）','静か（しずか）','高い（たかい）','映画（えいが）','友達（ともだち）','学校（がっこう）','面白い（おもしろい）','天気（てんき）','休み（やすみ）','時間（じかん）','昨日（きのう）','明日（あした）'],allowedKanji:[]};
const topic06Prerequisites={requiredKana:[],intendedVocabulary:['買う（かう）','読む（よむ）','本（ほん）','漫画（まんが）','町（まち）','静か（しずか）','日本語（にほんご）','歩く（あるく）','勉強する（べんきょうする）','大変（たいへん）','電車（でんしゃ）','遅い（おそい）','高い（たかい）','学生（がくせい）','行く（いく）','言う（いう）','思う（おもう）','友達（ともだち）','田中（たなか）','昨日（きのう）','毎日（まいにち）','明日（あした）'],allowedKanji:[]};
const topic07Prerequisites={requiredKana:[],intendedVocabulary:['聞く（きく）','急ぐ（いそぐ）','消す（けす）','住む（すむ）','結婚する（けっこんする）','知る（しる）','座る（すわる）','撮る（とる）','入る（はいる）','朝ご飯（あさごはん）','音楽（おんがく）','写真（しゃしん）','名前（なまえ）','水（みず）','大阪（おおさか）',...topic03Prerequisites.intendedVocabulary],allowedKanji:[]};
const lessons:GrammarLesson[]=GRAMMAR_V2_CONCEPTS.map(concept=>{
  const siblings=GRAMMAR_V2_CONCEPTS.filter(c=>c.topicId===concept.topicId),i=concept.order-1,base=`/grammar/n5/${concept.topicId}`;
  return {
  concept,id:concept.id,topicId:concept.topicId,titleKey:concept.titleKey,descriptionKey:concept.goalKey,
  icon:String(i+1),position:i+1,total:siblings.length,theory:[],ideaKey:concept.lesson.ideaKey,notes:[],prerequisites:concept.topicId==='07'?topic07Prerequisites:concept.topicId==='06'?topic06Prerequisites:concept.topicId==='05'?topic05Prerequisites:concept.topicId==='04'?topic04Prerequisites:concept.topicId==='03'?topic03Prerequisites:concept.topicId==='02'?topic02Prerequisites:prerequisites,
  previousPath:i?`${base}/${siblings[i-1].id}`:base,
  nextPath:i+1<siblings.length?`${base}/${siblings[i+1].id}`:`${base}/practice`,
  exercise:concept.exercises[0],additionalExercises:concept.exercises.slice(1),
};});
export const GRAMMAR_LESSONS:readonly GrammarLesson[]=[...lessons,...legacy.GRAMMAR_LESSONS.filter(l=>Number(l.topicId)>=8)];
export const GRAMMAR_SESSIONS:readonly GrammarStudySession[]=[...lessons.map(l=>({id:`${l.topicId}-${l.id}`,topicId:l.topicId,position:l.position,titleKey:l.titleKey,lessonIds:[l.id],learningMode:'production' as const,prerequisites:l.prerequisites})),...legacy.GRAMMAR_SESSIONS.filter(s=>Number(s.topicId)>=8)];
const topicCopy=(id:string)=>id==='07'?{title:K('topic07'),goal:K('topic07Goal'),review:K('review07'),body:K('review07Body'),icon:'て'}:id==='06'?{title:K('topic06'),goal:K('topic06Goal'),review:K('review06'),body:K('review06Body'),icon:'の'}:id==='05'?{title:K('topic05'),goal:K('topic05Goal'),review:K('review05'),body:K('review05Body'),icon:'です'}:id==='04'?{title:K('topic04'),goal:K('topic04Goal'),review:K('review04'),body:K('review04Body'),icon:'に'}:id==='03'?{title:K('topic03'),goal:K('topic03Goal'),review:K('review03'),body:K('review03Body'),icon:'行く'}:id==='02'?{title:K('topic02'),goal:K('topic02Goal'),review:K('review02'),body:K('review02Body'),icon:'な'}:{title:K('topic'),goal:K('topicGoal'),review:K('review'),body:K('reviewBody'),icon:'だ'};
export const GRAMMAR_TOPICS:readonly GrammarTopic[]=legacy.GRAMMAR_TOPICS.map(topic=>topic.id==='00'?{
  ...topic,titleKey:K('before'),descriptionKey:K('prerequisite'),lessons:[],metaKeys:[],journey:null,
  stage:{...topic.stage,bulletKeys:[K('prerequisite')]},
}:topic.id==='01'||topic.id==='02'||topic.id==='03'||topic.id==='04'||topic.id==='05'||topic.id==='06'||topic.id==='07'?{
  ...topic,icon:topicCopy(topic.id).icon,titleKey:topicCopy(topic.id).title,descriptionKey:topicCopy(topic.id).goal,metaKeys:[],
  goal:{eyebrowKey:K('goal'),titleKey:topicCopy(topic.id).title,bodyKey:topicCopy(topic.id).goal},visualKey:topicCopy(topic.id).goal,
  lessons:lessons.filter(l=>l.topicId===topic.id).map(l=>({id:l.id,titleKey:l.titleKey,bodyKey:l.descriptionKey,icon:l.icon,color:'cyan',examplesKey:l.ideaKey,path:`/grammar/n5/${topic.id}/${l.id}`})),
  end:{eyebrowKey:K('practice'),titleKey:topicCopy(topic.id).review,bodyKey:topicCopy(topic.id).body},
  journey:{eyebrowKey:K('practice'),titleKey:topicCopy(topic.id).review,bodyKey:topicCopy(topic.id).body,links:[{labelKey:topicCopy(topic.id).review,path:`/grammar/n5/${topic.id}/practice`}]},
  stage:{...topic.stage,icon:topicCopy(topic.id).icon,bulletKeys:[topicCopy(topic.id).goal]},
}:topic);
export const GRAMMAR_PRACTICES:readonly GrammarPractice[]=[...['01','02','03','04','05','06','07'].map(topicId=>({
  topicId,icon:'🎯',intro:{eyebrowKey:K('practice'),titleKey:topicCopy(topicId).review,bodyKey:topicCopy(topicId).body},
  stats:[{value:String(GRAMMAR_V2_REVIEW.filter(e=>e.topicId===topicId).length),labelKey:'grammar.exercise'}],philosophyKeys:[],
  tip:{eyebrowKey:K('idea'),titleKey:K('reviewTip'),bodyKey:K('reviewHelp')},resultEyebrowKey:topicCopy(topicId).review,areas:[],nextPath:topicId==='01'?'/grammar/n5/02':topicId==='02'?'/grammar/n5/03':topicId==='03'?'/grammar/n5/04':topicId==='04'?'/grammar/n5/05':topicId==='05'?'/grammar/n5/06':topicId==='06'?'/grammar/n5/07':'/grammar/n5/08',nextLabelKey:K(topicId==='01'?'nextTopic':topicId==='02'?'nextTopic03':topicId==='03'?'nextTopic04':topicId==='04'?'nextTopic05':topicId==='05'?'nextTopic06':topicId==='06'?'nextTopic07':'nextTopic08'),exercises:GRAMMAR_V2_REVIEW.filter(e=>e.topicId===topicId),
})),...legacy.GRAMMAR_PRACTICES.filter(p=>Number(p.topicId)>=8)];
