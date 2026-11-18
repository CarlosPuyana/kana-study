import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import * as sass from 'sass';import {fileURLToPath} from 'node:url';
export const SOURCE=path.dirname(fileURLToPath(import.meta.url)),ROOT=path.resolve(SOURCE,'../..'),WORK=path.join(ROOT,'.cache/phrase-islands-puyi-p01');
export function prepare(){
 fs.mkdirSync(path.join(WORK,'media'),{recursive:true});const source=JSON.parse(fs.readFileSync(path.join(ROOT,'src/app/data/phrase-islands/audio.v1.json'),'utf8'));
 const ids=['pi-everyday-001','pi-everyday-002','pi-everyday-003','pi-everyday-004','pi-everyday-005'];
 const clips=ids.map((id,n)=>{const a=source[id],bytes=fs.readFileSync(path.join(ROOT,'public',a.path));if(crypto.createHash('sha256').update(bytes).digest('hex')!==a.sha256)throw Error('Source hash mismatch');const alias=String.fromCharCode(65+n),dest=path.join(WORK,'media',alias+'.mp3');if(fs.existsSync(dest)&&!fs.readFileSync(dest).equals(bytes))throw Error('Existing sample preserved; hash conflict');if(!fs.existsSync(dest))fs.writeFileSync(dest,bytes,{flag:'wx'});return {id:alias,url:'media/'+alias+'.mp3',durationSeconds:a.durationSeconds,bytes:a.bytes,sha256:a.sha256,sourceId:id};});
 const manifest={schemaVersion:1,kind:'public-generic-test-clips-not-personal',engine:'AivisSpeech 1.2.0',voice:'Aida Shigeru normal',clips};fs.writeFileSync(path.join(WORK,'manifest.json'),JSON.stringify(manifest,null,2));
 fs.writeFileSync(path.join(WORK,'lab.css'),sass.compile(path.join(SOURCE,'lab.scss'),{style:'compressed'}).css);return manifest;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(JSON.stringify(prepare(),null,2));
