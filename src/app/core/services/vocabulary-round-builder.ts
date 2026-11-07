import { VocabularyStudyUnit, VOCABULARY_QUESTION_TYPES } from '../models/vocabulary.model';
import { VocabularyStudyProgress } from '../models/vocabulary-study.model';
import { VocabularyLessonKind } from '../models/vocabulary-lesson.model';
import { getSpainDayKey } from './daily-learning.service';

interface Options {units:readonly VocabularyStudyUnit[];progress:Readonly<Record<string,VocabularyStudyProgress>>;now:Date;limit:number;knownEntryIds?:ReadonlySet<string>;random?:()=>number}
const compare=(a:string,b:string)=>a<b?-1:a>b?1:0;
export function buildVocabularyLesson(options:Options){
  const day=getSpainDayKey(options.now),size=options.limit===15?15:10;
  const units=[...new Map(options.units.map(u=>[u.key,u])).values()];
  const known=new Set([...Object.values(options.progress).map(p=>p.entryId),...(options.knownEntryIds??[])]);
  const due=units.filter(u=>options.progress[u.key]&&getSpainDayKey(new Date(options.progress[u.key].fsrs.due))<=day)
    .sort((a,b)=>Date.parse(options.progress[a.key].fsrs.due)-Date.parse(options.progress[b.key].fsrs.due)||compare(a.key,b.key));
  const unique=(values:readonly VocabularyStudyUnit[])=>{const seen=new Set<string>();return values.filter(u=>{if(seen.has(u.entryId))return false;seen.add(u.entryId);return true;});};
  const reviews=unique(due),reviewWords=new Set(reviews.map(u=>u.entryId));
  const ordered=[...units].sort((a,b)=>compare(a.entryId,b.entryId)||VOCABULARY_QUESTION_TYPES.indexOf(a.questionType)-VOCABULARY_QUESTION_TYPES.indexOf(b.questionType));
  const fresh=unique(ordered.filter(u=>!known.has(u.entryId)));
  const directions=unique(ordered.filter(u=>known.has(u.entryId)&&!reviewWords.has(u.entryId)&&!options.progress[u.key]));
  const chosenReviews=reviews.slice(0,size===15?10:7),chosenNew=fresh.slice(0,size===15?5:3);
  let supplemental:VocabularyStudyUnit[]=[];
  // Only fill unused places, or reserve one non-new place once genuinely new words are exhausted.
  if(!fresh.length&&directions.length)supplemental=directions.slice(0,1);
  while(chosenReviews.length+chosenNew.length+supplemental.length<size){
    if(chosenReviews.length<reviews.length)chosenReviews.push(reviews[chosenReviews.length]);
    else if(chosenNew.length<fresh.length)chosenNew.push(fresh[chosenNew.length]);
    else if(supplemental.length<Math.min(size===15?2:1,directions.length))supplemental.push(directions[supplemental.length]);
    else break;
  }
  const regular=[...chosenReviews,...supplemental],result:VocabularyStudyUnit[]=[],kinds:Record<string,VocabularyLessonKind>={};
  for(const u of chosenReviews)kinds[u.key]='review';for(const u of chosenNew)kinds[u.key]='new';for(const u of supplemental)kinds[u.key]='direction';
  const total=regular.length+chosenNew.length;let r=0,n=0;
  for(let i=0;i<total;i++)result.push(Math.floor((i+1)*chosenNew.length/total)>Math.floor(i*chosenNew.length/total)?chosenNew[n++]:regular[r++]);
  return{units:result,kinds};
}
export function buildVocabularyRound(options:Options):readonly VocabularyStudyUnit[]{return buildVocabularyLesson(options).units;}
