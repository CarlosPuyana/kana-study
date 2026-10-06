import {TestBed} from '@angular/core/testing';
import {ActivatedRoute,provideRouter} from '@angular/router';
import {LocalManga} from '../../core/models/local-manga.model';
import {LocalMangaCatalogService} from '../../core/services/local-manga-catalog.service';
import {MangaRepository} from '../../core/services/manga.repository';
import {JapaneseLookupService} from '../../core/services/japanese-lookup.service';
import {MangaReaderPage} from './manga-reader.page';

describe('Shared Reader with local manga',()=>{
  const metadata:LocalManga={schemaVersion:1,id:'fixture',titles:{ja:'テスト',es:'Prueba'},originalLanguage:'ja',availableLanguages:['ja','es'],readingDirection:'rtl',status:'published',pages:[0,1,2].map(i=>({id:'p'+i,width:100,height:150,images:{ja:'jp/'+i+'.webp',es:'es/'+i+'.webp'}}))};
  const lookup={lookupAt:vi.fn(async()=>({installed:true,query:'学校',terms:[]}))};
  beforeEach(()=>{
    localStorage.clear();lookup.lookupAt.mockClear();vi.stubGlobal('matchMedia',vi.fn(()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()})));
    vi.stubGlobal('URL',class extends URL{static override createObjectURL=vi.fn(()=> 'blob:fixture');static override revokeObjectURL=vi.fn();});
    TestBed.configureTestingModule({providers:[provideRouter([]),{provide:ActivatedRoute,useValue:{snapshot:{paramMap:{get:()=> 'catalog:fixture'}}}},{provide:JapaneseLookupService,useValue:lookup},
      {provide:LocalMangaCatalogService,useValue:{volume:async()=>({id:'catalog:fixture',catalogId:'fixture',title:'テスト',seriesTitle:'テスト',pageCount:3,complete:true,readingDirection:'rtl',availableLanguages:['ja','es']}),page:vi.fn(async(_id:string,index:number,language:string)=>({volumeId:'catalog:fixture',pageIndex:index,image:new Blob(['image']),ocr:{img_path:language+'/'+index,img_width:100,img_height:150,blocks:[]}})),get:async()=>metadata}},
      {provide:MangaRepository,useValue:{progress:async()=>({pageIndex:1,activeSeconds:0}),put:vi.fn(async()=>{})}}]});
  });
  afterEach(()=>{TestBed.resetTestingModule();vi.restoreAllMocks();vi.unstubAllGlobals();});
  async function reader(){const f=TestBed.createComponent(MangaReaderPage);f.detectChanges();await vi.waitFor(()=>expect(f.componentInstance.loading()).toBe(false));f.detectChanges();return f;}
  it('honors an explicit 1-based source page over the last reading position',async()=>{
    TestBed.overrideProvider(ActivatedRoute,{useValue:{snapshot:{paramMap:{get:()=> 'catalog:fixture'},queryParamMap:{get:()=> '1'}}}});
    const f=await reader();expect(f.componentInstance.index()).toBe(0);
  });
  it.each(['0','4','-1','abc','1.5'])('rejects invalid source page %s and uses reading position',async page=>{
    TestBed.overrideProvider(ActivatedRoute,{useValue:{snapshot:{paramMap:{get:()=> 'catalog:fixture'},queryParamMap:{get:()=> page}}}});
    const f=await reader();expect(f.componentInstance.index()).toBe(1);
  });
  it('opens saved pages in Japanese and switches lettering without changing the page',async()=>{const f=await reader();expect(f.componentInstance.index()).toBe(1);expect(f.componentInstance.language()).toBe('ja');await f.componentInstance.setLanguage({target:{value:'es'}} as unknown as Event);f.detectChanges();expect(f.componentInstance.index()).toBe(1);expect(f.componentInstance.current()?.ocr.img_path).toBe('es/1');expect(f.nativeElement.querySelector('app-manga-ocr')).toBeNull();await f.componentInstance.setLanguage({target:{value:'ja'}} as unknown as Event);f.detectChanges();expect(f.nativeElement.querySelector('app-manga-ocr')).not.toBeNull();});
  it('rejects unknown languages and leaves the current page unchanged',async()=>{const f=await reader();await f.componentInstance.setLanguage({target:{value:'en'}} as unknown as Event);expect(f.componentInstance.language()).toBe('ja');expect(f.componentInstance.index()).toBe(1);});
  it('keeps dictionary lookup on original Japanese only',async()=>{const f=await reader();await f.componentInstance.setLanguage({target:{value:'es'}} as unknown as Event);await f.componentInstance.lookupWord({text:'Escuela',offset:0,x:0,y:0});expect(lookup.lookupAt).not.toHaveBeenCalled();await f.componentInstance.setLanguage({target:{value:'ja'}} as unknown as Event);await f.componentInstance.lookupWord({text:'学校',offset:0,x:0,y:0});expect(lookup.lookupAt).toHaveBeenCalledWith('学校',0);});
  it('honors RTL arrows while leaving next/previous logical page order intact',async()=>{const f=await reader();expect(f.nativeElement.querySelector('.next').textContent).toContain('‹');expect(f.nativeElement.querySelector('.previous').textContent).toContain('›');f.componentInstance.key(new KeyboardEvent('keydown',{key:'ArrowLeft'}));await vi.waitFor(()=>expect(f.componentInstance.loading()).toBe(false));expect(f.componentInstance.index()).toBe(2);f.componentInstance.key(new KeyboardEvent('keydown',{key:'ArrowRight'}));await vi.waitFor(()=>expect(f.componentInstance.loading()).toBe(false));expect(f.componentInstance.index()).toBe(1);});
});
