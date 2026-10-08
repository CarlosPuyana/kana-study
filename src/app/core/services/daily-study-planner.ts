import { DailyStudyActivity, DailyStudyDuration, DailyStudyModule, DailyStudyPlan, DailyStudySnapshot } from '../models/daily-study.model';
import { getSpainDayKey } from './daily-learning.service';

const moduleOrder:readonly DailyStudyModule[]=['kana','kanji','vocabulary','anki','manga','grammar'];
export function isStudyToday(value:string,now:number,day:string):boolean {
  const instant=Date.parse(value);
  return Number.isFinite(instant)&&instant<=now&&getSpainDayKey(new Date(instant))===day;
}
/** Finds the actual next Madrid day boundary, including DST, without assuming 24-hour days. */
export function nextSpainDayBoundary(now:number):number {
  const day=getSpainDayKey(new Date(now));let low=now,high=now+27*60*60*1000;
  while(high-low>1){const middle=Math.floor((low+high)/2);if(getSpainDayKey(new Date(middle))===day)low=middle;else high=middle;}
  return high;
}
/** Pure projection. Counts never affect cross-module priority; IDs break all ties. */
export function planDailyStudy(snapshot:DailyStudySnapshot,duration:DailyStudyDuration):DailyStudyPlan {
  const candidates:DailyStudyActivity[]=[];
  const performed:DailyStudyPlan['performed'][number][]=[];
  const sessions=[...new Map(snapshot.sessions.filter(s=>typeof s.sessionId==='string'&&s.sessionId&&s.exercisesCompleted>0&&isStudyToday(s.completedAt,snapshot.now,snapshot.day))
    .map(s=>[`${s.module??'kana'}:${s.sessionId}`,s])).values()];
  for(const session of sessions){const module=session.module??'kana';
    if(module==='flags'||module==='manga'&&(session.mangaSessionKind!=='fsrs'||!snapshot.manga.completedSessionIds.includes(session.sessionId)))continue;
    performed.push({id:`session:${module}:${session.sessionId}`,module,titleKey:module==='manga'?'manga.fsrs.title':`daily.module.${module}`,count:session.exercisesCompleted,completed:true});
  }
  for(const normal of snapshot.normal){
    if(!normal.units.length)continue;
    const due=normal.units.filter(u=>u.due!==null&&Number.isFinite(u.due)&&u.due<=snapshot.now).length;
    const fresh=normal.units.filter(u=>u.due===null).length;
    candidates.push({id:`normal:${normal.module}`,module:normal.module,titleKey:`daily.module.${normal.module}`,reasonKey:normal.completedToday?'daily.reason.locked':due?'daily.reason.due':fresh?'daily.reason.new':'daily.reason.future',priority:due?0:3,
      pendingCount:due+fresh,state:normal.completedToday?'completed':due+fresh?'available':'pending',...(!normal.completedToday&&due+fresh?{panel:normal.module}:{})});
    // Existing voluntary practice remains accessible independently of the daily learning lock.
    if(normal.completedToday)candidates.push({id:`practice:${normal.module}`,module:normal.module,titleKey:`daily.module.${normal.module}`,reasonKey:'daily.reason.voluntary',priority:4,state:'available',pendingCount:0,path:normal.module==='kana'?'/writing':`/${normal.module}/writing`});
  }
  for(const weak of snapshot.weaknesses){const record=weak.record,id=JSON.stringify([record.module,record.activity,record.itemId,record.questionType??null]);
    const groupId=`weak:${JSON.stringify([record.module,record.activity,record.questionType??null])}`;
    const previous=candidates.find(c=>c.id===groupId);
    if(record.score>=3){
      if(previous){const index=candidates.indexOf(previous);candidates[index]={...previous,pendingCount:previous.pendingCount+1,evidence:[...previous.evidence??[],id]};}
      else candidates.push({id:groupId,module:record.module,titleKey:weak.titleKey,detail:record.activity==='learn'?record.questionType:record.activity,reasonKey:'daily.reason.weak',priority:1,state:'available',pendingCount:1,path:weak.path,evidence:[id]});
    }
    if(isStudyToday(record.lastAttemptAt,snapshot.now,snapshot.day))performed.push({id:`attempt:${id}`,module:record.module,titleKey:weak.titleKey,count:1,completed:false});
  }
  const grammar=snapshot.grammar.filter(g=>!g.completed||g.difficult).sort((a,b)=>Number(b.difficult)-Number(a.difficult)||Number(!!a.optional)-Number(!!b.optional)||Number(b.path===snapshot.grammarContinuePath)-Number(a.path===snapshot.grammarContinuePath)||a.id.localeCompare(b.id));
  const integration=snapshot.grammarContinuePath?.startsWith('/grammar/n5/11/');
  if(grammar[0]&&(!integration||!grammar[0].optional||grammar[0].difficult)){const g=grammar[0];candidates.push({id:`grammar:${g.id}`,module:'grammar',titleKey:g.titleKey,reasonKey:g.difficult?'daily.reason.grammarDifficulty':'daily.reason.grammar',priority:2,state:'available',pendingCount:grammar.length,path:g.path});}
  else if(snapshot.grammarContinuePath?.startsWith('/grammar/n5/11/'))candidates.push({id:'grammar:integration',module:'grammar',titleKey:'grammar.title',reasonKey:'daily.reason.grammar',priority:2,state:'available',pendingCount:1,path:snapshot.grammarContinuePath});
  for(const g of snapshot.grammar)if(g.answersToday||g.completedAt&&isStudyToday(g.completedAt,snapshot.now,snapshot.day))performed.push({id:`grammar:${g.id}`,module:'grammar',titleKey:g.titleKey,count:g.answersToday,completed:!!g.completedAt&&isStudyToday(g.completedAt,snapshot.now,snapshot.day)});
  for(const deck of snapshot.decks){const work=deck.due+deck.fresh;
    candidates.push({id:`deck:${deck.id}`,module:'anki',titleKey:deck.titleKey,reasonKey:deck.completedToday?'daily.reason.locked':deck.due?'daily.reason.due':deck.fresh?'daily.reason.new':'daily.reason.future',priority:deck.due?0:4,state:deck.completedToday?'completed':work?'available':'pending',pendingCount:work,...(!deck.completedToday&&work?{path:`/anki/${encodeURIComponent(deck.id)}/study`}:{})});
    if(deck.reviewsToday||deck.completedToday)performed.push({id:`deck:${deck.id}`,module:'anki',titleKey:deck.titleKey,count:deck.reviewsToday,completed:deck.completedToday});
  }
  if(snapshot.manga.enabled){const manga=snapshot.manga,work=manga.due+manga.fresh;
    if(work||manga.nextDue!==null)candidates.push({id:'manga:fsrs',module:'manga',titleKey:'manga.fsrs.title',reasonKey:manga.due?'daily.reason.due':manga.fresh?'daily.reason.new':'daily.reason.future',priority:manga.due?0:4,state:work?'available':'pending',pendingCount:work,...(work?{path:'/manga/study/fsrs'}:{})});
    if(manga.eventsToday&&!performed.some(p=>p.module==='manga'))performed.push({id:'manga:attempts',module:'manga',titleKey:'manga.fsrs.title',count:manga.eventsToday,completed:false});
  }
  const sorted=[...new Map(candidates.map(c=>[c.id,c])).values()].sort((a,b)=>a.priority-b.priority||moduleOrder.indexOf(a.module)-moduleOrder.indexOf(b.module)||a.id.localeCompare(b.id));
  const available=sorted.filter(c=>c.state==='available'),recommended:DailyStudyActivity[]=[];
  const limit=duration===5?1:duration===15?3:4;
  for(const priority of [...new Set(available.map(c=>c.priority))]){
    const tier=available.filter(c=>c.priority===priority);
    // One activity per module on the first pass through comparable priorities.
    const first=tier.filter((c,i)=>tier.findIndex(other=>other.module===c.module)===i);
    for(const c of [...first,...tier.filter(c=>!first.includes(c))])if(recommended.length<limit)recommended.push(c);
  }
  return {recommended,available:available.filter(c=>!recommended.includes(c)),pending:sorted.filter(c=>c.state!=='available'),performed:[...new Map(performed.map(p=>[p.id,p])).values()]};
}
