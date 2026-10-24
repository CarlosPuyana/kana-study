import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { IDBFactory, IDBKeyRange, IDBObjectStore as FakeObjectStore } from 'fake-indexeddb';
import { MangaDeckAssistedService, MangaCardEdits } from './manga-deck-assisted.service';
import { CUSTOM_DECKS_ENABLED, CUSTOM_DECK_IDB, CustomDeckRepository } from './custom-deck.repository';
import { MANGA_DECK_ASSISTED_ENABLED } from './manga-deck-gate';
import { WorkspaceService } from './workspace.service';
import { DeckCatalogService } from './deck-catalog.service';
import { DeckStudyService } from './deck-study.service';
import { DECK_SCHEDULER_ENABLE_FUZZ } from './deck-scheduler.service';
import { MangaRepository } from './manga.repository';
import { DictionaryLookup, OcrLookupPoint } from '../models/dictionary.model';
import { MangaConfirmedCardOperation } from '../models/manga-deck-confirmation.model';

const point: OcrLookupPoint = {mode:'selection',text:'猫がいる。',selectedText:'猫',offset:0,startOffset:0,endOffset:1,
  blockIndex:0,lineIndex:0,endBlockIndex:0,endLineIndex:0,x:1,y:1};
const lookup: DictionaryLookup = {query:'猫',installed:true,terms:[{id:'import:1',dictionaryId:'test-import',
  expression:'猫',reading:'ねこ',glossaries:['gato'],sequence:42,definitionTags:'n',rules:'',score:1,termTags:''}]};
const edits: MangaCardEdits = {word:'猫',reading:'ねこ',meaning:'gato',language:'es',proposalIndex:0,
  reuseEntityId:null,newIdentity:false,reviewed:true};
const NOW = new Date('2026-10-22T12:00:00.000Z');

describe('Manga assisted decks: explicit local confirmation, registry and H1 FSRS', () => {
  const gate = signal(true), custom = signal(true);
  let service: MangaDeckAssistedService, repo: CustomDeckRepository, workspace: WorkspaceService;
  let catalog: DeckCatalogService, study: DeckStudyService;
  beforeEach(() => {
    TestBed.resetTestingModule(); localStorage.clear(); gate.set(true); custom.set(true);
    const factory = new IDBFactory(); vi.stubGlobal('indexedDB',factory); vi.stubGlobal('IDBKeyRange',IDBKeyRange);
    TestBed.configureTestingModule({providers:[{provide:MANGA_DECK_ASSISTED_ENABLED,useValue:gate},
      {provide:CUSTOM_DECKS_ENABLED,useValue:custom},{provide:CUSTOM_DECK_IDB,useValue:factory},
      {provide:DECK_SCHEDULER_ENABLE_FUZZ,useValue:false}]});
    service = TestBed.inject(MangaDeckAssistedService); repo = TestBed.inject(CustomDeckRepository);
    workspace = TestBed.inject(WorkspaceService); catalog = TestBed.inject(DeckCatalogService); study = TestBed.inject(DeckStudyService);
  });
  afterEach(() => {TestBed.resetTestingModule(); vi.restoreAllMocks(); vi.unstubAllGlobals();});
  const open = (volume = 'vol:1', context = point) => service.open(volume,'Volumen de prueba',2,context,lookup);
  async function prepare(volume = 'vol:1', edit = edits, context = point) { return service.preview(await open(volume,context),edit); }
  async function grade(p: MangaConfirmedCardOperation, rating:'again'|'good' = 'good') {
    const loaded = await catalog.load(p.deck.id); if (loaded.status !== 'ready') throw Error('missing deck');
    const {deck,content} = loaded.value, snapshot = await study.snapshot(deck,content.index,NOW);
    const choice = study.chooseNext(snapshot,deck,{debt:0}).choice!;
    return study.rate(deck,choice,study.preview(deck,choice,NOW),rating,900,NOW);
  }

  it('requires both gates, including a direct repository call', async () => {
    const p = await prepare(); gate.set(false);
    await expect(open()).rejects.toThrow(); await expect(repo.confirmMangaCard(p)).rejects.toThrow();
    gate.set(true); custom.set(false); await expect(service.confirm(p)).rejects.toThrow();
    expect(await repo.list()).toEqual([]);
  });
  it('does not create anything on selection, dictionary lookup or preview; review is mandatory', async () => {
    const draft = await open(); await expect(service.preview(draft,{...edits,reviewed:false})).rejects.toThrow();
    await service.preview(draft,edits);
    expect(await repo.list()).toEqual([]); expect(await repo.mangaConfirmations()).toEqual([]);
  });
  it('atomically records curated authority, explicit actor, original OCR/page and dictionary uncertainty', async () => {
    const p = await prepare(); await service.confirm(p);
    const cards = await repo.content(p.deck.id), receipts = await repo.mangaConfirmations();
    expect(cards).toHaveLength(1); expect(receipts).toHaveLength(1);
    expect(cards[0].lexicalIdentity.anchor.authority).toBe('kana-study-curated');
    expect(cards[0].lexicalIdentity.anchor.entryId).not.toBe('42');
    expect(cards[0].context).toEqual({text:'猫がいる。',sourceTitle:'Volumen de prueba',pageNumber:2});
    expect(receipts[0].actor).toEqual({kind:'local-workspace-user',workspace:'guest'});
    expect(receipts[0].expertCertified).toBe(false); expect(receipts[0].selectedProposal?.localId).toBe('import:1');
    expect(cards[0].glosses[0].source.kind).toBe('user');
    expect(await repo.getDeckProgress(p.deck.id)).toEqual([]);
    expect((await repo.journal()).map(o => o.kind)).toEqual(['manga-confirmation']);
  });
  it('retries and concurrent double clicks cannot duplicate deck, entity, card or receipt', async () => {
    const p = await prepare(); await Promise.all([service.confirm(p),service.confirm(p)]); await service.confirm(p);
    expect(await repo.list()).toHaveLength(1); expect(await repo.content(p.deck.id)).toHaveLength(1);
    expect(await repo.mangaConfirmations()).toHaveLength(1);
  });
  it('reopening the same source reproduces the registered entity and card, without merging just by text', async () => {
    const p = await prepare(); await service.confirm(p);
    const reopened = await prepare(); expect(reopened.card.id).toBe(p.card.id);
    expect(reopened.card.lexicalIdentity.key).toBe(p.card.lexicalIdentity.key);
    const otherSource = {...point,text:'また猫。',offset:2,startOffset:2,endOffset:3};
    const other = await prepare('vol:1',edits,otherSource);
    expect(other.card.lexicalIdentity.key).not.toBe(p.card.lexicalIdentity.key);
    await service.confirm(other); expect(await repo.content(p.deck.id)).toHaveLength(2);
  });
  it('explicit reuse edits the context/gloss while preserving card identity, FSRS and history', async () => {
    const p = await prepare(); await service.confirm(p); await grade(p);
    const before = await repo.getDeckProgress(p.deck.id), events = await repo.getDeckReviewEvents(p.deck.id);
    const otherSource = {...point,text:'また猫。',offset:2,startOffset:2,endOffset:3};
    const edited = await prepare('vol:1',{...edits,meaning:'gato confirmado',reuseEntityId:p.confirmation.entity.id},otherSource);
    await service.confirm(edited);
    expect(edited.card.id).toBe(p.card.id); expect(await repo.content(p.deck.id)).toHaveLength(1);
    expect((await repo.content(p.deck.id))[0].context?.text).toBe('また猫。');
    expect(await repo.getDeckProgress(p.deck.id)).toEqual(before); expect(await repo.getDeckReviewEvents(p.deck.id)).toEqual(events);
    expect((await repo.mangaConfirmations())[0].source.fragment).toBe('猫がいる。');
  });
  it('a different identity never inherits progress, even with the same word and reading', async () => {
    const p = await prepare(); await service.confirm(p); await grade(p);
    const other = await prepare('vol:1',{...edits,newIdentity:true}); await service.confirm(other);
    expect(other.card.id).not.toBe(p.card.id); expect(other.card.lexicalIdentity.key).not.toBe(p.card.lexicalIdentity.key);
    expect((await repo.getDeckProgress(p.deck.id)).map(c => c.entryId)).toEqual([p.card.id]);
  });
  it('does not reinterpret a registered entity with different word or reading', async () => {
    const p = await prepare(); await service.confirm(p);
    await expect(prepare('vol:1',{...edits,reading:'いぬ',reuseEntityId:p.confirmation.entity.id})).rejects.toThrow();
  });
  it('two volume decks can explicitly reuse the same entity with independent FSRS and undo', async () => {
    const a = await prepare(); await service.confirm(a);
    const b = await prepare('vol:2',{...edits,reuseEntityId:a.confirmation.entity.id}); await service.confirm(b);
    expect(b.card.lexicalIdentity.key).toBe(a.card.lexicalIdentity.key); expect(b.card.id).not.toBe(a.card.id);
    const event = await grade(a); expect(await repo.getDeckProgress(b.deck.id)).toEqual([]);
    await grade(b,'again'); await study.undo(event); await study.undo(event);
    expect(await repo.getDeckProgress(a.deck.id)).toEqual([]); expect(await repo.getDeckReviewEvents(b.deck.id)).toHaveLength(1);
    expect(await repo.mangaConfirmations()).toHaveLength(2);
  });
  it('deleting the manga preserves the deck, original context and study state', async () => {
    const p = await prepare(); await service.confirm(p); await grade(p);
    const manga = TestBed.inject(MangaRepository);
    await manga.delete('vol:1');
    expect((await repo.content(p.deck.id))[0].context?.text).toBe('猫がいる。');
    expect(await repo.getDeckProgress(p.deck.id)).toHaveLength(1);
    expect((await catalog.load(p.deck.id)).status).toBe('ready');
  });
  it('rejects stale competing edits rather than overwriting the last confirmation', async () => {
    const p = await prepare(); await service.confirm(p);
    const a = await prepare('vol:1',{...edits,meaning:'primero'}), b = await prepare('vol:1',{...edits,meaning:'segundo'});
    await service.confirm(a); await expect(service.confirm(b)).rejects.toThrow();
    expect((await repo.content(p.deck.id))[0].glosses[0].text).toBe('primero');
  });
  it('uses a persisted registry namespace, not a global hash of identical OCR on independent workspaces', async () => {
    const a = await prepare(); await service.confirm(a); workspace.activateUser('other');
    const b = await prepare(); await service.confirm(b);
    expect(b.confirmation.entity.registryNamespace).not.toBe(a.confirmation.entity.registryNamespace);
    expect(b.card.lexicalIdentity.key).not.toBe(a.card.lexicalIdentity.key);
  });
  it('rejects competing first registry proposals atomically and can prepare a fresh retry', async () => {
    const a = await prepare(), b = await prepare(); await service.confirm(a);
    await expect(service.confirm(b)).rejects.toThrow(); expect(await repo.content(a.deck.id)).toHaveLength(1);
    const retry = await prepare(); expect(retry.card.id).toBe(a.card.id); await service.confirm(retry);
    expect(await repo.content(a.deck.id)).toHaveLength(1);
  });
  it('does not mix workspaces or allow a preview captured before an account switch', async () => {
    const p = await prepare(); workspace.activateUser('a:b'); await expect(service.confirm(p)).rejects.toThrow();
    expect(await repo.list()).toEqual([]); expect(await repo.list('guest')).toEqual([]);
    const user = await prepare(); await service.confirm(user); workspace.activateUser('a_b');
    expect(await repo.list()).toEqual([]); expect(await repo.mangaConfirmations()).toEqual([]);
  });
  it('rejects a workspace change while preparing a preview after the IDB await', async () => {
    const draft = await open(), content = repo.content.bind(repo);
    vi.spyOn(repo,'content').mockImplementationOnce(async (...args) => { const result = await content(...args); workspace.activateUser('other'); return result; });
    await expect(service.preview(draft,edits)).rejects.toThrow(); expect(await repo.list('guest')).toEqual([]);
  });
  it('rejects a retained draft after A-B-A, even though the workspace name is identical', async () => {
    const draft=await open();workspace.activateUser('other');workspace.activateGuest();
    await expect(service.preview(draft,edits)).rejects.toThrow();expect(await repo.list()).toEqual([]);
  });
  it('fences A-B-A while opening a draft after the registry await', async () => {
    const original=repo.mangaConfirmations.bind(repo);
    vi.spyOn(repo,'mangaConfirmations').mockImplementationOnce(async(...args)=>{const value=await original(...args);workspace.activateUser('other');workspace.activateGuest();return value;});
    await expect(open()).rejects.toThrow();expect(await repo.list()).toEqual([]);
  });
  it('checks a cancelled UI scope inside confirmation before the atomic write', async () => {
    const p=await prepare(),original=repo.migratePermanentRegistry.bind(repo);let active=true;
    vi.spyOn(repo,'migratePermanentRegistry').mockImplementationOnce(async(...args)=>{await original(...args);active=false;});
    await expect(service.confirm(p,()=>{if(!active)throw Error('cancelled');})).rejects.toThrow('cancelled');
    expect(await repo.list()).toEqual([]);expect(await repo.journal()).toEqual([]);
  });
  it('rolls back registry, deck, card and journal on storage failure, then retries the exact request', async () => {
    const p = await prepare(), original = FakeObjectStore.prototype.put;
    const fail = vi.spyOn(FakeObjectStore.prototype,'put').mockImplementation(function(this:IDBObjectStore,...args) {
      if (this.name === 'journal') throw new DOMException('full','QuotaExceededError'); return original.apply(this,args);
    });
    await expect(service.confirm(p)).rejects.toThrow(); fail.mockRestore();
    expect(await repo.list()).toEqual([]); expect(await repo.content(p.deck.id)).toEqual([]); expect(await repo.journal()).toEqual([]);
    await service.confirm(p); expect(await repo.mangaConfirmations()).toHaveLength(1);
  });
  it('rejects an operation ID reused for a different meaning, retaining the original receipt', async () => {
    const p = await prepare(); await service.confirm(p);
    const changed = {...structuredClone(p), confirmation:{...p.confirmation,confirmedMeaning:'otro'},
      card:{...p.card,glosses:[{...p.card.glosses[0],text:'otro'}]}};
    await expect(service.confirm(changed)).rejects.toThrow('reused'); expect(await repo.mangaConfirmations()).toHaveLength(1);
  });
  it('refuses cross-block selections and oversized payloads without truncating original OCR', async () => {
    await expect(open('vol:1',{...point,endBlockIndex:1})).rejects.toThrow();
    await expect(open('vol:1',{...point,text:'猫'.repeat(1201)})).rejects.toThrow();
    await expect(prepare('vol:1',{...edits,meaning:'\\"'.repeat(2001)})).rejects.toThrow();
    expect(await repo.list()).toEqual([]);
  });
});
