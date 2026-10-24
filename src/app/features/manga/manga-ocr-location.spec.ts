import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MangaOcrLocation } from './manga-ocr-location';
import { MangaOcrComponent } from './manga-ocr.component';
import { MangaPage } from '../../core/models/manga.model';
import { MangaOcrOccurrence } from '../../core/models/manga-ocr-occurrence.model';
import { MangaOcrSourceService } from '../../core/services/manga-ocr-source.service';
import { ocrDigest } from '../../core/services/manga-ocr-text';
import { TranslationService } from '../../core/services/translation.service';
import { WorkspaceService } from '../../core/services/workspace.service';
import { CUSTOM_DECKS_ENABLED } from '../../core/services/custom-deck-gates';
import { MANGA_DECK_ASSISTED_ENABLED } from '../../core/services/manga-deck-gate';

describe('Deferred OCR location: one-page verification and readonly output',()=>{
  const gate=signal(true),source={open:vi.fn()};let page:MangaPage,reference:MangaOcrOccurrence,read:ReturnType<typeof vi.fn>;
  beforeEach(async()=>{
    TestBed.resetTestingModule();localStorage.clear();gate.set(true);source.open.mockReset();
    page={volumeId:'volume',pageIndex:1,image:new Blob(['synthetic']),ocr:{img_path:'p',img_width:100,img_height:100,blocks:[{box:[0,0,100,100],vertical:false,font_size:20,lines:['𠮷と猫<script>'],lines_coords:[[[0,0],[100,0],[100,100],[0,100]]]}]}};
    reference={schemaVersion:1,volumeId:'volume',pageIndex:1,blockIndex:0,lineIndex:0,start:3,end:4,found:'猫',pageFingerprint:await ocrDigest(JSON.stringify(page.ocr)),workspace:'guest',activationRevision:0};
    read=vi.fn(async()=>({ocr:page.ocr,imageBytes:9}));source.open.mockResolvedValue({pageCount:2,stamp:'v',read});
    await TestBed.configureTestingModule({imports:[MangaOcrLocation,MangaOcrComponent],providers:[
      {provide:MangaOcrSourceService,useValue:source},{provide:CUSTOM_DECKS_ENABLED,useValue:gate},
      {provide:MANGA_DECK_ASSISTED_ENABLED,useValue:signal(true)},{provide:TranslationService,useValue:{t:(key:string)=>key}}]}).compileComponents();
  });
  afterEach(()=>{TestBed.resetTestingModule();vi.restoreAllMocks();});
  function create(){const f=TestBed.createComponent(MangaOcrLocation);f.componentRef.setInput('reference',reference);f.componentRef.setInput('volumeId','volume');f.componentRef.setInput('page',page);return f;}
  async function settle(f:ReturnType<typeof create>){f.detectChanges();await vi.waitFor(()=>expect(f.componentInstance.result().status).not.toBe('pending'));f.detectChanges();return f;}
  it('reads only the requested page and emits a line address without selecting text or opening lookup',async()=>{
    const f=create(),locations:unknown[]=[];f.componentInstance.located.subscribe(r=>locations.push(r));await settle(f);
    expect(source.open).toHaveBeenCalledTimes(1);expect(read).toHaveBeenCalledExactlyOnceWith(1);
    expect(locations.at(-1)).toEqual({page,blockIndex:0,lineIndex:0});expect(f.nativeElement.querySelector('mark').textContent).toBe('猫');
    expect(f.nativeElement.textContent).toContain('[3, 4)');expect(f.nativeElement.querySelector('script')).toBeNull();
    expect(f.nativeElement.querySelector('app-dictionary-popup')).toBeNull();
  });
  it('does not read the source for a manipulated, foreign or inactive reference',async()=>{
    reference={...reference,workspace:'user:other'};const f=await settle(create());expect(f.componentInstance.result().status).toBe('unavailable');expect(source.open).not.toHaveBeenCalled();
  });
  it('does not load location evidence when a gate is disabled',async()=>{
    gate.set(false);const f=await settle(create());expect(f.componentInstance.result().status).toBe('unavailable');expect(source.open).not.toHaveBeenCalled();
  });
  it('marks a text-only edit stale without emitting an outline',async()=>{
    read.mockResolvedValue({ocr:{...page.ocr,blocks:[]},imageBytes:0});const f=create(),locations:unknown[]=[];f.componentInstance.located.subscribe(r=>locations.push(r));await settle(f);
    expect(f.componentInstance.result().status).toBe('stale');expect(locations.every(r=>r===null)).toBe(true);
  });
  it('keeps a valid textual context without a line outline when geometry is incomplete',async()=>{
    page.ocr.blocks[0].lines_coords=[];reference={...reference,pageFingerprint:await ocrDigest(JSON.stringify(page.ocr))};
    const f=create(),locations:unknown[]=[];f.componentInstance.located.subscribe(r=>locations.push(r));await settle(f);
    expect(f.componentInstance.result().status).toBe('text');expect(locations.every(r=>r===null)).toBe(true);
    const overlay=TestBed.createComponent(MangaOcrComponent);overlay.componentRef.setInput('page',page.ocr);overlay.detectChanges();
    expect(overlay.componentInstance.bounds(undefined,0)).toBe(0);expect(overlay.componentInstance.extent([],0)).toBe(0);
  });
  it('drops a delayed result after another page is rendered',async()=>{
    let release!:(v:{ocr:MangaPage['ocr'];imageBytes:number})=>void;read.mockImplementation(()=>new Promise(r=>release=r));
    const f=create(),locations:unknown[]=[];f.componentInstance.located.subscribe(r=>locations.push(r));f.detectChanges();await vi.waitFor(()=>expect(read).toHaveBeenCalledTimes(1));
    f.componentRef.setInput('page',{...page,pageIndex:0});f.detectChanges();release({ocr:page.ocr,imageBytes:0});await f.whenStable();
    expect(f.componentInstance.result().status).toBe('unavailable');expect(locations.every(r=>r===null)).toBe(true);
  });
  it('drops A-B-A responses while reading the source',async()=>{
    let release!:(v:{ocr:MangaPage['ocr'];imageBytes:number})=>void;read.mockImplementation(()=>new Promise(r=>release=r));
    const f=create(),locations:unknown[]=[];f.componentInstance.located.subscribe(r=>locations.push(r));f.detectChanges();await vi.waitFor(()=>expect(read).toHaveBeenCalledTimes(1));
    const workspace=TestBed.inject(WorkspaceService);workspace.activateUser('b');workspace.activateGuest();f.detectChanges();release({ocr:page.ocr,imageBytes:0});await f.whenStable();
    expect(f.componentInstance.result().status).toBe('unavailable');expect(locations.every(r=>r===null)).toBe(true);
  });
  it('cancels on destruction and offers an explicit dismiss action',async()=>{
    const f=await settle(create()),dismiss=vi.fn();f.componentInstance.dismissed.subscribe(dismiss);f.nativeElement.querySelector('button').click();expect(dismiss).toHaveBeenCalledTimes(1);
    const signal=source.open.mock.calls[0][2] as AbortSignal;f.destroy();expect(signal.aborted).toBe(true);
  });
});
