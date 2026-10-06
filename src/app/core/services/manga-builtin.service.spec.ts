import 'fake-indexeddb/auto';
import {IDBFactory} from 'fake-indexeddb';
import {TestBed} from '@angular/core/testing';
import {DOCUMENT} from '@angular/common';
import {ZipWriter,Uint8ArrayWriter,TextReader} from '@zip.js/zip.js';
import {MangaBuiltinService,BUILTIN_MANGA_ID} from './manga-builtin.service';
import {MangaRepository} from './manga.repository';
import {MangaImportService} from './manga-import.service';
import {WorkspaceService} from './workspace.service';
import {MangaVolume} from '../models/manga.model';

const blobBuffer=function(this:Blob):Promise<ArrayBuffer>{return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result as ArrayBuffer);reader.onerror=()=>reject(reader.error);reader.readAsArrayBuffer(this);});};
Object.defineProperty(Blob.prototype,'arrayBuffer',{configurable:true,value:blobBuffer});
Object.defineProperty(Blob.prototype,'text',{configurable:true,value:async function(this:Blob){return new TextDecoder().decode(await blobBuffer.call(this));}});
async function archive():Promise<Blob>{
  const zip=new ZipWriter(new Uint8ArrayWriter(),{level:0,useWebWorkers:false});
  const pages=[1,2].map(i=>({img_path:`pages/jp/p${i}.webp`,img_width:100,img_height:150,blocks:[]}));
  await zip.add('ja.mokuro',new TextReader(JSON.stringify({version:'0.2.0',title:'はじめての依頼',volume:'1',pages})));
  for(const page of pages)await zip.add(page.img_path,new TextReader('fixture image'));
  const bytes=await zip.close();
  return {size:bytes.length,arrayBuffer:async()=>bytes.buffer,slice:(start:number,end:number)=>({arrayBuffer:async()=>bytes.slice(start,end).buffer})} as unknown as Blob;
}
const ownVolume=():MangaVolume=>({id:'own',title:'My manga',seriesTitle:'Mine',pageCount:1,storageBytes:1,mokuro:{version:'0.2.0',title:'Mine',volume:'1'},createdAt:'2026-10-06',updatedAt:'2026-10-06',complete:true});
describe('included Manga provisioning',()=>{
  let repository:MangaRepository,service:MangaBuiltinService,fetchMock:ReturnType<typeof vi.fn>;
  beforeEach(async()=>{
    localStorage.clear();vi.stubGlobal('indexedDB',new IDBFactory());
    fetchMock=vi.fn().mockResolvedValue({ok:true,blob:async()=>archive()});vi.stubGlobal('fetch',fetchMock);
    TestBed.configureTestingModule({});repository=TestBed.inject(MangaRepository);service=TestBed.inject(MangaBuiltinService);
  });
  afterEach(()=>{TestBed.resetTestingModule();vi.restoreAllMocks();vi.unstubAllGlobals();});
  it('does no download on construction or ordinary repository access',async()=>{await repository.volumes();expect(fetchMock).not.toHaveBeenCalled();});
  it('imports on first visit through the existing importer and stores pages',async()=>{
    expect(await service.ensure()).toBe(true);expect(await repository.provisioned(BUILTIN_MANGA_ID)).toBe(true);
    expect(await repository.volume(BUILTIN_MANGA_ID)).toMatchObject({title:'はじめての依頼 — Vol. 1',complete:true,pageCount:2});
    expect((await repository.page(BUILTIN_MANGA_ID,0))?.ocr.img_path).toBe('pages/jp/p1.webp');
    expect(fetchMock).toHaveBeenCalledOnce();expect(fetchMock.mock.calls[0][0].toString()).toBe(new URL('manga/default/hajimete-no-irai.zip',document.baseURI).href);
  });
  it('repairs a legacy provisioned marker without a volume or deletion tombstone',async()=>{
    await repository.volumes();
    const db=await new Promise<IDBDatabase>((resolve,reject)=>{const req=indexedDB.open('kana-study-manga');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});
    await new Promise<void>((resolve,reject)=>{const tx=db.transaction('provisioning','readwrite');tx.objectStore('provisioning').put({id:BUILTIN_MANGA_ID,provisionedAt:'old'});tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});db.close();
    expect(await repository.provisioned(BUILTIN_MANGA_ID)).toBe(false);expect(await service.ensure()).toBe(true);expect(await repository.volume(BUILTIN_MANGA_ID)).toMatchObject({complete:true});expect(fetchMock).toHaveBeenCalledOnce();
  });
  it('internal cleanup does not create a voluntary-deletion tombstone',async()=>{
    await repository.put('volumes',{...ownVolume(),id:BUILTIN_MANGA_ID,complete:false,updatedAt:'2000-01-01'});
    await repository.cleanup();expect((await repository.provisioningState(BUILTIN_MANGA_ID))?.deletedAt).toBeUndefined();
    await service.ensure();expect(await repository.volume(BUILTIN_MANGA_ID)).toMatchObject({complete:true});
  });
  it('100 later visits do not download or duplicate',async()=>{await service.ensure();for(let i=0;i<100;i++)expect(await service.ensure()).toBe(false);expect(fetchMock).toHaveBeenCalledOnce();expect(await repository.volumes()).toHaveLength(1);});
  it('coalesces simultaneous requests in the same workspace',async()=>{await Promise.all(Array.from({length:10},()=>service.ensure()));expect(fetchMock).toHaveBeenCalledOnce();expect(await repository.volumes()).toHaveLength(1);});
  it('survives reload and respects voluntary deletion',async()=>{await service.ensure();await repository.delete(BUILTIN_MANGA_ID);expect((await repository.provisioningState(BUILTIN_MANGA_ID))?.deletedAt).toBeTruthy();TestBed.resetTestingModule();TestBed.configureTestingModule({});expect(await TestBed.inject(MangaBuiltinService).ensure()).toBe(false);expect(await TestBed.inject(MangaRepository).volumes()).toEqual([]);expect(fetchMock).toHaveBeenCalledOnce();});
  it('preserves an existing user volume, pages and reading progress',async()=>{
    const own=ownVolume(),progress={volumeId:own.id,pageIndex:0,activeSeconds:42,completed:true,lastOpenedAt:'now',updatedAt:'now'};
    await repository.put('volumes',own);await repository.put('reading-progress',progress);await repository.put('pages',{volumeId:'own',pageIndex:0,image:new Blob(['own']),ocr:{img_path:'own.webp',img_width:100,img_height:150,blocks:[]}});
    await service.ensure();expect(await repository.volumes()).toHaveLength(2);expect(await repository.volume('own')).toEqual(own);expect(await repository.progress('own')).toEqual(progress);expect((await repository.page('own',0))?.ocr.img_path).toBe('own.webp');
  });
  it('adds only provisioning metadata when upgrading a v1 library',async()=>{
    const own=ownVolume();
    await new Promise<void>((resolve,reject)=>{const req=indexedDB.open('kana-study-manga',1);req.onupgradeneeded=()=>{req.result.createObjectStore('volumes',{keyPath:'id'});req.result.createObjectStore('pages',{keyPath:['volumeId','pageIndex']}).createIndex('volumeId','volumeId');req.result.createObjectStore('reading-progress',{keyPath:'volumeId'});};req.onsuccess=()=>{const db=req.result,tx=db.transaction('volumes','readwrite');tx.objectStore('volumes').put(own);tx.oncomplete=()=>{db.close();resolve();};};req.onerror=()=>reject(req.error);});
    await service.ensure();expect(await repository.volume('own')).toEqual(own);expect(await repository.volumes()).toHaveLength(2);
  });
  it('keeps each workspace independent, including provisioning and deletion',async()=>{await service.ensure();await repository.delete(BUILTIN_MANGA_ID);TestBed.inject(WorkspaceService).activateUser('existing-user');await service.ensure();expect(await repository.volumes()).toHaveLength(1);expect(await repository.volumes('guest')).toHaveLength(0);expect(await repository.provisioned(BUILTIN_MANGA_ID,'guest')).toBe(true);expect(fetchMock).toHaveBeenCalledTimes(2);});
  it('HTTP failure leaves existing manga accessible and retries on a later visit',async()=>{await repository.put('volumes',ownVolume());fetchMock.mockResolvedValueOnce({ok:false});await expect(service.ensure()).rejects.toThrow();expect(await repository.provisioned(BUILTIN_MANGA_ID)).toBe(false);expect((await repository.volumes()).map(v=>v.id)).toEqual(['own']);await service.ensure();expect(await repository.volumes()).toHaveLength(2);});
  it('failed import is not marked and can be retried without partial pages',async()=>{const importer=TestBed.inject(MangaImportService);vi.spyOn(importer,'importBuiltin').mockRejectedValueOnce(new Error('Invalid archive'));await expect(service.ensure()).rejects.toThrow();expect(await repository.provisioned(BUILTIN_MANGA_ID)).toBe(false);await service.ensure();expect(await repository.volumes()).toHaveLength(1);});
  it('does not mark provisioned when the final transaction fails',async()=>{vi.spyOn(repository,'completeBuiltin').mockRejectedValueOnce(new Error('Quota'));await expect(service.ensure()).rejects.toThrow();expect(await repository.provisioned(BUILTIN_MANGA_ID)).toBe(false);expect(await repository.volume(BUILTIN_MANGA_ID)).toBeUndefined();expect(await repository.page(BUILTIN_MANGA_ID,0)).toBeUndefined();await service.ensure();expect(await repository.volumes()).toHaveLength(1);});
  it('resolves assets using the deployment base URI',async()=>{TestBed.resetTestingModule();TestBed.configureTestingModule({providers:[{provide:DOCUMENT,useValue:{baseURI:'https://example.test/kana-study/'}}]});await TestBed.inject(MangaBuiltinService).ensure();expect(fetchMock.mock.calls[0][0].toString()).toBe('https://example.test/kana-study/manga/default/hajimete-no-irai.zip');});
});
