// @vitest-environment jsdom
import '@angular/compiler';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';
import { SyncDiagnosticsService } from './sync-diagnostics.service';
import { MangaSavedSyncService } from './manga-saved-sync.service';
import { MangaStudySavedRepository } from './manga-study-saved.repository';
import { getTestBed, TestBed } from '@angular/core/testing';
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
import { CompletedSessionSummary } from '../models/learning-session.model';
import { MangaReviewHistoryService } from './manga-review-history.service';
import { MANGA_REVIEW_EVENTS_KEY, MangaReviewEvent } from '../models/manga-review.model';

const fs = (globalThis as unknown as {process: {getBuiltinModule: (id: string) => {readFileSync: (path: string, encoding: string) => string}}}).process.getBuiltinModule('fs');
const sessionMigration = fs.readFileSync('supabase/migrations/202610080005_manga_study_v3.sql', 'utf8');
const sqlSessionModules = [...sessionMigration.match(/add constraint completed_sessions_module_check\s+check\s*\(module in\s*\(([^)]+)\)/)![1].matchAll(/'([^']+)'/g)].map(match => match[1]);
const sqlEventModules = [...sessionMigration.match(/add constraint review_events_module_check\s+check\s*\(module in\s*\(([^)]+)\)/)![1].matchAll(/'([^']+)'/g)].map(match => match[1]);
// Exhaustive at compile time: a new summary module must also update this contract.
const summaryModules: Record<NonNullable<CompletedSessionSummary['module']>, true> = {
  kana: true, flags: true, kanji: true, vocabulary: true, grammar: true, manga: true,
};

// ng test initializes this already; direct Vitest runs need the same TestBed.
if(!getTestBed().platform)getTestBed().initTestEnvironment(BrowserTestingModule,platformBrowserTesting());

/** Two independent browser caches against one simulated Supabase account. */
describe('account sync reconciliation regressions', () => {
  let cloud: Record<string, any[]>;
  let queued: Map<string, SyncOutboxItem>;
  let fail: string | null;
  let onRead: ((table: string) => Promise<void>) | null;
  let writes: string[];
  let meta: any;
  let loseSessionResponse: boolean;
  let onWrite: ((table: string) => Promise<void>) | null;
  const mangaEvent=(id:string):MangaReviewEvent=>({id,key:'word',savedItemId:'word',sessionId:'manga-recovery',reviewedAt:'2026-10-08T12:00:00Z',exerciseType:'reading',correct:true,repetition:false,answerMode:'self-assessment',rating:'good'});
  const mangaSession=(sessionId:string):CompletedSessionSummary=>({module:'manga',sessionId,completedAt:'2026-10-08T12:00:00Z',mode:'quick-practice',exercisesCompleted:1,firstTrySuccesses:1,attempts:1,needsPracticeCount:0,durationSeconds:7});
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
        if(table==='completed_sessions'&&rows.some(row=>!sqlSessionModules.includes(row.module)))return {error:{code:'23514'}};
        if(table==='review_events'&&rows.some(row=>!sqlEventModules.includes(row.module)))return {error:{code:'23514'}};
        writes.push(table);cloud[table]??=[];
        for(const row of rows){const pk=keys[table]??['id'];const index=cloud[table].findIndex(old=>pk.every(k=>old[k]===row[k]));
          const saved=structuredClone({...row,updated_at:'2026-10-08T12:00:00Z'});if(index<0)cloud[table].push(saved);else cloud[table][index]=saved;}
        await onWrite?.(table);
        if(table==='completed_sessions'&&loseSessionResponse){loseSessionResponse=false;return {error:new Error('response lost after commit')};}
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
        enqueue:async(item:SyncOutboxItem)=>{queued.set(item.id,item);window.dispatchEvent(new CustomEvent('kana-study:sync-pending'));},
        enqueueIfAbsent:async(item:SyncOutboxItem)=>{if(queued.has(item.id))return false;queued.set(item.id,item);window.dispatchEvent(new CustomEvent('kana-study:sync-pending'));return true;},
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
  beforeEach(()=>{vi.useFakeTimers();cloud={};fail=null;onRead=null;onWrite=null;writes=[];loseSessionResponse=false;vi.spyOn(navigator,'onLine','get').mockReturnValue(true);});
  afterEach(()=>{TestBed.resetTestingModule();vi.restoreAllMocks();vi.unstubAllGlobals();vi.useRealTimers();});
  it('keeps the SQL completed-session CHECK compatible with every summary module',()=>{
    expect(sqlSessionModules.sort()).toEqual(Object.keys(summaryModules).sort());
    expect(sessionMigration).toMatch(/add constraint completed_sessions_module_check\s+check\s*\(module in/);
    const initial = fs.readFileSync('supabase/migrations/202609300001_local_first_accounts.sql', 'utf8');
    const initialCheck = initial.match(/create table public.completed_sessions\s*\([\s\S]*?check\s*\(module in\s*\(([^)]+)\)/)?.[1];
    expect(initialCheck).toBeDefined();
    const historicalModules = [...initialCheck!.matchAll(/'([^']+)'/g)].map(match => match[1]);
    expect(sqlSessionModules).toEqual([...historicalModules, 'grammar', 'manga'].sort());
    const grammarMigration=fs.readFileSync('supabase/migrations/202610080004_completed_sessions_grammar.sql','utf8');
    expect(grammarMigration).toContain("'grammar'");expect(sqlEventModules).toContain('manga');
  });
  it.each([...Object.keys(summaryModules), undefined])('synchronizes the supported session module %s',async(module)=>{
    const d=device();
    const summary:CompletedSessionSummary={module:module as CompletedSessionSummary['module'],sessionId:'module-contract',
      completedAt:'2026-10-08T12:00:00.000Z',mode:'quick-practice',exercisesCompleted:1,
      firstTrySuccesses:1,attempts:1,needsPracticeCount:0,durationSeconds:60};
    TestBed.inject(SessionHistoryService).record(summary);
    expect(await d.sync.syncNow()).toBe(true);
    expect(cloud['completed_sessions']).toHaveLength(1);
    expect(cloud['completed_sessions'][0]).toMatchObject({module:module??'kana',payload:JSON.parse(JSON.stringify(summary))});
  });
  it('prepares Grammar sessions unchanged and retries a lost server ACK without duplicates',async()=>{
    const d=device(),history=TestBed.inject(SessionHistoryService);
    const summary:CompletedSessionSummary={module:'grammar',sessionId:'grammar-v2-retry',completedAt:'2026-10-08T12:34:56.789Z',
      mode:'quick-practice',exercisesCompleted:4,firstTrySuccesses:3,attempts:5,needsPracticeCount:1,durationSeconds:137,
      grammarTopicIds:['11'],grammarLessonIds:['07'],grammarExerciseIds:['integration-1']};
    history.record(summary);
    expect([...queued.values()].find(item=>item.entityKey==='kana-study.completed-sessions.v1')?.payload).toEqual([summary]);
    loseSessionResponse=true;
    expect(await d.sync.syncNow()).toBe(false);
    expect(d.sync.status()).toBe('error');expect(queued.size).toBe(1);
    expect(cloud['completed_sessions']).toHaveLength(1);
    expect(cloud['completed_sessions'][0]).toMatchObject({id:summary.sessionId,module:'grammar',completed_at:summary.completedAt,payload:summary});
    expect(await d.sync.syncNow()).toBe(true);expect(queued.size).toBe(0);
    expect(writes.filter(table=>table==='completed_sessions')).toHaveLength(2);
    expect(cloud['completed_sessions']).toHaveLength(1);
    expect(cloud['completed_sessions'][0].payload).toEqual(summary);
    const next=device();expect(await next.sync.syncNow()).toBe(true);TestBed.tick();
    expect(TestBed.inject(SessionHistoryService).sessions()).toEqual([summary]);
  });
  it('A/B: another device hydrates Grammar V2 and updates the existing UI signal without reload',async()=>{
    let d=device();const c=GRAMMAR_V2_CONCEPTS[0];d.grammar.open(c.id);d.grammar.record(c.id,c.exercises[0].id,0,true);
    expect(await d.sync.syncNow()).toBe(true);
    d=device();expect(d.grammar.started()).toBe(false);expect(await d.sync.syncNow()).toBe(true);TestBed.tick();
    expect(d.grammar.state().concepts[c.id].answers[c.exercises[0].id].solved).toBe(true);
    const remote=cloud['user_preferences'].find(r=>r.preference_key===GRAMMAR_PROGRESS_V2_KEY).payload;
    remote.concepts[c.id].answers[c.exercises[1].id]={correct:true,solved:true,attempts:1,correctCount:1,answeredAt:'2026-10-08T13:00:00Z'};
    expect(await d.sync.syncNow()).toBe(true);TestBed.tick();expect(d.grammar.state().concepts[c.id].answers[c.exercises[1].id].solved).toBe(true);
  });
  it('Manga sessions and immutable attempts travel to another browser without duplicate time, including offline concurrent attempts',async()=>{
    const event=(id:string):MangaReviewEvent=>({id,key:'dictionary:word',savedItemId:'dictionary:word',sessionId:'manga-session',reviewedAt:'2026-10-08T12:00:00Z',exerciseType:'meaning',correct:true,repetition:false,answerMode:'self-assessment',rating:'good'});
    let d=device();const history=TestBed.inject(MangaReviewHistoryService);
    const summary:CompletedSessionSummary={sessionId:'manga-session',module:'manga',completedAt:'2026-10-08T12:00:00Z',mode:'quick-practice',exercisesCompleted:1,firstTrySuccesses:1,attempts:1,needsPracticeCount:0,durationSeconds:7};
    vi.spyOn(navigator,'onLine','get').mockReturnValue(false);await history.record(event('pc-answer'));TestBed.inject(SessionHistoryService).record(summary);
    expect(await d.sync.syncNow()).toBe(false);expect(queued.size).toBe(2);
    vi.spyOn(navigator,'onLine','get').mockReturnValue(true);expect(await d.sync.syncNow()).toBe(true);
    const pc=history.events();
    d=device();expect(await d.sync.syncNow()).toBe(true);TestBed.tick();
    expect(TestBed.inject(MangaReviewHistoryService).events()).toEqual(pc);
    expect(TestBed.inject(SessionHistoryService).sessions()).toEqual([summary]);
    expect((await TestBed.inject(ProfileStatsService).load()).studySeconds).toBe(7);
    const mobile=TestBed.inject(MangaReviewHistoryService);await mobile.record(event('mobile-answer'));expect(await d.sync.syncNow()).toBe(true);
    d=device();d.storage.setFromCloud(MANGA_REVIEW_EVENTS_KEY,pc);await TestBed.inject(MangaReviewHistoryService).record(event('pc-offline-answer'));
    expect(await d.sync.syncNow()).toBe(true);expect(await d.sync.syncNow()).toBe(true);TestBed.tick();
    expect(new Set(TestBed.inject(MangaReviewHistoryService).events().map(e=>e.id))).toEqual(new Set(['pc-answer','mobile-answer','pc-offline-answer']));
    expect(cloud['review_events']).toHaveLength(3);expect(cloud['completed_sessions']).toHaveLength(1);
    expect((await TestBed.inject(ProfileStatsService).load()).studySeconds).toBe(7);
  });
  it('Manga converges across two browsers: automatic sync and ten unchanged cycles never reupload confirmed history',async()=>{
    const event=(i:number):MangaReviewEvent=>({id:`manga-convergence:${i}`,key:`word:${i}`,savedItemId:`word:${i}`,sessionId:'manga-convergence',reviewedAt:'2026-10-08T12:00:00Z',exerciseType:'reading',correct:true,repetition:false,answerMode:'self-assessment',rating:'good'});
    let d=device();TestBed.tick();
    for(let i=0;i<5;i++)await TestBed.inject(MangaReviewHistoryService).record(event(i));
    TestBed.inject(SessionHistoryService).record({module:'manga',sessionId:'manga-convergence',completedAt:'2026-10-08T12:00:00Z',mode:'quick-practice',exercisesCompleted:5,firstTrySuccesses:5,attempts:5,needsPracticeCount:0,durationSeconds:21});
    expect(await d.sync.syncNow()).toBe(true);expect(d.sync.pendingCount()).toBe(0);
    const baseline=writes.length;
    d=device();TestBed.tick();expect(await d.sync.syncNow()).toBe(true);
    expect(TestBed.inject(MangaReviewHistoryService).events()).toHaveLength(5);
    await vi.advanceTimersByTimeAsync(1000);
    expect(d.sync.status()).toBe('synced');expect(d.sync.pendingCount()).toBe(0);expect(queued.size).toBe(0);
    expect(writes).toHaveLength(baseline);
    for(let cycle=0;cycle<10;cycle++){
      expect(await d.sync.syncNow()).toBe(true);await vi.advanceTimersByTimeAsync(1000);
      expect(d.sync.status()).toBe('synced');expect(d.sync.pendingCount()).toBe(0);expect(queued.size).toBe(0);
      expect(writes).toHaveLength(baseline);
    }
    expect(vi.getTimerCount()).toBe(0);
    expect((await TestBed.inject(ProfileStatsService).load()).studySeconds).toBe(21);
    await TestBed.inject(MangaReviewHistoryService).record(event(5));TestBed.inject(SessionHistoryService).record(mangaSession('mobile-return'));
    expect(await d.sync.syncNow()).toBe(true);const returned=writes.length;
    d=device();TestBed.tick();expect(await d.sync.syncNow()).toBe(true);await vi.advanceTimersByTimeAsync(1000);
    expect(TestBed.inject(MangaReviewHistoryService).events()).toHaveLength(6);
    expect((await TestBed.inject(ProfileStatsService).load()).studySeconds).toBe(28);
    expect(writes).toHaveLength(returned);expect(d.sync.pendingCount()).toBe(0);expect(vi.getTimerCount()).toBe(0);
  });
  it('recovers interrupted local event/session enqueues after reopening and offline, uploading only IDs absent from pull',async()=>{
    let d=device();TestBed.tick();const history=TestBed.inject(MangaReviewHistoryService),outbox=TestBed.inject(SyncOutboxService);
    vi.spyOn(outbox,'enqueue').mockRejectedValue(new Error('IndexedDB interrupted'));
    await expect(history.record(mangaEvent('lost-enqueue'))).rejects.toThrow('IndexedDB interrupted');
    TestBed.inject(SessionHistoryService).record(mangaSession('lost-session'));
    const events=history.events(),sessions=TestBed.inject(SessionHistoryService).sessions();
    d=device();TestBed.tick();d.storage.setFromCloud(MANGA_REVIEW_EVENTS_KEY,events);d.storage.setFromCloud('kana-study.completed-sessions.v1',sessions);
    vi.spyOn(navigator,'onLine','get').mockReturnValue(false);expect(await d.sync.syncNow()).toBe(false);expect(writes).toEqual([]);
    vi.spyOn(navigator,'onLine','get').mockReturnValue(true);
    expect(await d.sync.syncNow()).toBe(false);expect(d.sync.status()).toBe('pending');expect(d.sync.pendingCount()).toBe(2);
    expect([...queued.values()].map(item=>(item.payload as unknown[]).length)).toEqual([1,1]);
    expect(await d.sync.syncNow()).toBe(true);expect(cloud['review_events']).toHaveLength(1);expect(cloud['completed_sessions']).toHaveLength(1);
    const baseline=writes.length;expect(await d.sync.syncNow()).toBe(true);expect(writes).toHaveLength(baseline);
    expect((await TestBed.inject(ProfileStatsService).load()).studySeconds).toBe(7);
  });
  it('keeps a new response created during pull pending until its own ACK',async()=>{
    const d=device();TestBed.tick();const history=TestBed.inject(MangaReviewHistoryService);await history.record(mangaEvent('before-pull'));
    let once=true;onRead=async table=>{if(table==='review_events'&&once){once=false;await history.record(mangaEvent('during-pull'));}};
    expect(await d.sync.syncNow()).toBe(false);expect(d.sync.status()).toBe('pending');expect(d.sync.pendingCount()).toBe(1);
    expect((queued.values().next().value!.payload as MangaReviewEvent[]).map(e=>e.id)).toContain('during-pull');
    expect(await d.sync.syncNow()).toBe(true);expect(cloud['review_events']).toHaveLength(2);
    const baseline=writes.length;expect(await d.sync.syncNow()).toBe(true);expect(writes).toHaveLength(baseline);
  });
  it('an old session ACK cannot remove a session revision created during push',async()=>{
    const d=device();TestBed.tick();const history=TestBed.inject(SessionHistoryService);history.record(mangaSession('before-push'));
    const oldRevision=[...queued.values()][0].revision;let once=true;
    onWrite=async table=>{if(table==='completed_sessions'&&once){once=false;history.record(mangaSession('during-push'));}};
    expect(await d.sync.syncNow()).toBe(false);expect(d.sync.pendingCount()).toBe(1);expect([...queued.values()][0].revision).not.toBe(oldRevision);
    expect(await d.sync.syncNow()).toBe(true);expect(cloud['completed_sessions']).toHaveLength(2);
    expect((await TestBed.inject(ProfileStatsService).load()).studySeconds).toBe(14);
  });
  it('an event arriving after remote ACK but before cleanup keeps its newer outbox revision',async()=>{
    const d=device();TestBed.tick();const history=TestBed.inject(MangaReviewHistoryService),outbox=TestBed.inject(SyncOutboxService);
    await history.record(mangaEvent('acked'));const remove=outbox.removeProcessed.bind(outbox);
    let release!:()=>void,entered!:()=>void;const started=new Promise<void>(resolve=>entered=resolve),gate=new Promise<void>(resolve=>release=resolve);
    const cleanup=vi.spyOn(outbox,'removeProcessed').mockImplementationOnce(async items=>{entered();await gate;await remove(items);});
    const syncing=d.sync.syncNow();await started;
    expect((await d.sync.inspectDiagnostics())?.pending[0]).toMatchObject({remote:'confirmed',confirmedAwaitingCleanup:true});
    await history.record(mangaEvent('after-ack'));const newer=[...queued.values()][0].revision;release();
    expect(await syncing).toBe(false);expect([...queued.values()][0].revision).toBe(newer);cleanup.mockRestore();
    expect(await d.sync.syncNow()).toBe(true);expect(cloud['review_events']).toHaveLength(2);
  });
  it('a failed pull cannot treat unverified local history as remote-confirmed or enqueue speculative recovery',async()=>{
    const d=device();TestBed.tick();d.storage.setFromCloud(MANGA_REVIEW_EVENTS_KEY,[mangaEvent('local-only')]);fail='review_events';
    expect(await d.sync.syncNow()).toBe(false);expect(d.sync.status()).toBe('error');expect(queued.size).toBe(0);expect(writes).toEqual([]);
    fail=null;expect(await d.sync.syncNow()).toBe(false);expect(d.sync.status()).toBe('pending');expect(queued.size).toBe(1);
    expect(await d.sync.syncNow()).toBe(true);expect(queued.size).toBe(0);
  });
  it('Guest Manga attempts stay local and explicit import unions by ID without losing the account history',async()=>{
    const d=device(),workspace=d.workspace;workspace.activateGuest();TestBed.tick();
    const history=TestBed.inject(MangaReviewHistoryService);
    const guest:MangaReviewEvent={id:'guest-attempt',key:'word',savedItemId:'word',sessionId:'guest-session',reviewedAt:'2026-10-08T12:00:00Z',exerciseType:'reading',correct:false,repetition:false,answerMode:'self-assessment',rating:'again'};
    await history.record(guest);expect(queued.size).toBe(0);expect(await d.sync.syncNow()).toBe(false);
    const summary:CompletedSessionSummary={module:'manga',sessionId:'guest-session',completedAt:guest.reviewedAt,mode:'quick-practice',exercisesCompleted:1,firstTrySuccesses:0,attempts:2,needsPracticeCount:0,durationSeconds:7};
    TestBed.inject(SessionHistoryService).record(summary);
    workspace.activateUser('same-account');await history.record({...guest,id:'account-attempt'});
    TestBed.inject(SessionHistoryService).record({...summary,sessionId:'account-session',module:'grammar',durationSeconds:4});
    workspace.copyGuestLocalStorageToUser('same-account');TestBed.tick();
    // Import queues the union rather than replaying an older account outbox payload.
    d.storage.set(MANGA_REVIEW_EVENTS_KEY,history.events());
    // AuthService queues both unions before synchronization in the Merge flow.
    d.storage.set('kana-study.completed-sessions.v1',TestBed.inject(SessionHistoryService).sessions());expect(await d.sync.syncNow()).toBe(true);
    expect((await TestBed.inject(ProfileStatsService).load()).studySeconds).toBe(11);
    expect(cloud['completed_sessions']).toHaveLength(2);
    expect(cloud['review_events']).toHaveLength(2);workspace.activateGuest();TestBed.tick();expect(history.events()).toEqual([guest]);
  });
  it('qualifies only Manga transport IDs by owner while keeping logical Guest IDs immutable',async()=>{
    const event:MangaReviewEvent={id:'shared-guest-event',key:'word',savedItemId:'word',sessionId:'shared-guest-session',reviewedAt:'2026-10-08T12:00:00Z',exerciseType:'reading',correct:true,repetition:false,answerMode:'self-assessment',rating:'good'};
    const summary:CompletedSessionSummary={module:'manga',sessionId:event.sessionId,completedAt:event.reviewedAt,mode:'quick-practice',exercisesCompleted:1,firstTrySuccesses:1,attempts:1,needsPracticeCount:0,durationSeconds:4};
    for(const user of ['a','b']){
      const d=device(user);await TestBed.inject(MangaReviewHistoryService).record(event);TestBed.inject(SessionHistoryService).record(summary);
      expect(await d.sync.syncNow()).toBe(true);
      expect(cloud['review_events'].find(row=>row.user_id===user)).toMatchObject({id:`${user}:${event.id}`,payload:event});
      expect(cloud['completed_sessions'].find(row=>row.user_id===user)).toMatchObject({id:`${user}:${summary.sessionId}`,payload:summary});
    }
    expect(cloud['review_events']).toHaveLength(2);expect(cloud['completed_sessions']).toHaveLength(2);
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
  it.each([false,true])('preserves ACKs when a delayed workspace effect runs during push, account change=%s',async(changeAccount)=>{
    const d=device();if(changeAccount){TestBed.tick();d.workspace.activateUser('next-account');}
    d.storage.set('kana-study.settings.v1',{language:'ca'});
    const diagnostics=TestBed.inject(SyncDiagnosticsService),confirmed=diagnostics.confirmed.bind(diagnostics);
    const reset=vi.spyOn(diagnostics,'reset'),outbox=TestBed.inject(SyncOutboxService),remove=vi.spyOn(outbox,'removeProcessed');
    vi.spyOn(diagnostics,'confirmed').mockImplementation(item=>{confirmed(item);TestBed.tick();});
    const success=await d.sync.syncNow();
    expect(success).toBe(true);expect(d.sync.status()).toBe('synced');expect(queued.size).toBe(0);
    expect(reset).toHaveBeenCalledTimes(changeAccount?1:0);expect(remove.mock.calls[0][0]).toHaveLength(1);
    expect(d.sync.pendingCount()).toBe(0);expect((await d.sync.inspectDiagnostics())?.failure).toBeNull();
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
