// Synthetic acceptance volume only: never creates cards or touches browser storage.
import fs from 'node:fs/promises';
import {deflateSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {ZipWriter,Uint8ArrayWriter,Uint8ArrayReader,TextReader} from '@zip.js/zip.js';
const width=800,height=600,raw=Buffer.alloc((width*3+1)*height,255);
for(let y=0;y<height;y++)raw[y*(width*3+1)]=0;
function chunk(type,data){const t=Buffer.from(type),input=Buffer.concat([t,data]);let crc=0xffffffff;for(const b of input){crc^=b;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}const length=Buffer.alloc(4),sum=Buffer.alloc(4);length.writeUInt32BE(data.length);sum.writeUInt32BE((crc^0xffffffff)>>>0);return Buffer.concat([length,input,sum]);}
const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(width);ihdr.writeUInt32BE(height,4);ihdr[8]=8;ihdr[9]=2;
const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);
const text='大丈夫、大丈夫。猫がいる。',title='Release 3 acceptance (synthetic)',ocr={version:'0.2.0',title:'Kana Study test fixture',volume:title,pages:[{img_path:'001.png',img_width:width,img_height:height,blocks:[{box:[40,80,760,140],vertical:false,font_size:32,lines:[text],lines_coords:[[[40,80],[760,80],[760,140],[40,140]]]}]}]};
const zip=new ZipWriter(new Uint8ArrayWriter()),options={useWebWorkers:false,lastModDate:new Date('2026-10-26T00:00:00Z')};
await zip.add('001.png',new Uint8ArrayReader(png),options);await zip.add('acceptance.mokuro',new TextReader(JSON.stringify(ocr)),options);const bytes=await zip.close();
await fs.mkdir('.cache',{recursive:true});const file='.cache/release3-manual-volume.cbz';await fs.writeFile(file,bytes);const result={file,title,text,pages:1,synthetic:true,createsCards:false,sha256:createHash('sha256').update(bytes).digest('hex')};await fs.writeFile('.cache/release3-manual-fixture.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
