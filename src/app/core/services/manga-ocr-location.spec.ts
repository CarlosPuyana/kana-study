import { MokuroPage } from '../models/manga.model';
import { MangaOcrOccurrence } from '../models/manga-ocr-occurrence.model';
import { locateOcrOccurrence, parseOcrOccurrence } from './manga-ocr-location';
import { ocrDigest } from './manga-ocr-text';

function page(text='𠮷と生生生。'):MokuroPage{return {img_path:'synthetic',img_width:100,img_height:200,blocks:[
  {box:[0,0,100,100],vertical:false,font_size:20,lines:['別の行',text],lines_coords:[[[0,0],[100,0],[100,40],[0,40]],[[0,50],[100,50],[100,100],[0,100]]]},
  {box:[0,110,100,200],vertical:true,font_size:20,lines:['生徒'],lines_coords:[[[0,110],[100,110],[100,200],[0,200]]]}]};}
async function ref(p:MokuroPage,start=3,end=5):Promise<MangaOcrOccurrence>{return {schemaVersion:1,volumeId:'vol',pageIndex:1,blockIndex:0,lineIndex:1,start,end,found:p.blocks[0].lines[1].slice(start,end),pageFingerprint:await ocrDigest(JSON.stringify(p)),workspace:'guest',activationRevision:0};}
const locate=(r:unknown,p:MokuroPage,fresh=p)=>locateOcrOccurrence(r,'vol',1,'guest',0,fresh,p);
describe('Versioned OCR navigation: local textual evidence only',()=>{
  it('validates exact UTF-16 evidence in a specified line without touching OCR',async()=>{
    const p=page(),before=structuredClone(p),r=await ref(p,0,2);expect(await locate(r,p)).toEqual({status:'line',reference:r,fragment:'𠮷と生生生。'});expect(p).toEqual(before);
  });
  it('retains overlapping ranges and substrings without treating them as lexical identities',async()=>{
    const p=page(),a=await ref(p,3,5),b=await ref(p,4,6);
    expect(await locate(a,p)).toMatchObject({status:'line',reference:{start:3,end:5,found:'生生'}});
    expect(await locate(b,p)).toMatchObject({status:'line',reference:{start:4,end:6,found:'生生'}});
    const c={...a,blockIndex:1,lineIndex:0,start:0,end:1,found:'生'};expect(await locate(c,p)).toMatchObject({status:'line',fragment:'生徒'});
  });
  it.each([{schemaVersion:2},{start:-1},{start:.5},{end:9999},{pageIndex:NaN},{found:''},{pageFingerprint:'short'},{captureFingerprint:'bad'},{LexicalIdentity:'injected'},{gloss:'not allowed'},{found:'\udc00',start:0,end:1}])('rejects manipulated or incompatible fields %j',async(patch)=>{
    const p=page(),r={...await ref(p),...patch};expect(parseOcrOccurrence(r)).toBeNull();expect(await locate(r,p)).toEqual({status:'unavailable'});
  });
  it('rejects other volumes, pages, accounts and activations without searching elsewhere',async()=>{
    const p=page(),r=await ref(p);
    for(const patch of [{volumeId:'reimport'},{pageIndex:2},{workspace:'user:other'},{activationRevision:2}])expect(await locate({...r,...patch},p)).toEqual({status:'unavailable'});
  });
  it('rejects the wrong offsets even if the same sequence occurs elsewhere',async()=>{
    const p=page(),r=await ref(p);expect(await locate({...r,start:2,end:4},p)).toEqual({status:'unavailable'});
    expect(await locate({...r,blockIndex:8},p)).toEqual({status:'unavailable'});
    expect(await locate({...r,lineIndex:8},p)).toEqual({status:'unavailable'});
  });
  it('discards stale OCR even when volume metadata has not changed',async()=>{
    const old=page(),r=await ref(old),fresh=page('𠮷と生生生、追記');expect(await locate(r,old,fresh)).toEqual({status:'stale'});
    expect(await locate({...r,pageFingerprint:await ocrDigest(JSON.stringify(fresh))},old,fresh)).toEqual({status:'stale'});
  });
  it('falls back to verified textual context when image geometry is unavailable',async()=>{
    const p=page();p.blocks[0].lines_coords=[];expect(await locate(await ref(p),p)).toMatchObject({status:'text',fragment:'𠮷と生生生。'});
  });
  it('supports a missing source without manufacturing a location',async()=>{
    const p=page();expect(await locateOcrOccurrence(await ref(p),'vol',1,'guest',0,null,p)).toEqual({status:'unavailable'});
  });
  it('checks the lifecycle fence after asynchronous hashing',async()=>{
    const p=page(),r=await ref(p);let checks=0;
    await expect(locateOcrOccurrence(r,'vol',1,'guest',0,p,p,()=>{if(++checks>1)throw Error('obsolete');})).rejects.toThrow('obsolete');
  });
});
