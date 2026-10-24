import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { IDBFactory, IDBKeyRange, IDBObjectStore } from 'fake-indexeddb';
import { CustomDeckRepository, CUSTOM_DECK_IDB, CUSTOM_DECKS_ENABLED } from './custom-deck.repository';
import { MANGA_DECK_ASSISTED_ENABLED } from './manga-deck-gate';
import { MangaDeckAssistedService } from './manga-deck-assisted.service';
import { MangaVolumeVocabularyService } from './manga-volume-vocabulary.service';
import { filterVolumeVocabulary } from './manga-volume-vocabulary';
import { WorkspaceService } from './workspace.service';
import { memory } from './lexical-knowledge.fixture';
import { DeckCatalogService } from './deck-catalog.service';
import { DeckStudyService } from './deck-study.service';
import { DECK_SCHEDULER_ENABLE_FUZZ } from './deck-scheduler.service';

describe('Confirmed volume vocabulary: readonly, scoped and H3A card classifications',()=>{
  let repo:CustomDeckRepository,service:MangaVolumeVocabularyService,assisted:MangaDeckAssistedService;
  beforeEach(()=>{
    TestBed.resetTestingModule();localStorage.clear();const factory=new IDBFactory();
    vi.stubGlobal('indexedDB',factory);vi.stubGlobal('IDBKeyRange',IDBKeyRange);
    TestBed.configureTestingModule({providers:[{provide:CUSTOM_DECK_IDB,useValue:factory},
      {provide:CUSTOM_DECKS_ENABLED,useValue:signal(true)},{provide:MANGA_DECK_ASSISTED_ENABLED,useValue:signal(true)},
      {provide:DECK_SCHEDULER_ENABLE_FUZZ,useValue:false}]});
    repo=TestBed.inject(CustomDeckRepository);service=TestBed.inject(MangaVolumeVocabularyService);assisted=TestBed.inject(MangaDeckAssistedService);
  });
  afterEach(()=>{TestBed.resetTestingModule();vi.restoreAllMocks();vi.unstubAllGlobals();});
  async function confirm(volume='v1',page=2,newIdentity=false){
    const draft=await assisted.open(volume,'Same title',page,{mode:'selection',text:'猫がいる。',selectedText:'猫',offset:0,startOffset:0,endOffset:1,blockIndex:0,lineIndex:0,x:0,y:0},
      {query:'猫',installed:false,terms:[]});
    const p=await assisted.preview(draft,{word:'猫',reading:'ねこ',meaning:'gato',language:'es',proposalIndex:null,reuseEntityId:null,newIdentity,reviewed:true});
    await assisted.confirm(p);return p;
  }
  it('empty volume never writes or migrates the registry',async()=>{
    await repo.confirmedVocabularyInventory();const put=vi.spyOn(IDBObjectStore.prototype,'put');
    expect(await service.load('empty')).toEqual({entries:[],incomplete:false});expect(put).not.toHaveBeenCalled();
  });
  it('shows only real confirmed cards and original context; consultation writes nothing',async()=>{
    const p=await confirm();const before=await repo.confirmedVocabularyInventory(),put=vi.spyOn(IDBObjectStore.prototype,'put');
    const view=await service.load('v1');expect(view.incomplete).toBe(false);expect(view.entries).toHaveLength(1);
    expect(view.entries[0].confirmations[0]).toEqual(p.confirmation);expect(view.entries[0].classification.state).toBe('pending');
    expect(put).not.toHaveBeenCalled();expect(await repo.confirmedVocabularyInventory()).toEqual(before);
  });
  it('does not merge same-title volumes, a reimport ID, or identical spellings with different identities',async()=>{
    await confirm();await confirm('v1',4,true);await confirm('v2');
    const a=await service.load('v1'),b=await service.load('v2');expect(a.entries).toHaveLength(2);expect(b.entries).toHaveLength(1);
    expect(new Set(a.entries.map(e=>e.card.lexicalIdentity.key)).size).toBe(2);expect((await service.load('reimport')).entries).toEqual([]);
  });
  it.each([[2,13.999,'learning'],[2,14,'known'],[1,20,'learning'],[3,20,'learning']] as const)('reuses H3A state %i S%s -> %s',async(state,stability,expected)=>{
    const p=await confirm(),inventory=await repo.confirmedVocabularyInventory(),m=memory(p.deck.id,p.card.id,state,stability);
    inventory.progress.push({workspace:'guest',key:'memory',value:m.progress});inventory.events.push({workspace:'guest',key:'event',value:m.event});
    vi.spyOn(repo,'confirmedVocabularyInventory').mockResolvedValue(inventory);
    expect((await service.load('v1')).entries[0].classification.state).toBe(expected);
  });
  it('reloads real FSRS after study and undo without retaining an old classification',async()=>{
    const p=await confirm(),catalog=TestBed.inject(DeckCatalogService),study=TestBed.inject(DeckStudyService),loaded=await catalog.load(p.deck.id);
    if(loaded.status!=='ready')throw Error('missing');const {deck,content}=loaded.value,now=new Date('2026-10-23T12:00:00Z');
    const snapshot=await study.snapshot(deck,content.index,now),choice=study.chooseNext(snapshot,deck,{debt:0}).choice!;
    const event=await study.rate(deck,choice,study.preview(deck,choice,now),'good',750,new Date(now.getTime()+1500));
    expect((await service.load('v1')).entries[0].classification.state).toBe('learning');await study.undo(event);
    expect((await service.load('v1')).entries[0].classification.state).toBe('pending');
  });
  it('keeps archived decks readable and does not need the original manga',async()=>{
    await confirm();const inventory=await repo.confirmedVocabularyInventory();inventory.decks[0].value={...inventory.decks[0].value,status:'archived'};
    vi.spyOn(repo,'confirmedVocabularyInventory').mockResolvedValue(inventory);
    const view=await service.load('v1');expect(view.entries[0].classification.archived).toBe(true);expect(view.entries[0].card.context?.text).toBe('猫がいる。');
  });
  it('marks missing associations and invalid confirmations incomplete without inventing cards',async()=>{
    await confirm();const inventory=await repo.confirmedVocabularyInventory();inventory.links=[];
    vi.spyOn(repo,'confirmedVocabularyInventory').mockResolvedValue(inventory);expect(await service.load('v1')).toEqual({entries:[],incomplete:true});
  });
  it('keeps corrupt history indeterminate instead of converting it to New',async()=>{
    const p=await confirm(),inventory=await repo.confirmedVocabularyInventory();
    inventory.progress.push({workspace:'guest',key:'bad',value:{deckId:p.deck.id,entryId:p.card.id} as never});
    vi.spyOn(repo,'confirmedVocabularyInventory').mockResolvedValue(inventory);
    expect((await service.load('v1')).entries[0].classification.state).toBe('indeterminate');
  });
  it('classifies mixed states independently without letting corrupt memory poison other cards',async()=>{
    const cards=[await confirm(),await confirm('v1',3,true),await confirm('v1',4,true),await confirm('v1',5,true)];
    const inventory=await repo.confirmedVocabularyInventory();
    for(const [i,s] of [[0,14],[1,13.999]] as const){const p=cards[i],m=memory(p.deck.id,p.card.id,2,s);inventory.progress.push({workspace:'guest',key:'p'+i,value:m.progress});inventory.events.push({workspace:'guest',key:'e'+i,value:m.event});}
    inventory.progress.push({workspace:'guest',key:'broken',value:{deckId:cards[3].deck.id,entryId:cards[3].card.id} as never});
    vi.spyOn(repo,'confirmedVocabularyInventory').mockResolvedValue(inventory);
    const view=await service.load('v1');expect(view.entries.map(e=>e.classification.state).sort()).toEqual(['indeterminate','known','learning','pending']);
  });
  it('preserves several confirmed source pages without counting the same card twice',async()=>{
    const p=await confirm(),draft=await assisted.open('v1','Same title',9,{mode:'selection',text:'猫もいる。',selectedText:'猫',offset:0,startOffset:0,endOffset:1,blockIndex:0,lineIndex:0,x:0,y:0},{query:'猫',installed:false,terms:[]});
    await assisted.confirm(await assisted.preview(draft,{word:'猫',reading:'ねこ',meaning:'felino',language:'es',proposalIndex:null,reuseEntityId:p.confirmation.entity.id,newIdentity:false,reviewed:true}));
    const view=await service.load('v1');expect(view.entries).toHaveLength(1);expect(view.entries[0].confirmations.map(c=>c.source.pageNumber)).toEqual([2,9]);
  });
  it('does not expose a card backed only by a corrupt receipt',async()=>{
    await confirm();const inventory=await repo.confirmedVocabularyInventory();inventory.confirmations[0].value={...inventory.confirmations[0].value,confirmation:{...inventory.confirmations[0].value.confirmation,expertCertified:true} as never};
    vi.spyOn(repo,'confirmedVocabularyInventory').mockResolvedValue(inventory);expect(await service.load('v1')).toEqual({entries:[],incomplete:true});
  });
  it('rejects A-B-A workspace changes during an asynchronous read',async()=>{
    await confirm();const inventory=await repo.confirmedVocabularyInventory(),workspace=TestBed.inject(WorkspaceService);
    vi.spyOn(repo,'confirmedVocabularyInventory').mockImplementation(async()=>{workspace.activateUser('other');workspace.activateGuest();return inventory;});
    await expect(service.load('v1')).rejects.toThrow();
  });
  it('filters confirmed context and state and sorts by source page with stable identity ties',async()=>{
    await confirm('v1',5);await confirm('v1',2,true);const entries=(await service.load('v1')).entries;
    expect(filterVolumeVocabulary(entries,'GATO','pending','page').map(e=>e.confirmations[0].source.pageNumber)).toEqual([2,5]);
    expect(filterVolumeVocabulary(entries,'いる','all','confirmed')).toHaveLength(2);
    expect(filterVolumeVocabulary(entries,'','known','page')).toEqual([]);
    const dated=entries.map((e,i)=>({...e,confirmations:e.confirmations.map(c=>({...c,confirmedAt:`2026-10-2${i+1}T12:00:00.000Z`}))}));
    expect(filterVolumeVocabulary(dated,'','all','confirmed').map(e=>e.card.id)).toEqual([dated[1].card.id,dated[0].card.id]);
  });
});
