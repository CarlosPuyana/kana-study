import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ZipWriter, Uint8ArrayWriter, TextReader } from '@zip.js/zip.js';
import { MokuroRemoteImportPage } from './mokuro-remote-import.page';
import { MokuroRemoteImportService, parseRemoteLink, parseRemoteManifest, remoteHttpUrl } from '../../core/services/mokuro-remote-import.service';
import { MangaImportService } from '../../core/services/manga-import.service';
import { MangaRepository } from '../../core/services/manga.repository';
import { mapMokuroImages } from '../../core/services/mokuro-parser';
import { TranslationService } from '../../core/services/translation.service';
const link={cbz:'https://catalog.example/manga.cbz',manifest:'https://catalog.example/api/manifest?id=1'};
const rawManifest={version:1,series:'Series',volume:'One',archive:{url:'/manga.cbz',size:123},ocr:{url:'../ocr.mokuro'},layers:[],cover:{url:'/cover.jpg'}};
const doc={version:'0.2.0',title:'Original',volume:'Original 1',pages:[{img_path:'0001.jpg',img_width:100,img_height:150,blocks:[]},{img_path:'0002.jpg',img_width:100,img_height:150,blocks:[]}]};
const readBlob=function(this:Blob):Promise<ArrayBuffer>{return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result as ArrayBuffer);reader.onerror=()=>reject(reader.error);reader.readAsArrayBuffer(this);});};
Object.defineProperty(Blob.prototype,'arrayBuffer',{configurable:true,value:readBlob});
Object.defineProperty(Blob.prototype,'text',{configurable:true,value:async function(this:Blob){return new TextDecoder().decode(await readBlob.call(this));}});
async function archive():Promise<Blob>{const zip=new ZipWriter(new Uint8ArrayWriter(),{level:0,useWebWorkers:false});for(const page of doc.pages)await zip.add('pages/'+page.img_path,new TextReader('image'));const bytes=await zip.close();return {size:bytes.length,arrayBuffer:async()=>bytes.buffer,slice:(start:number,end:number)=>({arrayBuffer:async()=>bytes.slice(start,end).buffer})} as unknown as Blob;}
describe('Mokuro Remote Import V1',()=>{
  beforeEach(()=>{localStorage.clear();vi.stubGlobal('indexedDB',new IDBFactory());TestBed.configureTestingModule({providers:[provideRouter([]),{provide:ActivatedRoute,useValue:{snapshot:{queryParamMap:convertToParamMap(link)}}},{provide:TranslationService,useValue:{t:(key:string)=>key}}]});});
  afterEach(()=>{TestBed.resetTestingModule();vi.restoreAllMocks();vi.unstubAllGlobals();});
  it('parses the upload hash protocol with cbz and manifest',()=>{const hash=new URL('https://reader.example/app/#/upload?'+new URLSearchParams(link)).hash;expect(hash.startsWith('#/upload?')).toBe(true);expect(parseRemoteLink(convertToParamMap(Object.fromEntries(new URLSearchParams(hash.split('?')[1]))))).toEqual(link);});
  it('rejects all non-HTTP schemes',()=>{for(const value of ['javascript:alert(1)','data:text/plain,x','file:///x','blob:https://example/x','ftp://example/x'])expect(()=>remoteHttpUrl(value)).toThrow('invalidLink');});
  it('resolves archive, OCR and cover against the manifest URL',()=>{expect(parseRemoteManifest(rawManifest,link)).toMatchObject({archiveUrl:'https://catalog.example/manga.cbz',ocrUrl:'https://catalog.example/ocr.mokuro',coverUrl:'https://catalog.example/cover.jpg'});});
  it('accepts manifest v1 and rejects incompatible versions and inconsistent archive URLs',()=>{expect(parseRemoteManifest(rawManifest,link)).toMatchObject({series:'Series',volume:'One',size:123});expect(()=>parseRemoteManifest({...rawManifest,version:2},link)).toThrow('manifestIncompatible');expect(()=>parseRemoteManifest({...rawManifest,archive:{url:'/other.cbz'}},link)).toThrow('invalidLink');});
  it('downloads only the manifest before confirmation',async()=>{const fetchMock=vi.fn().mockResolvedValue(new Response(JSON.stringify(rawManifest)));vi.stubGlobal('fetch',fetchMock);const fixture=TestBed.createComponent(MokuroRemoteImportPage);fixture.detectChanges();await vi.waitFor(()=>expect(fixture.componentInstance.phase()).toBe('ready'));expect(fetchMock).toHaveBeenCalledOnce();expect(fetchMock.mock.calls[0][0]).toBe(link.manifest);expect(fixture.componentInstance.preview()?.manifest.volume).toBe('One');});
  it('imports separate CBZ and OCR through the existing parser and repository',async()=>{const repository=TestBed.inject(MangaRepository);const importer=TestBed.inject(MangaImportService);const id=await importer.importRemote({archiveBlob:await archive(),mokuroBlob:new Blob([JSON.stringify(doc)]),seriesTitle:'Series',volumeTitle:'One',archiveUrl:link.cbz,ocrUrl:'https://catalog.example/ocr.mokuro',signal:new AbortController().signal},()=>{});expect(await repository.volume(id)).toMatchObject({complete:true,title:'One',seriesTitle:'Series',pageCount:2,remoteSource:{archiveUrl:link.cbz}});expect((await repository.page(id,0))?.ocr).toEqual(doc.pages[0]);});
  it('uses exact paths first and falls back to a unique basename remotely',()=>{expect(mapMokuroImages(doc,['pages/0001.jpg','pages/0002.jpg'],'remote.mokuro',true)).toEqual(['pages/0001.jpg','pages/0002.jpg']);expect(()=>mapMokuroImages(doc,['pages/0001.jpg','pages/0002.jpg'],'remote.mokuro')).toThrow('missing');});
  it('rejects ambiguous basenames instead of guessing',()=>{expect(()=>mapMokuroImages(doc,['a/0001.jpg','b/0001.jpg','pages/0002.jpg'],'remote.mokuro',true)).toThrow('ambiguous');});
  it('aborts fetch and removes all staged pages when processing is cancelled',async()=>{
    const controller=new AbortController();vi.stubGlobal('fetch',vi.fn((_url:string,options:RequestInit)=>new Promise((_resolve,reject)=>options.signal?.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError'))))));const preview=TestBed.inject(MokuroRemoteImportService).preview(link,controller.signal);controller.abort();await expect(preview).rejects.toThrow('cancelled');
    const repository=TestBed.inject(MangaRepository);const put=vi.spyOn(repository,'put');const processing=new AbortController();await expect(TestBed.inject(MangaImportService).importRemote({archiveBlob:await archive(),mokuroBlob:new Blob([JSON.stringify(doc)]),seriesTitle:'Series',volumeTitle:'One',archiveUrl:link.cbz,ocrUrl:'https://catalog.example/ocr.mokuro',signal:processing.signal},current=>{if(current===1)processing.abort();})).rejects.toThrow('cancelled');
    const staged=put.mock.calls.find(call=>call[0]==='volumes')![1] as {id:string};expect(await repository.volume(staged.id)).toBeUndefined();expect(await repository.page(staged.id,0)).toBeUndefined();
  });
  it('offers an existing volume without downloading the archive again',async()=>{
    const repository=TestBed.inject(MangaRepository);await repository.put('volumes',{id:'existing',title:'One',seriesTitle:'Series',pageCount:1,storageBytes:1,mokuro:{version:'0.2.0',title:'Series',volume:'One'},createdAt:'',updatedAt:'',complete:true,remoteSource:{archiveUrl:link.cbz,ocrUrl:'https://catalog.example/ocr.mokuro'}});
    const fetchMock=vi.fn().mockResolvedValue(new Response(JSON.stringify(rawManifest)));vi.stubGlobal('fetch',fetchMock);const remote=TestBed.inject(MokuroRemoteImportService);const preview=await remote.preview(link,new AbortController().signal);expect(preview.existing?.id).toBe('existing');expect(await remote.import(preview.manifest,new AbortController().signal,()=>{},()=>{})).toBe('existing');expect(fetchMock).toHaveBeenCalledOnce();
  });
});
