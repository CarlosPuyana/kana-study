import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { IDBFactory, IDBKeyRange, IDBObjectStore } from 'fake-indexeddb';
import { CustomDeckSyncAdapter } from './custom-deck-sync-adapter';
import { CUSTOM_DECK_DATABASE, CUSTOM_DECK_IDB, CUSTOM_DECKS_ENABLED, CustomDeckRepository } from './custom-deck.repository';
import { CUSTOM_DECK_SYNC_ENABLED, CUSTOM_DECK_TRANSPORT, CustomDeckTransport, CustomRemoteStoredReceipt } from './custom-deck-sync-transport';
import { MANGA_DECK_ASSISTED_ENABLED } from './manga-deck-gate';
import { WorkspaceService } from './workspace.service';
import { canonical, digest, lexicalIdentity } from './custom-deck-validation';
import { CustomRemoteBundle, CustomRemoteEntity, CustomRemoteOperation, CustomRemoteReceipt } from '../models/custom-deck-sync.model';
import { MangaConfirmedCardOperation } from '../models/manga-deck-confirmation.model';
import { prepareCustomOperation } from './custom-deck-sync-protocol';
import { memory } from './lexical-knowledge.fixture';
import { mangaEntityId, MANGA_CURATED_POLICY } from './manga-deck-confirmation';

const fs=(globalThis as unknown as {process:{getBuiltinModule:(s:string)=>{readFileSync:(p:string,e:string)=>string}}}).process.getBuiltinModule('fs');
const user='00000000-0000-0000-0000-000000000001';
const fixture=()=>{const p=JSON.parse(fs.readFileSync('supabase/tests/h2ba-fixture.json','utf8')) as MangaConfirmedCardOperation;return {...p,confirmation:{...p.confirmation,workspace:`user:${user}`,actor:{...p.confirmation.actor,workspace:`user:${user}`}}} as MangaConfirmedCardOperation;};
import {Port} from './custom-deck-sync-port.fixture';

describe('Custom sync: durable journal, ACK, staging and workspace fences',()=>{
  let repo:CustomDeckRepository,adapter:CustomDeckSyncAdapter,workspace:WorkspaceService,port:Port,factory:IDBFactory;
  const setup=()=>{TestBed.configureTestingModule({providers:[{provide:CUSTOM_DECK_IDB,useValue:factory},{provide:CUSTOM_DECKS_ENABLED,useValue:signal(true)},
    {provide:MANGA_DECK_ASSISTED_ENABLED,useValue:signal(true)},{provide:CUSTOM_DECK_SYNC_ENABLED,useValue:signal(true)},{provide:CUSTOM_DECK_TRANSPORT,useValue:port}]});
    repo=TestBed.inject(CustomDeckRepository);workspace=TestBed.inject(WorkspaceService);workspace.activateUser(user);adapter=TestBed.inject(CustomDeckSyncAdapter);};
  beforeEach(async()=>{TestBed.resetTestingModule();localStorage.clear();Object.assign(globalThis,{IDBKeyRange});factory=new IDBFactory();port=new Port();setup();await repo.setCustomConsent(workspace.active(),true);});
  afterEach(()=>{vi.restoreAllMocks();TestBed.resetTestingModule();localStorage.clear();});
  it('materializes a paged bundle only from the complete revision-checked feed',async()=>{
    const p=fixture();await repo.confirmMangaCard(p);expect(await adapter.syncNow()).toBe(true);const before=await repo.content(p.deck.id),read=port.bundle.bind(port);
    vi.spyOn(port,'bundle').mockImplementation(async(...args)=>{const r=await read(...args);if(r.value)r.value={...r.value,status:'paged-required',entities:[]};return r;});
    expect(await adapter.syncNow(),String(adapter.failure())).toBe(true);expect(await repo.content(p.deck.id)).toEqual(before);
  });
  it('a paged bundle with a different manifest cannot replace the last complete publication',async()=>{
    const p=fixture();await repo.confirmMangaCard(p);expect(await adapter.syncNow()).toBe(true);const before=await repo.content(p.deck.id),read=port.bundle.bind(port);
    vi.spyOn(port,'bundle').mockImplementation(async(...args)=>{const r=await read(...args);if(r.value)r.value={...r.value,status:'paged-required',entities:[],manifest:{...r.value.manifest,revision:'999'}};return r;});
    expect(await adapter.syncNow()).toBe(false);expect(await repo.content(p.deck.id)).toEqual(before);
  });
  it('pushes the real journal ID, verifies the receipt and preserves canonical local order and permanent intent',async()=>{
    const p=fixture();await repo.confirmMangaCard(p);expect(await adapter.syncNow()).toBe(true);
    expect(port.receipts.get(p.confirmation.id)?.request.operationId).toBe(p.confirmation.id);expect((await repo.content(p.deck.id))[0].order).toBe(1);
    expect((await repo.permanentRegistry()).confirmations[0].card.order).toBe(0);expect((await repo.journal()).length).toBe(1);expect(adapter.status()).toBe('synced');
  });
  it('recovers a commit with lost response after service reload, without a new operation or event',async()=>{
    const p=fixture();await repo.confirmMangaCard(p);port.lose=true;expect(await adapter.syncNow()).toBe(false);
    expect((await repo.syncSnapshot(workspace.active())).state.prepared[p.confirmation.id].receipt).toBeUndefined();
    TestBed.resetTestingModule();setup();expect(await adapter.syncNow()).toBe(true);expect(port.calls).toBe(1);expect(port.receipts.size).toBe(1);
    expect((await repo.getDeckReviewEvents(p.deck.id))).toEqual([]);
  });
  it('does not ACK an apply response if the independently readable receipt is missing',async()=>{
    const p=fixture();await repo.confirmMangaCard(p);vi.spyOn(port,'receipt').mockImplementation(async owner=>port.owned(owner,null));expect(await adapter.syncNow()).toBe(false);
    expect((await repo.syncSnapshot(workspace.active())).state.prepared[p.confirmation.id].receipt).toBeUndefined();
  });
  it.each(['logout','A-B-A','wrong-owner'])('fences delayed network response: %s',async mode=>{
    const p=fixture();await repo.confirmMangaCard(p);const original=port.apply.bind(port);
    vi.spyOn(port,'apply').mockImplementation(async(...args)=>{const response=await original(...args);if(mode==='logout'){port.user=null;workspace.activateGuest();}else if(mode==='A-B-A'){workspace.activateUser('other');workspace.activateUser(user);}else port.wrong=true;return mode==='wrong-owner'?{...response,owner:'other'}:response;});
    expect(await adapter.syncNow()).toBe(false);expect((await repo.syncSnapshot(`user:${user}`)).state.prepared[p.confirmation.id].receipt).toBeUndefined();expect(await repo.list('guest')).toEqual([]);
  });
  it('keeps a new local operation written during ACK pending instead of overwriting it',async()=>{
    const p=fixture();await repo.confirmMangaCard(p);const original=port.apply.bind(port);let added=false;
    vi.spyOn(port,'apply').mockImplementation(async(...args)=>{const response=await original(...args);if(!added){added=true;await repo.saveSettings('new-local-settings',p.deck.id,{...p.deck.settings,newCardsPerDay:7});}return response;});
    expect(await adapter.syncNow()).toBe(false);expect(adapter.status()).toBe('pending');expect((await repo.list())[0].settings.newCardsPerDay).toBe(7);
    expect((await repo.journal()).length).toBe(2);expect(await adapter.syncNow()).toBe(true);
  });
  it('retains last complete content when the manifest generation changes between pages',async()=>{
    const p=fixture();await repo.confirmMangaCard(p);expect(await adapter.syncNow()).toBe(true);const before=await repo.content(p.deck.id),original=port.changes.bind(port);let pages=0;
    vi.spyOn(port,'changes').mockImplementation(async(...args)=>{const r=await original(...args);if(++pages===2)r.value.serverRevision=String(port.clock+1);return r;});
    expect(await adapter.syncNow()).toBe(false);expect(adapter.status()).toBe('pending');expect(await repo.content(p.deck.id)).toEqual(before);
  });
  it('preserves durable staging on interrupted pull and rebuilds it after reload',async()=>{
    const p=fixture();await repo.confirmMangaCard(p);const original=port.changes.bind(port);let n=0;
    vi.spyOn(port,'changes').mockImplementation(async(...args)=>{if(++n===2)throw new Error('Interrupted page');return original(...args);});
    expect(await adapter.syncNow()).toBe(false);expect((await repo.syncSnapshot(workspace.active())).state.stage?.entities.length).toBeGreaterThan(0);
    vi.restoreAllMocks();TestBed.resetTestingModule();setup();expect(await adapter.syncNow()).toBe(true);
  });
  it('stores a CAS conflict and original local evidence durably without silently applying the winner',async()=>{
    const p=fixture();await repo.confirmMangaCard(p);const request=(await repo.journal())[0];
    port.rows.push({kind:'card',id:p.card.id,payload:{...p.card,order:1},revision:'1',deleted:false,archived:false,head:null,voidedBy:null});port.clock=1;
    expect(await adapter.syncNow()).toBe(false);expect(Object.keys(await adapter.conflicts())).toEqual([p.confirmation.id]);
    expect(canonical((await adapter.conflicts())[p.confirmation.id].source)).toBe(canonical(request));expect((await repo.content(p.deck.id)).length).toBe(1);
    TestBed.resetTestingModule();setup();expect(Object.keys(await adapter.conflicts()).length).toBe(1);
  });
  it('two adapter instances sharing IndexedDB cannot overwrite each others prepared revisions',async()=>{
    const p=fixture();await repo.confirmMangaCard(p);const other=TestBed.runInInjectionContext(()=>new CustomDeckSyncAdapter());
    await Promise.all([adapter.syncNow(),other.syncNow()]);expect(port.receipts.size).toBe(1);expect(await adapter.syncNow()).toBe(true);expect((await repo.journal()).length).toBe(1);
  });
  it('disabled gate never touches the transport; offline writes stay local',async()=>{
    adapter.enabled.set(false);const spy=vi.spyOn(port,'receipt');await repo.confirmMangaCard(fixture());expect(await adapter.syncNow()).toBe(false);expect(spy).not.toHaveBeenCalled();
    adapter.enabled.set(true);vi.spyOn(port,'receipt').mockRejectedValue(new TypeError('offline'));vi.spyOn(navigator,'onLine','get').mockReturnValue(false);
    expect(await adapter.syncNow()).toBe(false);expect(adapter.status()).toBe('offline');expect((await repo.journal()).length).toBe(1);
  });
  it('an empty or rolled back feed cannot erase known data or claim Synced',async()=>{
    const p=fixture();await repo.confirmMangaCard(p);expect(await adapter.syncNow()).toBe(true);
    vi.spyOn(port,'changes').mockImplementation(async owner=>port.owned(owner,{schemaVersion:1,serverRevision:'0',entities:[]}));
    expect(await adapter.syncNow()).toBe(false);expect(adapter.status()).toBe('error');expect((await repo.content(p.deck.id)).length).toBe(1);
  });
  it('quarantines content without a publication manifest and retains the last complete local view',async()=>{
    const p=fixture();await repo.confirmMangaCard(p);expect(await adapter.syncNow()).toBe(true);
    const deck=port.rows.find(e=>e.kind==='deck')!;port.rows.push({...deck,id:'unpublished',payload:{...p.deck,id:'unpublished'},revision:String(++port.clock)});
    expect(await adapter.syncNow()).toBe(false);expect((await repo.list()).map(d=>d.id)).toEqual([p.deck.id]);
    expect((await repo.syncSnapshot(workspace.active())).state.stage?.entities.some(e=>e.id==='unpublished')).toBe(true);
  });
  it('does not retain the prior account Synced state after a workspace switch',async()=>{
    const p=fixture();await repo.confirmMangaCard(p);expect(await adapter.syncNow()).toBe(true);workspace.activateGuest();expect(adapter.status()).toBe('pending');
  });
  it('changes Synced to Pending as soon as a fresh local journal entry commits',async()=>{
    const p=fixture();await repo.confirmMangaCard(p);expect(await adapter.syncNow()).toBe(true);
    await repo.saveSettings('settings-after-sync',p.deck.id,{...p.deck.settings,newCardsPerDay:8});expect(adapter.status()).toBe('pending');
  });
  it('reads pre-H4BA confirmation journal records using durable canonical order without rewriting their payload',async()=>{
    const p=fixture();await repo.confirmMangaCard(p);
    const db=await new Promise<IDBDatabase>(resolve=>{const r=factory.open(CUSTOM_DECK_DATABASE);r.onsuccess=()=>resolve(r.result);});
    await new Promise<void>((resolve,reject)=>{const tx=db.transaction('journal','readwrite'),s=tx.objectStore('journal'),r=s.get([workspace.active(),p.confirmation.id]);
      r.onsuccess=()=>{delete r.result.value.context;s.put(r.result);};tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error);});db.close();
    const original=await repo.journal();expect(original[0].context).toBeUndefined();expect(await adapter.syncNow()).toBe(true);expect(await repo.journal()).toEqual(original);
    expect(port.receipts.get(p.confirmation.id)?.request.changes.find(c=>c.kind==='card')?.payload).toMatchObject({order:1});
    expect((await repo.permanentRegistry()).confirmations[0].card.order).toBe(0);
  });
  it('prepares review and undo from actual journal evidence and captured prior head, without recomputing events',async()=>{
    const p=fixture();await repo.confirmMangaCard(p);const m=memory(p.deck.id,p.card.id);
    const progress={...m.progress,card:{...m.progress.card,reps:1}},event={...m.event,cardBefore:null,stateBefore:0 as const,stabilityBefore:0,difficultyBefore:0};
    const daily={deckId:p.deck.id,localDate:'2026-10-22',introducedEntryIds:[p.card.id],newLimitOverride:null};
    await repo.commitReview(progress,event,daily);await repo.undoReview(event,{...daily,introducedEntryIds:[]});
    const {journal,state}=await repo.syncSnapshot(workspace.active());
    const review=journal.find(o=>o.kind==='review')!,undo=journal.find(o=>o.kind==='undo')!;
    const reviewOp=await prepareCustomOperation(review,state),undoOp=await prepareCustomOperation(undo,state);
    expect(reviewOp.operationId).toBe(event.id);expect(reviewOp.expectedHead).toBeNull();expect(reviewOp.changes.find(c=>c.kind==='review-event')?.payload).toEqual(event);
    expect(undoOp.operationId).toBe(undo.id);expect(undoOp.expectedHead).toBe(event.id);expect(undoOp.before).toEqual(progress.card);expect(undoOp.changes.find(c=>c.kind==='progress')?.payload).toBeNull();
    expect((await repo.getDeckReviewEvents(p.deck.id))).toEqual([]);expect((await repo.journal()).length).toBe(3);
  });
  it('prepares the effective daily state committed locally, preserving introductions',async()=>{
    const p=fixture();await repo.confirmMangaCard(p);
    const day={deckId:p.deck.id,localDate:'2026-10-22',introducedEntryIds:[p.card.id],newLimitOverride:null};
    await repo.writeDailyState(day);await repo.writeDailyState({...day,introducedEntryIds:[],completedAt:Date.parse('2026-10-22T13:00:00Z')});
    const {journal,state}=await repo.syncSnapshot(workspace.active()),last=journal[journal.length-1],op=await prepareCustomOperation(last,state);
    expect(op.changes[0].payload).toEqual(await repo.getDailyState(p.deck.id,day.localDate));expect(op.changes[0].payload).toMatchObject({introducedEntryIds:[p.card.id]});
  });
  it('keeps independently validated browser namespaces separate within the same authenticated owner',async()=>{
    const p=fixture();await repo.confirmMangaCard(p);expect(await adapter.syncNow()).toBe(true);
    const namespace='00000000-0000-4000-8000-000000000002',old=p.confirmation.entity;
    const entityId=await mangaEntityId(namespace,old.originReference,old.word,old.reading,old.branch);
    const identity=await lexicalIdentity({...old.identity.anchor,entryId:entityId},[old.word],MANGA_CURATED_POLICY);
    const id='second-browser-confirmation',cardId=await digest('mc-',[p.deck.id,identity.key,'japanese-to-meaning']);
    const next={...p,confirmation:{...p.confirmation,id,entity:{...old,id:entityId,identity,registryNamespace:namespace}},
      card:{...p.card,id:cardId,lexicalIdentity:identity,glosses:[{...p.card.glosses[0],source:{...p.card.glosses[0].source,sourceId:id}}]}};
    TestBed.resetTestingModule();factory=new IDBFactory();setup();await repo.setCustomConsent(workspace.active(),true);expect(await adapter.syncNow()).toBe(true);
    await repo.confirmMangaCard(next);expect((await repo.content(p.deck.id)).map(c=>c.order).sort()).toEqual([1,2]);expect((await repo.permanentRegistry()).identities).toHaveLength(2);
  });
  it('publishes parent decks before cards even when a later settings change sorts the deck after its cards',async()=>{
    const p=fixture();await repo.confirmMangaCard(p);expect(await adapter.syncNow()).toBe(true);
    await repo.saveSettings('newer-deck-than-card',p.deck.id,{...p.deck.settings,newCardsPerDay:7});expect(await adapter.syncNow()).toBe(true);
    TestBed.resetTestingModule();factory=new IDBFactory();setup();await repo.setCustomConsent(workspace.active(),true);expect(await adapter.syncNow()).toBe(true);
    expect((await repo.content(p.deck.id))).toHaveLength(1);expect((await repo.list())[0].settings.newCardsPerDay).toBe(7);
  });
  it('rolls back failed local publication atomically and resumes without repeating the remote event',async()=>{
    const p=fixture();await repo.confirmMangaCard(p);expect(await adapter.syncNow()).toBe(true);const before=await repo.content(p.deck.id),original=IDBObjectStore.prototype.put;
    const fail=vi.spyOn(IDBObjectStore.prototype,'put').mockImplementation(function(this:IDBObjectStore,...args){if(this.name==='cards')throw new DOMException('full','QuotaExceededError');return original.apply(this,args);});
    expect(await adapter.syncNow()).toBe(false);expect(await repo.content(p.deck.id)).toEqual(before);expect((await repo.list())).toHaveLength(1);
    fail.mockRestore();expect(await adapter.syncNow()).toBe(true);expect(port.calls).toBe(1);expect(port.receipts.size).toBe(1);
  });
});
