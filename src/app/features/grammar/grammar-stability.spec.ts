import {Component,signal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {provideRouter,Router} from '@angular/router';
import {RouterTestingHarness} from '@angular/router/testing';
import {AuthService} from '../../core/services/auth.service';
import {GrammarAccessService} from '../../core/services/grammar-access.service';
import {SupabaseClientService} from '../../core/services/supabase-client.service';
import {WorkspaceService} from '../../core/services/workspace.service';
import {StorageService} from '../../core/services/storage.service';
import {SyncOutboxService} from '../../core/services/sync-outbox.service';
import {AttemptRecordingService} from '../../core/services/attempt-recording.service';
import {GrammarV2ProgressService} from '../../core/services/grammar-v2-progress.service';
import {GRAMMAR_PROGRESS_V2_KEY} from '../../core/models/grammar-v2.model';
import {GrammarAccessShell} from '../grammar-access/grammar-access-shell';
import {GrammarExerciseComponent} from './components/grammar-exercise';
import {GrammarPage} from './pages/grammar.page';
import {GRAMMAR_ROUTES} from './grammar.routes';

@Component({template:'Access boundary fixture'}) class AccessFixture {}

describe('An active grammar lesson survives data and access revalidation',()=>{
  const user=signal({id:'A'}),record=vi.fn(),response=vi.fn();
  beforeEach(()=>{
    localStorage.clear();user.set({id:'A'});record.mockReset();response.mockResolvedValue({data:{enabled:true},error:null});
    vi.stubGlobal('matchMedia',()=>({matches:false,addEventListener:()=>{},removeEventListener:()=>{}}));
    vi.spyOn(window,'scrollTo').mockImplementation(()=>{});
    TestBed.configureTestingModule({providers:[
      {provide:AuthService,useValue:{ready:signal(true),user}},
      {provide:SupabaseClientService,useValue:{getClient:async()=>({from:()=>({select:()=>({eq:()=>({maybeSingle:response})})})})}},
      {provide:SyncOutboxService,useValue:{enqueue:vi.fn(async()=>{})}},
      {provide:AttemptRecordingService,useValue:{begin:()=>({record})}},
      provideRouter([{path:'grammar',component:GrammarAccessShell,children:GRAMMAR_ROUTES},{path:'grammar-access',component:AccessFixture}]),
    ]});
    TestBed.inject(WorkspaceService).activateUser('A');
  });
  afterEach(()=>{TestBed.resetTestingModule();vi.useRealTimers();vi.restoreAllMocks();vi.unstubAllGlobals();});
  async function lesson(){
    const access=TestBed.inject(GrammarAccessService);TestBed.tick();await access.check();
    const h=await RouterTestingHarness.create('/grammar/n5/01/sentence-structure-context');
    await h.fixture.whenStable();
    const page=h.fixture.debugElement.query(By.directive(GrammarPage)).componentInstance as GrammarPage;
    const exercise=h.fixture.debugElement.query(By.directive(GrammarExerciseComponent)).componentInstance as GrammarExerciseComponent;
    return {h,page,exercise,access};
  }
  it('separates same-workspace data/import revisions from lesson initialization',async()=>{
    const {h,page,exercise}=await lesson();
    exercise.select(0);exercise.check();h.detectChanges();page.continueExercise();await h.fixture.whenStable();
    exercise.select(1);const index=page.exerciseIndex(),scrollCalls=vi.mocked(window.scrollTo).mock.calls.length;
    const storage=TestBed.inject(StorageService),modern=TestBed.inject(GrammarV2ProgressService);
    const hydrated=structuredClone(modern.state());
    hydrated.resume={conceptId:'change-naru',path:'/grammar/n5/10/change-naru',exerciseIndex:4,updatedAt:'2027-01-01T00:00:00Z'};
    storage.setFromCloud(GRAMMAR_PROGRESS_V2_KEY,hydrated);
    // The import changes actual data while retaining the activation/account.
    const conceptId=page.lesson()!.id;
    localStorage.setItem(GRAMMAR_PROGRESS_V2_KEY,JSON.stringify({version:2,concepts:{},practices:{},review:{[conceptId]:{conceptId,topicId:'01',active:true,updatedAt:'2027-01-02T00:00:00Z'}}}));
    const workspace=TestBed.inject(WorkspaceService),epoch=workspace.activationRevision();
    const revision=workspace.dataRevision();
    workspace.copyGuestLocalStorageToUser('A');TestBed.tick();await h.fixture.whenStable();
    expect(workspace.dataRevision()).toBeGreaterThan(revision);
    expect(workspace.activationRevision()).toBe(epoch);
    expect(page.exerciseIndex()).toBe(index);expect(exercise.selected()).toBe(1);
    expect(h.fixture.debugElement.query(By.directive(GrammarPage)).componentInstance).toBe(page);
    expect(vi.mocked(window.scrollTo).mock.calls).toHaveLength(scrollCalls);
    expect(record).toHaveBeenCalledOnce();
    expect(modern.state().resume?.conceptId).toBe('change-naru');
  });
  it('retains feedback and exactly one attempt after timeout, late response and same-account refresh',async()=>{
    const {h,page,exercise,access}=await lesson();vi.useFakeTimers();
    exercise.select(0);exercise.check();h.detectChanges();
    let release!:(value:unknown)=>void;response.mockReturnValueOnce(new Promise(r=>release=r));
    const checking=access.check(true);
    user.set({id:'A'});TestBed.tick();
    await vi.advanceTimersByTimeAsync(GrammarAccessService.requestMs);expect(await checking).toBe(false);
    TestBed.tick();expect(access.refreshFailed()).toBe(true);expect(access.allowed()).toBe(true);
    release({data:{enabled:false},error:null});await Promise.resolve();TestBed.tick();
    expect(access.allowed()).toBe(true);expect(exercise.checked()).toBe(true);
    expect(h.fixture.debugElement.query(By.directive(GrammarPage)).componentInstance).toBe(page);
    exercise.check();expect(record).toHaveBeenCalledOnce();
    expect(TestBed.inject(Router).url).toContain('sentence-structure-context');
    response.mockResolvedValue({data:{enabled:true},error:null});
    await vi.advanceTimersByTimeAsync(GrammarAccessService.leaseMs);TestBed.tick();
    expect(access.refreshFailed()).toBe(false);expect(exercise.checked()).toBe(true);
  });
  it('closes the old activity on a real workspace change without copying its answers',async()=>{
    const {h,exercise}=await lesson();exercise.select(0);exercise.check();h.detectChanges();
    const workspace=TestBed.inject(WorkspaceService),storage=TestBed.inject(StorageService);
    const saved=localStorage.getItem(workspace.storageKey(GRAMMAR_PROGRESS_V2_KEY));
    workspace.activateUser('B');h.detectChanges();await h.fixture.whenStable();
    expect(h.fixture.debugElement.query(By.directive(GrammarPage))).toBeNull();
    expect(TestBed.inject(Router).url).toContain('/grammar-access');
    expect(storage.get(GRAMMAR_PROGRESS_V2_KEY,null)).toBeNull();
    expect(localStorage.getItem(workspace.storageKey(GRAMMAR_PROGRESS_V2_KEY,'user:A'))).toBe(saved);
    expect(record).toHaveBeenCalledOnce();
  });
});
