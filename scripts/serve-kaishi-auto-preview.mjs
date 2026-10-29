// Loopback preview: published candidate resources by default; --fixtures overlays QA resources only.
import http from 'node:http';import fs from 'node:fs/promises';import path from 'node:path';import crypto from 'node:crypto';
const root=path.resolve('dist/kana-study-candidate/browser'),fixtures=process.argv.includes('--fixtures')?path.resolve('.cache/kaishi-auto/fixtures'):null,base='/kana-study/',prefix=base+'assets/kaishi/esp-v1-3fdaef081150-r2/';
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.txt':'text/plain; charset=utf-8','.wav':'audio/wav','.mp3':'audio/mpeg','.woff2':'font/woff2'};
http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://127.0.0.1');if(url.pathname==='/'){res.writeHead(302,{Location:base}).end();return;}
 if(!url.pathname.startsWith(base)){res.writeHead(404).end();return;}
 if(url.pathname===base+'supabase-config.js'){res.writeHead(200,{'Content-Type':'text/javascript'}).end('window.__KANA_STUDY_CONFIG__={};');return;}
 const overlay=fixtures&&url.pathname.startsWith(prefix),directory=overlay?fixtures:root,relative=decodeURIComponent(url.pathname.slice(overlay?prefix.length:base.length))||'index.html',file=path.resolve(directory,relative);
 if(!file.startsWith(directory+path.sep)){res.writeHead(403).end();return;}
 const body=await fs.readFile(file),etag='"'+crypto.createHash('sha1').update(body).digest('hex')+'"',headers={'Content-Type':types[path.extname(file)]??'application/octet-stream','Content-Length':body.length,'Cache-Control':'public, max-age=600',ETag:etag};
 if(req.headers['if-none-match']===etag){res.writeHead(304,headers).end();return;}res.writeHead(200,headers).end(body);
}catch{res.writeHead(404,{'Cache-Control':'no-store'}).end();}}).listen(4403,'127.0.0.1',()=>console.log('Kaishi AUTO loopback preview http://127.0.0.1:4403/kana-study/; fixtures='+!!fixtures));
