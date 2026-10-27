import {TestBed} from '@angular/core/testing';
import {signal} from '@angular/core';
import {IDBFactory,IDBKeyRange,IDBObjectStore} from 'fake-indexeddb';
import {CUSTOM_DECK_IDB,CustomDeckRepository} from './custom-deck.repository';
import {CUSTOM_DECKS_ENABLED} from './custom-deck-gates';
import {MANGA_DECK_ASSISTED_ENABLED} from './manga-deck-gate';
import {DeckBackupService} from './deck-backup.service';
import {BACKUP_STORES,BACKUP_MAX_BYTES,decodeBackup,encodeBackup,validateBackupRecords,emptyBackupRecords} from './deck-backup-contract';
import {WorkspaceService} from './workspace.service';
import {DeckCatalogService} from './deck-catalog.service';
import {DeckStudyService} from './deck-study.service';
import {canonical,digest,lexicalIdentity} from './custom-deck-validation';
import {customDeck,customCard} from './custom-deck.fixture';
import fixture from '../../../../supabase/tests/h2ba-fixture.json';
import {MangaConfirmedCardOperation} from '../models/manga-deck-confirmation.model';

describe('RELEASE-MANGA-2A complete Guest backup',()=>{
 let db:IDBFactory;
 const now=new Date('2026-10-25T12:00:00Z'),signalFor=()=>new AbortController().signal;
 function configure(){TestBed.configureTestingModule({providers:[{provide:CUSTOM_DECK_IDB,useValue:db},{provide:CUSTOM_DECKS_ENABLED,useValue:signal(true)},{provide:MANGA_DECK_ASSISTED_ENABLED,useValue:signal(true)}]});}
 function fresh(){TestBed.resetTestingModule();db=new IDBFactory();vi.stubGlobal('indexedDB',db);configure();}
 const repo=()=>TestBed.inject(CustomDeckRepository),service=()=>TestBed.inject(DeckBackupService);
 async function seed(){await repo().confirmMangaCard(structuredClone(fixture) as unknown as MangaConfirmedCardOperation);}
 async function grade(){const loaded=await TestBed.inject(DeckCatalogService).load(fixture.deck.id);if(loaded.status!=='ready')throw Error('fixture');const {deck,content}=loaded.value,study=TestBed.inject(DeckStudyService);const snapshot=await study.snapshot(deck,content.index,now),choice=study.chooseNext(snapshot,deck,{debt:0}).choice!;return study.rate(deck,choice,study.preview(deck,choice,now),'good',1234,now);}
 async function signed(data:any){const {sha256,...body}=data;return JSON.stringify({...body,sha256:await digest('',body)});}
 beforeEach(()=>{localStorage.clear();vi.stubGlobal('IDBKeyRange',IDBKeyRange);fresh();});
 afterEach(()=>{TestBed.resetTestingModule();vi.restoreAllMocks();vi.unstubAllGlobals();localStorage.clear();});
 it('exports an empty deck with escaped Unicode, settings and the complete closed inventory',async()=>{
  await repo().create('empty',customDeck(),[]);const data=await decodeBackup(await service().export(signalFor()));expect(data.counts.decks).toBe(1);expect(data.counts.cards).toBe(0);expect(Object.keys(data.records)).toEqual([...BACKUP_STORES]);expect(data.records.decks[0].value.title).toBe(customDeck().title);
 });
 it('restores all stores exactly, including permanent identities, voided events, null snapshots, daily, receipts and original journal',async()=>{
  await seed();const event=await grade();await TestBed.inject(DeckStudyService).undo(event);
  await repo().create('other',customDeck('md-other'),[await customCard('md-other')]);await repo().saveSettings('settings','md-other',{desiredRetention:.85,newCardsPerDay:7,newCardOrder:'before-reviews'});
  const original=await repo().guestInventory(),raw=await service().export(signalFor()),parsed=await decodeBackup(raw);expect(parsed.counts.events).toBe(1);expect(parsed.records.events[0].voidedBy).toBeTruthy();expect(parsed.records.events[0].value.elapsedAnswerMs).toBe(1234);expect(parsed.records.progress[0].value).toBeNull();
  fresh();await service().restore(raw,true,signalFor());expect(await repo().guestInventory()).toEqual(original);
  TestBed.resetTestingModule();configure();expect(await repo().guestInventory()).toEqual(original);const loaded=await TestBed.inject(DeckCatalogService).load(fixture.deck.id);expect(loaded.status).toBe('ready');await grade();expect(await repo().getDeckReviewEvents(fixture.deck.id)).toHaveLength(1);
 });
 it.each([1,2,3])('validates exact serialized state %s without scheduling during backup',async state=>{
  await seed();await grade();const data=JSON.parse(await service().export(signalFor()));
  // Controlled state variants preserve the real engine-generated intervals and all duplicated documents.
  data.records.progress[0].value.state=state;data.records.progress[0].value.card.state=state;data.records.events[0].value.stateAfter=state;
  const op=data.records.journal.find((r:any)=>r.value.kind==='review').value;op.payload.progress.state=state;op.payload.progress.card.state=state;op.payload.event.stateAfter=state;op.request=canonical({kind:op.kind,entityId:op.entityId,payload:{event:op.payload.event}});
  const raw=await signed(data);fresh();await service().restore(raw,true,signalFor());expect((await repo().getDeckProgress(fixture.deck.id))[0].state).toBe(state);expect((await repo().getDeckReviewEvents(fixture.deck.id))[0].elapsedAnswerMs).toBe(1234);
 });
 it.each(['truncated','hash','version','reference','head','event','count','extra','owner'])('rejects %s without changing the destination',async mode=>{
  await seed();await grade();const data=JSON.parse(await service().export(signalFor()));let raw:string;
  if(mode==='truncated')raw=JSON.stringify(data).slice(0,-3);
  else if(mode==='hash'){data.records.cards[0].value.word='犬';raw=JSON.stringify(data);}
  else{if(mode==='version')data.version=2;if(mode==='reference')data.records.cards=[];if(mode==='head')data.records.progress[0].head='missing';if(mode==='event')data.records.events[0].voidedBy='missing';if(mode==='count')data.counts.cards=99;if(mode==='extra')data.records.cards[0].access_token='private';if(mode==='owner')data.scope='user:other';raw=await signed(data);}
  fresh();await expect(service().restore(raw,true,signalFor())).rejects.toThrow();expect(await repo().guestInventory()).toEqual({source:'guest',records:emptyBackupRecords()});
 });
 it('rejects nonportable cloud evidence without discarding or confirming it',async()=>{const records=emptyBackupRecords();records.reconciliation=[{workspace:'guest',key:'v1',value:{version:1,entities:[],prepared:{},conflicts:{},stage:null}}];await expect(encodeBackup(records)).rejects.toMatchObject({code:'coordination'});});
 it('preserves a verified historical registry without inventing its optional namespace metadata',async()=>{
  await seed();const records=(await decodeBackup(await service().export(signalFor()))).records;records['registry-meta']=records['registry-meta'].filter(r=>r.key!=='local-namespace');const raw=await encodeBackup(records);
  fresh();await service().restore(raw,true,signalFor());expect((await repo().guestInventory()).records).toEqual(records);expect(await repo().localRegistryNamespace()).toBeNull();await grade();expect(await repo().getDeckReviewEvents(fixture.deck.id)).toHaveLength(1);
 });
 it('rejects a nonempty destination and duplicate restoration rather than overwriting',async()=>{await seed();const raw=await service().export(signalFor()),before=await repo().guestInventory();await expect(service().restore(raw,true,signalFor())).rejects.toMatchObject({code:'nonempty'});expect(await repo().guestInventory()).toEqual(before);fresh();await service().restore(raw,true,signalFor());const restored=await repo().guestInventory();await expect(service().restore(raw,true,signalFor())).rejects.toMatchObject({code:'nonempty'});expect(await repo().guestInventory()).toEqual(restored);});
 it('requires explicit confirmation and rejects an incompatible destination owner',async()=>{const raw=await encodeBackup(emptyBackupRecords());await expect(service().restore(raw,false,signalFor())).rejects.toMatchObject({code:'confirmation'});TestBed.inject(WorkspaceService).activateUser('other');await expect(service().restore(raw,true,signalFor())).rejects.toMatchObject({code:'owner'});});
 it('preserves a daily override with an absent completion timestamp, without inventing a date',async()=>{
  await seed();const loaded=await TestBed.inject(DeckCatalogService).load(fixture.deck.id);if(loaded.status!=='ready')throw Error('fixture');await TestBed.inject(DeckStudyService).adjustTodayNewLimit(loaded.value.deck,5,now);
  const before=await repo().guestInventory(),raw=await service().export(signalFor());fresh();await service().restore(raw,true,signalFor());expect(await repo().guestInventory()).toEqual(before);expect((await repo().getDailyState(fixture.deck.id,'2026-10-25'))?.completedAt).toBeUndefined();
 });
 it.each(['quota','cancel','workspace'])('rolls back all stores on %s during puts',async mode=>{
  await seed();await grade();const raw=await service().export(signalFor());fresh();const controller=new AbortController(),put=IDBObjectStore.prototype.add,workspace=TestBed.inject(WorkspaceService);let fired=false;
  vi.spyOn(IDBObjectStore.prototype,'add').mockImplementation(function(this:IDBObjectStore,...args:[any,IDBValidKey?]){if(this.name==='events'&&!fired){fired=true;if(mode==='quota')throw new DOMException('quota','QuotaExceededError');if(mode==='cancel')controller.abort();else{workspace.activateUser('other');workspace.activateGuest();}}return put.apply(this,args);});
  await expect(service().restore(raw,true,controller.signal)).rejects.toThrow();expect(fired).toBe(true);expect(await repo().guestInventory()).toEqual({source:'guest',records:emptyBackupRecords()});
 });
 it('bounds files before reading, rejects excessive complexity and never fetches',async()=>{
  const read=vi.fn(),fetcher=vi.fn();vi.stubGlobal('fetch',fetcher);
  await expect(service().preview({size:BACKUP_MAX_BYTES+1,text:read} as unknown as Blob,signalFor())).rejects.toMatchObject({code:'limit'});expect(read).not.toHaveBeenCalled();
  const records=emptyBackupRecords();let nested:any={};for(let i=0;i<50;i++)nested={child:nested};(records as any).extra=nested;await expect(validateBackupRecords(records)).rejects.toThrow();await service().export(signalFor());expect(fetcher).not.toHaveBeenCalled();
 });
 it('rejects row count and nesting limits without truncation',async()=>{
  const rows=emptyBackupRecords();rows.decks=Array.from({length:30001},(_,i)=>({workspace:'guest',key:String(i),value:{}}));await expect(validateBackupRecords(rows)).rejects.toMatchObject({code:'limit'});
  const deep=emptyBackupRecords();let value:any={};for(let i=0;i<45;i++)value={child:value};deep.journal=[{workspace:'guest',key:'deep',value}];await expect(validateBackupRecords(deep)).rejects.toMatchObject({code:'limit'});
 });
 it('serializes competing restorations, committing only one complete copy',async()=>{
  await seed();const raw=await service().export(signalFor());fresh();const results=await Promise.allSettled([service().restore(raw,true,signalFor()),service().restore(raw,true,signalFor())]);expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);expect((await repo().guestInventory()).records['cards']).toHaveLength(1);
 });
 it('records bounded fixture timings and Node heap deltas, not physical mobile RAM peaks',async()=>{
  const measures=[],memory=()=>(globalThis as unknown as {process?:{memoryUsage():{heapUsed:number}}}).process?.memoryUsage().heapUsed??null;
  for(const n of [1,100,500]){
   fresh();const d=customDeck(),base=await customCard(),cards=await Promise.all(Array.from({length:n},async(_,i)=>({...base,id:'fixture-'+i,lexicalIdentity:await lexicalIdentity({...base.lexicalIdentity.anchor,entryId:String(50000+i)},['猫'],'benchmark')})));
   await repo().create('benchmark',d,cards);const heapBefore=memory(),start=performance.now(),raw=await service().export(signalFor()),exportMs=performance.now()-start;
   fresh();const restoreStart=performance.now();await service().restore(raw,true,signalFor());expect(await repo().content(d.id)).toHaveLength(n);
   const heapAfter=memory();measures.push({cards:n,bytes:new TextEncoder().encode(raw).length,exportMs,restoreMs:performance.now()-restoreStart,nodeHeapDeltaBytes:heapAfter===null||heapBefore===null?null:heapAfter-heapBefore,physicalMobilePeakMeasured:false});
  }
  const runtime=globalThis as unknown as {process?:{getBuiltinModule(name:string):{mkdirSync(path:string,options:{recursive:boolean}):void;writeFileSync(path:string,contents:string):void}}};
  const files=runtime.process?.getBuiltinModule('node:fs');files?.mkdirSync('.cache',{recursive:true});files?.writeFileSync('.cache/release2a-performance.json',JSON.stringify(measures,null,2));
 });
});
