import {TestBed} from '@angular/core/testing';
import {KAISHI_STATIC_VERSION,KAISHI_WITHHELD_SENTENCE} from '../models/kaishi-static-media.model';
import {KaishiStaticMediaService,kaishiCardKey,parseKaishiCard,parseKaishiCatalog} from './kaishi-static-media.service';
const catalog={schemaVersion:1,version:KAISHI_STATIC_VERSION,publication:'ready',dataset:'test'} as const;
const bytes=new Uint8Array([1,2,3]);let ref:{path:string;type:string;bytes:number};
const json=(value:unknown)=>new Response(JSON.stringify(value));
describe('Kaishi AUTO same-origin versioned static resources',()=>{
 let service:KaishiStaticMediaService;const fetcher=vi.fn();
 beforeEach(async()=>{TestBed.resetTestingModule();vi.stubGlobal('fetch',fetcher);fetcher.mockReset();vi.spyOn(document,'baseURI','get').mockReturnValue('https://example.test/kana-study/');service=TestBed.inject(KaishiStaticMediaService);
  const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-1',bytes)),n=>n.toString(16).padStart(2,'0')).join('');ref={path:'resources/'+digest+'.png',type:'image/png',bytes:3};});
 afterEach(()=>{TestBed.resetTestingModule();vi.restoreAllMocks();vi.unstubAllGlobals();});
 it('does not fetch on construction, reuses catalog and loads only the requested card under the Pages base',async()=>{
  expect(fetcher).not.toHaveBeenCalled();fetcher.mockImplementation(async(url:URL)=>url.pathname.endsWith('/catalog.json')?json(catalog):json({schemaVersion:1,version:KAISHI_STATIC_VERSION,entryId:'unsafe/id?&',resources:{picture:ref}}));
  await service.card('unsafe/id?&',new AbortController().signal);await service.card('unsafe/id?&',new AbortController().signal);
  expect(fetcher).toHaveBeenCalledTimes(3);const paths=fetcher.mock.calls.map(c=>String(c[0]));expect(paths[1]).toBe('https://example.test/kana-study/assets/kaishi/'+KAISHI_STATIC_VERSION+'/cards/'+await kaishiCardKey('unsafe/id?&')+'.json');expect(paths.every(p=>p.startsWith('https://example.test/kana-study/'))).toBe(true);
 });
 it('a blocked publication never requests descriptors or media',async()=>{
  fetcher.mockResolvedValue(json({...catalog,publication:'blocked',dataset:'kaishi'}));expect((await service.card('id',new AbortController().signal)).card).toBeNull();expect(fetcher).toHaveBeenCalledTimes(1);
 });
 it('rejects version mixtures, unsafe paths, unsupported kinds/types and withheld sentence audio',()=>{
  const card={schemaVersion:1,version:KAISHI_STATIC_VERSION,entryId:'id',resources:{picture:ref}};
  expect(parseKaishiCard(card,'id',catalog)).toEqual(card);
  for(const patch of [{version:'other'},{entryId:'different'},{resources:{picture:{...ref,path:'https://invalid.test/a.png'}}},{resources:{picture:{...ref,path:'resources/../a.png'}}},{resources:{other:ref}},{resources:{picture:{...ref,bytes:524289}}},{resources:{picture:{...ref,type:'text/html'}}}])expect(()=>parseKaishiCard({...card,...patch},'id',catalog)).toThrow();
  expect(()=>parseKaishiCard({...card,entryId:KAISHI_WITHHELD_SENTENCE,resources:{sentenceAudio:{...ref,path:'resources/'+'a'.repeat(40)+'.mp3',type:'audio/mpeg'}}},KAISHI_WITHHELD_SENTENCE,catalog)).toThrow();
  expect(()=>parseKaishiCatalog({...catalog,version:'future'})).toThrow();
 });
 it('verifies resource size/hash, uses HTTP cache, and rejects truncated/corrupt/oversized bodies',async()=>{
  fetcher.mockResolvedValue(new Response(bytes));expect((await service.resource(ref,new AbortController().signal)).size).toBe(3);expect(fetcher.mock.calls[0][1].cache).toBe('default');
  for(const body of [new Uint8Array([1,2]),new Uint8Array([3,2,1]),new Uint8Array([1,2,3,4])]){fetcher.mockResolvedValue(new Response(body));await expect(service.resource(ref,new AbortController().signal)).rejects.toThrow();}
 });
 it('validates decoded bytes when HTTP encoding changes transfer Content-Length and refuses redirects',async()=>{
  fetcher.mockResolvedValue(new Response(bytes,{headers:{'content-length':'1','content-encoding':'gzip'}}));
  expect((await service.resource(ref,new AbortController().signal)).size).toBe(3);expect(fetcher.mock.calls[0][1].redirect).toBe('error');
 });
 it('retries network failure explicitly and stops old card requests after cancellation',async()=>{
  fetcher.mockRejectedValueOnce(new Error('offline'));await expect(service.card('id',new AbortController().signal)).rejects.toThrow();
  fetcher.mockResolvedValue(json({...catalog,publication:'blocked'}));await service.card('id',new AbortController().signal,true);expect(fetcher.mock.calls[1][1].cache).toBe('reload');
  const aborted=new AbortController();aborted.abort();await expect(service.card('other',aborted.signal)).rejects.toThrow();expect(fetcher).toHaveBeenCalledTimes(2);
 });
});
