import {signal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb';
import fixture from '../../../../supabase/tests/h2ba-fixture.json';
import {MangaConfirmedCardOperation} from '../models/manga-deck-confirmation.model';
import {AuthService} from './auth.service';
import {SupabaseClientService} from './supabase-client.service';
import {WorkspaceService} from './workspace.service';
import {WorkspaceMigrationService} from './workspace-migration.service';
import {CUSTOM_DECK_IDB,CustomDeckRepository} from './custom-deck.repository';
import {CUSTOM_DECKS_ENABLED,CUSTOM_DECK_SYNC_ENABLED,CUSTOM_REMOTE_UPLOAD_APPROVED} from './custom-deck-gates';
import {MANGA_DECK_ASSISTED_ENABLED} from './manga-deck-gate';
import {hasLocalCustomData,hasLegacyLocalData} from './custom-local-presence';
import {DeckCatalogService} from './deck-catalog.service';
import {DeckDatabaseService} from './deck-database.service';

describe('Local custom Guest/account boundaries with controlled Auth events (no Supabase Auth)',()=>{
 let factory:IDBFactory,listener:(event:any,session:any)=>void,auth:AuthService,workspace:WorkspaceService,repo:CustomDeckRepository,migration:WorkspaceMigrationService;
 let user='local-a',profileReply:()=>Promise<any>;const cloud=vi.fn(()=>{throw Error('Unexpected cloud access');});
 beforeEach(async()=>{
  localStorage.clear();factory=new IDBFactory();vi.stubGlobal('indexedDB',factory);vi.stubGlobal('IDBKeyRange',IDBKeyRange);cloud.mockClear();user='local-a';profileReply=async()=>({data:null});
  const client={auth:{onAuthStateChange:(cb:typeof listener)=>{listener=cb;return {data:{subscription:{unsubscribe(){}}}};},signInWithPassword:async()=>{listener('SIGNED_IN',{user:{id:user}});return {error:null};},signOut:async()=>{listener('SIGNED_OUT',null);}},from:()=>({select:()=>({eq:()=>({maybeSingle:()=>profileReply()})})}),rpc:cloud};
  TestBed.configureTestingModule({providers:[{provide:CUSTOM_DECK_IDB,useValue:factory},{provide:CUSTOM_DECKS_ENABLED,useValue:signal(true)},{provide:MANGA_DECK_ASSISTED_ENABLED,useValue:signal(true)},{provide:SupabaseClientService,useValue:{config:{configured:true},getClient:async()=>client}}]});
  auth=TestBed.inject(AuthService);workspace=TestBed.inject(WorkspaceService);repo=TestBed.inject(CustomDeckRepository);migration=TestBed.inject(WorkspaceMigrationService);await Promise.resolve();
 });
 afterEach(()=>{TestBed.resetTestingModule();localStorage.clear();vi.unstubAllGlobals();vi.restoreAllMocks();});
 async function create(){const op=structuredClone(fixture) as unknown as MangaConfirmedCardOperation;await repo.confirmMangaCard({...op,confirmation:{...op.confirmation,workspace:workspace.active(),actor:{...op.confirmation.actor,workspace:workspace.active()}}});}
 const login=()=>auth.signIn('synthetic@example.invalid','controlled-password');
 it('absent database inspection leaves no database or writes behind',async()=>{
  expect(await hasLocalCustomData('guest',factory)).toBe(false);expect(await hasLegacyLocalData(factory)).toBe(false);expect(await factory.databases()).toEqual([]);
 });
 it('presence inspection does not upgrade an old database or repair its records',async()=>{
  const db=await new Promise<IDBDatabase>((resolve,reject)=>{const r=factory.open('kana-study-custom-decks-v1',1);r.onupgradeneeded=()=>{r.result.createObjectStore('cards',{keyPath:['workspace','key']}).createIndex('workspace','workspace');};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
  await new Promise<void>(resolve=>{const tx=db.transaction('cards','readwrite');tx.objectStore('cards').put({workspace:'guest',key:'historic',value:{unmodified:true}});tx.oncomplete=()=>resolve();});db.close();
  expect(await hasLocalCustomData('guest',factory)).toBe(true);expect(await hasLocalCustomData('user:local-a',factory)).toBe(false);expect(await factory.databases()).toEqual([{name:'kana-study-custom-decks-v1',version:1}]);
 });
 it('detects Guest independently of both cloud gates without changing inventory, versions or invoking RPC',async()=>{
  await create();const before=await repo.guestInventory(),databases=await factory.databases();
  expect(TestBed.inject(CUSTOM_DECK_SYNC_ENABLED)()).toBe(false);expect(TestBed.inject(CUSTOM_REMOTE_UPLOAD_APPROVED)).toBe(false);
  expect(await migration.hasCustomGuestData()).toBe(true);expect(migration.customImportAvailable()).toBe(false);
  expect(await repo.guestInventory()).toEqual(before);expect(await factory.databases()).toEqual(databases);expect(cloud).not.toHaveBeenCalled();
 });
 it('waits for readonly inspection before returning successful login and allows account without copying',async()=>{
  await create();const original=await repo.guestInventory(),copy=vi.spyOn(migration,'copyGuestToUser');
  expect(await login()).toEqual({error:null});expect(auth.needsGuestImportDecision()).toBe(true);expect(auth.guestDecks()).toBe(true);expect(auth.legacyGuest()).toBe(false);expect(workspace.active()).toBe('guest');
  expect(await auth.chooseGuestImport('account')).toBe(true);expect(await repo.list()).toEqual([]);expect(copy).not.toHaveBeenCalled();
  await auth.signOut();expect(workspace.active()).toBe('guest');expect(await repo.guestInventory()).toEqual(original);expect(cloud).not.toHaveBeenCalled();
 });
 it('cancel by sign out preserves Guest and does not record an import decision',async()=>{
  await create();const original=await repo.guestInventory();await login();await auth.signOut();
  expect(workspace.importDecision(user)).toBeNull();expect(await repo.guestInventory()).toEqual(original);expect(auth.needsGuestImportDecision()).toBe(false);
 });
 it('a pending remote profile cannot block local workspace choice or resurrect a signed-out account',async()=>{
  await create();let release!:(value:any)=>void;profileReply=()=>new Promise(r=>release=r);let finished=false;
  const signing=login().then(()=>{finished=true;});await vi.waitFor(()=>expect(finished).toBe(true));expect(auth.needsGuestImportDecision()).toBe(true);
  expect(await auth.chooseGuestImport('account')).toBe(true);await auth.signOut();release({data:{id:'local-a',display_name:'stale'}});await signing;
  await Promise.resolve();expect(workspace.active()).toBe('guest');expect(auth.profile()).toBeNull();
 });
 it('Guest → A → B → A → Guest keeps each original inventory and never copies custom stores',async()=>{
  await create();const original=await repo.guestInventory();await login();await auth.chooseGuestImport('account');await create();const a=await repo.list();
  user='local-b';await login();expect(workspace.active()).toBe('user:local-b');expect(await repo.list()).toEqual([]);expect(await hasLocalCustomData('user:local-b',factory)).toBe(false);
  user='local-a';await login();expect(await repo.list()).toEqual(a);await auth.signOut();expect(await repo.guestInventory()).toEqual(original);expect(cloud).not.toHaveBeenCalled();
 });
 it('explicit legacy merge finishes with cloud off and excludes every custom record',async()=>{
  await create();const original=await repo.guestInventory(),decks=TestBed.inject(DeckDatabaseService);
  await decks.writeDailyState({deckId:'japanese-1500',localDate:'2026-10-25',introducedEntryIds:['legacy-card'],newLimitOverride:null});const copy=vi.spyOn(migration,'copyGuestToUser');
  await login();expect(auth.legacyGuest()).toBe(true);expect(auth.guestDecks()).toBe(true);
  expect(await auth.chooseGuestImport('merge')).toBe(true);expect(copy).toHaveBeenCalledOnce();expect(auth.needsGuestImportDecision()).toBe(false);expect(await repo.list()).toEqual([]);
  expect((await decks.getDailyState('japanese-1500','2026-10-25'))?.introducedEntryIds).toEqual(['legacy-card']);
  await auth.signOut();expect(await repo.guestInventory()).toEqual(original);expect(cloud).not.toHaveBeenCalled();
 });
 it('A → B → Guest during a pending presence read cannot publish the stale decision',async()=>{
  let release!:(value:boolean)=>void;vi.spyOn(migration,'hasCustomGuestData').mockImplementation(()=>new Promise(r=>release=r));
  const signing=login();await vi.waitFor(()=>expect(release).toBeTypeOf('function'));workspace.activateUser('local-a');workspace.activateUser('local-b');workspace.activateGuest();release(true);await signing;
  expect(workspace.active()).toBe('guest');expect(auth.needsGuestImportDecision()).toBe(false);expect(auth.guestDecks()).toBe(false);
 });
 it('inspection failure still permits an explicit account decision without importing or deleting',async()=>{
  vi.spyOn(migration,'hasCustomGuestData').mockRejectedValue(new Error('blocked'));await login();expect(auth.guestDecks()).toBeNull();expect(auth.needsGuestImportDecision()).toBe(true);
  expect(await auth.chooseGuestImport('account')).toBe(true);expect(workspace.active()).toBe('user:local-a');expect(cloud).not.toHaveBeenCalled();
 });
 it('controlled INITIAL_SESSION restores the selected account without prompting for Guest again',async()=>{
  await create();await login();await auth.chooseGuestImport('account');await create();const original=await repo.list();
  listener('INITIAL_SESSION',{user:{id:user}});await vi.waitFor(()=>expect(auth.ready()).toBe(true));expect(auth.needsGuestImportDecision()).toBe(false);expect(await repo.list()).toEqual(original);expect(cloud).not.toHaveBeenCalled();
 });
 it('catalog refresh rejects an A → B → A capture even if no component rendered between switches',async()=>{
  workspace.activateUser('local-a');await create();const rows=await repo.list(),catalog=TestBed.inject(DeckCatalogService);
  let release!:()=>void;const barrier=new Promise<void>(r=>release=r);vi.spyOn(repo,'list').mockImplementation(async()=>{await barrier;return rows;});
  const pending=catalog.refresh();workspace.activateUser('local-b');expect(catalog.items().filter(d=>d.kind==='custom')).toEqual([]);workspace.activateUser('local-a');release();await pending;
  expect(catalog.items().filter(d=>d.kind==='custom')).toEqual([]);
 });
 it('catalog detail rejects an A → B → A capture during an asynchronous content read',async()=>{
  workspace.activateUser('local-a');await create();const catalog=TestBed.inject(DeckCatalogService),cards=await repo.content(fixture.deck.id);
  let release!:()=>void,entered!:()=>void;const barrier=new Promise<void>(r=>release=r),started=new Promise<void>(r=>entered=r);
  vi.spyOn(repo,'content').mockImplementation(async()=>{entered();await barrier;return cards;});
  const pending=catalog.load(fixture.deck.id);await started;workspace.activateUser('local-b');workspace.activateUser('local-a');release();expect((await pending).status).toBe('missing');
 });
});
