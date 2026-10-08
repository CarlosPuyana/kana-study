import { TestBed } from '@angular/core/testing';
import { IDBFactory } from 'fake-indexeddb';
import { SyncOutboxService, makeOutboxItem } from './sync-outbox.service';
import { WorkspaceService, WORKSPACE_LOCAL_KEYS } from './workspace.service';
import { StorageService } from './storage.service';
import { SessionHistoryService } from './session-history.service';
import { AuthService } from './auth.service';
import { SupabaseClientService } from './supabase-client.service';
import { WorkspaceMigrationService } from './workspace-migration.service';
import { GRAMMAR_PROGRESS_V2_KEY } from '../models/grammar-v2.model';
import { DeckDatabaseService } from './deck-database.service';
import { LocalRushRepository } from './rush-repository.service';
import { mergeProgressSnapshots } from './sync-merge';

describe('outbox and account isolation regressions',()=>{
  beforeEach(()=>{localStorage.clear();vi.stubGlobal('indexedDB',new IDBFactory());});
  afterEach(()=>{TestBed.resetTestingModule();vi.unstubAllGlobals();});
  it('a failed old revision never replaces a new offline write',async()=>{
    const outbox=TestBed.inject(SyncOutboxService),old=makeOutboxItem('user:a','local-storage','key',{value:1})!;
    await outbox.enqueue(old);const newer=makeOutboxItem('user:a','local-storage','key',{value:2})!;await outbox.enqueue(newer);
    await outbox.markAttempt([old]);await outbox.removeProcessed([old]);
    expect(await outbox.pending('user:a')).toEqual([newer]);
  });
  it('pending sees an enqueue started without awaiting it, including first database open',async()=>{
    const outbox=TestBed.inject(SyncOutboxService),item=makeOutboxItem('user:a','local-storage','key',{value:1})!;
    const write=outbox.enqueue(item);expect(await outbox.pending('user:a')).toEqual([item]);await write;
  });
  it('offline outbox changes survive service teardown and reopening the browser database',async()=>{
    let outbox=TestBed.inject(SyncOutboxService);const item=makeOutboxItem('user:a','local-storage','key',{value:1})!;
    await outbox.enqueue(item);TestBed.resetTestingModule();outbox=TestBed.inject(SyncOutboxService);
    expect(await outbox.pending('user:a')).toEqual([item]);expect(await outbox.pending('user:b')).toEqual([]);
  });
  it('Grammar V2 participates in explicit Guest import, including integration, without V1 mixing',()=>{
    const workspace=TestBed.inject(WorkspaceService);
    expect(WORKSPACE_LOCAL_KEYS as readonly string[]).toContain(GRAMMAR_PROGRESS_V2_KEY);
    localStorage.setItem(GRAMMAR_PROGRESS_V2_KEY,JSON.stringify({version:2,concepts:{},practices:{},review:{},integration:{openedAt:'2026-10-08T12:00:00Z',activities:{}}}));
    expect(workspace.hasGuestProgress()).toBe(true);workspace.copyGuestLocalStorageToUser('alice');workspace.activateUser('alice');
    expect(TestBed.inject(StorageService).get<any>(GRAMMAR_PROGRESS_V2_KEY,null).integration.openedAt).toBeDefined();
    expect(TestBed.inject(StorageService).get('kana-study.grammar-progress.v1',null)).toBeNull();
  });
  it('empty Grammar V2 does not trigger Guest import',()=>{
    localStorage.setItem(GRAMMAR_PROGRESS_V2_KEY,JSON.stringify({version:2,concepts:{},practices:{},review:{}}));
    expect(TestBed.inject(WorkspaceService).hasGuestProgress()).toBe(false);
  });
  it('G/J: history switches account immediately and deduplicates IDs after cloud hydration',()=>{
    const workspace=TestBed.inject(WorkspaceService),storage=TestBed.inject(StorageService),history=TestBed.inject(SessionHistoryService);
    workspace.activateUser('alice');storage.setFromCloud('kana-study.completed-sessions.v1',[{sessionId:'alice-session',studySeconds:10}]);TestBed.tick();
    expect(history.sessions()).toHaveLength(1);workspace.activateUser('bob');
    history.record({sessionId:'bob-session',studySeconds:20} as any);
    expect(history.sessions().map(s=>s.sessionId)).toEqual(['bob-session']);
    history.mergeFromCloud([{sessionId:'bob-session',studySeconds:20}] as any);expect(history.sessions()).toHaveLength(1);
    expect(storage.get<any[]>('kana-study.completed-sessions.v1',[]).map(s=>s.sessionId)).toEqual(['bob-session']);
  });
  it('G: delayed authentication and profile reads cannot resurrect a signed-out account',async()=>{
    let listener:any,release!:(value:any)=>void;
    const profile=new Promise(r=>release=r);
    const client={auth:{onAuthStateChange:(cb:any)=>{listener=cb;return {data:{subscription:{unsubscribe(){}}}};}},
      from:()=>({select:()=>({eq:()=>({maybeSingle:()=>profile})})})};
    TestBed.configureTestingModule({providers:[
      {provide:SupabaseClientService,useValue:{config:{configured:true},getClient:async()=>client}},
      {provide:WorkspaceMigrationService,useValue:{hasGuestData:async()=>false}},
    ]});
    const auth=TestBed.inject(AuthService);await Promise.resolve();listener('SIGNED_IN',{user:{id:'alice'}});
    for(let i=0;i<5;i++)await Promise.resolve();listener('SIGNED_OUT',null);await Promise.resolve();
    release({data:{id:'alice',display_name:'Alice'}});for(let i=0;i<5;i++)await Promise.resolve();
    expect(auth.profile()).toBeNull();expect(TestBed.inject(WorkspaceService).active()).toBe('guest');
  });
  it('G: deck and RUSH writes retain the workspace captured before IndexedDB awaits',async()=>{
    const workspace=TestBed.inject(WorkspaceService),outbox=TestBed.inject(SyncOutboxService);
    const decks=TestBed.inject(DeckDatabaseService),rush=TestBed.inject(LocalRushRepository);
    workspace.activateUser('alice');
    const daily=decks.writeDailyState({deckId:'d',localDate:'2026-10-08',introducedEntryIds:['a'],newLimitOverride:null});
    const session=rush.createSession({id:'s',module:'kana',startedAt:1,endedAt:null,activeSeconds:1} as any);
    workspace.activateUser('bob');await Promise.all([daily,session]);
    expect(await outbox.pending('user:bob')).toEqual([]);expect(await outbox.pending('user:alice')).toHaveLength(2);
    expect(await decks.getAllDailyStates()).toEqual([]);expect((await rush.getStats()).sessions).toEqual([]);
  });
  it('I/J: IndexedDB hydration survives reopen, respects newer deck FSRS and does not regress RUSH sessions',async()=>{
    const workspace=TestBed.inject(WorkspaceService);workspace.activateUser('alice');
    let decks=TestBed.inject(DeckDatabaseService),rush=TestBed.inject(LocalRushRepository);
    const progress={deckId:'d',entryId:'a',due:200,state:2,card:{lastReview:200,due:200,state:2}} as any;
    const session={id:'s',module:'kana',startedAt:1,endedAt:200,activeSeconds:50,cardsCompleted:4,uniqueContentsSeen:4,cyclesCompleted:1,initialUnitCount:4,localDay:'2026-10-08',interrupted:false};
    await decks.mergeFromCloud({progress:[progress],events:[{id:'e',deckId:'d',entryId:'a',reviewedAt:200} as any],daily:[{deckId:'d',localDate:'2026-10-08',introducedEntryIds:['a'],newLimitOverride:null}]});
    await rush.mergeFromCloud({sessions:[session as any],coverage:[{module:'kana',contentId:'a',firstSeenAt:2}]});
    await decks.mergeFromCloud({progress:[{...progress,card:{...progress.card,lastReview:100}}],events:[],daily:[]});
    await rush.mergeFromCloud({sessions:[{...session,endedAt:null,activeSeconds:10,cardsCompleted:1} as any],coverage:[{module:'kana',contentId:'a',firstSeenAt:3}]});
    TestBed.resetTestingModule();decks=TestBed.inject(DeckDatabaseService);rush=TestBed.inject(LocalRushRepository);
    expect((await decks.getProgress('d','a'))?.card.lastReview).toBe(200);expect(await decks.getDeckReviewEvents('d')).toHaveLength(1);
    expect((await decks.getAllDailyStates())[0].introducedEntryIds).toEqual(['a']);
    expect((await rush.getStats()).sessions).toEqual([session]);expect((await rush.getStats()).coverage[0].firstSeenAt).toBe(2);
  });
  it('a later practice timestamp cannot replace more recently reviewed FSRS',()=>{
    const remote={lastSeenAt:'2026-10-08T12:00:00Z',totalAttempts:4,fsrs:{lastReview:'2026-10-08T12:00:00Z',state:'review'}};
    const local={lastSeenAt:'2026-10-08T13:00:00Z',totalAttempts:7,fsrs:{lastReview:'2026-10-07T12:00:00Z',state:'learning'}};
    expect(mergeProgressSnapshots({a:local},{a:remote})['a'].fsrs).toEqual(remote.fsrs);
    expect(mergeProgressSnapshots({a:local},{a:remote})['a'].totalAttempts).toBe(7);
  });
});

