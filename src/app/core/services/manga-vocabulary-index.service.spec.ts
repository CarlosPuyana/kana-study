import { TestBed } from '@angular/core/testing';
import { IDBFactory, IDBKeyRange, IDBObjectStore } from 'fake-indexeddb';
import { MangaOcrSourceService } from './manga-ocr-source.service';
import { MangaRepository } from './manga.repository';
import { DictionaryRepository } from './dictionary.repository';
import { MangaVocabularyIndexService } from './manga-vocabulary-index.service';
import { WorkspaceService } from './workspace.service';
import { MangaPage, MangaVolume } from '../models/manga.model';
import { DictionaryTerm } from '../models/dictionary.model';
import { M16_DICTIONARY_ROWS } from './manga-linguistic-regression.fixture';
import { parseDictionaryTerm } from './yomitan-dictionary-parser';

const term: DictionaryTerm = {id:'d:1', dictionaryId:'d', expression:'猫', reading:'ねこ', sequence:1,
  glossaries:['cat'], rules:'', score:1, definitionTags:'n', termTags:''};
const volume = (id: string): MangaVolume => ({id, title:'Same title', seriesTitle:'Same title', pageCount:2, storageBytes:0,
  createdAt:'2026-01-01', updatedAt:'2026-01-01', complete:true, mokuro:{version:'0.1',title:'test',volume:'1'}});
const page = (volumeId: string, text: string, pageIndex=0): MangaPage => ({volumeId, pageIndex, image:new Blob(['original']),
  ocr:{img_path:'1.png',img_width:100,img_height:100,blocks:[{box:[0,0,10,10],vertical:false,font_size:10,lines:[text],lines_coords:[]}]}});
describe('M1 index persistence and content invalidation', () => {
  let repo: MangaRepository, service: MangaVocabularyIndexService, workspace: WorkspaceService;
  const load = (id: string) => service.load(id, new AbortController().signal);
  beforeEach(() => {
    TestBed.resetTestingModule();localStorage.clear();vi.stubGlobal('indexedDB',new IDBFactory());vi.stubGlobal('IDBKeyRange',IDBKeyRange);
    TestBed.configureTestingModule({providers:[{provide:DictionaryRepository,useValue:{
      ready:async()=>({dictionaryId:'d',revision:'1',status:'ready'}),find:async(_d:string,s:string)=>s==='猫'?[term]:[]}}]});
    repo=TestBed.inject(MangaRepository);service=TestBed.inject(MangaVocabularyIndexService);workspace=TestBed.inject(WorkspaceService);
  });
  afterEach(()=>{TestBed.resetTestingModule();vi.restoreAllMocks();vi.unstubAllGlobals();});
  it('persists after service/repository restart, isolates two volumes and never rewrites original records',async()=>{
    await repo.put('volumes',volume('a'));await repo.put('pages',page('a','猫。猫。'));
    await repo.put('volumes',volume('b'));await repo.put('pages',page('b','猫。'));
    const original=await repo.page('a',0),a=await load('a'),b=await load('b');
    expect(a.occurrences).toBe(2);expect(b.occurrences).toBe(1);expect(a.status).toBe('partial');
    expect(a.issues).toContainEqual({pageIndex:1,reason:'missing-ocr'});
    expect(await repo.page('a',0)).toEqual(original);
    // New instances open existing IndexedDB, with no OCR reads on a cache hit.
    repo=TestBed.runInInjectionContext(()=>new MangaRepository());
    service=TestBed.runInInjectionContext(()=>new MangaVocabularyIndexService());
    const read=vi.spyOn(TestBed.inject(MangaRepository),'page');expect(await load('a')).toEqual(a);expect(read).not.toHaveBeenCalled();
    await repo.saveVocabularyIndex({...a,analyzerStamp:'m1-segmenter-dictionary-1',entries:a.entries.map(e=>({...e,category:undefined,categoryEvidence:undefined}))},await repo.ocrRevision('a'));
    const upgraded=await load('a');expect(read).toHaveBeenCalled();expect(upgraded.entries[0].category).toBe('lexical');
    expect(upgraded.entries[0].occurrences).toEqual(a.entries[0].occurrences);expect(upgraded.occurrences).toBe(a.occurrences);
  });
  it('invalidates on page changes even without touching volume.updatedAt, but not reading progress',async()=>{
    await repo.put('volumes',volume('a'));await repo.put('pages',page('a','猫。'));const first=await load('a');
    await repo.put('reading-progress',{volumeId:'a',pageIndex:0,activeSeconds:10,completed:false,lastOpenedAt:'x',updatedAt:'x'});
    expect(await load('a')).toEqual(first);
    await repo.put('pages',page('a','猫。猫。猫。'));expect((await load('a')).occurrences).toBe(3);
    await expect(repo.saveVocabularyIndex(first,0)).rejects.toThrow();
    await repo.delete('a');expect(await repo.vocabularyIndex('a')).toBeUndefined();
  });
  it('isolates workspace caches and fences cancelled work',async()=>{
    await repo.put('volumes',volume('a'));await repo.put('pages',page('a','猫。'));await load('a');
    workspace.activateUser('second');expect(await repo.vocabularyIndex('a')).toBeUndefined();await expect(load('a')).rejects.toThrow();
    await repo.put('volumes',volume('a'));await repo.put('pages',page('a','猫。猫。'));
    expect((await load('a')).occurrences).toBe(2);workspace.activateGuest();expect((await load('a')).occurrences).toBe(1);
    const controller=new AbortController();controller.abort();await expect(service.load('a',controller.signal)).rejects.toThrow('stale');
  });
  it('reports missing OCR and incomplete imports explicitly',async()=>{
    await repo.put('volumes',volume('a'));expect((await load('a')).status).toBe('no-ocr');
    await repo.put('volumes',{...volume('b'),complete:false});expect((await load('b')).status).toBe('incomplete-import');
    expect(await repo.vocabularyIndex('b')).toBeUndefined();
    await repo.put('volumes',volume('c'));
    const read=vi.spyOn(repo,'page').mockRejectedValueOnce(Error('temporary read error'));
    const failed=await load('c');expect(failed.status).toBe('partial');expect(failed.entries).toEqual([]);
    expect(failed.issues[0].reason).toBe('read-error');
    read.mockClear();expect((await load('c')).status).toBe('no-ocr');expect(read).toHaveBeenCalled();
  });
  it('uses the existing reading index only after an exact miss, with a stable mother key',async()=>{
    const rows=M16_DICTIONARY_ROWS.map((r,i)=>parseDictionaryTerm(r,'d',i));
    const find=vi.spyOn(TestBed.inject(DictionaryRepository),'find').mockImplementation(async(_id,s,field)=>rows.filter(t=>t[field]===s));
    await repo.put('volumes',volume('mother'));await repo.put('pages',page('mother','お母さん。おかあさん。'));
    const result=await load('mother');expect(result.occurrences).toBe(2);expect(result.entries).toHaveLength(1);
    expect(result.entries[0].category).toBe('lexical');expect(find).toHaveBeenCalledWith('d','おかあさん','reading');
    expect((await load('mother')).entries).toEqual(result.entries);
  });
  it('lets RUSH read only a current cache, never scanning OCR or writing on a miss or invalidation',async()=>{
    await repo.put('volumes',volume('rush'));await repo.put('pages',page('rush','猫。'));const prepared=await load('rush');
    const read=vi.spyOn(repo,'page'),open=vi.spyOn(TestBed.inject(MangaOcrSourceService),'open'),save=vi.spyOn(repo,'saveVocabularyIndex');
    const put=vi.spyOn(IDBObjectStore.prototype,'put');
    expect(await service.cached('rush',new AbortController().signal)).toEqual(prepared);
    expect(await service.cached('missing',new AbortController().signal)).toBeNull();
    expect(read).not.toHaveBeenCalled();expect(open).not.toHaveBeenCalled();expect(save).not.toHaveBeenCalled();expect(put).not.toHaveBeenCalled();
    await repo.put('pages',page('rush','猫。猫。'));read.mockClear();open.mockClear();put.mockClear();
    expect(await service.cached('rush',new AbortController().signal)).toBeNull();expect(open).not.toHaveBeenCalled();expect(read).not.toHaveBeenCalled();expect(put).not.toHaveBeenCalled();
  });
});
