import { TestBed } from '@angular/core/testing';
import { IDBFactory } from 'fake-indexeddb';
import { findLiteralOcr, explorationCounts, OCR_SEARCH_LIMITS, OcrExploration } from './manga-ocr-text';
import { MangaOcrExplorerService } from './manga-ocr-explorer.service';
import { MangaOcrSourceService, OcrSource } from './manga-ocr-source.service';
import { MangaRepository } from './manga.repository';
import { WorkspaceService } from './workspace.service';
import { MokuroPage } from '../models/manga.model';
import { LocalMangaCatalogService } from './local-manga-catalog.service';

function page(...lines:string[]):MokuroPage{return {img_path:'synthetic.svg',img_width:100,img_height:100,
  blocks:[{box:[0,0,100,100],vertical:false,font_size:20,lines,lines_coords:lines.map(()=>[[0,0],[100,0],[100,100],[0,100]])}]};}
describe('Literal OCR: original UTF-16 sequences, no lexical identity',()=>{
  it('finds one exact match with a checked original range',()=>{const found=findLiteralOcr(page('猫がいる。'),'猫').matches[0];expect(found).toMatchObject({start:0,end:1,found:'猫',fragment:'猫がいる。',blockIndex:0,lineIndex:0});});
  it('keeps repeated, overlapping and substring matches distinct',()=>{
    expect(findLiteralOcr(page('生生生、学生、生ビール'),'生生').matches.map(m=>m.start)).toEqual([0,1]);
    expect(findLiteralOcr(page('学生、生ビール、人生'),'生').matches).toHaveLength(3);
  });
  it('does not equate homographs or infer their meanings',()=>{
    const found=findLiteralOcr(page('生ビール','生きる','学生'),'生');expect(found.matches.map(m=>m.lineIndex)).toEqual([0,1,2]);
    expect(found.matches.every(m=>!('lexicalIdentity' in m)&&!('meaning' in m))).toBe(true);
  });
  it('uses UTF-16 offsets including supplementary Japanese characters',()=>{
    const text='𠮷と𠮷野家';const matches=findLiteralOcr(page(text),'𠮷').matches;
    expect(matches.map(m=>[m.start,m.end])).toEqual([[0,2],[3,5]]);for(const m of matches)expect(text.slice(m.start,m.end)).toBe(m.found);
  });
  it('never normalizes or joins lines, preserving original offsets',()=>{
    const text='カ\u3099とガ';expect(findLiteralOcr(page(text),'ガ').matches.map(m=>m.start)).toEqual([3]);
    expect(findLiteralOcr(page(text),'カ\u3099').matches[0]).toMatchObject({start:0,end:2});
    expect(findLiteralOcr(page('学','校'),'学校').matches).toEqual([]);
  });
  it('caps results and rejects oversized lines or malformed OCR without inventing zero',()=>{
    expect(findLiteralOcr(page('猫猫猫'),'猫',2)).toMatchObject({limited:true,matches:expect.any(Array)});
    expect(()=>findLiteralOcr(page('猫'.repeat(OCR_SEARCH_LIMITS.lineUnits+1)),'猫')).toThrow('limit');
    expect(()=>findLiteralOcr({blocks:[{lines:[null]}]} as never,'猫')).toThrow('invalid-ocr');
  });
});

describe('Incremental OCR exploration and source verification',()=>{
  let explorer:MangaOcrExplorerService,workspace:WorkspaceService,source:OcrSource;
  const gateway={open:vi.fn()};
  beforeEach(()=>{TestBed.resetTestingModule();localStorage.clear();source={pageCount:2,stamp:'v1',read:vi.fn(async()=>({ocr:page('猫'),imageBytes:1024}))};
    gateway.open.mockReset().mockImplementation(async()=>source);TestBed.configureTestingModule({providers:[{provide:MangaOcrSourceService,useValue:gateway}]});
    explorer=TestBed.inject(MangaOcrExplorerService);workspace=TestBed.inject(WorkspaceService);});
  afterEach(()=>{TestBed.resetTestingModule();vi.restoreAllMocks();});
  const scan=(controller=new AbortController(),publish:((r:OcrExploration)=>void)|undefined=undefined,previous?:string)=>explorer.scan('volume','猫',controller.signal,publish,previous);
  it('explores pages incrementally, verifies hashes and records volume/page/line anchors',async()=>{
    const seen:OcrExploration[]=[];const result=await scan(undefined,r=>seen.push(r));
    expect(result.status).toBe('complete');expect(result.fingerprint).toMatch(/^[a-f0-9]{64}$/);expect(result.matches.map(m=>m.pageIndex)).toEqual([0,1]);
    expect(result.matches[0]).toMatchObject({volumeId:'volume',start:0,end:1,found:'猫',pageFingerprint:expect.stringMatching(/^[a-f0-9]{64}$/)});
    expect(seen.some(r=>r.pages.length===1&&explorationCounts(r).pending===1&&r.status==='scanning')).toBe(true);
    expect(source.read).toHaveBeenCalledTimes(4);expect(result.logicalImageBytesRead).toBe(4096);
  });
  it('keeps missing pages and malformed OCR partial, with explicit reasons and no global zero',async()=>{
    source={...source,pageCount:3,read:vi.fn(async i=>i===0?{ocr:page('犬'),imageBytes:0}:i===1?null:{ocr:{blocks:[{lines:null}]} as never,imageBytes:0})};
    const result=await scan();expect(result.status).toBe('partial');expect(result.matches).toEqual([]);
    expect(result.pages.map(p=>p.state)).toEqual(['examined','missing-page','invalid-ocr']);expect(result.reason).toBe('invalid-ocr');
  });
  it('distinguishes no OCR, deleted manga, source failure and a reimport ID',async()=>{
    source={...source,read:async()=>({ocr:page(),imageBytes:0})};expect((await scan()).status).toBe('no-ocr');
    gateway.open.mockResolvedValueOnce(null);expect((await scan()).status).toBe('deleted');
    gateway.open.mockRejectedValueOnce(Error('unavailable'));expect((await scan()).status).toBe('failed');
    await explorer.scan('different-id','猫',new AbortController().signal);expect(gateway.open.mock.calls.at(-1)?.[0]).toBe('different-id');
  });
  it.each(['猫','犬'])('cancels without waits and keeps only the examined subset (%s)',async(text)=>{
    source={...source,pageCount:100,read:vi.fn(async()=>({ocr:page(text),imageBytes:0}))};const controller=new AbortController();
    const result=await scan(controller,r=>{if(r.pages.length===1)controller.abort();});
    expect(result.status).toBe('cancelled');expect(result.matches).toHaveLength(text==='猫'?1:0);expect(explorationCounts(result).pending).toBe(99);
    expect(source.read).toHaveBeenCalledTimes(1);
  });
  it('drops A-B-A results instead of returning the previous owner capture',async()=>{
    source={...source,read:async()=>{workspace.activateUser('other');workspace.activateGuest();return {ocr:page('猫'),imageBytes:0};}};
    const seen:OcrExploration[]=[];await expect(scan(undefined,r=>seen.push(r))).rejects.toThrow('workspace-changed');expect(seen.every(r=>r.matches.length===0)).toBe(true);
  });
  it('detects OCR-only changes even when volume metadata is unchanged',async()=>{
    let reads=0;source={...source,read:async()=>({ocr:page(++reads>2?'犬':'猫'),imageBytes:0})};
    const result=await scan();expect(result.status).toBe('changed');expect(result.reason).toBe('source-changed');expect(result.fingerprint).toBeNull();
  });
  it('compares a previous fingerprint on explicit verification',async()=>{
    const original=await scan();source={...source,read:async()=>({ocr:page('犬'),imageBytes:0})};
    expect((await scan(undefined,undefined,original.fingerprint!)).status).toBe('changed');
  });
  it('does not silently treat result/page limits as complete',async()=>{
    source={...source,read:async()=>({ocr:page('猫'.repeat(501)),imageBytes:0})};const result=await scan();
    expect(result.status).toBe('partial');expect(result.matches).toHaveLength(500);expect(result.reason).toBe('limit');expect(explorationCounts(result).pending).toBe(1);
  });
  it('reports metadata changes and deletion during verification',async()=>{
    gateway.open.mockImplementationOnce(async()=>source).mockImplementationOnce(async()=>({...source,stamp:'new'}));expect((await scan()).status).toBe('changed');
    gateway.open.mockImplementationOnce(async()=>source).mockResolvedValueOnce(null);expect(await scan()).toMatchObject({status:'deleted',matches:[]});
  });
});

describe('OCR source reads real imported storage without decoding or study writes',()=>{
  beforeEach(()=>{TestBed.resetTestingModule();localStorage.clear();vi.stubGlobal('indexedDB',new IDBFactory());});
  afterEach(()=>{TestBed.resetTestingModule();vi.unstubAllGlobals();vi.restoreAllMocks();});
  it('projects one stored OCR page, counts the co-stored Blob and never writes on lookup',async()=>{
    // fake-indexeddb uses Node structuredClone; a jsdom Blob loses its internals there.
    const NativeBlob=(globalThis as unknown as {process:{getBuiltinModule:(m:string)=>{Blob:typeof Blob}}}).process.getBuiltinModule('buffer').Blob;
    const repo=TestBed.inject(MangaRepository);await repo.put('volumes',{id:'imported',title:'QA',seriesTitle:'QA',complete:true,pageCount:1,storageBytes:10,createdAt:'2026-10-23',updatedAt:'2026-10-23',mokuro:{version:'0.2.0',title:'QA',volume:'1'}});
    await repo.put('pages',{volumeId:'imported',pageIndex:0,ocr:page('猫'),image:new NativeBlob(['synthetic'])});
    const write=vi.spyOn(repo,'put'),source=await TestBed.inject(MangaOcrSourceService).open('imported','guest',new AbortController().signal);
    expect(await source!.read(0)).toEqual({ocr:page('猫'),imageBytes:9});expect(write).not.toHaveBeenCalled();
  });
  it('uses a Japanese OCR-only catalog API without requesting images',async()=>{
    const catalog=TestBed.inject(LocalMangaCatalogService);vi.spyOn(catalog,'volume').mockResolvedValue({id:'catalog:qa',title:'QA',seriesTitle:'QA',pageCount:1,complete:true});
    vi.spyOn(catalog,'ocrDocument').mockResolvedValue({version:'0.2.0',title:'QA',volume:'1',pages:[page('猫')]});const images=vi.spyOn(catalog,'page');
    const source=await TestBed.inject(MangaOcrSourceService).open('catalog:qa','guest',new AbortController().signal);expect((await source!.read(0))?.imageBytes).toBe(0);expect(images).not.toHaveBeenCalled();
  });
});
