import {TestBed} from '@angular/core/testing';
import {AuthService} from './auth.service';
import {SupabaseClientService} from './supabase-client.service';
import {SupabaseCustomDeckTransport} from './custom-deck-sync-transport';

describe('Custom transport session capture, without a new authentication system',()=>{
  afterEach(()=>TestBed.resetTestingModule());
  it('pins the captured session Authorization header instead of allowing a later SDK token lookup to select another account',async()=>{
    let account='owner-a';const header=vi.fn();
    const builder={setHeader:(name:string,value:string)=>{header(name,value);return Promise.resolve({data:{schemaVersion:1,entities:[],serverRevision:'0'},error:null});}};
    const client={auth:{getSession:async()=>({data:{session:{user:{id:'owner-a'},access_token:'test-session-a'}},error:null})},rpc:vi.fn(()=>builder)};
    TestBed.configureTestingModule({providers:[{provide:AuthService,useValue:{user:()=>({id:account})}},{provide:SupabaseClientService,useValue:{getClient:async()=>client}}]});
    const transport=TestBed.inject(SupabaseCustomDeckTransport);await transport.changes('owner-a','0',100);
    expect(header).toHaveBeenCalledWith('Authorization','Bearer test-session-a');expect(client.rpc).toHaveBeenCalledOnce();account='owner-b';
    await expect(transport.changes('owner-a','0',100)).rejects.toThrow();expect(client.rpc).toHaveBeenCalledOnce();
  });
  it('refuses a changed session before any RPC is sent',async()=>{
    const rpc=vi.fn(),client={auth:{getSession:async()=>({data:{session:{user:{id:'owner-b'},access_token:'test-session-b'}},error:null})},rpc};
    TestBed.configureTestingModule({providers:[{provide:AuthService,useValue:{user:()=>({id:'owner-a'})}},{provide:SupabaseClientService,useValue:{getClient:async()=>client}}]});
    await expect(TestBed.inject(SupabaseCustomDeckTransport).changes('owner-a','0',100)).rejects.toThrow();expect(rpc).not.toHaveBeenCalled();
  });
});
