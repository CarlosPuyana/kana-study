import 'fake-indexeddb/auto';
import {IDBFactory} from 'fake-indexeddb';
import {TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import {MangaPage} from './manga.page';
import {MangaBuiltinService} from '../../core/services/manga-builtin.service';
import {MangaRepository} from '../../core/services/manga.repository';
import {LocalMangaCatalogService} from '../../core/services/local-manga-catalog.service';
import {MangaVolume} from '../../core/models/manga.model';

describe('Manga library with included manga',()=>{
  const ensure=vi.fn();
  beforeEach(async()=>{
    localStorage.clear();vi.stubGlobal('indexedDB',new IDBFactory());ensure.mockReset();
    vi.stubGlobal('matchMedia',()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()}));
    TestBed.configureTestingModule({providers:[provideRouter([]),{provide:MangaBuiltinService,useValue:{ensure}},{provide:LocalMangaCatalogService,useValue:{list:async()=>[]}}]});
    const own:MangaVolume={id:'own',title:'My manga',seriesTitle:'My manga',pageCount:1,storageBytes:1,mokuro:{version:'0.2.0',title:'My manga',volume:'1'},createdAt:'now',updatedAt:'now',complete:true};
    await TestBed.inject(MangaRepository).put('volumes',own);
  });
  afterEach(()=>{TestBed.resetTestingModule();vi.unstubAllGlobals();});
  it('keeps the library and import button available while provisioning',async()=>{
    let complete!:(value:boolean)=>void;ensure.mockImplementation(()=>new Promise<boolean>(resolve=>complete=resolve));
    const f=TestBed.createComponent(MangaPage);f.detectChanges();await vi.waitFor(()=>expect(f.componentInstance.volumes()).toHaveLength(1));f.detectChanges();
    expect(f.componentInstance.builtinPreparing()).toBe(true);expect(f.componentInstance.busy()).toBe(false);expect(f.nativeElement.textContent).toContain('My manga');expect(f.nativeElement.textContent).toContain('Preparando manga incluido');expect(f.nativeElement.querySelector('.primary-action').disabled).toBe(false);
    complete(false);await vi.waitFor(()=>expect(f.componentInstance.builtinPreparing()).toBe(false));
  });
  it('shows a nonblocking failure and retries when the library is revisited',async()=>{
    ensure.mockRejectedValueOnce(new Error('Unavailable')).mockResolvedValue(false);
    const f=TestBed.createComponent(MangaPage);f.detectChanges();await vi.waitFor(()=>expect(f.componentInstance.builtinFailed()).toBe(true));await vi.waitFor(()=>expect(f.componentInstance.volumes()).toHaveLength(1));f.detectChanges();expect(f.nativeElement.textContent).toContain('My manga');expect(f.componentInstance.busy()).toBe(false);f.destroy();
    const next=TestBed.createComponent(MangaPage);next.detectChanges();await vi.waitFor(()=>expect(ensure).toHaveBeenCalledTimes(2));await vi.waitFor(()=>expect(next.componentInstance.builtinPreparing()).toBe(false));expect(next.componentInstance.builtinFailed()).toBe(false);
  });
  it('puts imported works before help and preserves separate reading, analysis and practice links',async()=>{
    ensure.mockResolvedValue(false);const f=TestBed.createComponent(MangaPage);f.detectChanges();await vi.waitFor(()=>expect(f.componentInstance.volumes()).toHaveLength(1));f.detectChanges();
    const root=f.nativeElement as HTMLElement,card=root.querySelector('.personal-library article')!;
    expect(root.querySelector('.manga-hero,.manga-steps')).toBeNull();expect(root.querySelector('.personal-library')!.compareDocumentPosition(root.querySelector('.library-help')!)&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect([...card.querySelectorAll('a')].map(a=>a.getAttribute('href'))).toEqual(expect.arrayContaining(['/manga/read/own','/manga/analysis/own','/manga/practice/own']));
    expect(card.getAttribute('tabindex')).toBeNull();expect(root.querySelector('.cover-placeholder')).not.toBeNull();
  });
  it('highlights only real unfinished progress and selects the most recently opened volume',async()=>{
    ensure.mockResolvedValue(false);const f=TestBed.createComponent(MangaPage);f.detectChanges();await vi.waitFor(()=>expect(f.componentInstance.volumes()).toHaveLength(1));
    const c=f.componentInstance,v=c.volumes()[0];c.volumes.set([v,{...v,id:'later',title:'Long title '.repeat(15),pageCount:30}]);
    expect(c.continuing()).toBeNull();c.progress.set({own:{volumeId:'own',pageIndex:0,activeSeconds:0,completed:true,lastOpenedAt:'2026-11-10T11:00:00Z',updatedAt:'2026-11-10T11:00:00Z'},later:{volumeId:'later',pageIndex:6,activeSeconds:100,completed:false,lastOpenedAt:'2026-11-11T11:00:00Z',updatedAt:'2026-11-11T11:00:00Z'}});
    f.detectChanges();expect(c.continuing()?.id).toBe('later');expect(rootText(f.nativeElement)).toContain('7 / 30');expect(f.nativeElement.querySelector('.continue-reading a').getAttribute('href')).toBe('/manga/read/later');
    c.progress.update(p=>({...p,later:{...p['later'],completed:true}}));f.detectChanges();expect(f.nativeElement.querySelector('.continue-reading')).toBeNull();
  });
  it('keeps an empty library useful with import and secondary help',async()=>{
    await TestBed.inject(MangaRepository).delete('own');ensure.mockResolvedValue(false);const f=TestBed.createComponent(MangaPage);f.detectChanges();await f.whenStable();f.detectChanges();
    expect(f.nativeElement.querySelector('.empty-library button')).not.toBeNull();expect(f.nativeElement.querySelector('input[type=file]').getAttribute('accept')).toBe('.zip,.cbz');expect(f.nativeElement.querySelector('.library-help')).not.toBeNull();
  });
});
function rootText(root:HTMLElement){return root.textContent??'';}
