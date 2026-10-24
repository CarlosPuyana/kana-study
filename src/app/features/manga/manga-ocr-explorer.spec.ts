import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MangaOcrExplorer } from './manga-ocr-explorer';
import { MangaOcrExplorerService } from '../../core/services/manga-ocr-explorer.service';
import { OcrExploration } from '../../core/services/manga-ocr-text';
import { TranslationService } from '../../core/services/translation.service';
import { WorkspaceService } from '../../core/services/workspace.service';
import { CUSTOM_DECKS_ENABLED } from '../../core/services/custom-deck-gates';
import { MANGA_DECK_ASSISTED_ENABLED } from '../../core/services/manga-deck-gate';

describe('OCR explorer UI: partial scope, lifecycle and gates',()=>{
  const gate=signal(true),service={scan:vi.fn()};let result:OcrExploration;
  beforeEach(async()=>{
    TestBed.resetTestingModule();localStorage.clear();gate.set(true);service.scan.mockReset();
    result={volumeId:'v',query:'猫',fingerprint:'a'.repeat(64),status:'complete',totalPages:2,pages:[{pageIndex:0,state:'examined',fingerprint:'a'},{pageIndex:1,state:'examined',fingerprint:'b'}],
      matches:[{volumeId:'v',pageIndex:1,blockIndex:0,lineIndex:0,fragment:'𠮷と猫がいる。',start:3,end:4,found:'猫',pageFingerprint:'b'}],reason:null,logicalImageBytesRead:20};
    service.scan.mockImplementation(async()=>result);
    await TestBed.configureTestingModule({imports:[MangaOcrExplorer],providers:[provideRouter([]),
      {provide:MangaOcrExplorerService,useValue:service},{provide:CUSTOM_DECKS_ENABLED,useValue:gate},
      {provide:MANGA_DECK_ASSISTED_ENABLED,useValue:signal(true)},{provide:TranslationService,useValue:{t:(k:string)=>k}}]}).compileComponents();
  });
  afterEach(()=>{TestBed.resetTestingModule();vi.restoreAllMocks();});
  async function render(){const f=TestBed.createComponent(MangaOcrExplorer);f.componentRef.setInput('volumeId','v');f.componentRef.setInput('query','猫');f.detectChanges();await f.whenStable();f.detectChanges();return f;}
  it('shows literal text and opens only the reader page without inventing a selection',async()=>{
    const f=await render(),el:HTMLElement=f.nativeElement;
    expect(el.querySelector('mark')?.textContent).toBe('猫');expect(el.querySelector('.fragment')?.getAttribute('lang')).toBe('ja');
    expect(el.querySelector('a')?.getAttribute('href')).toBe('/manga/read/v?page=2');expect(el.textContent).toContain('ocrExplorer.limitations');
    expect(el.textContent).not.toContain('%');expect(el.querySelectorAll('.matches li')).toHaveLength(1);
  });
  it('keeps partial results and pending pages explicit and marks focus returns stale without rescanning',async()=>{
    result={...result,status:'partial',totalPages:100,pages:[result.pages[0]]};const f=await render();
    expect(f.componentInstance.counts()?.pending).toBe(99);expect(f.nativeElement.textContent).toContain('ocrExplorer.status.partial');
    f.componentInstance.markStale();f.detectChanges();expect(f.nativeElement.textContent).toContain('ocrExplorer.status.stale');expect(service.scan).toHaveBeenCalledTimes(1);
  });
  it('cancels and discards a late callback on destruction',async()=>{
    let progress!:(r:OcrExploration)=>void,finish!:(r:OcrExploration)=>void,signal!:AbortSignal;
    service.scan.mockImplementation((_id:string,_query:string,s:AbortSignal,p:(r:OcrExploration)=>void)=>{signal=s;progress=p;return new Promise<OcrExploration>(r=>finish=r);});
    const f=TestBed.createComponent(MangaOcrExplorer);f.componentRef.setInput('volumeId','v');f.componentRef.setInput('query','猫');f.detectChanges();
    const component=f.componentInstance;f.destroy();expect(signal.aborted).toBe(true);progress(result);finish(result);await Promise.resolve();expect(component.result()).toBeNull();
  });
  it('discards old workspace results and never automatically searches another owner',async()=>{
    let finish!:(r:OcrExploration)=>void;service.scan.mockImplementation(()=>new Promise<OcrExploration>(r=>finish=r));
    const f=TestBed.createComponent(MangaOcrExplorer);f.componentRef.setInput('volumeId','v');f.componentRef.setInput('query','猫');f.detectChanges();
    const workspace=TestBed.inject(WorkspaceService);workspace.activateUser('b');workspace.activateGuest();f.detectChanges();finish(result);await f.whenStable();f.detectChanges();
    expect(f.componentInstance.result()).toBeNull();expect(service.scan).toHaveBeenCalledTimes(1);
  });
  it('does not read OCR with gates disabled',async()=>{gate.set(false);await render();expect(service.scan).not.toHaveBeenCalled();});
});
