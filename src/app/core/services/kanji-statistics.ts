import {AttemptEvent,validAttemptEvent} from '../models/attempt-event.model';
import {CompletedSessionSummary} from '../models/learning-session.model';
import {KANJI_QUESTION_TYPES,KanjiQuestionType} from '../models/kanji.model';
import {KanjiReviewEvent,KanjiStudyProgress} from '../models/kanji-study.model';
import {KANJI_N5} from '../../data/kanji-n5.generated';
import {addAttempt,emptyMetrics,historicalAccumulator,madridDay,madridMidnight,shiftDay} from './attempt-analytics';

const ids=new Set(KANJI_N5.map(k=>k.id));
const key=(id:string,type:KanjiQuestionType)=>`kanji:${id}:${type}`;
const counts=()=>({new:0,learning:0,review:0});
const ratings=()=>({reviews:0,again:0,hard:0,good:0});
type Ratings=ReturnType<typeof ratings>;
const validTime=(at:string,now:Date)=>Number.isFinite(Date.parse(at))&&Date.parse(at)<=now.getTime();

/** Whole catalog, independent of the saved selection. Both directions must be in review. */
export function kanjiCatalogOverview(progress:Readonly<Record<string,KanjiStudyProgress>>){
  const total=counts();
  const directions=KANJI_QUESTION_TYPES.map(type=>({type,...counts()}));
  for(const id of ids){
    const states=KANJI_QUESTION_TYPES.map((type,index)=>{
      const state=progress[key(id,type)]?.fsrs.state??'new';
      const category=state==='new'?'new':state==='review'?'review':'learning';
      directions[index][category]++;
      return category;
    });
    total[states.every(s=>s==='new')?'new':states.every(s=>s==='review')?'review':'learning']++;
  }
  return {total:ids.size,...total,directions};
}

/** Recorded completed normal rounds only. Unknown legacy durations stay unknown. */
export function kanjiSessionActivity(history:readonly CompletedSessionSummary[],count:7|30|90,now:Date){
  const today=madridDay(now),from=shiftDay(today,1-count);
  const sessions=[...new Map(history.filter(s=>s.module==='kanji'&&typeof s.sessionId==='string'&&s.sessionId
    &&validTime(s.completedAt,now)&&madridDay(new Date(s.completedAt))>=from
    &&Number.isInteger(s.exercisesCompleted)&&s.exercisesCompleted>0
    &&['quick-practice','self-assessment'].includes(s.mode)).map(s=>[s.sessionId,s])).values()]
    .sort((a,b)=>Date.parse(b.completedAt)-Date.parse(a.completedAt)||a.sessionId.localeCompare(b.sessionId));
  const duration=(s:CompletedSessionSummary)=>typeof s.durationSeconds==='number'&&Number.isFinite(s.durationSeconds)&&s.durationSeconds>=0?s.durationSeconds:null;
  const measured=sessions.filter(s=>duration(s)!==null);
  return {sessions:sessions.length,today:sessions.filter(s=>madridDay(new Date(s.completedAt))===today).length,
    measured:measured.length,seconds:measured.length?measured.reduce((n,s)=>n+duration(s)!,0):null,
    recent:sessions.slice(0,5).map(s=>({...s,seconds:duration(s)}))};
}

/** Review ratings are authoritative; objective accuracy requires a matching detailed attempt. */
export function kanjiHistoryAccumulator(events:readonly KanjiReviewEvent[],count:7|30|90,now:Date){
  const from=madridMidnight(shiftDay(madridDay(now),1-count));
  const measured=historicalAccumulator(count,now),total=ratings();
  const directions=KANJI_QUESTION_TYPES.map(type=>({type,...ratings(),measured:emptyMetrics()}));
  const days=Array.from({length:count},(_,n)=>({day:shiftDay(madridDay(now),n+1-count),...ratings()}));
  const daily=new Map(days.map(d=>[d.day,d]));
  const items=new Map<string,Ratings>(),normal=new Map<string,KanjiReviewEvent>(),seen=new Set<string>();
  const signature=(session:string,id:string,type:string,at:string)=>JSON.stringify([session,id,type,Date.parse(at)]);
  for(const e of events){
    if(seen.has(e.id)||!ids.has(e.kanjiId)||!KANJI_QUESTION_TYPES.includes(e.questionType)
      ||e.key!==key(e.kanjiId,e.questionType)||!validTime(e.reviewedAt,now)||Date.parse(e.reviewedAt)<Date.parse(from))continue;
    seen.add(e.id);
    normal.set(signature(e.sessionId,e.kanjiId,e.questionType,e.reviewedAt),e);
    const item=items.get(e.kanjiId)??ratings();items.set(e.kanjiId,item);
    for(const group of [total,directions.find(d=>d.type===e.questionType)!,item,daily.get(madridDay(new Date(e.reviewedAt)))!]){group.reviews++;group[e.rating]++;}
  }
  const accepted=new Set<string>();
  return {from,to:now.toISOString(),accept(e:AttemptEvent){
    if(!validAttemptEvent(e)||e.module!=='kanji'||e.activity!=='learn'||e.firstAttempt!==true||!e.sessionId||!e.questionType)return;
    const match=signature(e.sessionId,e.itemId,e.questionType,e.occurredAt),review=normal.get(match);
    if(!review||accepted.has(match)||e.result.source==='objective'&&(e.result.correct?'good':'again')!==review.rating
      ||e.result.source==='self'&&e.result.rating!==review.rating)return;
    accepted.add(match);measured.accept(e);addAttempt(directions.find(d=>d.type===e.questionType)!.measured,e);
  },finish(){
    const history=measured.finish();
    return {total,directions,ratingsByDay:days,days:history.days,measured:history.total,unclassified:total.reviews-history.total.attempts,
      difficult:[...items].filter(([,r])=>r.reviews>=3&&r.again+r.hard>0)
        .sort(([a,x],[b,y])=>(y.again+y.hard)/y.reviews-(x.again+x.hard)/x.reviews||y.again-x.again||y.reviews-x.reviews||a.localeCompare(b))
        .slice(0,5).map(([id,r])=>({kanji:KANJI_N5.find(k=>k.id===id)!,...r}))};
  }};
}
