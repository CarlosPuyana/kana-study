import { MangaSavedSyncService } from './manga-saved-sync.service';
import { MangaStudySavedRepository } from './manga-study-saved.repository';
import { TestBed } from '@angular/core/testing';
import { SyncService } from './sync.service';
import { SyncOutboxService, makeOutboxItem } from './sync-outbox.service';
import { StorageService } from './storage.service';
import { WorkspaceService } from './workspace.service';
import { SupabaseClientService } from './supabase-client.service';
import { DeviceService } from './device.service';
import { DeckDatabaseService } from './deck-database.service';
import { LocalRushRepository } from './rush-repository.service';
import { SessionHistoryService } from './session-history.service';
import { GrammarV2ProgressService } from './grammar-v2-progress.service';
import { GRAMMAR_V2_CONCEPTS } from '../../data/grammar/grammar-n5-v2.generated';
import { GRAMMAR_PROGRESS_V2_KEY } from '../models/grammar-v2.model';
import { SyncOutboxItem } from '../models/account.model';
import { IDBFactory } from 'fake-indexeddb';
import { GRAMMAR_V2_INTEGRATION } from '../../data/grammar/grammar-n5-v2.generated';
import { ProfileStatsService } from './profile-stats.service';
import { CardStudyTimer } from './card-study-time';

/** Two independent browser caches against one simulated Supabase account. */
describe('account sync reconciliation regressions', () => {
  let cloud: Record<string, any[]>;
  let queued: Map<string, SyncOutboxItem>;
  let fail: string | null;
  let onRead: ((table: string) => Promise<void>) | null;
  let writes: string[];
  let meta: any;
  const keys: Record<string, string[]> = {
    study_progress: ['user_id','module','unit_key'], user_preferences: ['user_id','preference_key'],
    deck_card_progress: ['user_id','deck_id','entry_id'], deck_daily_state: ['user_id','deck_id','local_day'],
    deck_settings: ['user_id','deck_id'], rush_coverage: ['user_id','module','content_id'],
    medal_unlocks: ['user_id','medal_id'],
  };
  const client = { from: (table: string) => {
    const filters: [string, unknown][] = []; let start = 0, end = 999; let deleting = false;
    const query: any = {
      select: () => query, eq: (key: string, value: unknown) => {filters.push([key,value]); return query;},
      gte: () => query, order: () => query, range: (a: number,b: number) => {start=a;end=b;return query;},
      delete: () => {deleting=true; return query;},
      maybeSingle: async () => {await onRead?.(table); return {data:(cloud[table]??[]).find(row=>filters.every(([k,v])=>row[k]===v))??null,error:fail===table?new Error('network'):null};},
      then: (resolve: any, reject: any) => (async () => {
        await onRead?.(table);
        const rows=(cloud[table]??[]).filter(row=>filters.every(([k,v])=>row[k]===v));
        if(deleting && fail!==table)cloud[table]=(cloud[table]??[]).filter(row=>!rows.includes(row));
        return {data: structuredClone(rows.slice(start,end+1)),error:fail===table||(deleting&&fail==='delete:'+table)?new Error('network'):null};
      })().then(resolve,reject),
      upsert: async (rows: any[]) => {
        if(fail===table)return {error:new Error('network')};
        writes.push(table);cloud[table]??=[];
        for(const row of rows){const pk=keys[table]??['id'];const index=cloud[table].findIndex(old=>pk.every(k=>old[k]===row[k]));
          const saved=structuredClone({...row,updated_at:'2026-10-08T12:00:00Z'});if(index<0)cloud[table].push(saved);else cloud[table][index]=saved;}
        return {error:null};
      },
    };return query;
  }};
  function device(user='same-account', realDatabases=false) {
    TestBed.resetTestingModule(); localStorage.clear();queued=new Map();meta=null;
    TestBed.configureTestingModule({providers:[{provide:MangaSavedSyncService,useValue:{prepare:async()=>{},push:async()=>{},pull:async()=>{}}},{provide:MangaStudySavedRepository,useValue:{pending:async()=>[]}},
      {provide:SupabaseClientService,useValue:{config:{configured:true},getClient:async()=>client}},
      {provide:DeviceService,useValue:{id:'simulated-device'}},
      {provide:SyncOutboxService,useValue:{markLegacyGuestMapped:async()=>{},
        enqueue:async(item:SyncOutboxItem)=>{queued.set(item.id,item);},
        pending:async(workspace:string)=>[...queued.values()].filter(i=>i.workspace===workspace),
        count:async(workspace:string)=>[...queued.values()].filter(i=>i.workspace===workspace).length,
        getMeta:async()=>meta,putMeta:async(value:any)=>{meta=value;},
        removeProcessed:async(items:SyncOutboxItem[])=>{for(const i of items)if(queued.get(i.id)?.revision===i.revision)queued.delete(i.id);},
        markAttempt:async()=>{},
      }},
      ...(realDatabases?[]:[
        {provide:DeckDatabaseService,useValue:{getDeckProgress:async()=>[],getDeckReviewEvents:async()=>[],getAllDailyStates:async()=>[],mergeFromCloud:async()=>{}}},
        {provide:LocalRushRepository,useValue:{getStats:async()=>({sessions:[],coverage:[]}),mergeFromCloud:async()=>{}}},
      ]),
    ]});
    TestBed.inject(WorkspaceService).activateUser(user);
    return {sync:TestBed.inject(SyncService),storage:TestBed.inject(StorageService),workspace:TestBed.inject(WorkspaceService),grammar:TestBed.inject(GrammarV2ProgressService)};
  }
  beforeEach(()=>{vi.useFakeTimers();cloud={};fail=null;onRead=null;writes=[];vi.spyOn(navigator,'onLine','get').mockReturnValue(true);});
  afterEach(()=>{TestBed.resetTestingModule();vi.restoreAllMocks();vi.unstubAllGlobals();vi.useRealTimers();});
  it('A/B: another device hydrates Grammar V2 and updates the existing UI signal without reload',async()=>{
    let d=device();const c=GRAMMAR_V2_CONCEPTS[0];d.grammar.open(c.id);d.grammar.record(c.id,c.exercises[0].id,0,true);
    expect(await d.sync.syncNow()).toBe(true);
    d=device();expect(d.grammar.started()).toBe(false);expect(await d.sync.syncNow()).toBe(true);TestBed.tick();
    expect(d.grammar.state().concepts[c.id].answers[c.exercises[0].id].solved).toBe(true);
    const remote=cloud['user_preferences'].find(r=>r.preference_key===GRAMMAR_PROGRESS_V2_KEY).payload;
    remote.concepts[c.id].answers[c.exercises[1].id]={correct:true,solved:true,attempts:1,correctCount:1,answeredAt:'2026-10-08T13:00:00Z'};
    expect(await d.sync.syncNow()).toBe(true);TestBed.tick();expect(d.grammar.state().concepts[c.id].answers[c.exercises[1].id].solved).toBe(true);
  });
  it('C: different answers from the same baseline are unioned and repeated sync is idempotent',async()=>{
    let d=device();const c=GRAMMAR_V2_CONCEPTS[0];d.grammar.open(c.id);const baseline=d.grammar.state();
    d.grammar.record(c.id,c.exercises[0].id,0,true);expect(await d.sync.syncNow()).toBe(true);
    d=device();d.storage.setFromCloud(GRAMMAR_PROGRESS_V2_KEY,baseline);TestBed.tick();d.grammar.record(c.id,c.exercises[1].id,1,true);
    expect(await d.sync.syncNow()).toBe(true);TestBed.tick();expect(Object.keys(d.grammar.state().concepts[c.id].answers)).toHaveLength(2);
    expect(await d.sync.syncNow()).toBe(true);TestBed.tick();expect(d.grammar.state().concepts[c.id].attempts).toBe(2);
  });
  it('D: offline progress remains pending and is uploaded after reconnect',async()=>{
    const d=device();vi.spyOn(navigator,'onLine','get').mockReturnValue(false);d.grammar.open(GRAMMAR_V2_CONCEPTS[0].id);
    expect(await d.sync.syncNow()).toBe(false);expect(queued.size).toBeGreaterThan(0);
    vi.spyOn(navigator,'onLine','get').mockReturnValue(true);expect(await d.sync.syncNow()).toBe(true);expect(queued.size).toBe(0);
  });
  it('E: boot does not requeue confirmed stale settings or overwrite newer FSRS',async()=>{
    const d=device();const key='kana-study.settings.v1';d.storage.setFromCloud(key,{language:'es'});
    cloud['user_preferences']=[{user_id:'same-account',preference_key:key,payload:{language:'ca'},updated_at:'2026-10-01T00:00:00Z'}];
    expect(await d.sync.syncNow()).toBe(true);expect(d.storage.get(key,null)).toEqual({language:'ca'});expect(writes).not.toContain('user_preferences');
    const newer={key:'a',lastSeenAt:'2026-10-08T13:00:00Z',state:'review'};
    cloud['study_progress']=[{user_id:'same-account',module:'kana',unit_key:'a',card_json:newer}];
    d.storage.set('kana-study.study-progress.v2',{a:{...newer,lastSeenAt:'2026-10-07T12:00:00Z',state:'learning'}});
    expect(await d.sync.syncNow()).toBe(true);expect(cloud['study_progress'][0].card_json).toEqual(newer);
  });
  it('F: concurrent callers wait for the same run; a new write during pull remains pending and local',async()=>{
    const d=device();const key='kana-study.settings.v1';cloud['user_preferences']=[{user_id:'same-account',preference_key:key,payload:{language:'es'}}];
    let release!:()=>void,entered!:()=>void;const started=new Promise<void>(r=>entered=r),gate=new Promise<void>(r=>release=r);
    onRead=async(table)=>{if(table==='user_preferences'){entered();await gate;}};
    const first=d.sync.syncNow();await started;d.storage.set(key,{language:'ca'});d.sync.schedule();const second=d.sync.syncNow();release();
    expect(await first).toBe(false);expect(await second).toBe(false);expect(d.storage.get(key,null)).toEqual({language:'ca'});
    expect(d.sync.status()).toBe('pending');expect(d.sync.pendingCount()).toBe(1);expect(d.sync.lastSyncedAt()).toBeNull();
  });
  it('G: a late pull from the previous account never hydrates the next account',async()=>{
    const d=device('alice');cloud['user_preferences']=[{user_id:'alice',preference_key:'kana-study.settings.v1',payload:{language:'ca'}}];
    let release!:()=>void,entered!:()=>void;const started=new Promise<void>(r=>entered=r),gate=new Promise<void>(r=>release=r);
    onRead=async(table)=>{if(table==='user_preferences'){entered();await gate;}};
    const run=d.sync.syncNow();await started;d.workspace.activateUser('bob');release();expect(await run).toBe(false);
    expect(d.storage.get('kana-study.settings.v1',null)).toBeNull();expect(d.sync.lastSyncedAt()).toBeNull();
  });
  it('H: a remote settings read failure is visible and preserves the outbox',async()=>{
    const d=device();d.storage.set('kana-study.settings.v1',{language:'ca'});fail='user_preferences';
    expect(await d.sync.syncNow()).toBe(false);expect(d.sync.status()).toBe('error');expect(queued.size).toBe(1);expect(writes).toEqual([]);
  });
  it('reads all pages even with an old client-clock cursor far in the future',async()=>{
    const d=device();meta={lastPulledAt:'2099-01-01T00:00:00Z'};
    cloud['review_events']=Array.from({length:1101},(_,i)=>({user_id:'same-account',module:'kana',id:String(i),payload:{id:String(i)}}));
    expect(await d.sync.syncNow()).toBe(true);expect(d.storage.get<any[]>('kana-study.review-events.v1',[])).toHaveLength(1101);
  });
  it('I: stale queued deck/RUSH snapshots cannot regress newer cloud state or daily coverage',async()=>{
    const d=device();const queue=(type:any,key:string,payload:any)=>{const item=makeOutboxItem('user:same-account',type,key,payload)!;queued.set(item.id,item);};
    const progress={deckId:'d',entryId:'a',card:{lastReview:200,state:2},due:300,state:2};
    cloud['deck_card_progress']=[{user_id:'same-account',deck_id:'d',entry_id:'a',card_json:progress}];
    cloud['deck_daily_state']=[{user_id:'same-account',deck_id:'d',local_day:'2026-10-08',introduced_entry_ids:['b']}];
    cloud['rush_sessions']=[{id:'s',user_id:'same-account',module:'kana',started_at:'2026-10-08T12:00:00Z',ended_at:'2026-10-08T12:10:00Z',active_seconds:50,cards_completed:4}];
    queue('deck-card-progress','d:a',{...progress,card:{lastReview:100,state:1}});
    queue('deck-daily-state','d:2026-10-08',{deckId:'d',localDate:'2026-10-08',introducedEntryIds:['a'],newLimitOverride:null});
    queue('rush-session','s',{id:'s',module:'kana',startedAt:Date.parse('2026-10-08T12:00:00Z'),endedAt:null,activeSeconds:10,cardsCompleted:1});
    expect(await d.sync.syncNow()).toBe(true);expect(cloud['deck_card_progress'][0].card_json.card.lastReview).toBe(200);
    expect(cloud['deck_daily_state'][0].introduced_entry_ids.sort()).toEqual(['a','b']);
    expect(cloud['rush_sessions'][0].active_seconds).toBe(50);expect(cloud['rush_sessions'][0].cards_completed).toBe(4);
  });
  it('I/J: Grammar completion/integration, decks and RUSH travel through sync to a new browser and survive reload without duplicate time',async()=>{
    // fake-indexeddb uses real task callbacks, independently of scheduling timers.
    vi.useFakeTimers({toFake:['setTimeout','clearTimeout']});vi.stubGlobal('indexedDB',new IDBFactory());let d=device('same-account',true);
    const c=GRAMMAR_V2_CONCEPTS[0];d.grammar.open(c.id);c.exercises.forEach((e,i)=>d.grammar.record(c.id,e.id,i,true));
    const activity=GRAMMAR_V2_INTEGRATION.find(s=>s.track==='core')!;d.grammar.openIntegration('00');d.grammar.openIntegration(activity.id);d.grammar.recordIntegration(activity.id,activity.exercises[0].id,true);
    const progress={deckId:'d',entryId:'a',due:200,state:2,card:{lastReview:100,due:200,state:2}} as any;
    await TestBed.inject(DeckDatabaseService).commitReview(progress,{id:'e',deckId:'d',entryId:'a',reviewedAt:100} as any,{deckId:'d',localDate:'2026-10-08',introducedEntryIds:['a'],newLimitOverride:null});
    const session={id:'s',module:'kana',startedAt:100,endedAt:200,activeSeconds:50,cardsCompleted:4,uniqueContentsSeen:4,cyclesCompleted:1,initialUnitCount:4,localDay:'2026-10-08',interrupted:false};
    await TestBed.inject(LocalRushRepository).saveProgress(session as any,'a');
    expect(await d.sync.syncNow()).toBe(true);
    TestBed.resetTestingModule();vi.stubGlobal('indexedDB',new IDBFactory());d=device('same-account',true);expect(await d.sync.syncNow()).toBe(true);TestBed.tick();
    expect(d.grammar.state().concepts[c.id].status).toBe('completed');expect(d.grammar.state().integration?.activities[activity.id].answers[activity.exercises[0].id].solved).toBe(true);
    expect((await TestBed.inject(DeckDatabaseService).getProgress('d','a'))?.card.lastReview).toBe(100);
    expect(await TestBed.inject(DeckDatabaseService).getDeckReviewEvents('d')).toHaveLength(1);
    expect((await TestBed.inject(LocalRushRepository).getStats()).sessions.map(s=>s.activeSeconds)).toEqual([50]);
    d=device('same-account',true);expect(await d.sync.syncNow()).toBe(true);expect((await TestBed.inject(LocalRushRepository).getStats()).sessions).toHaveLength(1);
    expect((await TestBed.inject(DeckDatabaseService).getAllDailyStates())[0].introducedEntryIds).toEqual(['a']);
  });
  it('a settings edit made while its push reads remote is not erased by remote precedence',async()=>{
    const d=device(),key='kana-study.settings.v1';d.storage.set(key,{language:'es'});
    cloud['user_preferences']=[{user_id:'same-account',preference_key:key,payload:{language:'en'},updated_at:'2099-01-01T00:00:00Z'}];
    let once=true;onRead=async table=>{if(table==='user_preferences'&&once){once=false;d.storage.set(key,{language:'ca'});}};
    expect(await d.sync.syncNow()).toBe(false);expect(d.storage.get(key,null)).toEqual({language:'ca'});expect(d.sync.pendingCount()).toBe(1);
  });
  it('failed remote deletion is not success and keeps the deletion pending',async()=>{
    const d=device();d.storage.remove('kana-study.settings.v1');fail='delete:user_preferences';
    expect(await d.sync.syncNow()).toBe(false);expect(queued.size).toBe(1);
  });
  it('a write during the final metadata commit prevents a false synced status',async()=>{
    const d=device();const outbox=TestBed.inject(SyncOutboxService);
    vi.spyOn(outbox,'putMeta').mockImplementation(async()=>{d.storage.set('kana-study.settings.v1',{language:'ca'});});
    expect(await d.sync.syncNow()).toBe(false);expect(d.sync.status()).toBe('pending');expect(d.sync.pendingCount()).toBe(1);expect(d.sync.lastSyncedAt()).toBeNull();
  });
  it('a new deck daily-state edit during pull remains local and pending until the next upload',async()=>{
    vi.useFakeTimers({toFake:['setTimeout','clearTimeout']});vi.stubGlobal('indexedDB',new IDBFactory());const d=device('same-account',true);
    const decks=TestBed.inject(DeckDatabaseService),daily={deckId:'d',localDate:'2026-10-08',introducedEntryIds:['a'],newLimitOverride:7};
    cloud['deck_daily_state']=[{user_id:'same-account',deck_id:'d',local_day:daily.localDate,introduced_entry_ids:['b'],new_limit_override:1}];
    let once=true;onRead=async table=>{if(table==='deck_daily_state'&&once){once=false;await decks.writeDailyState(daily);}};
    expect(await d.sync.syncNow()).toBe(false);expect((await decks.getDailyState('d',daily.localDate))?.newLimitOverride).toBe(7);
    expect(d.sync.pendingCount()).toBe(1);expect(await d.sync.syncNow()).toBe(true);
    expect(cloud['deck_daily_state'][0].new_limit_override).toBe(7);expect(cloud['deck_daily_state'][0].introduced_entry_ids.sort()).toEqual(['a','b']);
  });
  it('capped history, deck events and RUSH keep the exact same time on another device, without changing history or duplicating seconds',async()=>{
    vi.useFakeTimers({toFake:['setTimeout','clearTimeout']});vi.stubGlobal('indexedDB',new IDBFactory());
    let d=device('same-account',true),now=0;const timer=new CardStudyTimer(()=>now);timer.resume();
    const events:number[]=[];
    for(const seconds of [4,15,7]){timer.startAppearance();now+=seconds*1000;events.push(timer.commitAppearance());}
    const summary={sessionId:'capped',module:'kana',completedAt:'2026-10-08T12:00:00Z',mode:'self-assessment',exercisesCompleted:3,firstTrySuccesses:3,attempts:3,needsPracticeCount:0,durationSeconds:timer.committedSeconds} as const;
    TestBed.inject(SessionHistoryService).record({...summary,sessionId:'historic',durationSeconds:1325});
    TestBed.inject(SessionHistoryService).record(summary);
    for(const [i,elapsedAnswerMs] of events.entries())await TestBed.inject(DeckDatabaseService).commitReview(
      {deckId:'japanese-1500',entryId:String(i),due:200,state:2,card:{lastReview:100,due:200,state:2}} as any,
      {id:`capped-${i}`,deckId:'japanese-1500',entryId:String(i),reviewedAt:100,elapsedAnswerMs} as any,
      {deckId:'japanese-1500',localDate:'2026-10-08',introducedEntryIds:['0','1','2'],newLimitOverride:null});
    await TestBed.inject(LocalRushRepository).saveProgress({id:'capped',module:'kana',startedAt:100,endedAt:200,activeSeconds:timer.committedSeconds,cardsCompleted:3,uniqueContentsSeen:3,cyclesCompleted:1,initialUnitCount:3,localDay:'2026-10-08',interrupted:false});
    expect((await TestBed.inject(ProfileStatsService).load()).studySeconds).toBe(1388);
    expect(await d.sync.syncNow()).toBe(true);
    expect(cloud['deck_review_events'].map(row=>row.payload.elapsedAnswerMs)).toEqual([4000,10000,7000]);
    expect(cloud['rush_sessions'][0].active_seconds).toBe(21);
    TestBed.resetTestingModule();vi.stubGlobal('indexedDB',new IDBFactory());d=device('same-account',true);
    expect(await d.sync.syncNow()).toBe(true);expect(await d.sync.syncNow()).toBe(true);
    expect(TestBed.inject(SessionHistoryService).sessions()).toHaveLength(2);
    expect(TestBed.inject(SessionHistoryService).sessions().find(s=>s.sessionId==='historic')?.durationSeconds).toBe(1325);
    expect(await TestBed.inject(DeckDatabaseService).getDeckReviewEvents('japanese-1500')).toHaveLength(3);
    expect((await TestBed.inject(ProfileStatsService).load()).studySeconds).toBe(1388);
  });
});
