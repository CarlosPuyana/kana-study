import { TestBed } from '@angular/core/testing';
import { LeaderboardService, mapLeaderboard } from './leaderboard.service';
import { SupabaseClientService } from './supabase-client.service';
const row = {position:1,username:'tester',display_name:'Tester',study_seconds:0,medal_count:0,is_current_user:true};
describe('LeaderboardService',()=>{
  it('maps snake case, safe numeric strings and current user without exposing extra fields',()=>{
    expect(mapLeaderboard([{...row,study_seconds:'138',email:'private'}, {...row,username:'second',is_current_user:false}])).toEqual([
      {position:1,username:'tester',displayName:'Tester',studySeconds:138,medalCount:0,isCurrentUser:true},
      {position:1,username:'second',displayName:'Tester',studySeconds:0,medalCount:0,isCurrentUser:false},
    ]);
  });
  it('drops malformed rows and rejects an invalid root',()=>{
    expect(mapLeaderboard([null,{...row,study_seconds:-1},{...row,is_current_user:'false'},{...row,medal_count:'NaN'}])).toEqual([]);
    expect(()=>mapLeaderboard({})).toThrow();
  });
  it('loads the RPC once, preserves order, and retains data on refresh error',async()=>{
    const rpc=vi.fn().mockResolvedValueOnce({data:[row,{...row,position:2,username:'second'}],error:null}).mockResolvedValueOnce({data:null,error:new Error('offline')});
    TestBed.configureTestingModule({providers:[{provide:SupabaseClientService,useValue:{getClient:async()=>({rpc})}}]});
    const service=TestBed.inject(LeaderboardService);expect(rpc).not.toHaveBeenCalled();
    await service.load();await service.load();expect(rpc).toHaveBeenCalledExactlyOnceWith('get_leaderboard_v1');
    expect(service.entries().map(e=>e.username)).toEqual(['tester','second']);
    await service.load(true);expect(service.status()).toBe('error');expect(service.entries()).toHaveLength(2);
  });
  it('deduplicates concurrent loads and exposes loading state',async()=>{
    let resolve!:(value:unknown)=>void;const rpc=vi.fn(()=>new Promise(r=>resolve=r));
    TestBed.configureTestingModule({providers:[{provide:SupabaseClientService,useValue:{getClient:async()=>({rpc})}}]});
    const service=TestBed.inject(LeaderboardService), pending=service.load();expect(service.status()).toBe('loading');
    expect(service.load()).toBe(pending);await Promise.resolve();resolve({data:[],error:null});await pending;expect(service.status()).toBe('loaded');
  });
});
