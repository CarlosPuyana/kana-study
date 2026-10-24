import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { MangaDeckReview } from './manga-deck-review';
import { CustomDeckRepository, CUSTOM_DECK_IDB, CUSTOM_DECKS_ENABLED } from '../../core/services/custom-deck.repository';
import { MANGA_DECK_ASSISTED_ENABLED } from '../../core/services/manga-deck-gate';
import { MangaDeckAssistedService } from '../../core/services/manga-deck-assisted.service';
import { WorkspaceService } from '../../core/services/workspace.service';

const term={id:'local',dictionaryId:'local',expression:'猫',reading:'ねこ',glossaries:['gato <script>'],sequence:1,rules:'',definitionTags:'',termTags:'',score:1};
describe('Manga quick add: one explicit confirmation and progressive edits',()=>{
  beforeEach(()=>{
    TestBed.resetTestingModule();localStorage.clear();
    vi.stubGlobal('matchMedia',()=>({matches:false,addEventListener:()=>{},removeEventListener:()=>{}}));
    const factory=new IDBFactory();vi.stubGlobal('indexedDB',factory);vi.stubGlobal('IDBKeyRange',IDBKeyRange);
    TestBed.configureTestingModule({imports:[MangaDeckReview],providers:[
      {provide:CUSTOM_DECK_IDB,useValue:factory},{provide:CUSTOM_DECKS_ENABLED,useValue:signal(true)},
      {provide:MANGA_DECK_ASSISTED_ENABLED,useValue:signal(true)}]});
  });
  afterEach(()=>{TestBed.resetTestingModule();vi.restoreAllMocks();vi.unstubAllGlobals();});
  async function create(terms:any[]=[term]){
    const f=TestBed.createComponent(MangaDeckReview);
    f.componentRef.setInput('point',{mode:'selection',text:'猫がいる。',selectedText:'猫',offset:0,startOffset:0,endOffset:1,blockIndex:0,lineIndex:0});
    f.componentRef.setInput('location',{volumeId:'test',pageIndex:1,blockIndex:0});f.componentRef.setInput('volumeTitle','Volumen');
    f.componentRef.setInput('lookup',{installed:true,query:'猫',terms});f.detectChanges();
    await vi.waitFor(()=>expect(f.componentInstance.busy()).toBe(false));f.detectChanges();return f;
  }
  it('fills a sole complete exact proposal without writing; the final click is the only confirmation',async()=>{
    const f=await create(),c=f.componentInstance,repo=TestBed.inject(CustomDeckRepository),saved=vi.fn();c.saved.subscribe(saved);
    expect(c.selectedProposal).toBe('0');expect(c.reading).toBe('ねこ');expect(c.meaning).toBe('gato <script>');
    expect(c.editing()).toBe(false);expect(f.nativeElement.querySelector('script')).toBeNull();
    expect(f.nativeElement.textContent).toContain('Página 2');expect(await repo.list()).toEqual([]);
    await c.confirm();expect(saved).toHaveBeenCalledTimes(1);
    const receipt=(await repo.mangaConfirmations())[0];expect(receipt.source.fragment).toBe('猫がいる。');
    expect(receipt.source.pageNumber).toBe(2);expect(receipt.expertCertified).toBe(false);expect(await repo.journal()).toHaveLength(1);
  });
  it.each([
    ['reading',[{...term,reading:''}],'reading'],
    ['meaning',[{...term,glossaries:[]}],'meaning'],
    ['manual',[],'reading'],
  ])('requests missing %s without inventing a value',async(_name,terms,field)=>{
    const f=await create(terms as any[]),c=f.componentInstance;
    expect(c.editing()).toBe(true);expect(c[field as 'reading'|'meaning']).toBe('');
    if(_name==='reading'){expect(c.meaning).toBe('gato <script>');expect(c.missing()).toEqual(['reading']);}
    await c.confirm();f.detectChanges();expect(f.nativeElement.querySelector('[aria-invalid=true]')).not.toBeNull();
    expect(await TestBed.inject(CustomDeckRepository).list()).toEqual([]);
    c.reading='ねこ';c.meaning='cat';c.language='en';c.edit();await c.confirm();
    expect((await TestBed.inject(CustomDeckRepository).mangaConfirmations())[0].meaningLanguage).toBe('en');
  });
  it('never chooses between multiple proposals or senses, including truncated alternatives',async()=>{
    const f=await create([term,{...term,id:'other',reading:'びょう'}]),c=f.componentInstance;
    expect(c.selectedProposal).toBe('');expect(c.meaning).toBe('');expect(c.editing()).toBe(true);
    c.selectedProposal='1';c.chooseProposal();expect(c.reading).toBe('びょう');expect(c.meaning).toBe('');
    c.useMeaning('gato <script>');await c.confirm();
    expect((await TestBed.inject(CustomDeckRepository).mangaConfirmations())[0].selectedProposal?.reading).toBe('びょう');
  });
  it('does not pick a sense from one entry with several glosses',async()=>{
    const f=await create([{...term,glossaries:['gato','felino']}]);expect(f.componentInstance.meaning).toBe('');
    expect(f.componentInstance.editing()).toBe(true);
  });
  it('rejects empty input without opening advanced editing or calling confirmation',async()=>{
    const f=await create([]),c=f.componentInstance,service=TestBed.inject(MangaDeckAssistedService);
    const preview=vi.spyOn(service,'preview'),confirm=vi.spyOn(service,'confirm');
    await c.confirm();f.detectChanges();await f.whenStable();
    expect(c.advanced()).toBe(false);expect(c.newIdentity).toBe(false);expect(f.nativeElement.querySelectorAll('input[type=checkbox]')).toHaveLength(0);
    expect(document.activeElement).toBe(f.nativeElement.querySelector('[data-field=reading]'));
    expect(preview).not.toHaveBeenCalled();expect(confirm).not.toHaveBeenCalled();
  });
  it('focuses meaning when that is the only missing field',async()=>{
    const f=await create([]),c=f.componentInstance;c.reading='ねこ';await c.confirm();f.detectChanges();await f.whenStable();
    expect(c.advanced()).toBe(false);expect(document.activeElement).toBe(f.nativeElement.querySelector('[data-field=meaning]'));
  });
  it('clears a deliberately chosen new identity when the word or reading is edited',async()=>{
    const a=await create();await a.componentInstance.confirm();a.destroy();const f=await create(),c=f.componentInstance;
    expect(c.newIdentity).toBe(false);c.createIdentity();expect(c.newIdentity).toBe(true);c.reading='びょう';c.identityEdited();
    expect(c.newIdentity).toBe(false);expect(c.reuseEntityId).toBe('');
  });
  it('keeps preview validation failures separate from confirmation/persistence failures',async()=>{
    const f=await create(),c=f.componentInstance,service=TestBed.inject(MangaDeckAssistedService);
    vi.spyOn(service,'preview').mockRejectedValueOnce(Error('validation'));const confirm=vi.spyOn(service,'confirm');
    await c.confirm();expect(c.failureStage()).toBe('prepare');expect(confirm).not.toHaveBeenCalled();expect(c.meaning).toBe('gato <script>');
  });
  it('does not silently accept a dictionary form different from the OCR selection',async()=>{
    const f=await create([{...term,expression:'犬'}]);expect(f.componentInstance.word).toBe('猫');expect(f.componentInstance.selectedProposal).toBe('');
  });
  it('keeps manual edits through ordinary rerenders and preserves the authentic source',async()=>{
    const f=await create(),c=f.componentInstance;c.openEdit();c.word='猫ちゃん';c.reading='ねこちゃん';c.meaning='gatito';c.edit();
    f.componentRef.setInput('location',{volumeId:'test',pageIndex:1,blockIndex:0});f.detectChanges();await f.whenStable();
    expect(c.meaning).toBe('gatito');await c.confirm();const receipt=(await TestBed.inject(CustomDeckRepository).mangaConfirmations())[0];
    expect(receipt.entity.word).toBe('猫ちゃん');expect(receipt.source.surface).toBe('猫');expect(receipt.source.fragment).toBe('猫がいる。');
  });
  it('reuses existing text limits without rejecting a legitimate multiline gloss',async()=>{
    const f=await create(),c=f.componentInstance;c.openEdit();c.meaning='cat\nfeline';c.edit();
    expect(c.invalid('meaning')).toBe(false);await c.confirm();
    expect((await TestBed.inject(CustomDeckRepository).mangaConfirmations())[0].confirmedMeaning).toBe('cat\nfeline');
  });
  it('uses one operation for double clicks and retries an unchanged failed request',async()=>{
    const f=await create(),c=f.componentInstance,repo=TestBed.inject(CustomDeckRepository);
    const original=repo.confirmMangaCard.bind(repo),calls:any[]=[];
    const fail=vi.spyOn(repo,'confirmMangaCard').mockImplementation(async(...args)=>{calls.push(args[0]);throw Error('quota');});
    await c.confirm();f.detectChanges();expect(c.failed()).toBe(true);expect(c.meaning).toBe('gato <script>');expect(c.completed()).toBe(false);
    fail.mockImplementation(async(...args)=>{calls.push(args[0]);return original(...args);});
    await Promise.all([c.confirm(),c.confirm()]);await c.confirm();
    expect(calls[1].confirmation.id).toBe(calls[0].confirmation.id);expect(await repo.mangaConfirmations()).toHaveLength(1);expect(await repo.journal()).toHaveLength(1);
  });
  it('offers explicit identity reuse instead of merging matching spelling or creating another card by default',async()=>{
    const a=await create();await a.componentInstance.confirm();a.destroy();
    const f=await create(),c=f.componentInstance,repo=TestBed.inject(CustomDeckRepository);
    expect(c.needsIdentityChoice()).toBe(true);await c.confirm();expect(await repo.journal()).toHaveLength(1);
    c.reuseEntityId=c.draft()!.entities[0].id;c.chooseEntity();await c.confirm();
    expect(await repo.content((await repo.list())[0].id)).toHaveLength(1);
    expect(await repo.journal()).toHaveLength(2);
    expect((await repo.mangaConfirmations()).some(x=>x.reusedEntity)).toBe(true);
  });
  it('does not write on cancellation or component destruction',async()=>{
    const f=await create();f.componentInstance.cancelled.emit();f.destroy();
    expect(await TestBed.inject(CustomDeckRepository).list()).toEqual([]);expect(await TestBed.inject(CustomDeckRepository).journal()).toEqual([]);
  });
  it.each(['page','volume'])('invalidates a pending save after the input %s changes',async(kind)=>{
    const f=await create(),c=f.componentInstance,service=TestBed.inject(MangaDeckAssistedService),original=service.preview.bind(service);
    let release!:()=>void;const held=new Promise<void>(r=>release=r);
    vi.spyOn(service,'preview').mockImplementationOnce(async(...args)=>{const p=await original(...args);await held;return p;});
    const pending=c.confirm();
    f.componentRef.setInput('location',{volumeId:kind==='volume'?'other':'test',pageIndex:kind==='page'?0:1,blockIndex:0});f.detectChanges();
    release();await pending;expect(await TestBed.inject(CustomDeckRepository).list()).toEqual([]);
  });
  it('fences a retained draft across A-B-A, including a delayed preview',async()=>{
    const f=await create(),c=f.componentInstance,workspace=TestBed.inject(WorkspaceService),service=TestBed.inject(MangaDeckAssistedService),original=service.preview.bind(service);
    let release!:()=>void;const held=new Promise<void>(r=>release=r);
    vi.spyOn(service,'preview').mockImplementationOnce(async(...args)=>{const p=await original(...args);await held;return p;});
    const pending=c.confirm();workspace.activateUser('other');workspace.activateGuest();f.detectChanges();release();await pending;
    expect(await TestBed.inject(CustomDeckRepository).list()).toEqual([]);expect(c.completed()).toBe(false);
  });
  it('rejects a cached failed request after A-B-A even before the workspace effect renders',async()=>{
    const f=await create(),c=f.componentInstance,repo=TestBed.inject(CustomDeckRepository),workspace=TestBed.inject(WorkspaceService);
    const confirm=vi.spyOn(repo,'confirmMangaCard').mockRejectedValueOnce(Error('quota'));
    await c.confirm();expect(c.failed()).toBe(true);
    workspace.activateUser('other');workspace.activateGuest();await c.confirm();
    expect(confirm).toHaveBeenCalledTimes(1);expect(await repo.journal()).toEqual([]);
  });
});
