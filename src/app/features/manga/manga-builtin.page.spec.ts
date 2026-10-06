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
});
