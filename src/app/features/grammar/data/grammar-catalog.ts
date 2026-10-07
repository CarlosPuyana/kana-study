// Incremental runtime adapter. The legacy source remains canonical for Topics 02–10.
import * as legacy from './grammar-n5.generated';
import {GRAMMAR_V2_CONCEPTS, GRAMMAR_V2_REVIEW} from '../../../data/grammar/grammar-n5-v2.generated';
import {GrammarLesson, GrammarPractice, GrammarStudySession, GrammarTopic} from '../models/grammar.model';
export {GRAMMAR_ROADMAP} from './grammar-n5.generated';
export const grammarConceptId=(lesson: Pick<GrammarLesson,'id'|'topicId'|'concept'>):string=>lesson.concept?.id??`${lesson.topicId}.${lesson.id}`;
export const grammarSessionConceptId=(topicId:string,id:string):string=>topicId==='01'?id:`${topicId}.${id}`;
const K=(id:string)=>`grammar.v2.${id}`;
const prerequisites={requiredKana:[],intendedVocabulary:['学生（がくせい）','先生（せんせい）','元気（げんき）','静か（しずか）','誰（だれ）','私（わたし）','本（ほん）','日本（にほん）','日本語（にほんご）','車（くるま）','田中（たなか）','山田（やまだ）'],allowedKanji:[]};
const lessons:GrammarLesson[]=GRAMMAR_V2_CONCEPTS.map((concept,i)=>({
  concept,id:concept.id,topicId:concept.topicId,titleKey:concept.titleKey,descriptionKey:concept.goalKey,
  icon:String(i+1),position:i+1,total:GRAMMAR_V2_CONCEPTS.length,theory:[],ideaKey:concept.lesson.ideaKey,notes:[],prerequisites,
  previousPath:i?`/grammar/n5/01/${GRAMMAR_V2_CONCEPTS[i-1].id}`:'/grammar/n5/01',
  nextPath:i+1<GRAMMAR_V2_CONCEPTS.length?`/grammar/n5/01/${GRAMMAR_V2_CONCEPTS[i+1].id}`:'/grammar/n5/01/practice',
  exercise:concept.exercises[0],additionalExercises:concept.exercises.slice(1),
}));
export const GRAMMAR_LESSONS:readonly GrammarLesson[]=[...lessons,...legacy.GRAMMAR_LESSONS.filter(l=>Number(l.topicId)>=2)];
export const GRAMMAR_SESSIONS:readonly GrammarStudySession[]=[...lessons.map((l,i)=>({id:`01-${l.id}`,topicId:'01',position:i+1,titleKey:l.titleKey,lessonIds:[l.id],learningMode:'production' as const,prerequisites})),...legacy.GRAMMAR_SESSIONS.filter(s=>Number(s.topicId)>=2)];
export const GRAMMAR_TOPICS:readonly GrammarTopic[]=legacy.GRAMMAR_TOPICS.map(topic=>topic.id==='00'?{
  ...topic,titleKey:K('before'),descriptionKey:K('prerequisite'),lessons:[],metaKeys:[],journey:null,
  stage:{...topic.stage,bulletKeys:[K('prerequisite')]},
}:topic.id==='01'?{
  ...topic,icon:'だ',titleKey:K('topic'),descriptionKey:K('topicGoal'),metaKeys:[],
  goal:{eyebrowKey:K('goal'),titleKey:K('topic'),bodyKey:K('topicGoal')},visualKey:K('topicGoal'),
  lessons:lessons.map(l=>({id:l.id,titleKey:l.titleKey,bodyKey:l.descriptionKey,icon:l.icon,color:'cyan',examplesKey:l.ideaKey,path:`/grammar/n5/01/${l.id}`})),
  end:{eyebrowKey:K('practice'),titleKey:K('review'),bodyKey:K('reviewBody')},
  journey:{eyebrowKey:K('practice'),titleKey:K('review'),bodyKey:K('reviewBody'),links:[{labelKey:K('review'),path:'/grammar/n5/01/practice'}]},
  stage:{...topic.stage,icon:'だ',bulletKeys:[K('topicGoal')]},
}:topic);
export const GRAMMAR_PRACTICES:readonly GrammarPractice[]=[{
  topicId:'01',icon:'🎯',intro:{eyebrowKey:K('practice'),titleKey:K('review'),bodyKey:K('reviewBody')},
  stats:[{value:String(GRAMMAR_V2_REVIEW.length),labelKey:'grammar.exercise'}],philosophyKeys:[],
  tip:{eyebrowKey:K('idea'),titleKey:K('reviewTip'),bodyKey:K('reviewHelp')},resultEyebrowKey:K('review'),areas:[],nextPath:'/grammar/n5/02',nextLabelKey:K('nextTopic'),exercises:GRAMMAR_V2_REVIEW,
},...legacy.GRAMMAR_PRACTICES.filter(p=>Number(p.topicId)>=2)];
