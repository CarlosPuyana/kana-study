import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { REPO,run,safePath } from './phrase-islands-admin-lib.mjs';

export async function previewRelease(author,name,{allowDemo=false,port=4412}={}){
 const verified=author.verify(name,{allowDemo});
 let relative='previews/'+name,dir=safePath(author.workspace,relative);
 if(fs.existsSync(dir)&&!fs.existsSync(path.join(dir,'.authoring-preview.json'))){
  console.warn('Keeping incomplete preview: '+dir);
  relative+='-'+Date.now();dir=safePath(author.workspace,relative);
 }
 if(!fs.existsSync(dir)){
  fs.mkdirSync(dir,{recursive:true});
  for(const folder of ['src','public','scripts'])fs.cpSync(path.join(REPO,folder),path.join(dir,folder),{recursive:true,dereference:false});
  for(const file of fs.readdirSync(REPO))if(file==='angular.json'||/^package(?:-lock)?\.json$/.test(file)||/^tsconfig.*\.json$/.test(file))fs.copyFileSync(path.join(REPO,file),path.join(dir,file));
  fs.symlinkSync(path.join(REPO,'node_modules'),path.join(dir,'node_modules'),process.platform==='win32'?'junction':'dir');
  for(const file of verified.manifest.files){const output=safePath(dir,file.path);fs.mkdirSync(path.dirname(output),{recursive:true});fs.copyFileSync(safePath(verified.candidate,file.path),output);}
  fs.writeFileSync(path.join(dir,'.authoring-preview.json'),JSON.stringify({name,fingerprint:verified.manifest.candidateCatalogFingerprint}));
 }else{
  const marker=JSON.parse(fs.readFileSync(path.join(dir,'.authoring-preview.json'),'utf8'));if(marker.name!==name||marker.fingerprint!==verified.manifest.candidateCatalogFingerprint)throw Error('Preview directory already exists with another snapshot');
 }
 const browser=path.join(dir,'dist/kana-study-candidate/browser');
 if(!fs.existsSync(path.join(browser,'index.html'))){await run(process.execPath,[path.join(REPO,'node_modules/@angular/cli/bin/ng.js'),'build','--configuration','production,manga-candidate','--base-href','/kana-study/','--stats-json'],{cwd:dir});await run(process.execPath,['scripts/audit-manga-candidate-bundle.mjs'],{cwd:dir});}
 const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.mp3':'audio/mpeg','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2','.md':'text/plain'};
 const server=http.createServer((req,res)=>{
  try{const url=new URL(req.url,'http://127.0.0.1');if(url.pathname==='/'){res.writeHead(302,{Location:'/kana-study/'}).end();return;}
   if(!url.pathname.startsWith('/kana-study/')){res.writeHead(404).end();return;}
   if(url.pathname.endsWith('/supabase-config.js')){res.writeHead(200,{'Content-Type':'text/javascript'}).end('window.__KANA_STUDY_CONFIG__={};');return;}
   const rel=decodeURIComponent(url.pathname.slice('/kana-study/'.length))||'index.html';const file=safePath(browser,rel),bytes=fs.readFileSync(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]??'application/octet-stream','Content-Length':bytes.length,'Cache-Control':'no-store'}).end(bytes);
  }catch{res.writeHead(404).end();}
 });await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});
 const url=`http://127.0.0.1:${server.address().port}/kana-study/#/anki/islands`;console.log('ISOLATED PREVIEW, NOT PUBLISHED: '+url);return {url,previewRoot:dir,status:'local-preview-not-published'};
}
