import {createEnvironmentInjector, EnvironmentInjector} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {IDBFactory, IDBDatabase} from 'fake-indexeddb';
import type {AuthChangeEvent, Session} from '@supabase/supabase-js';
import {MangaSavedRemoteRow, MangaStudySavedItem} from '../models/manga-study-saved.model';
import {MangaStudySavedRepository} from './manga-study-saved.repository';
import {MangaSavedSyncService} from './manga-saved-sync.service';
import {SyncService} from './sync.service';
import {SyncOutboxService} from './sync-outbox.service';
import {WorkspaceService} from './workspace.service';
import {WorkspaceMigrationService} from './workspace-migration.service';
import {SupabaseClientService} from './supabase-client.service';
import {StorageService} from './storage.service';
import {SessionHistoryService} from './session-history.service';
import {DeckDatabaseService} from './deck-database.service';
import {LocalRushRepository} from './rush-repository.service';
import {DeviceService} from './device.service';
import {AuthService} from './auth.service';
import {SyncDiagnosticsService} from './sync-diagnostics.service';
import {makeOutboxItem} from './sync-outbox.service';

const word=(expression='食べる',reading='たべる',page=3):MangaStudySavedItem=>({schemaVersion:1,id:'dictionary:'+JSON.stringify([expression,reading]),expression,reading,kanji:[],context:'First context',meaning:'meaning',source:{volumeId:'volume',pageNumber:page},createdAt:100});
const req=<T>(r:IDBRequest<T>)=>new Promise<T>((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
interface CloudRow extends MangaSavedRemoteRow {user_id:string;restored_revision:number}
class Cloud {
  rows=new Map<string,CloudRow>();calls=0;fail:string|null=null;
  failWrites=new Set<string>();upserted:string[]=[];
  readHook:((user:string)=>Promise<void>)|null=null;
  writeHook:((user:string,args:any)=>Promise<void>)|null=null;
  authEvent:((event:AuthChangeEvent,session:Session|null)=>void)|null=null;
  responseHook:(()=>Promise<void>)|null=null;
  private lock:Promise<void>=Promise.resolve();
  client(user:string){return {
    auth:{onAuthStateChange:(callback:(event:AuthChangeEvent,session:Session|null)=>void)=>{this.authEvent=callback;return {data:{subscription:{unsubscribe:()=>{this.authEvent=null;}}}};}},
    from:(table:string)=>{
      let owner='',start=0,end=499;
      const query:any={select:()=>query,eq:(key:string,value:string)=>{if(key==='user_id')owner=value;return query;},order:()=>query,range:(a:number,b:number)=>{start=a;end=b;return query;},
        maybeSingle:async()=>({data:null,error:null}),
        then:(resolve:any,reject:any)=>(async()=>{
          if(table==='manga_saved_items'){
            await this.readHook?.(user);if(this.fail)return {data:null,error:new Error(this.fail)};
            if(owner!==user)return {data:[],error:null};
            return {data:structuredClone([...this.rows.values()].filter(r=>r.user_id===user).sort((a,b)=>a.item_id.localeCompare(b.item_id)).slice(start,end+1)),error:null};
          }
          return {data:[],error:null};
        })().then(resolve,reject),upsert:async()=>{this.upserted.push(table);return {error:this.failWrites.has(table)?{code:'42501',message:'permission denied: private secret 食べる user a'}:null};}};return query;
    },
    rpc:async(_name:string,args:any)=>{
      this.calls++;await this.writeHook?.(user,args);
      if(this.fail)return {data:null,error:new Error(this.fail)};
      const result=this.lock.then(()=>{
        const key=user+args.p_item_id;
        let row=this.rows.get(key)??{user_id:user,item_id:args.p_item_id,payload:null,deleted_at:'server',revision:0,restored_revision:0,last_operation:null};
        if(row.last_operation!==args.p_operation){
          if(args.p_delete){
            if(row.revision===0||(!row.deleted_at&&args.p_expected_revision>=row.restored_revision&&args.p_expected_revision<=row.revision))
              row={...row,payload:null,deleted_at:'server',revision:row.revision+1,last_operation:args.p_operation};
          }else if(row.revision===0||(!args.p_initial&&row.deleted_at&&args.p_expected_revision===row.revision)){
            row={...row,payload:structuredClone(args.p_payload),deleted_at:null,revision:row.revision+1,
              restored_revision:row.revision?row.revision+1:0,last_operation:args.p_operation};
          }
        }
        this.rows.set(key,row);return {data:[structuredClone(row)],error:null};
      });this.lock=result.then(()=>undefined);const response=await result;await this.responseHook?.();return response;
    },
  };}
}
interface Device {env:EnvironmentInjector;factory:IDBFactory;workspace:WorkspaceService;saved:MangaStudySavedRepository;sync:SyncService;outbox:SyncOutboxService}
describe('Manga Saved Sync V1 with independent durable browser caches',()=>{
  let cloud:Cloud;let devices:Device[];
  beforeEach(()=>{localStorage.clear();vi.useFakeTimers({toFake:['setTimeout','clearTimeout']});cloud=new Cloud();devices=[];vi.spyOn(navigator,'onLine','get').mockReturnValue(true);TestBed.configureTestingModule({});});
  afterEach(()=>{for(const d of devices)if(!d.env.destroyed)d.env.destroy();TestBed.resetTestingModule();vi.restoreAllMocks();vi.unstubAllGlobals();vi.useRealTimers();});
  async function device(user='a',factory=new IDBFactory()):Promise<Device>{
    vi.stubGlobal('indexedDB',factory);
    const env=createEnvironmentInjector([SyncDiagnosticsService,AuthService,WorkspaceService,MangaStudySavedRepository,MangaSavedSyncService,SyncService,SyncOutboxService,StorageService,SessionHistoryService,WorkspaceMigrationService,
      {provide:SupabaseClientService,useValue:{config:{configured:true},getClient:async()=>cloud.client(user)}},{provide:DeviceService,useValue:{id:'test'}},
      {provide:DeckDatabaseService,useValue:{getDeckProgress:async()=>[],getDeckReviewEvents:async()=>[],getAllDailyStates:async()=>[],mergeFromCloud:async()=>{}}},
      {provide:LocalRushRepository,useValue:{getStats:async()=>({sessions:[],coverage:[]}),mergeFromCloud:async()=>{}}},
    ],TestBed.inject(EnvironmentInjector));
    const workspace=env.get(WorkspaceService);workspace.activate(user==='guest'?'guest':`user:${user}`);
    const d={env,factory,workspace,saved:env.get(MangaStudySavedRepository),sync:env.get(SyncService),outbox:env.get(SyncOutboxService)};devices.push(d);
    TestBed.tick();await d.saved.list();await d.outbox.pending(workspace.active());return d;
  }
  const row=(item:MangaStudySavedItem,user='a',deleted=false,revision=1):CloudRow=>({user_id:user,item_id:item.id,payload:deleted?null:item,deleted_at:deleted?'server':null,revision,restored_revision:0,last_operation:null});
  it('PC saves, mobile receives reactively, mobile saves another word and PC receives both without duplication',async()=>{
    const pc=await device(),mobile=await device();const a=word(),b=word('橋','はし');
    await pc.saved.save(a);expect(await pc.sync.syncNow()).toBe(true);expect(await mobile.sync.syncNow()).toBe(true);
    expect(mobile.saved.items()).toEqual([a]);expect(mobile.saved.count()).toBe(1);
    await mobile.saved.save(b);await mobile.sync.syncNow();await pc.sync.syncNow();await pc.sync.syncNow();
    expect(pc.saved.count()).toBe(2);expect(cloud.rows.size).toBe(2);expect(pc.sync.pendingCount()).toBe(0);
  });
  it.each([false,true])('clears journals and confirmed outbox after mobile deletion, with two other module changes=%s',async(others)=>{
    const pc=await device(),mobile=await device(),a=word();await pc.saved.save(a);await pc.sync.syncNow();await mobile.sync.syncNow();
    await mobile.saved.remove(a.id);
    if(others){await mobile.outbox.enqueue(makeOutboxItem('user:a','local-storage','kana-study.settings.v1',{theme:'dark'})!);await mobile.outbox.enqueue(makeOutboxItem('user:a','local-storage','kana-study.deck-settings.v1',{deck:{newLimit:5}})!);}
    expect(await mobile.sync.syncNow()).toBe(true);await pc.sync.syncNow();
    for(const d of [pc,mobile]){expect(d.saved.count()).toBe(0);expect(await d.saved.pending()).toEqual([]);expect(await d.outbox.pending('user:a')).toEqual([]);expect(d.sync.pendingCount()).toBe(0);expect(d.sync.status()).toBe('synced');}
  });
  it.each([1,2])('keeps only %s unconfirmed operations when Manga deletion succeeds before another module fails',async(blocked)=>{
    const pc=await device(),mobile=await device(),a=word();await pc.saved.save(a);await pc.sync.syncNow();await mobile.sync.syncNow();await mobile.saved.remove(a.id);
    for(const key of ['kana-study.settings.v1','kana-study.deck-settings.v1'])await mobile.outbox.enqueue(makeOutboxItem('user:a','local-storage',key,{value:true})!);
    cloud.failWrites.add('user_preferences');if(blocked===2)cloud.failWrites.add('deck_settings');expect(await mobile.sync.syncNow()).toBe(false);
    await pc.sync.syncNow();expect(pc.saved.count()).toBe(0);expect(await mobile.saved.pending()).toEqual([]);
    const pending=await mobile.outbox.pending('user:a');expect(pending).toHaveLength(blocked);expect(pending.every(i=>i.entityType==='local-storage')).toBe(true);expect(mobile.sync.pendingCount()).toBe(blocked);
    const diagnostic=await mobile.sync.inspectDiagnostics();expect(diagnostic?.failure?.phase).toBe('push');expect(diagnostic?.failure?.code).toBe('42501');expect(diagnostic?.failure?.entityType).toBe('local-storage');expect(diagnostic?.pending).toHaveLength(blocked);
    expect(JSON.stringify(diagnostic)).not.toMatch(/食べる|private secret|user:a|dictionary:|revision|token/);
    cloud.failWrites.clear();expect(await mobile.sync.syncNow()).toBe(true);expect(mobile.sync.pendingCount()).toBe(0);
  });
  it('preserves a verified Manga outbox entry if cleanup fails and verifies its journal-free retry',async()=>{
    const pc=await device();await pc.saved.save(word());vi.spyOn(pc.outbox,'removeProcessed').mockRejectedValue(new DOMException('private text','QuotaExceededError'));
    expect(await pc.sync.syncNow()).toBe(false);expect(await pc.saved.pending()).toEqual([]);expect(await pc.outbox.pending('user:a')).toHaveLength(1);
    const diagnostic=await pc.sync.inspectDiagnostics();expect(diagnostic?.failure?.phase).toBe('outbox-ack');expect(diagnostic?.pending[0]).toMatchObject({journalAssociated:false,remote:'confirmed',confirmedAwaitingCleanup:true});
    const factory=pc.factory;pc.env.destroy();const reopened=await device('a',factory);const calls=cloud.calls;
    expect(await reopened.sync.syncNow()).toBe(true);expect(cloud.calls).toBe(calls+1);expect([...cloud.rows.values()][0].revision).toBe(1);expect(await reopened.outbox.pending('user:a')).toEqual([]);
  });
  it('does not remove a replacement Manga outbox revision when cleaning a confirmed earlier push after another module fails',async()=>{
    const pc=await device(),a=word();await pc.saved.save(a);await pc.outbox.enqueue(makeOutboxItem('user:a','local-storage','kana-study.settings.v1',{theme:'dark'})!);
    let once=true;cloud.writeHook=async()=>{if(once){once=false;await pc.saved.remove(a.id);}};cloud.failWrites.add('user_preferences');
    expect(await pc.sync.syncNow()).toBe(false);expect(await pc.saved.pending()).toHaveLength(1);expect((await pc.outbox.pending('user:a')).filter(i=>i.entityType==='manga-saved-item')).toHaveLength(1);
    cloud.failWrites.clear();cloud.writeHook=null;expect(await pc.sync.syncNow()).toBe(true);expect([...cloud.rows.values()][0].deleted_at).not.toBeNull();
  });
  it('reports the exact RPC failure phase and preserves an unverified journal and outbox',async()=>{
    const pc=await device();await pc.saved.save(word());cloud.writeHook=async()=>{throw {code:'42501',message:'JWT private word 食べる 00000000-0000-0000-0000-000000000001'};};
    expect(await pc.sync.syncNow()).toBe(false);const report=await pc.sync.inspectDiagnostics();
    expect(report?.failure).toMatchObject({phase:'push',target:'apply_manga_saved_change_v1',entityType:'manga-saved-item',code:'42501'});
    expect(report?.pending[0]).toMatchObject({journalAssociated:true,remote:'unverified',attempts:1});
    expect(JSON.stringify(report)).not.toMatch(/JWT|private word|食べる|00000000|user:a|dictionary:/);expect(await pc.saved.pending()).toHaveLength(1);
    cloud.writeHook=null;expect(await pc.sync.syncNow()).toBe(true);
  });
  it('clears diagnostics on logout and cannot expose a late inspection to the next account',async()=>{
    const pc=await device();await pc.saved.save(word());cloud.fail='network';await pc.sync.syncNow();
    expect((await pc.sync.inspectDiagnostics())?.pending).toHaveLength(1);
    const pending=pc.outbox.pending.bind(pc.outbox);vi.spyOn(pc.outbox,'pending').mockImplementationOnce(async workspace=>{pc.workspace.activateUser('b');TestBed.tick();return pending(workspace);});
    expect(await pc.sync.inspectDiagnostics()).toBeNull();await pc.saved.reload();expect((await pc.sync.inspectDiagnostics())?.failure).toBeNull();
    pc.workspace.activateGuest();TestBed.tick();expect(await pc.sync.inspectDiagnostics()).toBeNull();
  });
  it('reports connection/session acquisition failure without losing pending local changes',async()=>{
    const pc=await device();await pc.saved.save(word());const supabase=pc.env.get(SupabaseClientService);
    vi.spyOn(supabase,'getClient').mockRejectedValueOnce({code:'PGRST301',message:'private expired JWT'});
    expect(await pc.sync.syncNow()).toBe(false);expect(pc.sync.status()).toBe('error');
    expect((await pc.sync.inspectDiagnostics())?.failure).toMatchObject({phase:'connect',target:'supabase',code:'PGRST301'});
    expect(await pc.saved.pending()).toHaveLength(1);expect(await pc.sync.syncNow()).toBe(true);
  });
  it('duplicate concurrent device saves retain the first confirmed context, while written homophones remain distinct',async()=>{
    const pc=await device(),mobile=await device(),a=word();await pc.saved.save(a);await mobile.saved.save({...a,context:'page 18',source:{...a.source,pageNumber:18}});
    await Promise.all([pc.sync.syncNow(),mobile.sync.syncNow()]);await mobile.sync.syncNow();
    expect(cloud.rows.size).toBe(1);expect(mobile.saved.items()[0].context).toBe('First context');
    await pc.saved.save(word('橋','はし'));await pc.saved.save(word('箸','はし'));await pc.sync.syncNow();expect(cloud.rows.size).toBe(3);
  });
  it('offline saves survive reopening and are uploaded later',async()=>{
    const pc=await device();vi.spyOn(navigator,'onLine','get').mockReturnValue(false);await pc.saved.save(word());expect(await pc.sync.syncNow()).toBe(false);expect(pc.sync.status()).toBe('offline');
    pc.env.destroy();const reopened=await device('a',pc.factory);vi.spyOn(navigator,'onLine','get').mockReturnValue(true);expect(await reopened.sync.syncNow()).toBe(true);expect(cloud.rows.size).toBe(1);
  });
  it('recovers only a durable dirty journal after an outbox enqueue failure',async()=>{
    const pc=await device();vi.spyOn(pc.outbox,'enqueue').mockRejectedValueOnce(new Error('enqueue'));
    await expect(pc.saved.save(word())).rejects.toThrow('enqueue');expect(await pc.saved.list()).toHaveLength(1);expect(await pc.saved.pending()).toHaveLength(1);
    pc.env.destroy();const reopened=await device('a',pc.factory);expect(await reopened.sync.syncNow()).toBe(true);expect(await reopened.saved.pending()).toHaveLength(0);
    const calls=cloud.calls;await reopened.sync.syncNow();expect(cloud.calls).toBe(calls);
  });
  it('the existing automatic sync schedule uploads Manga journal changes',async()=>{
    const pc=await device();await pc.sync.syncNow();await pc.saved.save(word());
    await vi.advanceTimersByTimeAsync(900);
    await vi.waitFor(()=>expect(pc.sync.status()).toBe('synced'));expect(cloud.rows.size).toBe(1);expect(pc.sync.pendingCount()).toBe(0);
  });
  it('Profile counts the durable Manga journal even when enqueue fails',async()=>{
    const pc=await device();await pc.sync.syncNow();vi.spyOn(pc.outbox,'enqueue').mockRejectedValue(new Error('outbox full'));
    await expect(pc.saved.save(word())).rejects.toThrow('outbox full');
    await vi.waitFor(()=>expect(pc.sync.pendingCount()).toBe(1));expect(pc.sync.status()).not.toBe('synced');expect(await pc.saved.list()).toHaveLength(1);
  });
  it('two devices saving different words concurrently preserve both collections',async()=>{
    const pc=await device(),mobile=await device();await pc.saved.save(word());await mobile.saved.save(word('橋','はし'));
    await Promise.all([pc.sync.syncNow(),mobile.sync.syncNow()]);await pc.sync.syncNow();await mobile.sync.syncNow();
    expect(pc.saved.count()).toBe(2);expect(mobile.saved.count()).toBe(2);expect(cloud.rows.size).toBe(2);
  });
  it('a mobile deletion removes an old PC cache instead of resurrecting it',async()=>{
    const pc=await device(),mobile=await device(),a=word();await pc.saved.save(a);await pc.sync.syncNow();await mobile.sync.syncNow();
    await mobile.saved.remove(a.id);expect(mobile.saved.count()).toBe(0);await mobile.sync.syncNow();expect(await pc.saved.exists(a.id)).toBe(true);
    await pc.sync.syncNow();expect(pc.saved.count()).toBe(0);expect([...cloud.rows.values()][0].deleted_at).not.toBeNull();
  });
  it('stale save loses to a newer tombstone; a subsequent explicit save with its known revision restores it',async()=>{
    const pc=await device(),mobile=await device(),a=word();await pc.saved.save(a);await mobile.saved.remove(a.id);await mobile.sync.syncNow();
    await pc.sync.syncNow();expect(pc.saved.count()).toBe(0);await pc.saved.save({...a,context:'new intention'});await pc.sync.syncNow();await mobile.sync.syncNow();
    expect(mobile.saved.items()[0].context).toBe('new intention');expect([...cloud.rows.values()][0].revision).toBe(2);
  });
  it.each([true,false])('concurrent initial save/delete is deletion-safe in either request order: deleteFirst=%s',async(deleteFirst)=>{
    const pc=await device(),mobile=await device(),a=word();await pc.saved.save(a);await mobile.saved.remove(a.id);
    let count=0,release!:()=>void;const gate=new Promise<void>(r=>release=r);cloud.writeHook=async()=>{if(++count===2)release();await gate;};
    await Promise.all(deleteFirst?[mobile.sync.syncNow(),pc.sync.syncNow()]:[pc.sync.syncNow(),mobile.sync.syncNow()]);cloud.writeHook=null;
    await pc.sync.syncNow();await mobile.sync.syncNow();expect(pc.saved.count()).toBe(0);expect(mobile.saved.count()).toBe(0);
  });
  it('offline deletion and clear propagate without resurrecting a second device cache',async()=>{
    const pc=await device(),mobile=await device();await pc.saved.save(word());await pc.saved.save(word('龍','りゅう'));await pc.sync.syncNow();await mobile.sync.syncNow();
    vi.spyOn(navigator,'onLine','get').mockReturnValue(false);await mobile.saved.clear();expect(await mobile.sync.syncNow()).toBe(false);expect(await mobile.saved.pending()).toHaveLength(2);
    vi.spyOn(navigator,'onLine','get').mockReturnValue(true);await mobile.sync.syncNow();await pc.sync.syncNow();expect(pc.saved.count()).toBe(0);expect([...cloud.rows.values()].every(r=>r.deleted_at)).toBe(true);
  });
  it.each(['network','RLS denied','missing table','expired session'])('retains data and pending deletion on %s and never reports Synced',async(error)=>{
    const pc=await device(),a=word();await pc.saved.save(a);await pc.sync.syncNow();await pc.saved.remove(a.id);cloud.fail=error;
    expect(await pc.sync.syncNow()).toBe(false);expect(pc.sync.status()).toBe('error');expect(await pc.saved.pending()).toHaveLength(1);expect(pc.sync.pendingCount()).toBe(1);
    cloud.fail=null;expect(await pc.sync.syncNow()).toBe(true);expect([...cloud.rows.values()][0].deleted_at).not.toBeNull();
  });
  it('interrupted push is idempotent even when the server committed but the response was lost',async()=>{
    const pc=await device();await pc.saved.save(word());
    cloud.responseHook=async()=>{throw new Error('response lost');};
    expect(await pc.sync.syncNow()).toBe(false);expect(await pc.saved.pending()).toHaveLength(1);
    cloud.responseHook=null;expect(await pc.sync.syncNow()).toBe(true);expect([...cloud.rows.values()][0].revision).toBe(1);expect(cloud.rows.size).toBe(1);
  });
  it('a write during pull remains pending, updates the live collection and is not overwritten by a cache snapshot',async()=>{
    const pc=await device(),a=word();let reads=0;cloud.readHook=async()=>{if(++reads===2)await pc.saved.save(a);};
    expect(await pc.sync.syncNow()).toBe(false);expect(pc.sync.status()).toBe('pending');expect(pc.saved.items()).toEqual([a]);
    cloud.readHook=null;expect(await pc.sync.syncNow()).toBe(true);expect(cloud.rows.size).toBe(1);
  });
  it('a new revision written during a push survives processing the old outbox revision',async()=>{
    const pc=await device(),a=word();await pc.saved.save(a);let once=true;cloud.writeHook=async()=>{if(once){once=false;await pc.saved.remove(a.id);}};
    expect(await pc.sync.syncNow()).toBe(false);expect(pc.saved.count()).toBe(0);expect(await pc.saved.pending()).toHaveLength(1);
    cloud.writeHook=null;expect(await pc.sync.syncNow()).toBe(true);expect([...cloud.rows.values()][0].deleted_at).not.toBeNull();
  });
  it('an interrupted pull preserves pending state and cached words for retry',async()=>{
    const pc=await device(),a=word();await pc.saved.save(a);let reads=0;cloud.readHook=async()=>{if(++reads===2)throw Error('pull interrupted');};
    expect(await pc.sync.syncNow()).toBe(false);expect(pc.saved.items()).toEqual([a]);expect(pc.sync.status()).toBe('error');
    cloud.readHook=null;expect(await pc.sync.syncNow()).toBe(true);expect(cloud.rows.size).toBe(1);
  });
  it('bootstraps V1 historical rows once, preserves canonical context and respects tombstones',async()=>{
    const factory=new IDBFactory(),a=word(),b=word('橋','はし'),c=word('龍','りゅう');
    const opening=factory.open('kana-study-manga-study--a',1);opening.onupgradeneeded=()=>opening.result.createObjectStore('saved-items',{keyPath:'id'});const db=await req(opening);
    const tx=db.transaction('saved-items','readwrite');for(const item of [a,b,c])tx.objectStore('saved-items').put(item);
    await new Promise<void>((r,j)=>{tx.oncomplete=()=>r();tx.onerror=()=>j(tx.error);});db.close();
    cloud.rows.set('a'+b.id,row({...b,context:'canonical'}));cloud.rows.set('a'+c.id,row(c,'a',true));
    const pc=await device('a',factory);expect(await pc.saved.list()).toHaveLength(3);expect(await pc.sync.syncNow()).toBe(true);
    expect(pc.saved.count()).toBe(2);expect((await pc.saved.get(b.id))?.context).toBe('canonical');expect(cloud.rows.size).toBe(3);
    const calls=cloud.calls;await pc.sync.syncNow();expect(cloud.calls).toBe(calls);
  });
  it('an empty local collection downloads the remote collection rather than clearing it, with full pagination',async()=>{
    for(let i=0;i<501;i++){const item={...word('word'+i,'reading'),createdAt:i};cloud.rows.set('a'+item.id,row(item));}
    const pc=await device();expect(await pc.sync.syncNow()).toBe(true);expect(pc.saved.count()).toBe(501);expect(cloud.calls).toBe(0);
  });
  it('Guest remains local, is detected by itself and only explicit merge imports eligible words',async()=>{
    const guest=await device('guest');await guest.saved.save(word());expect(await guest.sync.syncNow()).toBe(false);expect(cloud.rows.size).toBe(0);expect(await guest.outbox.pending('guest')).toEqual([]);
    vi.stubGlobal('indexedDB',guest.factory);const migration=guest.env.get(WorkspaceMigrationService);expect(await migration.hasGuestData()).toBe(true);
    const a=word();cloud.rows.set('a'+a.id,row(a,'a',true));await migration.copyGuestToUser('a');guest.workspace.activateUser('a');TestBed.tick();await guest.saved.reload();
    // The client in this fixture has Guest identity; the user-scoped adapter must use authenticated a.
    const account=await device('a',guest.factory);expect(await account.sync.syncNow()).toBe(true);expect(account.saved.count()).toBe(0);expect(await guest.saved.list('guest')).toEqual([a]);
  });
  it('Use my account never copies Guest data and isolates A, B and Guest',async()=>{
    const pc=await device('guest');await pc.saved.save(word());pc.workspace.markImportDecision('a','account');pc.workspace.activateUser('a');await pc.saved.reload();expect(pc.saved.count()).toBe(0);
    await pc.saved.save(word('橋','はし'),'user:a');pc.workspace.activateUser('b');TestBed.tick();await pc.saved.reload();expect(pc.saved.count()).toBe(0);
    pc.workspace.activateGuest();TestBed.tick();await pc.saved.reload();expect(pc.saved.items()).toEqual([word()]);
  });
  it('account switching during pull ignores a late private response and cannot confirm the next account',async()=>{
    const pc=await device();const a=word();cloud.rows.set('a'+a.id,row(a));let once=true;
    cloud.readHook=async()=>{if(once){once=false;pc.workspace.activateUser('b');TestBed.tick();await pc.saved.reload();}};
    expect(await pc.sync.syncNow()).toBe(false);expect(pc.saved.count()).toBe(0);expect(pc.workspace.userId()).toBe('b');expect(pc.sync.status()).not.toBe('synced');
  });
  it('aborted local writes preserve words and never create a fake success',async()=>{
    const pc=await device();await pc.saved.save(word());
    const transaction=IDBDatabase.prototype.transaction;vi.spyOn(IDBDatabase.prototype,'transaction').mockImplementationOnce(function(this:IDBDatabase,...args:Parameters<IDBDatabase['transaction']>){const tx=transaction.apply(this,args);tx.abort();return tx;});
    await expect(pc.saved.remove(word().id)).rejects.toThrow();expect(await pc.saved.exists(word().id)).toBe(true);
  });
  it('a blocked IndexedDB upgrade reports failure, preserves V1 data and can retry after the old tab closes',async()=>{
    const factory=new IDBFactory(),a=word();
    const opening=factory.open('kana-study-manga-study--a',1);opening.onupgradeneeded=()=>opening.result.createObjectStore('saved-items',{keyPath:'id'});
    const legacy=await req(opening);await req(legacy.transaction('saved-items','readwrite').objectStore('saved-items').put(a));
    await expect(device('a',factory)).rejects.toThrow('IndexedDB blocked');
    const pc=devices[0];await pc.saved.reload();expect(pc.saved.failed()).toBe(true);expect(await pc.sync.syncNow()).toBe(false);expect(pc.sync.status()).toBe('error');
    legacy.close();await vi.waitFor(async()=>expect(await pc.saved.list()).toEqual([a]));
    expect(await pc.sync.syncNow()).toBe(true);expect(cloud.rows.size).toBe(1);
  });
  it.each(['merge','account'] as const)('Manga-only Guest data requests the real auth import decision, then honors %s',async(decision)=>{
    const pc=await device();pc.workspace.activateGuest();TestBed.tick();await pc.saved.save(word());
    const auth=pc.env.get(AuthService);await Promise.resolve();
    cloud.authEvent!('SIGNED_IN',{user:{id:'a',email:'a@example.com'}} as Session);
    await vi.waitFor(()=>expect(auth.needsGuestImportDecision()).toBe(true));expect(pc.workspace.active()).toBe('guest');expect(cloud.rows.size).toBe(0);
    await auth.chooseGuestImport(decision);TestBed.tick();await pc.saved.reload();
    expect(pc.workspace.active()).toBe('user:a');expect(auth.needsGuestImportDecision()).toBe(false);
    expect(pc.saved.count()).toBe(decision==='merge'?1:0);expect(await pc.saved.list('guest')).toEqual([word()]);
    expect(await pc.sync.syncNow()).toBe(true);expect(cloud.rows.size).toBe(decision==='merge'?1:0);
  });
  it('saving Manga words leaves FSRS, Weakness, daily state, completed sessions and time unchanged',async()=>{
    const pc=await device(),keys=['kana-study.study-progress.v2','kana-study.weaknesses.v1','kana-study.completed-sessions.v1','kana-study.vocabulary-progress.v1'];
    for(const key of keys)localStorage.setItem(key,'sentinel');const before=keys.map(k=>localStorage.getItem(k));
    await pc.saved.save(word());await pc.sync.syncNow();expect(keys.map(k=>localStorage.getItem(k))).toEqual(before);
  });
});
