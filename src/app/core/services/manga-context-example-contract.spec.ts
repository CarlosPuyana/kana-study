import {TestBed} from '@angular/core/testing';
import {MANGA_ASSISTANT_ENDPOINT,MangaContextService} from './manga-context.service';

const context='大丈夫、大丈夫。一緒に行こう。';
const location={volumeId:'test-volume',pageIndex:1,blockIndex:0};
describe('existing Manga translation API: isolated example contract',()=>{
  beforeEach(()=>{TestBed.resetTestingModule();localStorage.clear();TestBed.configureTestingModule({providers:[
    {provide:MANGA_ASSISTANT_ENDPOINT,useValue:'https://assistant.invalid/assist'}]});});
  afterEach(()=>{TestBed.resetTestingModule();localStorage.clear();vi.unstubAllGlobals();});
  const result={natural:'Tranquilo, tranquilo. Vamos juntos.',notes:['Sugerencia controlada de prueba, no inferencia real.']};
  it('only an explicit request sends the FULL original context, without word-only hints, page, images or IDs',async()=>{
    const fetch=vi.fn(async()=>new Response(JSON.stringify(result)));vi.stubGlobal('fetch',fetch);
    const service=TestBed.inject(MangaContextService);expect(fetch).not.toHaveBeenCalled();
    const answer=await service.request('translate',{selectedText:context,targetLanguage:'es'},location,new AbortController().signal);
    expect(answer).toEqual(result);expect(fetch).toHaveBeenCalledTimes(1);
    const options=fetch.mock.calls[0] as unknown as [string,RequestInit];
    expect(JSON.parse(options[1].body as string)).toEqual({schemaVersion:1,mode:'translate',request:{selectedText:context,targetLanguage:'es'}});
    expect(options[1].credentials).toBe('omit');
  });
  it('reuses only the exact current request key, and not another phrase containing the same word',async()=>{
    const fetch=vi.fn(async()=>new Response(JSON.stringify(result)));vi.stubGlobal('fetch',fetch);
    const service=TestBed.inject(MangaContextService),ask=(text:string)=>service.request('translate',{selectedText:text,targetLanguage:'es'},location,new AbortController().signal);
    await ask(context);await ask(context);expect(fetch).toHaveBeenCalledTimes(1);
    await ask('大丈夫。');expect(fetch).toHaveBeenCalledTimes(2);
  });
  it.each(['','  ','\n\t'])('rejects an empty/whitespace-only AI answer instead of caching it: %j',async natural=>{
    vi.stubGlobal('fetch',vi.fn(async()=>new Response(JSON.stringify({natural}))));
    await expect(TestBed.inject(MangaContextService).request('translate',{selectedText:context,targetLanguage:'es'},location,new AbortController().signal)).rejects.toThrow('invalid');
    expect(localStorage.getItem('kana-study-manga-context-v1')).toBeNull();
  });
  it('rejects malformed JSON and does not add it to the cache',async()=>{
    vi.stubGlobal('fetch',vi.fn(async()=>new Response('not JSON')));
    await expect(TestBed.inject(MangaContextService).request('translate',{selectedText:context,targetLanguage:'es'},location,new AbortController().signal)).rejects.toThrow();
    expect(localStorage.getItem('kana-study-manga-context-v1')).toBeNull();
  });
  it('does not cache a late response after cancellation',async()=>{
    let release!:(r:Response)=>void;vi.stubGlobal('fetch',vi.fn(()=>new Promise<Response>(r=>release=r)));
    const controller=new AbortController(),request=TestBed.inject(MangaContextService).request('translate',{selectedText:context,targetLanguage:'es'},location,controller.signal);
    const rejected=expect(request).rejects.toThrow();controller.abort();release(new Response(JSON.stringify(result)));await rejected;
    expect(localStorage.getItem('kana-study-manga-context-v1')).toBeNull();
  });
  it('leaves the provider unavailable when the existing local test configuration disables its endpoint',async()=>{
    TestBed.overrideProvider(MANGA_ASSISTANT_ENDPOINT,{useValue:null});const fetch=vi.fn();vi.stubGlobal('fetch',fetch);
    const service=TestBed.inject(MangaContextService);expect(service.available).toBe(false);
    await expect(service.request('translate',{selectedText:context,targetLanguage:'es'},location,new AbortController().signal)).rejects.toThrow('unavailable');
    expect(fetch).not.toHaveBeenCalled();
  });
});
