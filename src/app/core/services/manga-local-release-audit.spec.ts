import {signal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb';
import fixture from '../../../../supabase/tests/h2ba-fixture.json';
import {MangaConfirmedCardOperation} from '../models/manga-deck-confirmation.model';
import {CUSTOM_DECKS_ENABLED,CUSTOM_DECK_SYNC_ENABLED,CUSTOM_REMOTE_UPLOAD_APPROVED} from './custom-deck-gates';
import {MANGA_DECK_ASSISTED_ENABLED} from './manga-deck-gate';
import {CUSTOM_DECK_IDB,CustomDeckRepository} from './custom-deck.repository';
import {CUSTOM_DECK_TRANSPORT} from './custom-deck-sync-transport';
import {CustomDeckSyncAdapter} from './custom-deck-sync-adapter';
import {CustomGuestImportService} from './custom-guest-import.service';
import {DeckCatalogService} from './deck-catalog.service';
import {DeckStudyService} from './deck-study.service';
import {DECK_SCHEDULER_ENABLE_FUZZ} from './deck-scheduler.service';
import {SupabaseClientService} from './supabase-client.service';
import {WorkspaceService} from './workspace.service';
import {WorkspaceMigrationService} from './workspace-migration.service';
import {AuthService} from './auth.service';

// Audit configuration only. Production providers and gates are deliberately unchanged.
describe('RELEASE-MANGA-1 local-first audit',()=>{
  const operation=fixture as unknown as MangaConfirmedCardOperation;
  const now=new Date('2026-10-24T12:00:00Z');
  let factory:IDBFactory;
  const remote=()=>Object.fromEntries(['apply','receipt','changes','bundle','transferApply','transferGet','transferReceipt','confirmationReceipt','conflictEvidence','conflictResolutions']
    .map(name=>[name,vi.fn(async()=>{throw new Error('Unexpected custom network call: '+name);})]));
  let calls:ReturnType<typeof remote>;
  function configure(){
    TestBed.configureTestingModule({providers:[
      {provide:CUSTOM_DECK_IDB,useValue:factory},
      {provide:CUSTOM_DECKS_ENABLED,useFactory:()=>signal(true).asReadonly()},
      {provide:MANGA_DECK_ASSISTED_ENABLED,useFactory:()=>signal(true).asReadonly()},
      {provide:DECK_SCHEDULER_ENABLE_FUZZ,useValue:false},
      {provide:SupabaseClientService,useValue:{config:{configured:false},getClient:async()=>null}},
      {provide:CUSTOM_DECK_TRANSPORT,useValue:{...calls,principal:()=>TestBed.inject(WorkspaceService).userId()}},
    ]});
  }
  beforeEach(()=>{TestBed.resetTestingModule();localStorage.clear();factory=new IDBFactory();calls=remote();vi.stubGlobal('indexedDB',factory);vi.stubGlobal('IDBKeyRange',IDBKeyRange);configure();});
  afterEach(()=>{TestBed.resetTestingModule();localStorage.clear();vi.unstubAllGlobals();vi.restoreAllMocks();});
  const repo=()=>TestBed.inject(CustomDeckRepository);
  async function create(){await repo().confirmMangaCard(structuredClone(operation));}
  async function review(){
    const state=await TestBed.inject(DeckCatalogService).load(operation.deck.id);if(state.status!=='ready')throw Error('Missing audit deck');
    const {deck,content}=state.value,study=TestBed.inject(DeckStudyService),snapshot=await study.snapshot(deck,content.index,now);
    const choice=study.chooseNext(snapshot,deck,{debt:0}).choice!;
    return study.rate(deck,choice,study.preview(deck,choice,now),'good',1234,now);
  }
  function noRemote(){for(const call of Object.values(calls))expect(call).not.toHaveBeenCalled();}
  it('creates, studies and undoes locally; even explicit custom sync/import attempts cannot contact transport when disabled',async()=>{
    expect(TestBed.inject(CUSTOM_DECK_SYNC_ENABLED)()).toBe(false);expect(TestBed.inject(CUSTOM_REMOTE_UPLOAD_APPROVED)).toBe(false);
    expect(await repo().list()).toEqual([]);await create();const event=await review();
    expect((await repo().getDeckProgress(operation.deck.id))[0].card.reps).toBe(1);
    await TestBed.inject(DeckStudyService).undo(event);await TestBed.inject(DeckStudyService).undo(event);
    expect(await repo().getDeckReviewEvents(operation.deck.id)).toEqual([]);
    expect((await repo().journal()).map(o=>o.kind)).toEqual(['manga-confirmation','review','undo']);
    TestBed.inject(WorkspaceService).activateUser('audit-account');
    expect(await TestBed.inject(CustomDeckSyncAdapter).syncNow()).toBe(false);
    expect(await TestBed.inject(CustomGuestImportService).start(true)).toBe(false);
    noRemote();
  });
  it('reopens the same database through a new injector with exact receipts, snapshots, journal and identity',async()=>{
    await create();await review();const before=await repo().guestInventory(),content=await repo().content(operation.deck.id),receipts=await repo().mangaConfirmations();
    TestBed.resetTestingModule();configure();
    expect(await repo().guestInventory()).toEqual(before);
    expect(await repo().content(operation.deck.id)).toEqual(content);
    expect(await repo().mangaConfirmations()).toEqual(receipts);noRemote();
  });
  it('isolates local account decks from Guest and other accounts and returns Guest unchanged',async()=>{
    await create();await review();const guest=await repo().guestInventory(),workspace=TestBed.inject(WorkspaceService);
    workspace.activateUser('audit-a');expect(await repo().list()).toEqual([]);
    const account:MangaConfirmedCardOperation={...structuredClone(operation),confirmation:{...operation.confirmation,workspace:'user:audit-a',actor:{...operation.confirmation.actor,workspace:'user:audit-a'}}};
    await repo().confirmMangaCard(account);expect(await repo().list()).toHaveLength(1);expect(await repo().getDeckReviewEvents(operation.deck.id)).toEqual([]);
    workspace.activateUser('audit-b');expect(await repo().list()).toEqual([]);
    workspace.activateGuest();expect(await repo().guestInventory()).toEqual(guest);noRemote();
  });
  it('detects custom-only Guest data with cloud off and continues without copying',async()=>{
    // Simulated Auth event, not a Supabase Auth or gateway test and no private account.
    let authEvent:((event:any,session:any)=>void)|undefined;
    const client={auth:{onAuthStateChange:(callback:typeof authEvent)=>{authEvent=callback;return {data:{subscription:{unsubscribe(){}}}};},signOut:async()=>{}},
      from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:null})})})})};
    TestBed.overrideProvider(SupabaseClientService,{useValue:{config:{configured:true},getClient:async()=>client}});
    await create();const original=await repo().guestInventory(),migration=TestBed.inject(WorkspaceMigrationService);
    expect(original.records['cards']).toHaveLength(1);expect(await migration.hasCustomGuestData()).toBe(true);expect(await migration.hasGuestData()).toBe(true);
    const auth=TestBed.inject(AuthService),workspace=TestBed.inject(WorkspaceService);await Promise.resolve();
    expect(authEvent).toBeTypeOf('function');authEvent!('SIGNED_IN',{user:{id:'audit-a'}});
    await vi.waitFor(()=>expect(auth.needsGuestImportDecision()).toBe(true));expect(workspace.active()).toBe('guest');
    expect(await auth.chooseGuestImport('account')).toBe(true);expect(workspace.active()).toBe('user:audit-a');expect(auth.needsGuestImportDecision()).toBe(false);expect(await repo().list()).toEqual([]);
    await auth.signOut();expect(workspace.active()).toBe('guest');expect(await repo().guestInventory()).toEqual(original);noRemote();
  });
});
