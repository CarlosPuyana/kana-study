// Private extraction and QA fixtures. Public resources are separately checked against recorded authorization.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import assert from 'node:assert/strict';
const version='esp-v1-3fdaef081150-r2';
const source=await fs.readFile('src/app/data/kaishi-media.manifest.ts','utf8');
const entries=JSON.parse(source.slice(source.indexOf(' = ')+3,source.lastIndexOf(' as const;')));
const fixtures=process.argv.includes('--fixtures'),root=path.resolve('.cache/kaishi-auto/'+(fixtures?'fixtures':'private'));
assert(root.startsWith(path.resolve('.cache/kaishi-auto')+path.sep));await fs.mkdir(path.join(root,'resources'),{recursive:true});await fs.mkdir(path.join(root,'cards'),{recursive:true});
const hash=(algorithm,data)=>crypto.createHash(algorithm).update(data).digest('hex');
const mimeExtension={'audio/mpeg':'mp3','audio/wav':'wav','image/webp':'webp','image/jpeg':'jpg','image/png':'png'};
const inventory=new Map();
async function save(data,type){const name=hash('sha1',data)+'.'+mimeExtension[type],resource={path:'resources/'+name,bytes:data.length,type};await fs.writeFile(path.join(root,resource.path),data);inventory.set(resource.path,resource);return resource;}
function wav(frequency,samples){const b=Buffer.alloc(44+samples*2);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(22050,24);b.writeUInt32LE(44100,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(samples*2,40);for(let i=0;i<samples;i++)b.writeInt16LE(Math.round(Math.sin(i*frequency*2*Math.PI/22050)*2500),44+i*2);return b;}
function png(reverse=false){const crc=data=>{let c=0xffffffff;for(const n of data){c^=n;for(let i=0;i<8;i++)c=c&1?0xedb88320^(c>>>1):c>>>1;}return(c^0xffffffff)>>>0;};const chunk=(type,data)=>{const t=Buffer.from(type),b=Buffer.alloc(12+data.length);b.writeUInt32BE(data.length);t.copy(b,4);data.copy(b,8);b.writeUInt32BE(crc(Buffer.concat([t,data])),8+data.length);return b;};const w=128,h=80,header=Buffer.alloc(13);header.writeUInt32BE(w);header.writeUInt32BE(h,4);header[8]=8;header[9]=2;const raw=Buffer.alloc((w*3+1)*h);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*(w*3+1)+1+x*3;raw[i]=x<64?(reverse?190:50):150;raw[i+1]=y<40?130:210;raw[i+2]=180;}return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);}
let testRefs,zip;
if(fixtures){testRefs={wordAudio:await save(wav(440,3300),'audio/wav'),sentenceAudio:await save(wav(660,22050),'audio/wav'),picture:await save(png(),'image/png'),picture2:await save(png(true),'image/png')};}
else{
 const input=process.argv[2];assert(input&&!input.startsWith('--'),'Usage: node scripts/prepare-kaishi-static-media.mjs LOCAL_APKG | --fixtures');
 const file=await fs.readFile(input);assert.equal(file.length,102049547);assert.equal(hash('sha256',file),'3fdaef081150b09e1f58be4637d261903b95a9e7d60374467d5facee5b0387df');
 const ts=await import('typescript');
 for(const [name,input] of [['kaishi-media.model','src/app/core/models/kaishi-media.model.ts'],['kaishi-media-parser','src/app/core/services/kaishi-media-parser.ts']]){
  let js=ts.transpileModule(await fs.readFile(input,'utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;js=js.replace('../models/kaishi-media.model','./kaishi-media.model.mjs');await fs.writeFile(path.join(root,name+'.mjs'),js);
 }
 const {validateKaishiInventory,decodeKaishiResource}=await import(new URL('../.cache/kaishi-auto/private/kaishi-media-parser.mjs',import.meta.url));
 const {ZipReader,BlobReader,Uint8ArrayWriter}=await import('@zip.js/zip.js');zip=new ZipReader(new BlobReader(new Blob([file])),{useWebWorkers:false});
 const list=await zip.getEntries();validateKaishiInventory(list);const byName=new Map(list.map(e=>[e.filename,e])),refs=new Map(entries.flatMap(e=>['wordAudio','sentenceAudio','picture'].flatMap(k=>e[k]?[e[k]]:[])).map(r=>[r[0],r]));
 for(const ref of refs.values()){const raw=await byName.get(ref[0]).getData(new Uint8ArrayWriter(),{checkSignature:true,useWebWorkers:false});const blob=await decodeKaishiResource(raw,ref,ref[3]);await save(Buffer.from(await blob.arrayBuffer()),ref[3]);}
 await zip.close();
}
for(const entry of entries){const resources={};for(const kind of ['wordAudio','sentenceAudio','picture'])if(entry[kind]){const ref=entry[kind];resources[kind]=fixtures?testRefs[kind==='picture'&&entry.id===entries[1].id?'picture2':kind]:{path:'resources/'+ref[2]+'.'+mimeExtension[ref[3]],bytes:ref[1],type:ref[3]};}
 await fs.writeFile(path.join(root,'cards',hash('sha256',entry.id)+'.json'),JSON.stringify({schemaVersion:1,version,entryId:entry.id,resources}));}
await fs.writeFile(path.join(root,'catalog.json'),JSON.stringify({schemaVersion:1,version,publication:fixtures?'ready':'blocked',dataset:fixtures?'test':'kaishi'}));
const totalBytes=[...inventory.values()].reduce((n,r)=>n+r.bytes,0);
const report={scope:fixtures?'original programmatic test tones/image, never Kaishi recordings':'private preparation; redistribution NOT cleared',version,cards:entries.length,uniqueFiles:inventory.size,mediaBytes:totalBytes,publicationAllowed:false};
await fs.writeFile(path.join(root,'preparation-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
