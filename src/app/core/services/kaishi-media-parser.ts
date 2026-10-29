import { Decompress } from 'fzstd';
import { KAISHI_PACKAGE, KAISHI_RESOURCE_LIMIT, KaishiMediaError, KaishiReference } from '../models/kaishi-media.model';
export function hex(bytes:ArrayBuffer):string{return Array.from(new Uint8Array(bytes),n=>n.toString(16).padStart(2,'0')).join('');}
export async function verifyKaishiPackage(file:Blob):Promise<void>{
  if(file.size!==KAISHI_PACKAGE.bytes)throw new KaishiMediaError('package');
  if(hex(await crypto.subtle.digest('SHA-256',await file.arrayBuffer()))!==KAISHI_PACKAGE.sha256)throw new KaishiMediaError('package');
}
export function validateKaishiInventory(entries:readonly {filename:string;directory?:boolean;encrypted?:boolean;uncompressedSize:number;compressionMethod?:number}[]):void{
  const names=new Set(entries.map(e=>e.filename));
  if(entries.length!==4358||names.size!==entries.length||!['meta','media','collection.anki21b','collection.anki2'].every(n=>names.has(n))
    ||entries.some(e=>e.directory||e.encrypted||e.compressionMethod!==0||e.uncompressedSize<0||e.uncompressedSize>1048576||!(/^(?:0|[1-9]\d{0,3})$/.test(e.filename)||['meta','media','collection.anki21b','collection.anki2'].includes(e.filename))))throw new KaishiMediaError('format');
  for(let i=0;i<4354;i++)if(!names.has(String(i)))throw new KaishiMediaError('format');
}
export async function decodeKaishiResource(data:Uint8Array,ref:KaishiReference,type:KaishiReference[3]):Promise<Blob>{
  const expected=ref[1];
  if(!Number.isSafeInteger(expected)||expected<1||expected>KAISHI_RESOURCE_LIMIT||data.length>1048576||data.length<9||data[0]!==0x28||data[1]!==0xb5||data[2]!==0x2f||data[3]!==0xfd)throw new KaishiMediaError('resource');
  // The pinned package uses non-single-segment frames with a 2 MiB window.
  // Reject larger windows before the decoder allocates, and disallow other frame layouts.
  if(data[4]!==0||2**(10+(data[5]>>3))*(1+(data[5]&7)/8)>8*1024*1024)throw new KaishiMediaError('resource');
  // Only one complete non-checksummed frame: reject truncation/concatenated frames
  // before a later frame could request a different allocation window.
  let cursor=6,last=false;
  while(!last){if(cursor+3>data.length)throw new KaishiMediaError('resource');
    const block=data[cursor]|data[cursor+1]<<8|data[cursor+2]<<16;cursor+=3;
    const kind=(block>>1)&3,size=block>>3;last=!!(block&1);
    if(kind===3||size>131072)throw new KaishiMediaError('resource');cursor+=kind===1?1:size;
    if(cursor>data.length)throw new KaishiMediaError('resource');
  }
  if(cursor!==data.length)throw new KaishiMediaError('resource');
  const output=new Uint8Array(expected);let offset=0;
  try{new Decompress(chunk=>{if(offset+chunk.length>expected)throw new KaishiMediaError('resource');output.set(chunk,offset);offset+=chunk.length;}).push(data,true);}catch{throw new KaishiMediaError('resource');}
  if(offset!==expected||hex(await crypto.subtle.digest('SHA-1',output))!==ref[2])throw new KaishiMediaError('resource');
  const text=new TextDecoder('ascii');
  const valid=type==='image/webp'?text.decode(output.subarray(0,4))==='RIFF'&&text.decode(output.subarray(8,12))==='WEBP'
    :type==='image/png'?[137,80,78,71,13,10,26,10].every((n,i)=>output[i]===n)
    :type==='image/jpeg'?output[0]===255&&output[1]===216&&output[2]===255
    :text.decode(output.subarray(0,3))==='ID3'||output[0]===255&&(output[1]&224)===224;
  if(!valid)throw new KaishiMediaError('resource');
  return new Blob([output],{type});
}
