import {TestBed} from '@angular/core/testing';
import {ALL_KANA} from '../../data/kana';
import {CompletedSessionSummary} from '../models/learning-session.model';
import {SyncOutboxItem} from '../models/account.model';
import {LearningSessionService} from './learning-session.service';
import {ProgressService} from './progress.service';
import {DailyLearningService} from './daily-learning.service';
import {MedalService} from './medal.service';
import {SessionHistoryService} from './session-history.service';
import {ProfileStatsService} from './profile-stats.service';
import {StorageService} from './storage.service';
import {WorkspaceService} from './workspace.service';
import {SyncService} from './sync.service';
import {SyncOutboxService} from './sync-outbox.service';
import {SupabaseClientService} from './supabase-client.service';
import {DeviceService} from './device.service';
import {DeckDatabaseService} from './deck-database.service';
import {LocalRushRepository} from './rush-repository.service';
import {calculateLearningAnalytics} from './learning-analytics.service';

describe('Daily KANA study time through local history, profile and synchronization',()=>{
  const key='kana-study.completed-sessions.v1';
  const baseline:CompletedSessionSummary={module:'kana',sessionId:'historic',completedAt:'2026-10-01T10:00:00Z',mode:'self-assessment',exercisesCompleted:1,firstTrySuccesses:1,attempts:1,needsPracticeCount:0,durationSeconds:1325};
  let remote:CompletedSessionSummary[];
  let pending:SyncOutboxItem[],uploaded:CompletedSessionSummary[];
  const unit={key:`${ALL_KANA[0].id}:kana-to-romaji`,kanaId:ALL_KANA[0].id,questionType:'kana-to-romaji' as const};
  beforeEach(()=>{
    localStorage.clear();vi.useFakeTimers();vi.setSystemTime(new Date('2026-10-02T10:00:00Z'));remote=[baseline];pending=[];uploaded=[];
    const client={from:(table:string)=>{
      const query={select:()=>query,eq:()=>query,gte:()=>query,maybeSingle:async()=>({data:null,error:null}),
        then:(resolve:(value:unknown)=>unknown)=>Promise.resolve(resolve({data:table==='completed_sessions'?remote.map(payload=>({payload})):[],error:null})),
        upsert:async(rows: {payload:CompletedSessionSummary}[])=>{if(table==='completed_sessions')uploaded.push(...rows.map(r=>r.payload));return {error:null};}};return query;
    }};
    TestBed.configureTestingModule({providers:[
      {provide:ProgressService,useValue:{buildRound:()=>[unit],recordReview:vi.fn(),recordPracticeAttempt:vi.fn()}},
      {provide:DailyLearningService,useValue:{isCompletedToday:()=>false,refresh:vi.fn()}},
      {provide:MedalService,useValue:{evaluateUnlocks:()=>[]}},
      {provide:SupabaseClientService,useValue:{config:{configured:true},getClient:async()=>client}},
      {provide:SyncOutboxService,useValue:{markLegacyGuestMapped:async()=>undefined,enqueue:vi.fn(async(item:SyncOutboxItem)=>{pending.push(item);}),pending:async()=>pending,count:async()=>pending.length,getMeta:async()=>null,putMeta:async()=>undefined,removeProcessed:async()=>{pending=[];},markAttempt:async()=>undefined}},
      {provide:DeviceService,useValue:{id:'test-device'}},
      {provide:DeckDatabaseService,useValue:{getDeckProgress:async()=>[],getDeckReviewEvents:async()=>[],getAllDailyStates:async()=>[],mergeFromCloud:async()=>undefined}},
      {provide:LocalRushRepository,useValue:{getStats:async()=>({sessions:[],coverage:[]}),mergeFromCloud:async()=>undefined}},
    ]});
    TestBed.inject(WorkspaceService).activateUser('time-test');
    TestBed.inject(StorageService).setFromCloud(key,[baseline]);
  });
  afterEach(()=>{TestBed.resetTestingModule();vi.useRealTimers();});
  function complete(seconds:number){
    const learning=TestBed.inject(LearningSessionService);
    expect(learning.start('self-assessment')).toBe(true);
    vi.setSystemTime(new Date(Date.now()+seconds*1000));learning.reveal();learning.rate('good');
    expect(learning.completed()).toBe(true);
    learning.rate('good'); // Repeated UI action cannot record the completion twice.
    return learning.session()!.id;
  }
  it('adds two real durations exactly once, retains them after stale pulls and reload, and agrees with Analytics',async()=>{
    const history=TestBed.inject(SessionHistoryService),stats=TestBed.inject(ProfileStatsService);
    expect((await stats.load()).studySeconds).toBe(1325);
    const a=complete(40);expect(history.sessions()).toHaveLength(2);
    expect(history.sessions().find(s=>s.sessionId===a)?.durationSeconds).toBe(40);
    vi.setSystemTime(new Date('2026-10-03T10:00:00Z'));
    const b=complete(10);expect(b).not.toBe(a);expect(history.sessions()).toHaveLength(3);
    expect(history.sessions().find(s=>s.sessionId===b)?.durationSeconds).toBe(10);
    expect((await stats.load()).studySeconds).toBe(1375);
    const sync=TestBed.inject(SyncService);expect(await sync.syncNow()).toBe(true);
    expect(uploaded.some(s=>s.sessionId===a&&s.durationSeconds===40)).toBe(true);
    expect(uploaded.some(s=>s.sessionId===b&&s.durationSeconds===10)).toBe(true);
    remote=[{...baseline,durationSeconds:1}];expect(await sync.syncNow()).toBe(true);
    const stored=TestBed.inject(StorageService).get<CompletedSessionSummary[]>(key,[]);
    expect(new Set(stored.map(s=>s.sessionId))).toEqual(new Set(['historic',a,b]));
    expect((await stats.load()).studySeconds).toBe(1375);
    const reloaded=TestBed.runInInjectionContext(()=>new SessionHistoryService());
    expect(reloaded.sessions()).toEqual(stored);
    expect(calculateLearningAnalytics([],reloaded.sessions(),new Date()).summary.seconds).toBe(1375);
    expect((await TestBed.runInInjectionContext(()=>new ProfileStatsService()).load()).studySeconds).toBe(1375);
  });
  it('does not record practice as daily time or invent unknown legacy durations',async()=>{
    const storage=TestBed.inject(StorageService);
    const {durationSeconds,...legacy}=baseline;storage.setFromCloud(key,[legacy]);
    expect((await TestBed.inject(ProfileStatsService).load()).studySeconds).toBe(0);
    const history=TestBed.inject(SessionHistoryService),learning=TestBed.inject(LearningSessionService);
    learning.startPractice([unit],'self-assessment');vi.setSystemTime(new Date(Date.now()+40000));learning.reveal();learning.rate('good');
    expect(learning.completed()).toBe(true);expect(history.sessions()).toHaveLength(1);
    expect((await TestBed.inject(ProfileStatsService).load()).studySeconds).toBe(0);
  });
});
