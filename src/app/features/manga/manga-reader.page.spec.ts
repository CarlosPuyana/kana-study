import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MangaReaderPage } from './manga-reader.page';
import { MangaRepository } from '../../core/services/manga.repository';
import { JapaneseLookupService } from '../../core/services/japanese-lookup.service';
import { TranslationService } from '../../core/services/translation.service';
import { MangaReadingClock, MangaClockOptions } from '../../core/services/manga-reading-clock';
import { MANGA_READER_PREFERENCES_KEY } from '../../core/services/manga-reader-preferences';
const point={text:'学校',offset:0,x:100,y:100};
describe('Manga reader controls',()=>{
  const lookup={lookup:vi.fn()};
  beforeEach(()=>{
    localStorage.clear();lookup.lookup.mockReset().mockResolvedValue({query:'学校',installed:true,terms:[]});
    vi.spyOn(document,'hasFocus').mockReturnValue(true);
    vi.stubGlobal('URL',class extends URL{static override createObjectURL=vi.fn(()=> 'blob:fixture');static override revokeObjectURL=vi.fn();});
    TestBed.configureTestingModule({providers:[provideRouter([]),
      {provide:ActivatedRoute,useValue:{snapshot:{paramMap:{get:()=> 'fixture'}}}},
      {provide:TranslationService,useValue:{t:(key:string)=>key}},
      {provide:JapaneseLookupService,useValue:lookup},
      {provide:MangaRepository,useValue:{volume:vi.fn().mockResolvedValue({id:'fixture',title:'Fixture',pageCount:3,complete:true}),progress:vi.fn().mockResolvedValue(undefined),
        page:vi.fn(async(volumeId:string,pageIndex:number)=>({volumeId,pageIndex,image:new Blob(['image']),ocr:{img_width:100,img_height:150,blocks:[]}})),put:vi.fn().mockResolvedValue(undefined)}},
    ]});
  });
  afterEach(()=>{TestBed.resetTestingModule();vi.restoreAllMocks();vi.unstubAllGlobals();});
  async function reader(){const fixture=TestBed.createComponent(MangaReaderPage);fixture.detectChanges();await vi.waitFor(()=>expect(fixture.componentInstance.loading()).toBe(false));fixture.detectChanges();return fixture;}
  it('navigates previous/next with disabled first and last page boundaries',async()=>{
    const fixture=await reader(),component=fixture.componentInstance;
    expect(fixture.nativeElement.querySelector('.previous').disabled).toBe(true);expect(fixture.nativeElement.querySelector('.next').disabled).toBe(false);
    await component.go(1);await component.go(0);expect(component.index()).toBe(0);await component.go(-1);expect(component.index()).toBe(0);
    await component.go(2);fixture.detectChanges();expect(fixture.nativeElement.querySelector('.next').disabled).toBe(true);expect(fixture.nativeElement.querySelector('.previous').disabled).toBe(false);await component.go(3);expect(component.index()).toBe(2);
  });
  it('persists OCR and dictionary preferences across reader instances',async()=>{
    const fixture=await reader();fixture.componentInstance.openPanel('settings');fixture.detectChanges();
    const inputs=fixture.nativeElement.querySelectorAll('.reader-panel input') as NodeListOf<HTMLInputElement>;
    inputs[0].checked=true;inputs[0].dispatchEvent(new Event('change'));inputs[1].checked=false;inputs[1].dispatchEvent(new Event('change'));
    expect(JSON.parse(localStorage.getItem(MANGA_READER_PREFERENCES_KEY)!)).toMatchObject({ocrVisible:true,dictionaryEnabled:false,idleMinutes:5});fixture.destroy();
    const reopened=await reader();expect(reopened.componentInstance.showOcr()).toBe(true);expect(reopened.componentInstance.preferences().dictionaryEnabled).toBe(false);expect(reopened.componentInstance.clockState()).toBe('off');
  });
  it('does not perform lookup when the integrated dictionary is disabled',async()=>{
    const fixture=await reader();fixture.componentInstance.openPanel('settings');fixture.detectChanges();const input=fixture.nativeElement.querySelectorAll('.reader-panel input')[1] as HTMLInputElement;input.checked=false;input.dispatchEvent(new Event('change'));
    await fixture.componentInstance.lookupWord(point);expect(lookup.lookup).not.toHaveBeenCalled();expect(fixture.componentInstance.popup()).toBeNull();
  });
  it('keeps settings, clock and dictionary overlays mutually exclusive',async()=>{
    const fixture=await reader(),component=fixture.componentInstance;component.openPanel('settings');expect(component.panel()).toBe('settings');
    await component.lookupWord(point);expect(component.panel()).toBeNull();expect(component.popup()).toEqual(point);
    component.openPanel('clock');expect(component.popup()).toBeNull();expect(component.panel()).toBe('clock');component.openPanel('settings');fixture.detectChanges();expect(fixture.nativeElement.querySelectorAll('[role="dialog"]').length).toBe(1);
    component.key(new KeyboardEvent('keydown',{key:'Escape'}));expect(component.panel()).toBeNull();
  });
  it('persists the selected fit mode',async()=>{
    const fixture=await reader();fixture.componentInstance.openPanel('settings');fixture.detectChanges();const select=fixture.nativeElement.querySelector('.reader-panel select') as HTMLSelectElement;select.value='width';select.dispatchEvent(new Event('change'));
    expect(JSON.parse(localStorage.getItem(MANGA_READER_PREFERENCES_KEY)!)).toMatchObject({fitMode:'width',manualZoom:null});fixture.destroy();const reopened=await reader();expect(reopened.componentInstance.preferences().fitMode).toBe('width');
  });
  it('clamps zoom in and out to 50–300 percent',async()=>{
    const component=(await reader()).componentInstance;for(let i=0;i<20;i++)component.changeZoom(1);expect(component.zoom()).toBe(300);for(let i=0;i<20;i++)component.changeZoom(-1);expect(component.zoom()).toBe(50);
  });
  it('resets manual zoom to the current fit mode',async()=>{
    const fixture=await reader(),component=fixture.componentInstance;component.changeZoom(1);expect(component.preferences().manualZoom).toBe(125);component.resetZoom();expect(component.zoom()).toBe(100);expect(component.preferences()).toMatchObject({manualZoom:null,fitMode:'height'});
  });
  it('requests fullscreen on the reader and reflects native exit or denial',async()=>{
    const fixture=await reader(),component=fixture.componentInstance;const root=fixture.nativeElement.querySelector('main') as HTMLElement;let active:Element|null=null;
    const descriptor=Object.getOwnPropertyDescriptor(document,'fullscreenElement');const exitDescriptor=Object.getOwnPropertyDescriptor(document,'exitFullscreen');
    Object.defineProperty(document,'fullscreenElement',{configurable:true,get:()=>active});const request=vi.fn(async()=>{active=root;});Object.defineProperty(root,'requestFullscreen',{configurable:true,value:request});const exit=vi.fn(async()=>{active=null;});Object.defineProperty(document,'exitFullscreen',{configurable:true,value:exit});
    try{await component.toggleFullscreen();expect(request).toHaveBeenCalledOnce();expect(component.fullscreen()).toBe(true);await component.toggleFullscreen();expect(exit).toHaveBeenCalledOnce();expect(component.fullscreen()).toBe(false);request.mockRejectedValueOnce(new Error('Denied'));await component.toggleFullscreen();expect(component.fullscreen()).toBe(false);}
    finally{if(descriptor)Object.defineProperty(document,'fullscreenElement',descriptor);else Reflect.deleteProperty(document,'fullscreenElement');if(exitDescriptor)Object.defineProperty(document,'exitFullscreen',exitDescriptor);else Reflect.deleteProperty(document,'exitFullscreen');}
  });
  it('scales the shared image and OCR parent together',async()=>{
    const fixture=await reader();fixture.componentInstance.changeZoom(1);fixture.componentInstance.changeZoom(1);fixture.detectChanges();const parent=fixture.nativeElement.querySelector('.page-image') as HTMLElement;
    expect(parent.style.transform).toBe('scale(1.5)');expect(fixture.nativeElement.querySelector('img').parentElement).toBe(parent);expect(fixture.nativeElement.querySelector('app-manga-ocr').parentElement).toBe(parent);
  });
  it('resets scroll pan on page changes while keeping zoom',async()=>{
    const fixture=await reader(),component=fixture.componentInstance;component.changeZoom(1);const stage=fixture.nativeElement.querySelector('.page-stage') as HTMLElement;stage.scrollLeft=40;stage.scrollTop=200;await component.go(1);expect(stage.scrollLeft).toBe(0);expect(stage.scrollTop).toBe(0);expect(component.zoom()).toBe(125);
  });
  it('decodes only the adjacent pages without fetching duplicate blobs',async()=>{
    const previews:{src:string;decode:ReturnType<typeof vi.fn>}[]=[];
    vi.stubGlobal('Image',class{src='';decode=vi.fn().mockResolvedValue(undefined);constructor(){previews.push(this);}});
    const fixture=await reader();expect(previews.length).toBe(1);previews.length=0;await fixture.componentInstance.go(1);
    expect(previews.length).toBe(2);expect(previews.every(image=>image.decode.mock.calls.length===1)).toBe(true);expect(vi.mocked(TestBed.inject(MangaRepository).page).mock.calls.map(call=>call[1])).toEqual([0,1,2]);
  });
  it('intercepts Ctrl+wheel only inside the reader and leaves normal scroll alone',async()=>{
    const fixture=await reader();const stage=fixture.nativeElement.querySelector('.page-stage') as HTMLElement;
    const normal=new WheelEvent('wheel',{deltaY:-100,bubbles:true,cancelable:true});stage.dispatchEvent(normal);expect(normal.defaultPrevented).toBe(false);expect(fixture.componentInstance.zoom()).toBe(100);
    const control=new WheelEvent('wheel',{ctrlKey:true,deltaY:-100,bubbles:true,cancelable:true});stage.dispatchEvent(control);expect(control.defaultPrevented).toBe(true);expect(fixture.componentInstance.zoom()).toBe(125);
    const outside=new WheelEvent('wheel',{ctrlKey:true,deltaY:-100,bubbles:true,cancelable:true});document.body.dispatchEvent(outside);expect(outside.defaultPrevented).toBe(false);expect(fixture.componentInstance.zoom()).toBe(125);
  });
});
describe('Existing MangaReadingClock controls',()=>{
  const options:MangaClockOptions={pauseHidden:true,idleMinutes:5,pauseDictionary:true,dictionaryOpen:false};
  it('starts and stops recording without recording while manually off',()=>{
    const clock=new MangaReadingClock(0,false);expect(clock.tick(true,true,1000,options)).toBe(0);clock.start(1000);expect(clock.tick(true,true,3000,options)).toBe(2);clock.stop(3000);expect(clock.tick(true,true,5000,options)).toBe(0);expect(clock.state(true,true,5000,options)).toBe('off');
  });
  it('pauses while hidden and does not resume after a manual stop',()=>{
    const clock=new MangaReadingClock(0,false);clock.start(0);expect(clock.tick(false,false,1000,options)).toBe(0);expect(clock.state(false,false,1000,options)).toBe('paused');expect(clock.state(true,true,1000,options)).toBe('running');
    clock.stop(1000);clock.interact(2000);expect(clock.tick(true,true,3000,options)).toBe(0);expect(clock.state(true,true,3000,options)).toBe('off');
  });
  it('pauses for the dictionary only when that preference is enabled',()=>{
    const clock=new MangaReadingClock(0);expect(clock.tick(true,true,1000,{...options,dictionaryOpen:true})).toBe(0);expect(clock.state(true,true,1000,{...options,dictionaryOpen:true})).toBe('paused');
    expect(clock.tick(true,true,2000,{...options,dictionaryOpen:true,pauseDictionary:false})).toBe(1);expect(clock.tick(true,true,3000,options)).toBe(1);
  });
  it('uses the five minute idle threshold, resumes on activity, and supports never pausing',()=>{
    const clock=new MangaReadingClock(0);expect(clock.tick(true,true,301000,options)).toBe(300);expect(clock.state(true,true,301000,options)).toBe('paused');clock.interact(301000);expect(clock.tick(true,true,302000,options)).toBe(1);
    expect(clock.tick(false,false,3_902_000,{...options,idleMinutes:0,pauseHidden:false})).toBe(3600);
  });
});
