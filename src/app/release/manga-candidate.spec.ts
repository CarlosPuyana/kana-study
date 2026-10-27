import {signal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb';
import {provideRouter,ActivatedRoute,convertToParamMap,Router} from '@angular/router';
import {of} from 'rxjs';
import {MANGA_CANDIDATE_PROVIDERS} from './manga-candidate.providers';
import {CUSTOM_DECKS_ENABLED,CUSTOM_DECK_SYNC_ENABLED,CUSTOM_REMOTE_UPLOAD_APPROVED} from '../core/services/custom-deck-gates';
import {MANGA_DECK_ASSISTED_ENABLED} from '../core/services/manga-deck-gate';
import {CustomDeckAccess} from '../core/services/custom-deck-access';
import {CUSTOM_DECK_IDB,CustomDeckRepository} from '../core/services/custom-deck.repository';
import {WorkspaceService} from '../core/services/workspace.service';
import {DeckCatalogService} from '../core/services/deck-catalog.service';
import {DeckPersistenceRouter} from '../core/services/deck-persistence-router';
import {DeckStudyService} from '../core/services/deck-study.service';
import {DECK_SCHEDULER_ENABLE_FUZZ} from '../core/services/deck-scheduler.service';
import {customDeck,customCard} from '../core/services/custom-deck.fixture';
import {DeckBackupService} from '../core/services/deck-backup.service';
import {BACKUP_STORES} from '../core/services/deck-backup-contract';
import {CustomDeckSyncAdapter} from '../core/services/custom-deck-sync-adapter';
import {CustomGuestImportService} from '../core/services/custom-guest-import.service';
import {CUSTOM_DECK_TRANSPORT} from '../core/services/custom-deck-sync-transport';
import {customDeckRouteGuard,guestCustomRouteGuard} from '../core/services/custom-deck-route.guard';
import {AnkiStudyPage} from '../features/anki-study/anki-study.page';
import {SupabaseClientService} from '../core/services/supabase-client.service';
import fixture from '../../../supabase/tests/h2ba-fixture.json';
import {MangaConfirmedCardOperation} from '../core/models/manga-deck-confirmation.model';
import {emptyCustomReconciliation} from '../core/models/custom-deck-reconciliation.model';
import {getLocalStudyDayKey} from '../core/services/deck-study-time';

describe('Production candidate: enforced local Guest-only custom decks',()=>{
 let factory:IDBFactory,repo:CustomDeckRepository,workspace:WorkspaceService;
 const calls=Object.fromEntries(['apply','receipt','changes','bundle','transferApply','transferGet','transferReceipt'].map(k=>[k,vi.fn(async()=>{throw Error('Unexpected custom transport');})]));
 beforeEach(()=>{
  localStorage.clear();factory=new IDBFactory();vi.stubGlobal('indexedDB',factory);vi.stubGlobal('IDBKeyRange',IDBKeyRange);
  vi.stubGlobal('matchMedia',()=>({matches:false,addEventListener(){},removeEventListener(){}}));
  TestBed.configureTestingModule({providers:[...MANGA_CANDIDATE_PROVIDERS,provideRouter([]),{provide:CUSTOM_DECK_IDB,useValue:factory},
   {provide:DECK_SCHEDULER_ENABLE_FUZZ,useValue:false},{provide:CUSTOM_DECK_TRANSPORT,useValue:{...calls,principal:()=>workspace.userId()}},
   {provide:SupabaseClientService,useValue:{config:{configured:false},getClient:async()=>null}},
   {provide:ActivatedRoute,useValue:{snapshot:{paramMap:convertToParamMap({deckId:'md-candidate'})},paramMap:of(convertToParamMap({deckId:'md-candidate'}))}}]});
  repo=TestBed.inject(CustomDeckRepository);workspace=TestBed.inject(WorkspaceService);
 });
 afterEach(()=>{TestBed.resetTestingModule();localStorage.clear();vi.unstubAllGlobals();vi.restoreAllMocks();for(const call of Object.values(calls))call.mockClear();});
 async function seedGuest(){const deck=customDeck('md-candidate'),card=await customCard(deck.id);await repo.create('candidate-create',deck,[card]);return {deck,card};}
 // Synthetic pre-candidate account fixture, including actual journal/FSRS rows. Not an application import path.
 async function mirrorAccount(){const source=await repo.guestInventory(),db=await new Promise<IDBDatabase>((resolve,reject)=>{const r=factory.open('kana-study-custom-decks-v1');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
  await new Promise<void>((resolve,reject)=>{const tx=db.transaction([...BACKUP_STORES],'readwrite');for(const s of BACKUP_STORES)for(const row of source.records[s])tx.objectStore(s).put({...row,workspace:'user:a',value:s==='journal'?{...row.value as object,workspace:'user:a'}:row.value});tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error);});db.close();}
 async function seedAccount(){const input=await seedGuest();await mirrorAccount();return input;}
 async function inventory(){const db=await new Promise<IDBDatabase>((resolve,reject)=>{const r=factory.open('kana-study-custom-decks-v1');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});try{return await Promise.all(BACKUP_STORES.map(s=>new Promise<any[]>(resolve=>{const r=db.transaction(s).objectStore(s).getAll();r.onsuccess=()=>resolve(r.result);})))}finally{db.close();}}
 it('has explicit immutable candidate gates; no Auth stub or forced workspace in its providers',()=>{
  expect(TestBed.inject(CUSTOM_DECKS_ENABLED)()).toBe(true);expect(TestBed.inject(MANGA_DECK_ASSISTED_ENABLED)()).toBe(true);expect(TestBed.inject(CUSTOM_DECK_SYNC_ENABLED)()).toBe(false);expect(TestBed.inject(CUSTOM_REMOTE_UPLOAD_APPROVED)).toBe(false);
  expect('set' in TestBed.inject(CUSTOM_DECKS_ENABLED)).toBe(false);workspace.activateUser('a');expect(TestBed.inject(CustomDeckAccess).permitted()).toBe(false);expect(workspace.active()).toBe('user:a');
 });
 it('Guest can create and use the actual scheduler, undo, export and restore into an empty Guest factory',async()=>{
  const {deck}=await seedGuest(),catalog=TestBed.inject(DeckCatalogService),loaded=await catalog.load(deck.id);if(loaded.status!=='ready')throw Error('Missing candidate deck');
  const study=TestBed.inject(DeckStudyService),now=new Date('2026-10-26T12:00:00Z'),snapshot=await study.snapshot(loaded.value.deck,loaded.value.content.index,now),choice=study.chooseNext(snapshot,loaded.value.deck,{debt:0}).choice!;
  const event=await study.rate(loaded.value.deck,choice,study.preview(loaded.value.deck,choice,now),'good',1234,now);await study.undo(event);expect(await repo.getDeckReviewEvents(deck.id)).toEqual([]);
  const before=await repo.guestInventory(),raw=await TestBed.inject(DeckBackupService).export(new AbortController().signal);
  TestBed.resetTestingModule();const destination=new IDBFactory();vi.stubGlobal('indexedDB',destination);TestBed.configureTestingModule({providers:[...MANGA_CANDIDATE_PROVIDERS,{provide:CUSTOM_DECK_IDB,useValue:destination}]});
  await TestBed.inject(DeckBackupService).restore(raw,true,new AbortController().signal);expect((await TestBed.inject(CustomDeckRepository).guestInventory()).records).toEqual(before.records);
 });
 it('account creation/edit/settings/lifecycle/registry and coordination cannot modify any existing owner record',async()=>{
  const {deck,card}=await seedAccount(),before=await inventory();workspace.activateUser('a');
  const denied=[()=>repo.create('account-create',deck,[card]),()=>repo.editCard('edit',{...card,contentVersion:2},1),()=>repo.saveSettings('settings',deck.id,deck.settings),
   ()=>repo.lifecycle('archive','archive','deck',deck.id,deck.id),()=>repo.lifecycle('delete','delete','card',card.id,deck.id),()=>repo.lifecycle('restore','restore','deck',deck.id,deck.id),
   ()=>repo.migratePermanentRegistry(),()=>repo.setCustomConsent('user:a',true),()=>repo.writeDailyState({deckId:deck.id,localDate:'2026-10-26',introducedEntryIds:[],newLimitOverride:null})];
  for(const action of denied)await expect(action()).rejects.toThrow('Guest-only');
  expect(await inventory()).toEqual(before);expect(await repo.list()).toHaveLength(1);
 });
 it('a retained study binding cannot write account review/undo or a Guest A→B→Guest capture',async()=>{
  const {deck}=await seedAccount(),router=TestBed.inject(DeckPersistenceRouter),binding=router.bind(deck.id);workspace.activateUser('a');expect(()=>router.bind(deck.id)).toThrow();
  workspace.activateGuest();expect(()=>binding.assertOwner()).toThrow();expect(await inventory()).toBeTruthy();
 });
 it('raw review/undo, Manga confirmation and sync publication also reject account writes without changing historical rows',async()=>{
  const {deck}=await seedAccount(),loaded=await TestBed.inject(DeckCatalogService).load(deck.id);if(loaded.status!=='ready')throw Error('Missing Guest deck');
  const study=TestBed.inject(DeckStudyService),now=new Date('2026-10-26T12:00:00Z'),snapshot=await study.snapshot(loaded.value.deck,loaded.value.content.index,now),choice=study.chooseNext(snapshot,loaded.value.deck,{debt:0}).choice!;
  const event=await study.rate(loaded.value.deck,choice,study.preview(loaded.value.deck,choice,now),'good',1234,now),progress=(await repo.getDeckProgress(deck.id))[0],daily=(await repo.getDailyState(deck.id,getLocalStudyDayKey(now)))!;
  await mirrorAccount();const before=await inventory();workspace.activateUser('a');
  await expect(repo.commitReview(progress,event,daily)).rejects.toThrow('Guest-only');await expect(repo.undoReview(event,daily)).rejects.toThrow('Guest-only');
  const p=structuredClone(fixture) as unknown as MangaConfirmedCardOperation;await expect(repo.confirmMangaCard({...p,confirmation:{...p.confirmation,workspace:'user:a',actor:{...p.confirmation.actor,workspace:'user:a'}}})).rejects.toThrow('Guest-only');
  await expect(repo.syncCommit('user:a',0,null,emptyCustomReconciliation(),()=>{})).rejects.toThrow('Guest-only');expect(await inventory()).toEqual(before);
 });
 it('catalog hides preserved account custom data with explicit scope UI while Japanese 1500 still loads',async()=>{
  const {deck}=await seedAccount(),before=await inventory(),catalog=TestBed.inject(DeckCatalogService);workspace.activateUser('a');await catalog.refresh();expect(catalog.items().map(d=>d.id)).toEqual(['japanese-1500']);expect((await catalog.load(deck.id)).status).toBe('missing');
  expect((await catalog.load('japanese-1500')).status).toBe('ready');expect(TestBed.inject(DeckPersistenceRouter).bind('japanese-1500').workspace).toBe('user:a');expect(await inventory()).toEqual(before);
 });
 it('deep guards redirect custom account routes to scope information without blocking Japanese 1500',()=>{
  workspace.activateUser('a');const route=(id:string)=>({paramMap:convertToParamMap({deckId:id})});
  const custom=TestBed.runInInjectionContext(()=>customDeckRouteGuard(route('md-candidate') as any,{} as any));expect(TestBed.inject(Router).serializeUrl(custom as any)).toBe('/anki');
  expect(TestBed.runInInjectionContext(()=>customDeckRouteGuard(route('japanese-1500') as any,{} as any))).toBe(true);
  expect(TestBed.inject(Router).serializeUrl(TestBed.runInInjectionContext(()=>guestCustomRouteGuard({} as any,{} as any)) as any)).toBe('/anki');
 });
 it('a custom study page retained at login reveals no old card or grading UI',async()=>{
  await seedGuest();const f=TestBed.createComponent(AnkiStudyPage);f.detectChanges();await f.componentInstance.resource.ready();await f.whenStable();f.detectChanges();expect(f.nativeElement.querySelector('.front')).toBeTruthy();
  workspace.activateUser('a');f.detectChanges();expect(f.nativeElement.querySelector('.front')).toBeNull();expect(f.nativeElement.querySelector('.ratings')).toBeNull();expect(f.nativeElement.textContent).toContain('se conservan sin modificaciones');f.destroy();
 });
 it('Guest→A→Guest during IDB opening rejects the pending write before touching stores',async()=>{
  const before=await repo.guestInventory();let entered!:()=>void,release!:()=>void;const started=new Promise<void>(r=>entered=r),barrier=new Promise<void>(r=>release=r);
  const port=repo as unknown as {open:()=>Promise<IDBDatabase>},original=port.open.bind(repo);vi.spyOn(port,'open').mockImplementation(async()=>{entered();await barrier;return original();});
  const pending=repo.saveSettings('stale','md-candidate',customDeck().settings);await started;workspace.activateUser('a');workspace.activateGuest();release();await expect(pending).rejects.toThrow('Guest-only');vi.restoreAllMocks();expect(await repo.guestInventory()).toEqual(before);
 });
 it('an account activation clears a pending custom catalog read without retaining its loading state',async()=>{
  const catalog=TestBed.inject(DeckCatalogService);let release!:(value:[])=>void;vi.spyOn(repo,'list').mockImplementation(()=>new Promise(r=>release=r));
  const pending=catalog.refresh();expect(catalog.loading()).toBe(true);workspace.activateUser('a');await catalog.refresh();expect(catalog.loading()).toBe(false);release([]);await pending;expect(catalog.items().map(d=>d.id)).toEqual(['japanese-1500']);expect(catalog.loading()).toBe(false);
 });
 it('account backup is rejected and explicit sync/import cannot call any custom transport',async()=>{
  await seedAccount();workspace.activateUser('a');await expect(TestBed.inject(DeckBackupService).export(new AbortController().signal)).rejects.toMatchObject({code:'owner'});
  expect(await TestBed.inject(CustomDeckSyncAdapter).syncNow()).toBe(false);expect(await TestBed.inject(CustomGuestImportService).start(true)).toBe(false);for(const call of Object.values(calls))expect(call).not.toHaveBeenCalled();
 });
 it('an account registry request is denied before opening or upgrading IndexedDB',async()=>{
  workspace.activateUser('a');const port=repo as unknown as {open:()=>Promise<IDBDatabase>},open=vi.spyOn(port,'open');
  await expect(repo.migratePermanentRegistry()).rejects.toThrow('Guest-only');expect(open).not.toHaveBeenCalled();expect(await factory.databases()).toEqual([]);
 });
});
