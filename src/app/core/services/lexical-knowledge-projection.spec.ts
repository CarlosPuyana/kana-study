import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { LexicalEvidenceManifest } from '../models/lexical-knowledge.model';
import { LexicalKnowledgeProjectionService } from './lexical-knowledge-projection.service';
import { LEXICAL_EVIDENCE_MANIFEST, LexicalEvidenceService } from './lexical-evidence.service';
import { CustomDeckRepository, CUSTOM_DECKS_ENABLED, CUSTOM_DECK_IDB } from './custom-deck.repository';
import { MANGA_DECK_ASSISTED_ENABLED } from './manga-deck-gate';
import { MangaDeckAssistedService } from './manga-deck-assisted.service';
import { DeckCatalogService } from './deck-catalog.service';
import { DeckDatabaseService } from './deck-database.service';
import { DeckStudyService } from './deck-study.service';
import { DECK_SCHEDULER_ENABLE_FUZZ } from './deck-scheduler.service';
import { WorkspaceService } from './workspace.service';
import { SyncOutboxService } from './sync-outbox.service';
import { customCard, customDeck } from './custom-deck.fixture';
import { digest } from './custom-deck-validation';
import { KNOWLEDGE_NOW, memory, provenIdentity, verification } from './lexical-knowledge.fixture';

describe('LexicalKnowledgeProjectionService: read-only workspace inventory, evidence and cache',()=>{
  const manifest=signal<LexicalEvidenceManifest>({schemaVersion:1,revision:'empty',identities:[],mappings:[],equivalences:[]});
  let repo:CustomDeckRepository,catalog:DeckCatalogService,builtin:DeckDatabaseService,workspace:WorkspaceService;
  beforeEach(()=>{
    TestBed.resetTestingModule();localStorage.clear();const factory=new IDBFactory();
    vi.stubGlobal('indexedDB',factory);vi.stubGlobal('IDBKeyRange',IDBKeyRange);
    manifest.set({schemaVersion:1,revision:'empty',identities:[],mappings:[],equivalences:[]});
    TestBed.configureTestingModule({providers:[{provide:LEXICAL_EVIDENCE_MANIFEST,useValue:manifest},
      {provide:CUSTOM_DECK_IDB,useValue:factory},{provide:CUSTOM_DECKS_ENABLED,useValue:signal(true)},
      {provide:MANGA_DECK_ASSISTED_ENABLED,useValue:signal(true)},{provide:DECK_SCHEDULER_ENABLE_FUZZ,useValue:false}]});
    repo=TestBed.inject(CustomDeckRepository);catalog=TestBed.inject(DeckCatalogService);
    builtin=TestBed.inject(DeckDatabaseService);workspace=TestBed.inject(WorkspaceService);
  });
  afterEach(()=>{TestBed.resetTestingModule();vi.restoreAllMocks();vi.unstubAllGlobals();});
  const projection=()=>TestBed.inject(LexicalKnowledgeProjectionService);
  async function custom(){const card=await customCard();await repo.create('create',customDeck(),[card]);return card;}
  async function trustedCustom(){
    const card=await custom();manifest.set({...manifest(),revision:'test-1',identities:[{identity:card.lexicalIdentity,evidence:verification}]});return card;
  }
  async function local(){
    const service=TestBed.inject(MangaDeckAssistedService);
    const draft=await service.open('volume','Volume',1,{mode:'selection',text:'猫。',selectedText:'猫',offset:0,startOffset:0,endOffset:1,blockIndex:0,lineIndex:0,x:0,y:0},
      {query:'猫',installed:false,terms:[]});
    const preview=await service.preview(draft,{word:'猫',reading:'ねこ',meaning:'gato',language:'es',proposalIndex:null,reuseEntityId:null,newIdentity:false,reviewed:true});
    await service.confirm(preview);return preview;
  }
  it('does not trust an arbitrary jmdict anchor or textual OCR, including a suggested key',async()=>{
    const c=await custom(),p=projection();
    expect((await p.query({kind:'identity',identity:c.lexicalIdentity})).state).toBe('unlinked');
    expect((await p.query({kind:'proposal',surface:'猫',reading:'ねこ',possibleKeys:[c.lexicalIdentity.key]})).reasons).toEqual(['possible-equivalence-unproved']);
    expect((await p.load()).unmappedCards).toBe(1501);
  });
  it('classifies a locally registered curated entity without giving it global equivalences',async()=>{
    const localCard=await local(),p=projection(),before=await repo.journal();
    const result=await p.query({kind:'identity',identity:localCard.card.lexicalIdentity});
    expect(result.state).toBe('pending');expect(result.identities[0].proof).toMatchObject({kind:'local-confirmation',workspace:'guest'});
    expect(result.equivalenceIds).toEqual([]);expect(result.inventoryComplete).toBe(false);
    expect(await repo.journal()).toEqual(before);expect(await repo.getDeckProgress(localCard.deck.id)).toEqual([]);
  });
  it('actual review and undo invalidate the cache and omit voided custom events',async()=>{
    const c=await local(),p=projection(),initial=await p.load();
    const loaded=await catalog.load(c.deck.id);if(loaded.status!=='ready')throw Error('fixture');
    const study=TestBed.inject(DeckStudyService),{deck,content}=loaded.value,now=new Date(KNOWLEDGE_NOW);
    const choice=study.chooseNext(await study.snapshot(deck,content.index,now),deck,{debt:0}).choice!;
    const event=await study.rate(deck,choice,study.preview(deck,choice,now),'good',1000,now);
    expect(p.snapshot()).toBeNull();const reviewed=await p.query({kind:'identity',identity:c.card.lexicalIdentity});
    expect(reviewed.state).toBe('learning');expect(reviewed.cards[0].eventIds).toEqual([event.id]);
    expect((await p.load()).cacheKey).not.toBe(initial.cacheKey);
    await study.undo(event);expect((await p.query({kind:'identity',identity:c.card.lexicalIdentity})).state).toBe('pending');
    expect(await repo.getDeckReviewEvents(c.deck.id)).toEqual([]);
    expect((await repo.journal()).filter(o=>o.kind==='review'||o.kind==='undo')).toHaveLength(2);
  });
  it('does not infer a foreign curated entity after switching workspace',async()=>{
    const c=await local(),p=projection();await p.load();workspace.activateUser('other');
    expect(p.snapshot()).toBeNull();expect((await p.query({kind:'identity',identity:c.card.lexicalIdentity})).state).toBe('unlinked');
  });
  it('includes archived decks but does not add them to the daily catalog',async()=>{
    const c=await customCard();await repo.create('archived',{...customDeck(),status:'archived'},[c]);
    manifest.set({...manifest(),revision:'archived-1',identities:[{identity:c.lexicalIdentity,evidence:verification}]});
    await catalog.refresh();expect(catalog.items().some(d=>d.id===c.deckId)).toBe(false);
    const result=await projection().query({kind:'identity',identity:c.lexicalIdentity});
    expect(result.cards).toHaveLength(1);expect(result.cards[0].archived).toBe(true);
  });
  it('missing content cannot be resurrected by residual FSRS or events',async()=>{
    const c=await trustedCustom(),m=memory(c.deckId,c.id);
    vi.spyOn(repo,'content').mockResolvedValue([]);
    vi.spyOn(repo,'getDeckProgress').mockResolvedValue([m.progress]);vi.spyOn(repo,'getDeckReviewEvents').mockResolvedValue([m.event]);
    const result=await projection().query({kind:'identity',identity:c.lexicalIdentity});
    expect(result.cards).toEqual([]);expect(result.state).toBe('indeterminate');
  });
  it('quarantines unreadable snapshots instead of silently converting them into New',async()=>{
    const c=await trustedCustom();vi.spyOn(repo,'getDeckProgress').mockRejectedValue(Error('corrupt snapshot'));
    const result=await projection().query({kind:'identity',identity:c.lexicalIdentity});
    expect(result.state).toBe('indeterminate');expect(result.cards[0].reasons).toEqual(['invalid-history']);
  });
  it('reads a partial builtin mapping and invalidates after cloud merges, without touching editorial content',async()=>{
    const loaded=await catalog.load('japanese-1500');if(loaded.status!=='ready')throw Error('fixture');
    const entry=loaded.value.content.entries()[0],identity=(await provenIdentity('99',entry.word,entry.reading)).identity;
    manifest.set({...manifest(),revision:'partial-1',identities:[{identity,evidence:verification}],mappings:[{
      deckId:'japanese-1500',entryId:entry.id,identityKey:identity.key,contentDigest:await digest('entry-',entry),evidence:verification,revoked:false}]});
    const p=projection();expect((await p.query({kind:'identity',identity})).state).toBe('pending');
    expect((await p.load()).unmappedCards).toBe(1499);
    const m=memory('japanese-1500',entry.id);
    const corrupt=vi.spyOn(builtin,'getDeckProgress').mockResolvedValue([{...m.progress,card:{...m.progress.card,stability:NaN}}]);
    p.invalidate();expect((await p.query({kind:'identity',identity})).state).toBe('indeterminate');corrupt.mockRestore();
    await builtin.mergeFromCloud({progress:[m.progress],events:[m.event],daily:[]});
    const known=await p.query({kind:'identity',identity});expect(known.state).toBe('known');expect(known.cards[0].eventIds).toEqual([m.event.id]);
    const revision=builtin.revision();await builtin.undoReview(m.event,{deckId:'japanese-1500',localDate:'2026-10-22',introducedEntryIds:[],newLimitOverride:null});
    expect(builtin.revision()).toBe(revision+1); // Restored snapshot has no remaining effective head: indeterminate.
    expect((await p.query({kind:'identity',identity})).state).toBe('indeterminate');
    expect(await digest('entry-',entry)).toBe(manifest().mappings[0].contentDigest);
  });
  it('rejects stale mappings and revoked mappings rather than matching only word/reading',async()=>{
    const loaded=await catalog.load('japanese-1500');if(loaded.status!=='ready')throw Error('fixture');
    const entry=loaded.value.content.entries()[0],identity=(await provenIdentity('99',entry.word,entry.reading)).identity;
    manifest.set({...manifest(),revision:'stale',identities:[{identity,evidence:verification}],mappings:[{deckId:'japanese-1500',entryId:entry.id,
      identityKey:identity.key,contentDigest:'entry-'+'0'.repeat(64),evidence:verification,revoked:false}]});
    const p=projection();expect((await p.query({kind:'identity',identity})).cards).toEqual([]);
    expect((await p.load()).issues).toEqual([`mapping-content-mismatch:japanese-1500:${entry.id}`]);
    manifest.set({...manifest(),revision:'revoked',mappings:manifest().mappings.map(m=>({...m,revoked:true}))});
    expect((await p.load()).issues).toEqual([]);expect((await p.load()).unmappedCards).toBe(1500);
  });
  it('coalesces queries, invalidates content revisions and rejects stale publication after workspace changes',async()=>{
    const c=await trustedCustom(),p=projection();const first=await p.load();
    expect(await p.load()).toBe(first);expect(await p.load()).toBe(first);
    await repo.editCard('edit',{...c,contentVersion:2,glosses:[{...c.glosses[0],text:'edited'}]},1);
    expect(p.snapshot()).toBeNull();expect((await p.load()).cacheKey).not.toBe(first.cacheKey);
    const original=catalog.knowledgeInventory.bind(catalog);let release!:()=>void,started!:()=>void;
    const held=new Promise<void>(resolve=>release=resolve),entered=new Promise<void>(resolve=>started=resolve);
    vi.spyOn(catalog,'knowledgeInventory').mockImplementationOnce(async owner=>{started();await held;return original(owner);});
    p.invalidate();const stale=p.load();await entered;workspace.activateUser('new');release();
    await expect(stale).rejects.toThrow();expect(p.snapshot()).toBeNull();
    expect((await p.load()).workspace).toBe('user:new');
  });
  it('verified equivalence revocation changes groups without rewriting card or journal',async()=>{
    const c=await trustedCustom(),other=await provenIdentity('2');
    manifest.set({...manifest(),revision:'link-1',identities:[...manifest().identities,{identity:other.identity,evidence:verification}],
      equivalences:[{id:'edge',left:c.lexicalIdentity.key,right:other.identity.key,evidence:verification,revoked:false}]});
    const p=projection(),before=await repo.journal();expect((await p.query({kind:'identity',identity:other.identity})).state).toBe('pending');
    manifest.set({...manifest(),revision:'link-2',equivalences:manifest().equivalences.map(e=>({...e,revoked:true}))});
    expect((await p.query({kind:'identity',identity:other.identity})).state).toBe('indeterminate');
    expect(await repo.journal()).toEqual(before);
  });
  it('invalidates after a builtin local commit even when the later outbox enqueue fails',async()=>{
    workspace.activateUser('offline-test');const p=projection(),initial=await p.load();
    const m=memory('japanese-1500','controlled-unmapped-card'),revision=builtin.revision();
    vi.spyOn(TestBed.inject(SyncOutboxService),'enqueue').mockRejectedValue(Error('controlled outbox failure'));
    await expect(builtin.commitReview(m.progress,m.event,{deckId:'japanese-1500',localDate:'2026-10-22',introducedEntryIds:[],newLimitOverride:null})).rejects.toThrow('controlled outbox failure');
    expect(builtin.revision()).toBe(revision+1);expect(p.snapshot()).toBeNull();
    expect(await builtin.getDeckProgress('japanese-1500')).toEqual([m.progress]);
    expect((await p.load()).cacheKey).not.toBe(initial.cacheKey);
  });
  it('only a complete inventory can prove unknown, and missing evidence is never a verified mapping',async()=>{
    const identity=(await provenIdentity()).identity;
    manifest.set({...manifest(),revision:'empty-inventory',identities:[{identity,evidence:verification}]});
    vi.spyOn(catalog,'knowledgeInventory').mockResolvedValue({builtin:[],custom:[]});
    expect((await projection().query({kind:'identity',identity})).state).toBe('unknown');
    manifest.set({...manifest(),revision:'bad-proof',identities:[{identity,evidence:{...verification,reference:''}}]});
    await expect(TestBed.inject(LexicalEvidenceService).load()).rejects.toThrow();
  });
});
