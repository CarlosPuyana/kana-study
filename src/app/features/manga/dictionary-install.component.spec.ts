import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DictionaryInstallComponent, JMDICT_DOWNLOAD_URL } from './dictionary-install.component';
import { DictionaryRepository } from '../../core/services/dictionary.repository';
import { YomitanDictionaryImporter } from '../../core/services/yomitan-dictionary-importer';
import { TranslationService } from '../../core/services/translation.service';
import { DictionaryMetadata } from '../../core/models/dictionary.model';
const previous:DictionaryMetadata={id:'active',dictionaryId:'old',title:'JMdict Spanish',revision:'old',count:12000,status:'ready',updatedAt:''};
describe('JMdict download installation',()=>{
  const importer={import:vi.fn()};
  beforeEach(()=>{
    importer.import.mockReset();
    TestBed.configureTestingModule({providers:[
      {provide:DictionaryRepository,useValue:{cleanup:vi.fn().mockResolvedValue(undefined),ready:vi.fn().mockResolvedValue(previous)}},
      {provide:YomitanDictionaryImporter,useValue:importer},
      {provide:TranslationService,useValue:{t:(key:string)=>key,language:()=> 'es'}},
    ]});
  });
  afterEach(()=>{document.querySelector('base[data-dictionary-test]')?.remove();vi.unstubAllGlobals();});
  it('downloads the official ZIP and passes its Blob and progress to the existing importer',async()=>{
    const fetchMock=vi.fn().mockResolvedValue(new Response(new Uint8Array([1,2,3]),{headers:{'Content-Length':'3'}}));vi.stubGlobal('fetch',fetchMock);
    const installed={...previous,dictionaryId:'new',count:3};importer.import.mockImplementation(async(_blob:Blob,progress:(count:number)=>void)=>{progress(3);return installed;});
    const fixture=TestBed.createComponent(DictionaryInstallComponent);await fixture.componentInstance.download();
    expect(fetchMock).toHaveBeenCalledWith(new URL(JMDICT_DOWNLOAD_URL,document.baseURI).href,{signal:expect.any(AbortSignal)});
    const blob=importer.import.mock.calls[0][0] as Blob;expect(blob).toBeInstanceOf(Blob);expect(blob.size).toBe(3);expect(fixture.componentInstance.percent()).toBe(100);expect(fixture.componentInstance.count()).toBe(3);expect(fixture.componentInstance.ready()).toEqual(installed);
  });
  it.each(['http://localhost:4200/','https://carlospuyana.github.io/kana-study/'])('resolves the asset against the application base URI %s',async(baseURI)=>{
    const base=document.createElement('base');base.setAttribute('data-dictionary-test','');base.href=baseURI;document.head.prepend(base);
    const fetchMock=vi.fn().mockResolvedValue(new Response(new Uint8Array([1])));vi.stubGlobal('fetch',fetchMock);importer.import.mockResolvedValue(previous);
    const fixture=TestBed.createComponent(DictionaryInstallComponent);await fixture.componentInstance.download();
    const requested=fetchMock.mock.calls[0][0] as string;expect(requested).toBe(baseURI+'dictionaries/JMdict_spanish.zip');expect(new URL(requested).origin).toBe(new URL(document.baseURI).origin);expect(importer.import).toHaveBeenCalledOnce();
  });
  it('shows an HTTP error and preserves the installed dictionary and manual fallback',async()=>{
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(null,{status:503})));
    const fixture=TestBed.createComponent(DictionaryInstallComponent);fixture.detectChanges();await fixture.whenStable();await fixture.componentInstance.download();fixture.detectChanges();
    expect(importer.import).not.toHaveBeenCalled();expect(fixture.componentInstance.ready()).toEqual(previous);expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('dictionary.downloadError');expect(fixture.nativeElement.querySelector('input[type="file"]').disabled).toBe(false);
  });
  it('updates through the same importer, keeping the previous installation if import fails',async()=>{
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(new Uint8Array([1]))));importer.import.mockRejectedValue(new Error('Invalid ZIP'));
    const fixture=TestBed.createComponent(DictionaryInstallComponent);await fixture.componentInstance.ngOnInit();fixture.detectChanges();expect(fixture.nativeElement.querySelector('button').textContent).toContain('dictionary.update');
    await fixture.componentInstance.download();expect(importer.import).toHaveBeenCalledOnce();expect(fixture.componentInstance.ready()).toEqual(previous);expect(fixture.componentInstance.error()).toBe('import');expect(fixture.componentInstance.percent()).toBeNull();
  });
  it('aborts an unfinished download when the component is destroyed',async()=>{
    let signal:AbortSignal|undefined;
    vi.stubGlobal('fetch',vi.fn((_url:string,options:RequestInit)=>new Promise((_resolve,reject)=>{signal=options.signal as AbortSignal;signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')));}))); 
    const fixture=TestBed.createComponent(DictionaryInstallComponent);const pending=fixture.componentInstance.download();fixture.destroy();await pending;
    expect(signal?.aborted).toBe(true);expect(importer.import).not.toHaveBeenCalled();
  });
});
