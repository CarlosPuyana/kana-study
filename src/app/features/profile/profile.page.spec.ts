import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { ProfilePage } from './profile.page';
import { AuthService } from '../../core/services/auth.service';
import { SyncService } from '../../core/services/sync.service';
import { ProfileStatsService, profileMedals } from '../../core/services/profile-stats.service';
import { SupabaseClientService } from '../../core/services/supabase-client.service';
import { MEDAL_DEFINITIONS } from '../../data/medals';
describe('Profile V2',()=>{
  const stats={streak:4,studySeconds:8299,completedSessions:10,reviews:44,rushCards:12,kana:4,kanji:3,vocabulary:2,deckUnseen:10,deckLearning:2,deckReview:1,
    medals:profileMedals(MEDAL_DEFINITIONS.slice(0,5).map(d=>({medalId:d.id,unlockedAt:'2026-10-01T00:00:00Z'})),[])};
  let rpc:ReturnType<typeof vi.fn>,syncNow:ReturnType<typeof vi.fn>,load:ReturnType<typeof vi.fn>;
  beforeEach(()=>{
    vi.stubGlobal('matchMedia',vi.fn(()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()})));
    rpc=vi.fn(async()=>({data:[{position:1,username:'tester',display_name:'Tester',study_seconds:8299,medal_count:5,is_current_user:true}],error:null}));
    syncNow=vi.fn(async()=>true);load=vi.fn(async()=>stats);
    TestBed.configureTestingModule({providers:[provideRouter([]),
      {provide:AuthService,useValue:{authenticated:()=>true,profile:()=>({displayName:'Tester',username:'tester',bio:'Bio',createdAt:'2026-10-01T00:00:00Z'}),initials:()=> 'T',user:()=>({email:'private@example.test'})}},
      {provide:SyncService,useValue:{syncNow,status:signal('idle'),lastSyncedAt:signal(null),pendingCount:signal(0)}},
      {provide:ProfileStatsService,useValue:{load}}, {provide:SupabaseClientService,useValue:{getClient:async()=>({rpc})}},
    ]});
  });
  afterEach(()=>vi.unstubAllGlobals());
  it('defaults to summary, renders all owned badges and does not load ranking',async()=>{
    const f=TestBed.createComponent(ProfilePage);await f.whenStable();f.detectChanges();
    expect(rpc).not.toHaveBeenCalled();expect(f.nativeElement.querySelectorAll('app-medal-badge')).toHaveLength(5);
    expect(f.componentInstance.formatDuration(3599)).toBe('59 min');expect(f.componentInstance.formatDuration(0)).toBe('0 min');
  });
  it('shows a clean zero-medal state',async()=>{
    load.mockResolvedValue({...stats,medals:[]});const f=TestBed.createComponent(ProfilePage);await f.whenStable();f.detectChanges();
    expect(f.nativeElement.querySelector('.empty-medals').textContent).toContain('Sin medallas');expect(f.nativeElement.querySelectorAll('app-medal-badge')).toHaveLength(0);
  });
  it('loads only on opening ranking, highlights current user and reuses loaded entries',async()=>{
    const f=TestBed.createComponent(ProfilePage);f.componentInstance.selectView('leaderboard');await f.whenStable();f.detectChanges();
    expect(f.nativeElement.querySelector('.current-user').textContent).toContain('Tú');expect(f.nativeElement.querySelector('table').textContent).not.toContain('private@example.test');
    f.componentInstance.selectView('summary');f.componentInstance.selectView('leaderboard');await f.whenStable();expect(rpc).toHaveBeenCalledTimes(1);
  });
  it('refreshes sync, personal stats and ranking in order',async()=>{
    const f=TestBed.createComponent(ProfilePage);await f.whenStable();load.mockClear();await f.componentInstance.refreshLeaderboard();
    expect(syncNow).toHaveBeenCalledTimes(1);expect(load).toHaveBeenCalledTimes(1);expect(rpc).toHaveBeenCalledTimes(1);
    expect(syncNow.mock.invocationCallOrder[0]).toBeLessThan(load.mock.invocationCallOrder[0]);expect(load.mock.invocationCallOrder[0]).toBeLessThan(rpc.mock.invocationCallOrder[0]);
  });
  it('renders ranking errors within the section and retains profile identity',async()=>{
    rpc.mockResolvedValue({data:null,error:new Error('RPC unavailable')});const f=TestBed.createComponent(ProfilePage);f.componentInstance.selectView('leaderboard');await f.whenStable();f.detectChanges();
    expect(f.nativeElement.querySelector('[role=alert]')).not.toBeNull();expect(f.nativeElement.querySelector('.hero').textContent).toContain('Tester');
  });
  it('renders a loading status before the RPC finishes',async()=>{
    let resolve!:(value:unknown)=>void;rpc.mockImplementation(()=>new Promise(r=>resolve=r));const f=TestBed.createComponent(ProfilePage);f.componentInstance.selectView('leaderboard');await Promise.resolve();f.detectChanges();
    expect(f.nativeElement.querySelector('[role=status]')).not.toBeNull();resolve({data:[],error:null});await f.whenStable();
  });
});
