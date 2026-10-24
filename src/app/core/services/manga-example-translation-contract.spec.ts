import {signal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {IDBFactory,IDBKeyRange} from 'fake-indexeddb';
import fixture from '../../../../supabase/tests/h2ba-fixture.json';
import {MangaConfirmedCardOperation} from '../models/manga-deck-confirmation.model';
import {CustomDeckCard} from '../models/deck-catalog.model';
import {canonical,digest,validateCard} from './custom-deck-validation';
import {validateCustomRemoteOperation} from './custom-deck-sync-contract';
import {validateMangaConfirmedOperation} from './manga-deck-confirmation';
import {CUSTOM_DECKS_ENABLED,CUSTOM_DECK_IDB,CustomDeckRepository} from './custom-deck.repository';
import {MANGA_DECK_ASSISTED_ENABLED} from './manga-deck-gate';
import {buildGuestTransfer} from './custom-guest-transfer-builder';

// Audit guards for the CURRENT V1/V2 contract, not an implemented translation feature.
describe('example translation: current persistence compatibility boundary',()=>{
  const original=fixture as unknown as MangaConfirmedCardOperation;
  const translation=async()=>({version:1,text:'Traducción manual de prueba',language:'es',source:'manual',confirmedByUser:true,
    originalContextFingerprint:await digest('ctx-',original.card.context!.text)});
  beforeEach(()=>{
    TestBed.resetTestingModule();localStorage.clear();const db=new IDBFactory();
    vi.stubGlobal('indexedDB',db);vi.stubGlobal('IDBKeyRange',IDBKeyRange);
    TestBed.configureTestingModule({providers:[{provide:CUSTOM_DECK_IDB,useValue:db},{provide:CUSTOM_DECKS_ENABLED,useValue:signal(true)},
      {provide:MANGA_DECK_ASSISTED_ENABLED,useValue:signal(true)}]});
  });
  afterEach(()=>{TestBed.resetTestingModule();vi.unstubAllGlobals();vi.restoreAllMocks();});
  it('accepts historical cards and receipts without a translation',async()=>{
    await expect(validateMangaConfirmedOperation(original)).resolves.toBeUndefined();
    expect(canonical(await validateCard(original.card))).toBe(canonical(original.card));
  });
  it.each(['root','context'] as const)('the V1 card decoder strips an unknown translation at %s',async(where)=>{
    const extra=await translation(),base=structuredClone(original.card);
    const card=where==='root'?{...base,contextTranslation:extra}:{...base,context:{...base.context!,contextTranslation:extra}};
    const decoded=await validateCard(card);
    expect(canonical(decoded)).toBe(canonical(original.card));expect(canonical(decoded)).not.toBe(canonical(card));
  });
  it.each(['root','context'] as const)('remote V1 and V2 inner operations reject unknown translation at %s',async(where)=>{
    const card:any=structuredClone(original.card);
    const op=(payload:any)=>({schemaVersion:1 as const,operationId:'translation-audit',action:'publish' as const,
      changes:[{kind:'card' as const,id:card.id,baseRevision:'0',payload}]});
    await expect(validateCustomRemoteOperation(op(card))).resolves.toBeUndefined();
    if(where==='root')card.contextTranslation=await translation();else card.context.contextTranslation=await translation();
    await expect(validateCustomRemoteOperation(op(card))).rejects.toThrow();
  });
  it('does not allow adding properties to the exact OCR context in a historical confirmation',async()=>{
    const p:any=structuredClone(original);p.card.context.contextTranslation=await translation();
    await expect(validateMangaConfirmedOperation(p)).rejects.toThrow();
    expect(p.confirmation.source.fragment).toBe(original.confirmation.source.fragment);
  });
  it('a generic local edit can succeed while losing the new field; Guest V2 also blocks that edit journal',async()=>{
    const repo=TestBed.inject(CustomDeckRepository);await repo.confirmMangaCard(structuredClone(original));
    await expect(buildGuestTransfer('baseline-transfer','00000000-0000-4000-8000-000000000002',await repo.guestInventory(),[],'0')).resolves.toBeDefined();
    const oldReceipt=canonical((await repo.mangaConfirmations())[0]),card=(await repo.content(original.deck.id))[0];
    const edited={...card,contentVersion:card.contentVersion+1,contextTranslation:await translation()};
    await repo.editCard('translation-edit-audit',edited,card.contentVersion);
    const stored=(await repo.content(card.deckId))[0];
    expect(stored.id).toBe(card.id);expect(stored.lexicalIdentity).toEqual(card.lexicalIdentity);
    expect('contextTranslation' in stored).toBe(false);
    const journal=await repo.journal();expect(journal.map(o=>o.kind)).toEqual(['manga-confirmation','edit-card']);
    expect('contextTranslation' in (journal[1].payload as {card:CustomDeckCard}).card).toBe(false);
    expect(canonical((await repo.mangaConfirmations())[0])).toBe(oldReceipt);
    expect(await repo.getDeckProgress(card.deckId)).toEqual([]);expect(await repo.getDeckReviewEvents(card.deckId)).toEqual([]);
    await expect(buildGuestTransfer('translation-transfer-audit','00000000-0000-4000-8000-000000000002',await repo.guestInventory(),[],'0')).rejects.toThrow();
  });
});
