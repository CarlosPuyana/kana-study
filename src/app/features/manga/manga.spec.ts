import 'fake-indexeddb/auto';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { MangaRepository } from '../../core/services/manga.repository';
import { WorkspaceService } from '../../core/services/workspace.service';
import { findMokuro, mapMokuroImages, normalizeMangaPath, parseMokuro } from '../../core/services/mokuro-parser';
import { MangaVolume, MokuroDocument } from '../../core/models/manga.model';
import { MangaOcrComponent } from './manga-ocr.component';
import { MangaReadingClock } from '../../core/services/manga-reading-clock';
const document = (): MokuroDocument => ({ version:'0.2.0',title:'Series',volume:'One',pages:[{img_path:'003.jpg',img_width:1000,img_height:1400,blocks:[{box:[100,200,200,400],vertical:true,font_size:20,lines:['日本語'],lines_coords:[[[100,200],[200,200],[200,400],[100,400]]]}]},{img_path:'001.jpg',img_width:1000,img_height:1400,blocks:[]}] });
const volume = (id:string): MangaVolume => ({id,title:'One',seriesTitle:'Series',pageCount:2,storageBytes:10,mokuro:{version:'0.2.0',title:'Series',volume:'One'},createdAt:'2026-10-01',updatedAt:'2026-10-01',complete:true});
describe('Manga parser and OCR', () => {
  it('parses official Mokuro page and block metadata', () => { expect(parseMokuro(JSON.stringify(document()))).toEqual(document()); });
  it('rejects malformed block coordinates', () => { const doc=document(); doc.pages[0].blocks[0].box=[0,0,2000,10]; expect(() => parseMokuro(JSON.stringify(doc))).toThrow('invalid'); });
  it('rejects unsupported versions', () => { const doc=document(); doc.version='0.1.9'; expect(() => parseMokuro(JSON.stringify(doc))).toThrow('version'); });
  it('maps img_path in document order instead of archive order', () => { expect(mapMokuroImages(document(),['001.jpg','003.jpg'],'volume.mokuro')).toEqual(['003.jpg','001.jpg']); });
  it('supports a containing directory and normalized separators', () => { expect(mapMokuroImages(document(),['book\\001.jpg','book/003.jpg'],'book/volume.mokuro')).toEqual(['book/003.jpg','book/001.jpg']); });
  it('rejects ZIP without Mokuro', () => { expect(() => findMokuro(['001.jpg','.DS_Store'])).toThrow('noMokuro'); });
  it('rejects multiple Mokuro files', () => { expect(() => findMokuro(['a.mokuro','b.mokuro'])).toThrow('multiple'); });
  it('rejects missing images before any writes', () => { expect(() => mapMokuroImages(document(),['001.jpg'],'a.mokuro')).toThrow('missing'); });
  it('rejects unsafe paths', () => { for (const path of ['../001.jpg','/001.jpg','C:\\001.jpg']) expect(() => normalizeMangaPath(path)).toThrow('invalid'); });
  it('renders Japanese as selectable DOM text at scaled coordinates, without canvas', () => {
    const fixture=TestBed.createComponent(MangaOcrComponent); fixture.componentRef.setInput('page',document().pages[0]);fixture.detectChanges();
    const element=fixture.nativeElement as HTMLElement; const line=element.querySelector('span')!;
    expect(line.textContent).toBe('日本語'); expect(line.style.left).toBe('10%');expect(line.style.top).toBe(`${200/1400*100}%`);expect(line.style.writingMode).toBe('vertical-rl');expect(element.querySelector('canvas,iframe')).toBeNull();fixture.destroy();
  });
});
describe('Manga persistence', () => {
  let repository:MangaRepository, workspace:WorkspaceService;
  let id:string;
  beforeEach(() => { localStorage.clear(); TestBed.configureTestingModule({});repository=TestBed.inject(MangaRepository);workspace=TestBed.inject(WorkspaceService);id=crypto.randomUUID(); });
  it('isolates Guest, Carlos and Nora libraries', async () => {
    await repository.put('volumes',volume(id),'guest');workspace.activateUser('carlos');expect(await repository.volumes()).toEqual([]);
    await repository.put('volumes',volume(id));workspace.activateUser('nora');expect(await repository.volumes()).toEqual([]);
    workspace.activateGuest();expect((await repository.volumes()).some(v=>v.id===id)).toBe(true);
  });
  it('restores saved pageIndex and reading time', async () => {
    const saved={volumeId:id,pageIndex:1,activeSeconds:43,completed:true,lastOpenedAt:'2026-10-01',updatedAt:'2026-10-01'};
    await repository.put('reading-progress',saved);TestBed.resetTestingModule();repository=TestBed.inject(MangaRepository);expect(await repository.progress(id)).toEqual(saved);
  });
  it('deletes pages and progress without deleting another volume', async () => {
    await repository.put('volumes',volume(id));await repository.put('volumes',volume(id+'-other'));
    await repository.put('pages',{volumeId:id,pageIndex:0,image:new Blob(['image']),ocr:document().pages[0]});
    await repository.put('reading-progress',{volumeId:id,pageIndex:0,activeSeconds:0,completed:false,lastOpenedAt:'',updatedAt:''});
    await repository.delete(id);expect(await repository.volume(id)).toBeUndefined();expect(await repository.page(id,0)).toBeUndefined();expect(await repository.progress(id)).toBeUndefined();expect(await repository.volume(id+'-other')).toBeDefined();
  });
  it('hides and cleans interrupted imports, preserving active imports',async()=>{
    await repository.put('volumes',{...volume(id),complete:false});await repository.put('volumes',{...volume(id+'-active'),complete:false});
    expect((await repository.volumes()).some(v=>v.id===id)).toBe(false);await repository.cleanup('guest',new Set([id+'-active']));expect(await repository.volume(id)).toBeUndefined();expect(await repository.volume(id+'-active')).toBeDefined();
  });
});
describe('Manga reading clock',()=>{
  it('stops after three idle minutes and excludes hidden or unfocused time',()=>{
    const clock=new MangaReadingClock(0);expect(clock.tick(true,true,5000)).toBe(5);expect(clock.tick(false,true,10000)).toBe(0);expect(clock.tick(true,false,15000)).toBe(0);
    for(let t=20000;t<=180000;t+=5000) clock.tick(true,true,t);
    expect(clock.tick(true,true,185000)).toBe(0);clock.interact(185000);expect(clock.tick(true,true,190000)).toBe(5);
  });
});
