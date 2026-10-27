import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
/** Loopback preview only. Runtime Auth is unconfigured unless the browser test supplies its controlled config. */
export async function serveCandidate(port=4402){
 const root=path.resolve('dist/kana-study-candidate/browser'),base='/kana-study/';
 const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.zip':'application/zip','.woff2':'font/woff2'};
 const server=http.createServer(async(req,res)=>{try{
  const url=new URL(req.url,'http://127.0.0.1');if(url.pathname==='/'){res.writeHead(302,{Location:base}).end();return;}
  if(!url.pathname.startsWith(base)){res.writeHead(404).end();return;}
  if(url.pathname===base+'supabase-config.js'){res.writeHead(200,{'Content-Type':'text/javascript'}).end('window.__KANA_STUDY_CONFIG__={};');return;}
  const file=path.resolve(root,decodeURIComponent(url.pathname.slice(base.length))||'index.html');if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  const body=await fs.readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]??'application/octet-stream','Content-Length':body.length,'Cache-Control':'no-store'}).end(body);
 }catch{res.writeHead(404).end();}});
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});
 return {server,url:'http://127.0.0.1:'+server.address().port+base,close:()=>new Promise(r=>server.close(r))};
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===path.resolve(process.argv[1])){const preview=await serveCandidate();console.log('Candidate preview (Guest, no private Auth configuration): '+preview.url);}
