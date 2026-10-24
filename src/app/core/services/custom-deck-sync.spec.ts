import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { IDBFactory, IDBKeyRange, IDBObjectStore } from 'fake-indexeddb';
import { MangaConfirmedCardOperation } from '../models/manga-deck-confirmation.model';
import { LocalWorkspaceId } from '../models/account.model';
import { CustomRemoteBundle, CustomRemoteChange, CustomRemoteOperation } from '../models/custom-deck-sync.model';
import { CUSTOM_DECK_DATABASE, CUSTOM_DECK_DATABASE_VERSION, CUSTOM_DECK_IDB, CUSTOM_DECKS_ENABLED, CustomDeckRepository } from './custom-deck.repository';
import { MANGA_DECK_ASSISTED_ENABLED } from './manga-deck-gate';
import { canonical } from './custom-deck-validation';
import { validateMangaConfirmedOperation } from './manga-deck-confirmation';
import { assertCustomSyncWorkspace, customBundleReadiness, customSyncJsonBytes, validServerRevision, validateCustomRemoteOperation } from './custom-deck-sync-contract';
import { memory } from './lexical-knowledge.fixture';

const fs=(globalThis as unknown as {process:{getBuiltinModule:(name:string)=>{readFileSync:(path:string,encoding:string)=>string}}}).process.getBuiltinModule('fs');
const fixture=():MangaConfirmedCardOperation=>JSON.parse(fs.readFileSync('supabase/tests/h2ba-fixture.json','utf8'));
const stores=['decks','cards','progress','events','daily','journal'];
const changes=(p:MangaConfirmedCardOperation):CustomRemoteChange[]=>[
  {kind:'identity',id:p.confirmation.entity.id,payload:p.confirmation.entity,baseRevision:'0'},
  {kind:'deck',id:p.deck.id,payload:p.deck,baseRevision:'0'},
  {kind:'card',id:p.card.id,payload:p.card,baseRevision:'0'},
  {kind:'confirmation',id:p.confirmation.id,payload:p.confirmation,baseRevision:'0'},
  {kind:'volume-link',id:p.deck.id,payload:{schemaVersion:1,deckId:p.deck.id,volumeId:p.confirmation.source.volumeId},baseRevision:'0'},
  {kind:'manifest',id:p.deck.id,payload:{schemaVersion:1,deckId:p.deck.id,cardIds:[p.card.id]},baseRevision:'0'}];

describe('Custom remote V1 contracts, without transport activation',()=>{
  it('accepts the exact H2B-A fixture used by PostgreSQL without rewriting IDs or original intent order',async()=>{
    const p=fixture(),before=structuredClone(p);await validateMangaConfirmedOperation(p);
    await validateCustomRemoteOperation({schemaVersion:1,operationId:p.confirmation.id,action:'publish',changes:changes(p),intent:p});
    expect(p).toEqual(before);expect(p.card.order).toBe(0);expect(p.confirmation.expertCertified).toBe(false);
  });
  it.each(['0','1','9007199254740993','9223372036854775807'])('keeps exact server revision %s as decimal text',s=>expect(validServerRevision(s)).toBe(true));
  it.each(['-1','01','1.5','1e3','9223372036854775808'])('rejects invalid revision %s',s=>expect(validServerRevision(s)).toBe(false));
  it('counts PostgreSQL JSON bytes including spaces, escaping, astral characters and expanded exponents',()=>{
    expect(customSyncJsonBytes({a:[1,2]})).toBe(13);expect(customSyncJsonBytes([1e21,1e-7])).toBe(35);
    expect(customSyncJsonBytes('𠮷"\\')).toBe(10);expect(()=>customSyncJsonBytes('\ud800')).toThrow();expect(()=>customSyncJsonBytes(Infinity)).toThrow();
  });
  it('rejects userId, images, duplicate changes and oversized requests',async()=>{
    const p=fixture(),op:CustomRemoteOperation={schemaVersion:1,operationId:'x',action:'publish',changes:changes(p)};
    await expect(validateCustomRemoteOperation({...op,userId:'forged'} as CustomRemoteOperation)).rejects.toThrow();
    await expect(validateCustomRemoteOperation({...op,changes:[...op.changes,op.changes[0]]})).rejects.toThrow();
    await expect(validateCustomRemoteOperation({...op,changes:op.changes.map(c=>c.kind==='card'?{...c,payload:{...p.card,images:['private']} as typeof p.card}:c)})).rejects.toThrow();
    await expect(validateCustomRemoteOperation({...op,intent:{...p,rawOcr:'x'.repeat(524288)} as MangaConfirmedCardOperation})).rejects.toThrow();
  });
  it('partial or stale downloads are not a ready empty deck; manifest references bind canonical revisions',()=>{
    const p=fixture(),entities=changes(p).filter(c=>c.kind!=='manifest').map(c=>({kind:c.kind,id:c.id,payload:c.payload,revision:'1',deleted:false,archived:false,head:null,voidedBy:null}));
    const m={schemaVersion:1 as const,deckId:p.deck.id,cardIds:[p.card.id],references:entities.map(e=>({kind:e.kind,id:e.id,revision:e.revision}))};
    const bundle:CustomRemoteBundle={schemaVersion:1,status:'complete',manifest:{kind:'manifest',id:p.deck.id,payload:m,revision:'2',deleted:false,archived:false,head:null,voidedBy:null},entities};
    expect(customBundleReadiness(bundle)).toBe('ready');expect(customBundleReadiness(null)).toBe('incomplete');
    expect(customBundleReadiness({...bundle,entities:[]})).toBe('incomplete');
    expect(customBundleReadiness({...bundle,status:'paged-required'})).toBe('incomplete');
    expect(customBundleReadiness({...bundle,entities:entities.map(e=>e.kind==='identity'?{...e,revision:'3'}:e)})).toBe('incomplete');
    expect(customBundleReadiness({...bundle,entities:entities.map(e=>e.kind==='card'?{...e,deleted:true}:e)})).toBe('incomplete');
  });
  it('requires a captured authenticated workspace, including after a user change',()=>{
    expect(()=>assertCustomSyncWorkspace('guest','guest')).toThrow();expect(()=>assertCustomSyncWorkspace('user:a','user:b')).toThrow();
    expect(()=>assertCustomSyncWorkspace('user:a','user:a')).not.toThrow();
  });
});

describe('H2B-A journal to permanent registry: additive, atomic and recoverable',()=>{
  let factory:IDBFactory,repo:CustomDeckRepository;
  const configure=()=>{
    TestBed.configureTestingModule({providers:[{provide:CUSTOM_DECK_IDB,useValue:factory},{provide:CUSTOM_DECKS_ENABLED,useValue:signal(true)},
      {provide:MANGA_DECK_ASSISTED_ENABLED,useValue:signal(true)}]});repo=TestBed.inject(CustomDeckRepository);
  };
  beforeEach(()=>{TestBed.resetTestingModule();localStorage.clear();factory=new IDBFactory();vi.stubGlobal('indexedDB',factory);vi.stubGlobal('IDBKeyRange',IDBKeyRange);configure();});
  afterEach(()=>{TestBed.resetTestingModule();vi.restoreAllMocks();vi.unstubAllGlobals();});
  async function seed(owner='guest',bad=false){
    const source=fixture(),p:MangaConfirmedCardOperation={...source,confirmation:{...source.confirmation,workspace:owner as LocalWorkspaceId,actor:{kind:'local-workspace-user',workspace:owner as LocalWorkspaceId}}};
    const db=await new Promise<IDBDatabase>((resolve,reject)=>{const r=factory.open(CUSTOM_DECK_DATABASE,1);
      r.onupgradeneeded=()=>{for(const s of stores){const store=r.result.createObjectStore(s,{keyPath:['workspace','key']});store.createIndex('workspace','workspace');if(s==='cards'){
        store.createIndex('deck',['workspace','value.deckId']);store.createIndex('lexical',['workspace','value.deckId','value.lexicalIdentity.key','value.direction'],{unique:true});}}};
      r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
    const m=memory(p.deck.id,p.card.id),op={schemaVersion:1,id:p.confirmation.id,workspace:owner,kind:'manga-confirmation',entityId:p.deck.id,
      createdAt:p.confirmation.confirmedAt,localRevision:1,state:'committed',request:canonical({kind:'manga-confirmation',entityId:p.deck.id,payload:p}),payload:bad?{...p,schemaVersion:0}:p};
    await new Promise<void>((resolve,reject)=>{const tx=db.transaction(stores,'readwrite');tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error);
      const put=(s:string,key:string,value:unknown,extra={})=>tx.objectStore(s).put({workspace:owner,key,value,...extra});
      put('decks',p.deck.id,p.deck,{count:1});put('cards',JSON.stringify([p.deck.id,p.card.id]),{...p.card,order:1});
      put('progress',JSON.stringify([p.deck.id,p.card.id]),m.progress,{head:m.event.id});put('events',m.event.id,m.event);put('journal',op.id,op);
    });db.close();return {p,m,op};
  }
  it('upgrades schema and copies durable records while preserving journal, content, IDs and FSRS',async()=>{
    const {p,m,op}=await seed();await repo.migratePermanentRegistry();await repo.migratePermanentRegistry();
    expect(await repo.journal()).toEqual([op]);expect(await repo.getDeckProgress(p.deck.id)).toEqual([m.progress]);
    expect((await repo.content(p.deck.id))[0]).toEqual({...p.card,order:1});
    const registry=await repo.permanentRegistry();expect(registry.identities).toEqual([p.confirmation.entity]);expect(registry.confirmations).toEqual([p]);
    const db=await new Promise<IDBDatabase>(resolve=>{const r=factory.open(CUSTOM_DECK_DATABASE);r.onsuccess=()=>resolve(r.result);});
    expect(db.version).toBe(CUSTOM_DECK_DATABASE_VERSION);expect(db.objectStoreNames.contains('identities')).toBe(true);db.close();
  });
  it('rolls back a failed backfill and retries without duplicating records or discarding source',async()=>{
    const {p,op}=await seed(),original=IDBObjectStore.prototype.put;
    const fail=vi.spyOn(IDBObjectStore.prototype,'put').mockImplementation(function(this:IDBObjectStore,...args){if(this.name==='confirmations')throw new DOMException('full','QuotaExceededError');return original.apply(this,args);});
    await expect(repo.migratePermanentRegistry()).rejects.toThrow();fail.mockRestore();expect(await repo.journal()).toEqual([op]);
    await repo.migratePermanentRegistry();expect((await repo.permanentRegistry()).confirmations).toEqual([p]);
  });
  it('permanent receipts survive service reload and no longer depend on reading the journal',async()=>{
    const {p}=await seed();await repo.migratePermanentRegistry();TestBed.resetTestingModule();configure();
    const journal=vi.spyOn(repo,'journal').mockRejectedValue(Error('journal not needed for registry lookup'));
    expect(await repo.mangaConfirmations()).toEqual([p.confirmation]);expect(journal).not.toHaveBeenCalled();
  });
  it('isolates identical Guest IDs in another workspace without overwriting either owner',async()=>{
    const guest=await seed(),user=await seed('user:target');await repo.migratePermanentRegistry('guest');
    expect((await repo.permanentRegistry('user:target')).confirmations).toEqual([user.p]);
    expect((await repo.permanentRegistry('guest')).confirmations).toEqual([guest.p]);
  });
  it('rejects corrupt historical receipts and retains the original data for recovery',async()=>{
    const {op}=await seed('guest',true);await expect(repo.migratePermanentRegistry()).rejects.toThrow();expect(await repo.journal()).toEqual([op]);
  });
});
