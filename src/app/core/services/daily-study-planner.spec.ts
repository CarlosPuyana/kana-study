import { DailyStudySnapshot } from '../models/daily-study.model';
import { getSpainDayKey } from './daily-learning.service';
import { nextSpainDayBoundary, planDailyStudy } from './daily-study-planner';

const now=Date.parse('2026-10-08T12:00:00Z');
const snapshot=():DailyStudySnapshot=>({workspace:'guest',now,day:getSpainDayKey(new Date(now)),normal:[],grammar:[],grammarContinuePath:null,weaknesses:[],decks:[],manga:{enabled:false,due:0,fresh:0,nextDue:null,eventsToday:0,completedSessionIds:[]},sessions:[]});
const normal=(module:'kana'|'kanji'|'vocabulary',due:number|null=null,completedToday=false)=>({module,completedToday,units:[{key:module,itemId:'item',questionType:'direction',due}]});
describe('pure daily study planning',()=>{
  it('is deterministic, does not mutate the snapshot and ignores card volume in ties',()=>{
    const input={...snapshot(),normal:[normal('vocabulary',now-1),normal('kanji',now-1),normal('kana',now-1)]};
    const copy=structuredClone(input),result=planDailyStudy(input,30);
    expect(planDailyStudy(input,30)).toEqual(result);expect(input).toEqual(copy);
    expect(result.recommended.map(a=>a.module)).toEqual(['kana','kanji','vocabulary']);
    const large={...input,normal:input.normal.map(m=>m.module==='vocabulary'?{...m,units:Array.from({length:1000},(_,i)=>({...m.units[0],key:String(i)}))}:m)};
    expect(planDailyStudy(large,5).recommended[0].module).toBe('kana');
  });
  it.each([[5,1],[15,3],[30,4]] as const)('uses %i minutes as an activity budget, without inventing times', (duration,count)=>{
    const input={...snapshot(),normal:[normal('kana'),normal('kanji'),normal('vocabulary')],decks:[{id:'deck',titleKey:'deck',due:1,fresh:0,completedToday:false,reviewsToday:0,nextDue:null}]};
    expect(planDailyStudy(input,duration).recommended).toHaveLength(count);
    expect(planDailyStudy(input,duration).recommended[0].module).toBe('anki');
  });
  it('distinguishes future, new and genuinely due units',()=>{
    const input={...snapshot(),normal:[normal('kana',now+1),normal('kanji',null),normal('vocabulary',now)]};
    const plan=planDailyStudy(input,30);expect(plan.recommended.map(a=>a.module)).toEqual(['vocabulary','kanji']);
    expect(plan.pending[0].state).toBe('pending');expect(plan.pending[0].panel).toBeUndefined();
  });
  it('offers no impossible tasks for empty active selections',()=>{
    const plan=planDailyStudy({...snapshot(),normal:[{module:'kana',completedToday:false,units:[]}]},30);
    expect(plan.recommended).toEqual([]);expect(plan.pending).toEqual([]);
  });
  it.each(['kana','kanji','vocabulary'] as const)('respects the %s normal daily lock and preserves voluntary practice',module=>{
    const plan=planDailyStudy({...snapshot(),normal:[normal(module,now-1,true)]},5);
    expect(plan.pending[0]).toMatchObject({state:'completed',pendingCount:1});expect(plan.pending[0].panel).toBeUndefined();
    expect(plan.recommended[0]).toMatchObject({id:`practice:${module}`,reasonKey:'daily.reason.voluntary',state:'available'});
  });
  it('preserves exact weakness identities and separates learn, writing and listening',()=>{
    const record={module:'vocabulary' as const,activity:'learn' as const,itemId:'a',questionType:'japanese-to-meaning',attempts:3,failures:3,score:6,consecutiveCorrect:0,lastAttemptAt:'2026-10-07T12:00:00Z'};
    const input={...snapshot(),weaknesses:[{record,titleKey:'vocabulary.title',path:'/weaknesses'},{record:{...record,itemId:'b'},titleKey:'vocabulary.title',path:'/weaknesses'},{record:{...record,activity:'writing' as const,questionType:undefined},titleKey:'vocabulary.title',path:'/vocabulary/writing?weak=1'},{record:{...record,activity:'listening' as const,questionType:undefined},titleKey:'vocabulary.title',path:'/vocabulary/listening?weak=1'}]};
    const tasks=planDailyStudy(input,30).recommended;expect(tasks).toHaveLength(3);
    const learn=tasks.find(t=>t.detail==='japanese-to-meaning')!;expect(learn.pendingCount).toBe(2);expect(learn.evidence).toEqual([JSON.stringify(['vocabulary','learn','a','japanese-to-meaning']),JSON.stringify(['vocabulary','learn','b','japanese-to-meaning'])]);
  });
  it('balances comparable weakness priorities before repeating a module',()=>{
    const record={module:'kana' as const,activity:'writing' as const,itemId:'a',attempts:2,failures:2,score:4,consecutiveCorrect:0,lastAttemptAt:'2026-10-07T12:00:00Z'};
    const input={...snapshot(),weaknesses:[{record,titleKey:'kana',path:'/writing'},{record:{...record,activity:'learn' as const,questionType:'romaji-to-kana'},titleKey:'kana',path:'/weaknesses'},{record:{...record,module:'kanji' as const},titleKey:'kanji',path:'/kanji/writing'}]};
    expect(planDailyStudy(input,15).recommended.map(t=>t.module)).toEqual(['kana','kanji','kana']);
  });
  it('chooses active Grammar difficulties before continuation without treating an opening as completion',()=>{
    const input={...snapshot(),grammarContinuePath:'/grammar/n5/01/b',grammar:[{id:'a',titleKey:'a',path:'/grammar/n5/01/a',completed:false,answersToday:0,difficult:true},{id:'b',titleKey:'b',path:'/grammar/n5/01/b',completed:false,answersToday:0,difficult:false}]};
    expect(planDailyStudy(input,5).recommended[0].id).toBe('grammar:a');expect(planDailyStudy(input,5).performed).toEqual([]);
    expect(planDailyStudy({...input,grammar:input.grammar.map(g=>({...g,difficult:false}))},5).recommended[0].id).toBe('grammar:b');
  });
  it('uses Anki daily completion and real reviews without claiming a review finishes a session',()=>{
    const deck={id:'deck',titleKey:'deck',due:1,fresh:2,completedToday:false,reviewsToday:3,nextDue:null};
    const plan=planDailyStudy({...snapshot(),decks:[deck]},5);expect(plan.recommended[0].path).toBe('/anki/deck/study');expect(plan.performed[0].completed).toBe(false);
    expect(planDailyStudy({...snapshot(),decks:[{...deck,completedToday:true,due:0,fresh:0}]},5).recommended).toEqual([]);
  });
  it('continues real Grammar integration before optional bridge lessons and revisits completed difficulties',()=>{
    const g={id:'bridge',titleKey:'bridge',path:'/grammar/n5/01/bridge',completed:false,answersToday:0,difficult:false,optional:true};
    expect(planDailyStudy({...snapshot(),grammar:[g],grammarContinuePath:'/grammar/n5/11/01'},5).recommended[0].path).toBe('/grammar/n5/11/01');
    expect(planDailyStudy({...snapshot(),grammar:[{...g,completed:true,difficult:true,path:'/grammar/review'}]},5).recommended[0].path).toBe('/grammar/review');
  });
  it('requires enabled eligible Manga work and separates V3 from completed FSRS sessions',()=>{
    const input=snapshot();expect(planDailyStudy({...input,manga:{...input.manga,due:10}},5).recommended).toEqual([]);
    expect(planDailyStudy({...input,manga:{...input.manga,enabled:true}},5).recommended).toEqual([]);
    expect(planDailyStudy({...input,manga:{...input.manga,enabled:true,due:1}},5).recommended[0]).toMatchObject({module:'manga',priority:0,path:'/manga/study/fsrs'});
  });
  it('deduplicates actual sessions by module/ID, rejects future/empty evidence, and never completes on navigation',()=>{
    const summary={sessionId:'same',module:'kana' as const,completedAt:new Date(now).toISOString(),exercisesCompleted:10,mode:'quick-practice' as const,firstTrySuccesses:10,attempts:10,needsPracticeCount:0,durationSeconds:60};
    const input={...snapshot(),sessions:[summary,summary,{...summary,sessionId:'future',completedAt:new Date(now+1).toISOString()},{...summary,sessionId:'empty',exercisesCompleted:0}]};
    expect(planDailyStudy(input,15).performed).toHaveLength(1);expect(planDailyStudy(snapshot(),15).performed).toEqual([]);
  });
  it('does not count V3 or partial Manga events as completed FSRS sessions',()=>{
    const summary={sessionId:'fsrs-session',module:'manga' as const,completedAt:new Date(now).toISOString(),exercisesCompleted:1,mode:'self-assessment' as const,firstTrySuccesses:1,attempts:1,needsPracticeCount:0,durationSeconds:7};
    expect(planDailyStudy({...snapshot(),sessions:[summary]},5).performed).toEqual([]);
    expect(planDailyStudy({...snapshot(),sessions:[{...summary,mangaSessionKind:'fsrs'}]},5).performed).toEqual([]);
    const input=snapshot();expect(planDailyStudy({...input,sessions:[{...summary,mangaSessionKind:'fsrs'}],manga:{...input.manga,completedSessionIds:['fsrs-session']}},5).performed[0].completed).toBe(true);
    expect(planDailyStudy({...input,manga:{...input.manga,enabled:true,eventsToday:1}},5).performed[0].completed).toBe(false);
  });
  it.each(['2026-01-15T22:59:59Z','2026-07-15T21:59:59Z','2026-03-28T23:00:00Z','2026-10-24T22:00:00Z'])('refreshes at the real Madrid boundary including DST from %s',iso=>{
    const time=Date.parse(iso),boundary=nextSpainDayBoundary(time);
    expect(getSpainDayKey(new Date(boundary-1))).toBe(getSpainDayKey(new Date(time)));
    expect(getSpainDayKey(new Date(boundary))).not.toBe(getSpainDayKey(new Date(time)));
  });
});
