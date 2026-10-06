import {DOCUMENT} from '@angular/common';
import {TestBed} from '@angular/core/testing';
import {LocalManga} from '../models/local-manga.model';
import {LocalMangaCatalogService,parseLocalManga,parseMangaDialogue} from './local-manga-catalog.service';
import {MangaSourceService} from './manga-source.service';
import {MangaRepository} from './manga.repository';

const metadata:LocalManga={schemaVersion:1,id:'test-manga',titles:{ja:'テスト',es:'Prueba'},originalLanguage:'ja',availableLanguages:['ja','es'],readingDirection:'rtl',status:'published',pages:[{id:'p01',width:100,height:150,images:{ja:'pages/jp/01.webp',es:'pages/es/01.webp'}}],cover:'cover.webp',dialogue:'data/dialogue.json',mokuro:{ja:'ja.mokuro'}};
const bubble={pageId:'p01',bubbleId:'p01_b01',jp:'学校',reading:'がっこう',es:'Escuela',studyTargets:['学校']};
describe('Local manga catalog',()=>{
  let fetcher:ReturnType<typeof vi.fn>;
  beforeEach(()=>{
    const files:Record<string,unknown>={'index.json':{schemaVersion:1,mangas:['test/metadata.json']},'test/metadata.json':metadata,'test/data/dialogue.json':[bubble],'test/ja.mokuro':{version:'0.2.0',title:'テスト',volume:'Test',pages:[{img_path:'pages/jp/01.webp',img_width:100,img_height:150,blocks:[{box:[0,0,100,40],vertical:false,font_size:20,lines:['学校'],lines_coords:[[[0,0],[100,0],[100,40],[0,40]]]}]}]}};
    fetcher=vi.fn(async(input:URL)=>({ok:true,json:async()=>structuredClone(files[input.href.split('/manga/')[1]]),blob:async()=>new Blob(['local-image'],{type:'image/webp'})}));vi.stubGlobal('fetch',fetcher);
    TestBed.configureTestingModule({providers:[{provide:DOCUMENT,useValue:{baseURI:'https://example.test/kana-study/'}},{provide:MangaRepository,useValue:{volume:vi.fn(async()=>({id:'imported'})),page:vi.fn(async()=>({volumeId:'imported'}))}}]});
  });
  afterEach(()=>{TestBed.resetTestingModule();vi.unstubAllGlobals();});
  it('discovers metadata by configuration, uses baseURI and caches catalog reads',async()=>{const catalog=TestBed.inject(LocalMangaCatalogService);expect(await catalog.list()).toEqual([metadata]);await catalog.list();expect(fetcher).toHaveBeenCalledTimes(2);expect(String(fetcher.mock.calls[0][0])).toBe('https://example.test/kana-study/manga/index.json');expect(catalog.asset(metadata,metadata.cover!)).toBe('https://example.test/kana-study/manga/test/cover.webp');});
  it('adapts metadata to the existing Reader volume with RTL and languages',async()=>{expect(await TestBed.inject(LocalMangaCatalogService).volume('test-manga')).toMatchObject({id:'catalog:test-manga',catalogId:'test-manga',pageCount:1,originalLanguage:'ja',readingDirection:'rtl',availableLanguages:['ja','es']});});
  it('resolves Japanese image and real Mokuro data',async()=>{const p=await TestBed.inject(LocalMangaCatalogService).page('test-manga',0);expect(p.image.size).toBeGreaterThan(0);expect(p.ocr.blocks[0].lines).toEqual(['学校']);expect(String(fetcher.mock.calls[2][0]).endsWith('/test/pages/jp/01.webp')).toBe(true);});
  it('resolves the same page in Spanish without manufacturing Japanese OCR',async()=>{const p=await TestBed.inject(LocalMangaCatalogService).page('test-manga',0,'es');expect(p.pageIndex).toBe(0);expect(p.ocr.blocks).toEqual([]);expect(String(fetcher.mock.calls[2][0]).endsWith('/test/pages/es/01.webp')).toBe(true);});
  it('loads official dialogue separately with stable IDs',async()=>expect(await TestBed.inject(LocalMangaCatalogService).dialogue('test-manga')).toEqual([bubble]));
  it('reports missing manga and out-of-range pages',async()=>{const catalog=TestBed.inject(LocalMangaCatalogService);await expect(catalog.get('absent')).rejects.toThrow('catalogMissing');await expect(catalog.page('test-manga',3)).rejects.toThrow('catalogMissing');});
  it('rejects an unavailable language without fetching page images',async()=>{const catalog=TestBed.inject(LocalMangaCatalogService);await catalog.list();await expect(catalog.page('test-manga',0,'en' as 'ja')).rejects.toThrow('catalogLanguage');expect(fetcher).toHaveBeenCalledTimes(2);});
  it('retries failed catalog downloads',async()=>{fetcher.mockResolvedValueOnce({ok:false} as never);const catalog=TestBed.inject(LocalMangaCatalogService);await expect(catalog.list()).rejects.toThrow('catalogUnavailable');expect(await catalog.list()).toHaveLength(1);});
  it('rejects unsafe and external asset paths',()=>{expect(()=>parseLocalManga({...metadata,cover:'../secret'})).toThrow('catalogInvalid');expect(()=>parseLocalManga({...metadata,cover:'https://external.test/cover.webp'})).toThrow('catalogInvalid');expect(()=>parseLocalManga({...metadata,dialogue:'%2e%2e/secret'})).toThrow('catalogInvalid');});
  it('rejects missing language images, repeated page IDs, and invalid original language',()=>{expect(()=>parseLocalManga({...metadata,pages:[{...metadata.pages[0],images:{ja:'page.webp'}}]})).toThrow();expect(()=>parseLocalManga({...metadata,pages:[metadata.pages[0],metadata.pages[0]]})).toThrow();expect(()=>parseLocalManga({...metadata,originalLanguage:'es'})).toThrow();});
  it('rejects repeated bubbles and references to absent pages',()=>{expect(()=>parseMangaDialogue([bubble,bubble],metadata)).toThrow();expect(()=>parseMangaDialogue([{...bubble,pageId:'p20'}],metadata)).toThrow();});
  it('hides draft content',async()=>{fetcher.mockImplementation(async(input:URL)=>({ok:true,json:async()=>input.href.endsWith('index.json')?{schemaVersion:1,mangas:['test/metadata.json']}:{...metadata,status:'draft'}}));expect(await TestBed.inject(LocalMangaCatalogService).list()).toEqual([]);});
  it('rejects duplicate catalog IDs',async()=>{fetcher.mockImplementation(async(input:URL)=>({ok:true,json:async()=>input.href.endsWith('index.json')?{schemaVersion:1,mangas:['one/metadata.json','two/metadata.json']}:metadata}));await expect(TestBed.inject(LocalMangaCatalogService).list()).rejects.toThrow('catalogInvalid');});
  it('preserves imported source delegation and does not load the static catalog',async()=>{const source=TestBed.inject(MangaSourceService);expect(await source.volume('imported','guest')).toEqual({id:'imported'});expect(await source.page('imported',0,'guest')).toEqual({volumeId:'imported'});expect(fetcher).not.toHaveBeenCalled();});
  it('uses the catalog namespace without storing static volumes/pages in IndexedDB',async()=>{const repository=TestBed.inject(MangaRepository),source=TestBed.inject(MangaSourceService);await source.volume('catalog:test-manga','guest');await source.page('catalog:test-manga',0,'guest');expect(repository.volume).not.toHaveBeenCalled();expect(repository.page).not.toHaveBeenCalled();});
});
