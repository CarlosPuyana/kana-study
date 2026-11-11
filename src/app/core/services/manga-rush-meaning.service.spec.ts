import {TestBed} from '@angular/core/testing';
import {MangaRushMeaningService} from './manga-rush-meaning.service';
import {MANGA_ASSISTANT_ENDPOINT} from './manga-context.service';
import {WorkspaceService} from './workspace.service';
import {MangaRushMeaningRequest} from '../models/manga-rush.model';
describe('Manga RUSH explicit translate adapter and scoped cache',()=>{
  let service:MangaRushMeaningService,fetcher:ReturnType<typeof vi.fn>;
  const request=():MangaRushMeaningRequest=>({lexicalKey:'word',location:{volumeId:'v1',pageIndex:0,blockIndex:0},request:{selectedText:'いる',selectedExpression:'いる',contextText:'ここにいる。',targetLanguage:'es'}});
  beforeEach(()=>{TestBed.resetTestingModule();localStorage.clear();fetcher=vi.fn(async()=>({ok:true,text:async()=>JSON.stringify({natural:'estar aquí',notes:['También puede tener otro uso.']})}));vi.stubGlobal('fetch',fetcher);
    TestBed.configureTestingModule({providers:[MangaRushMeaningService,{provide:MANGA_ASSISTANT_ENDPOINT,useValue:'https://assistant.test/assist'}]});service=TestBed.inject(MangaRushMeaningService);});
  afterEach(()=>{TestBed.resetTestingModule();vi.unstubAllGlobals();localStorage.clear();});
  it('does nothing on creation; explicit translate sends bounded text only and reuses scoped cache',async()=>{
    expect(fetcher).not.toHaveBeenCalled();const result=await service.resolve(request(),new AbortController().signal);
    expect(result.notes).toHaveLength(1);expect(result.kind).toBe('contextual');
    const body=JSON.parse(fetcher.mock.calls[0][1].body);expect(body.mode).toBe('translate');expect(body.request.selectedText).toBe('いる');expect(body.request.contextText).toBe('ここにいる。');
    await service.resolve(request(),new AbortController().signal);expect(fetcher).toHaveBeenCalledTimes(1);
    const keys=Object.keys(localStorage).filter(k=>k.includes('manga-context'));expect(keys).toEqual(['kana-study-manga-context-v1.rush.guest']);
    const other=request();other.location.volumeId='v2';await service.resolve(other,new AbortController().signal);expect(fetcher).toHaveBeenCalledTimes(2);
    const lang=request();lang.request.targetLanguage='ca';await service.resolve(lang,new AbortController().signal);expect(fetcher).toHaveBeenCalledTimes(3);
    TestBed.inject(WorkspaceService).activateUser('other');await service.resolve(request(),new AbortController().signal);expect(fetcher).toHaveBeenCalledTimes(4);
  });
  it('does not retry failures or cache stale results after card/workspace cancellation',async()=>{
    fetcher.mockResolvedValueOnce({ok:false});await expect(service.resolve(request(),new AbortController().signal)).rejects.toThrow();expect(fetcher).toHaveBeenCalledTimes(1);
    let finish!:(v:unknown)=>void;fetcher.mockImplementationOnce(()=>new Promise(resolve=>finish=resolve));let current=true;const input=request();input.isCurrent=()=>current;
    const pending=service.resolve(input,new AbortController().signal);current=false;finish({ok:true,text:async()=>JSON.stringify({natural:'stale'})});await expect(pending).rejects.toThrow('stale');
    expect(Object.keys(localStorage).some(k=>k.includes('manga-context'))).toBe(false);
  });
  it('reports an unconfigured endpoint without a request',()=>{
    TestBed.resetTestingModule();TestBed.configureTestingModule({providers:[MangaRushMeaningService,{provide:MANGA_ASSISTANT_ENDPOINT,useValue:null}]});expect(TestBed.inject(MangaRushMeaningService).available).toBe(false);expect(fetcher).not.toHaveBeenCalled();
  });
  it('ignores a completed response after workspace changes even if transport ignores cancellation',async()=>{
    let finish!:(v:unknown)=>void;fetcher.mockImplementationOnce(()=>new Promise(resolve=>finish=resolve));
    const pending=service.resolve(request(),new AbortController().signal);TestBed.inject(WorkspaceService).activateUser('different');
    finish({ok:true,text:async()=>JSON.stringify({natural:'old workspace'})});await expect(pending).rejects.toThrow('stale');
    expect(Object.keys(localStorage).filter(k=>k.includes('manga-context'))).toEqual([]);
  });
});
