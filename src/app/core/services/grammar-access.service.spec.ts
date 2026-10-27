import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import type { User } from '@supabase/supabase-js';
import { AuthService } from './auth.service';
import { GrammarAccessService } from './grammar-access.service';
import { SupabaseClientService } from './supabase-client.service';
import { WorkspaceService } from './workspace.service';

describe('Grammar beta access leases and account fences',()=>{
  const ready=signal(true),user=signal<User|null>(null);
  const select=vi.fn(),eq=vi.fn(),response=vi.fn();
  const client={from:vi.fn(()=>({select,eq,maybeSingle:response}))};
  let getClient:ReturnType<typeof vi.fn>;
  const account=(id:string)=>{user.set({id} as User);TestBed.inject(WorkspaceService).activateUser(id);};
  const settle=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
  beforeEach(()=>{
    localStorage.clear();ready.set(true);user.set(null);vi.clearAllMocks();
    select.mockImplementation(()=>({eq}));eq.mockImplementation(()=>({maybeSingle:response}));
    response.mockResolvedValue({data:{enabled:true},error:null});
    getClient=vi.fn(async()=>client);
    TestBed.configureTestingModule({providers:[{provide:AuthService,useValue:{ready,user}},
      {provide:SupabaseClientService,useValue:{getClient}}]});
  });
  afterEach(()=>{TestBed.resetTestingModule();vi.useRealTimers();localStorage.clear();});
  function service(){const s=TestBed.inject(GrammarAccessService);TestBed.tick();return s;}
  it('denies Guest and ignores URL/localStorage switches and historical progress',async()=>{
    const progress='{"version":2,"concepts":{"historical":{"status":"completed"}}}';
    localStorage.setItem('kana-study.grammar-progress.v2',progress);
    localStorage.setItem('grammarAccess','authorized');localStorage.setItem('GRAMMAR_ENABLED','true');
    const s=service();expect(await s.check(true)).toBe(false);expect(s.state()).toBe('denied');
    expect(getClient).not.toHaveBeenCalled();expect(localStorage.getItem('kana-study.grammar-progress.v2')).toBe(progress);
  });
  it.each([null,{enabled:false}])('denies ungranted and disabled accounts (%j)',async data=>{
    account('A');response.mockResolvedValue({data,error:null});const s=service();
    expect(await s.check()).toBe(false);expect(s.state()).toBe('denied');expect(eq).toHaveBeenCalledWith('user_id','A');
  });
  it('waits for Auth then permission without exposing content; only literal true grants',async()=>{
    ready.set(false);const s=service();let resolve!:(v:unknown)=>void;
    response.mockReturnValue(new Promise(r=>resolve=r));const entry=s.check(true);
    expect(s.allowed()).toBe(false);expect(response).not.toHaveBeenCalled();
    account('A');ready.set(true);TestBed.tick();await settle();
    expect(s.state()).toBe('checking');expect(s.allowed()).toBe(false);
    resolve({data:{enabled:true},error:null});expect(await entry).toBe(true);expect(s.allowed()).toBe(true);
    expect(Object.keys(localStorage).some(k=>/grammar.*access/i.test(k))).toBe(false);
  });
  it('fails closed on missing configuration, network errors and malformed positive values',async()=>{
    account('A');getClient.mockResolvedValue(null);const s=service();
    expect(await s.check(true)).toBe(false);expect(s.state()).toBe('error');
    getClient.mockResolvedValue(client);response.mockRejectedValue(new Error('offline'));
    expect(await s.check(true)).toBe(false);expect(s.state()).toBe('error');
    response.mockResolvedValue({data:{enabled:'true'},error:null});expect(await s.check(true)).toBe(false);
  });
  it('discards old A replies on A→B→A and workspace changes, including errors',async()=>{
    account('A');let release!:(v:unknown)=>void;response.mockReturnValueOnce(new Promise(r=>release=r));
    const s=service(),old=s.check();await settle();
    account('B');expect(s.allowed()).toBe(false);TestBed.tick();
    expect(await s.check()).toBe(true);account('A');expect(s.allowed()).toBe(false);TestBed.tick();
    expect(await s.check()).toBe(true);release({data:null,error:{message:'old error'}});expect(await old).toBe(false);
    expect(s.allowed()).toBe(true);TestBed.inject(WorkspaceService).activateGuest();expect(s.allowed()).toBe(false);
  });
  it('logout invalidates an in-flight grant and does not erase saved progress',async()=>{
    account('A');let release!:(v:unknown)=>void;response.mockReturnValueOnce(new Promise(r=>release=r));
    const s=service(),old=s.check();await settle();
    user.set(null);TestBed.inject(WorkspaceService).activateGuest();TestBed.tick();
    release({data:{enabled:true},error:null});expect(await old).toBe(false);expect(s.allowed()).toBe(false);
  });
  it('expires after 60 seconds, blocks during revalidation and respects revocation',async()=>{
    vi.useFakeTimers();account('A');const s=service();expect(await s.check()).toBe(true);
    let release!:(v:unknown)=>void;response.mockReturnValueOnce(new Promise(r=>release=r));
    await vi.advanceTimersByTimeAsync(GrammarAccessService.leaseMs);
    expect(s.allowed()).toBe(false);expect(s.state()).toBe('checking');
    release({data:{enabled:false},error:null});await settle();expect(s.state()).toBe('denied');
  });
  it('forces fresh checks on entry and foreground, including a same-account Auth event',async()=>{
    account('A');const s=service();expect(await s.check()).toBe(true);const before=response.mock.calls.length;
    expect(await s.check(true)).toBe(true);expect(response.mock.calls.length).toBe(before+1);
    response.mockResolvedValue({data:{enabled:false},error:null});
    window.dispatchEvent(new Event('focus'));expect(s.allowed()).toBe(false);await settle();expect(s.state()).toBe('denied');
    response.mockResolvedValue({data:{enabled:true},error:null});user.set({id:'A'} as User);TestBed.tick();
    expect(await s.check()).toBe(true);
  });
  it('bounds unresolved permission requests and ignores late successes',async()=>{
    vi.useFakeTimers();account('A');let release!:(v:unknown)=>void;
    response.mockReturnValue(new Promise(r=>release=r));const s=service(),entry=s.check();
    await vi.advanceTimersByTimeAsync(GrammarAccessService.requestMs);expect(await entry).toBe(false);expect(s.state()).toBe('error');
    release({data:{enabled:true},error:null});await settle();expect(s.allowed()).toBe(false);
  });
  it('fails closed if Auth initialization never completes',async()=>{
    vi.useFakeTimers();ready.set(false);const s=service(),entry=s.check(true);
    await vi.advanceTimersByTimeAsync(GrammarAccessService.requestMs);
    expect(await entry).toBe(false);expect(s.state()).toBe('error');expect(s.allowed()).toBe(false);expect(getClient).not.toHaveBeenCalled();
  });
  it('shares an entry check with simultaneous foreground events instead of invalidating it',async()=>{
    account('A');let release!:(v:unknown)=>void;response.mockReturnValue(new Promise(r=>release=r));
    const s=service(),entry=s.check(true);await settle();
    window.dispatchEvent(new Event('focus'));document.dispatchEvent(new Event('visibilitychange'));
    expect(response).toHaveBeenCalledOnce();expect(s.allowed()).toBe(false);
    release({data:{enabled:true},error:null});expect(await entry).toBe(true);expect(s.allowed()).toBe(true);
  });
});
