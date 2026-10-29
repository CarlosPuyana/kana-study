import {JAPANESE_1500_ENTRIES} from '../../data/japanese-1500.generated';
import {KAISHI_PACKAGE,KaishiReference} from '../models/kaishi-media.model';
import {decodeKaishiResource,hex,validateKaishiInventory,verifyKaishiPackage} from './kaishi-media-parser';
import {KAISHI_MEDIA_MANIFEST} from '../../data/kaishi-media.manifest';
const raw=new Uint8Array([73,68,51,4,0,0,0,0,0,0]);
async function sample(data=raw){const n=data.length*8+1;return {frame:new Uint8Array([0x28,0xb5,0x2f,0xfd,0,0x58,n&255,n>>8&255,n>>16,...data]),ref:['1',data.length,hex(await crypto.subtle.digest('SHA-1',data)),'audio/mpeg'] as KaishiReference};}
const inventory=()=>[...['meta','media','collection.anki21b','collection.anki2'],...Array.from({length:4354},(_,i)=>String(i))].map(filename=>({filename,uncompressedSize:10,compressionMethod:0}));
describe('Kaishi fixed package and bounded media decoding',()=>{
 it('rejects wrong size and a modified file of the expected size, without accepting another version',async()=>{
  await expect(verifyKaishiPackage(new Blob(['other']))).rejects.toMatchObject({code:'package'});
  const file=new Blob(['changed']);Object.defineProperty(file,'size',{value:KAISHI_PACKAGE.bytes});
  await expect(verifyKaishiPackage(file)).rejects.toMatchObject({code:'package'});
 });
 it('validates complete numeric inventory without paths, duplicate names, encryption or excess sizes',()=>{
  expect(()=>validateKaishiInventory(inventory())).not.toThrow();
  for(const patch of [{filename:'../1'},{filename:'1'},{encrypted:true},{uncompressedSize:1048577},{compressionMethod:8},{directory:true}]){
   const rows=inventory();rows[0]={...rows[0],...patch};expect(()=>validateKaishiInventory(rows)).toThrow();
  }expect(()=>validateKaishiInventory(inventory().slice(1))).toThrow();
 });
 it('decodes a minimal explicit Zstandard raw block and validates the resulting MP3 signature/hash',async()=>{
  const {frame,ref}=await sample(),blob=await decodeKaishiResource(frame,ref,'audio/mpeg');expect(blob.size).toBe(raw.length);expect(blob.type).toBe('audio/mpeg');
 });
 it('rejects truncation, incorrect fingerprints, type mismatch and output/window limits',async()=>{
  const {frame,ref}=await sample();
  for(const data of [frame.slice(0,-1),new Uint8Array([...frame,...frame]),new Uint8Array([1,2]),new Uint8Array([...frame.slice(0,5),255,...frame.slice(6)])])await expect(decodeKaishiResource(data,ref,'audio/mpeg')).rejects.toThrow();
  await expect(decodeKaishiResource(frame,['1',524289,ref[2],'audio/mpeg'],'audio/mpeg')).rejects.toThrow();
  await expect(decodeKaishiResource(frame,['1',2,ref[2],'audio/mpeg'],'audio/mpeg')).rejects.toThrow();
  await expect(decodeKaishiResource(frame,['1',raw.length,'0'.repeat(40),'audio/mpeg'],'audio/mpeg')).rejects.toThrow();
  await expect(decodeKaishiResource(frame,ref,'image/webp')).rejects.toThrow();
 });
 it('pins only enabled resources and explicitly excludes the unverified 永遠 sentence',()=>{
  const entries=KAISHI_MEDIA_MANIFEST as readonly {id:string;wordAudio?:KaishiReference;sentenceAudio?:KaishiReference;picture:KaishiReference}[];
  expect(entries.map(e=>e.id)).toEqual(JAPANESE_1500_ENTRIES.map(e=>e.id));expect(entries).toHaveLength(1500);expect(new Set(entries.map(e=>e.id)).size).toBe(1500);
  expect(entries.filter(e=>e.wordAudio)).toHaveLength(1499);expect(entries.filter(e=>e.sentenceAudio)).toHaveLength(1499);
  expect(entries.find(e=>e.id==='n-jp1500-en-CGA2j9S)g.')?.sentenceAudio).toBeUndefined();
  const refs=new Map(entries.flatMap(e=>[e.wordAudio,e.sentenceAudio,e.picture].filter((r):r is KaishiReference=>!!r).map(r=>[r[0],r])));
  expect(refs.size).toBe(KAISHI_PACKAGE.resources);expect([...refs.values()].reduce((n,r)=>n+r[1],0)).toBe(KAISHI_PACKAGE.unpackedBytes);
 });
});
