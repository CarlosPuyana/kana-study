// RELEASE-MANGA-1: audit the UNMODIFIED optimized Pages artifact, all public gates off.
// Loopback only, synthetic browser profiles; no account, SDK credentials or remote AI.
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {chromium,expect} from '@playwright/test';
import {ZipReader,Uint8ArrayReader,TextWriter} from '@zip.js/zip.js';
const root=path.resolve('dist/kana-study/browser'),base='/kana-study/';
const sentence='大丈夫、大丈夫。一緒に行こう。',rows=[];
const zip=new ZipReader(new Uint8ArrayReader(await fs.readFile('public/dictionaries/JMdict_spanish.zip')));
try{for(const entry of await zip.getEntries())if(/^term_bank_\d+\.json$/.test(entry.filename))for(const row of JSON.parse(await entry.getData(new TextWriter())))if(row[0]==='大丈夫')rows.push(row);}finally{await zip.close();}
assert.equal(rows.length,2);
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.zip':'application/zip'};
const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://127.0.0.1');if(!url.pathname.startsWith(base)){res.writeHead(404).end();return;}
  // Do not read or serve any runtime account configuration, even if configured locally.
  if(url.pathname===base+'supabase-config.js'){res.setHeader('Content-Type','text/javascript');res.end('window.__KANA_STUDY_CONFIG__={};');return;}
  const file=path.resolve(root,decodeURIComponent(url.pathname.slice(base.length))||'index.html');
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  const body=await fs.readFile(file);res.setHeader('Content-Type',types[path.extname(file)]??'application/octet-stream');res.end(body);
 }catch{res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin='http://127.0.0.1:'+server.address().port;
const results=[];
async function select(page){
 const line=page.locator('.ocr-line').first();await expect(line).toBeVisible();
 const b=await line.evaluate(el=>{const range=document.createRange();range.setStart(el.firstChild,0);range.setEnd(el.firstChild,3);const b=range.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height};});
 await page.mouse.move(b.x+1,b.y+b.height/2);await page.mouse.down();await page.mouse.move(b.x+b.width-1,b.y+b.height/2,{steps:8});await page.mouse.up();
 await expect(page.locator('app-dictionary-popup h2')).toHaveText('大丈夫');
}
async function install(page){await page.evaluate(async({rows,sentence})=>{
 const open=(name,version,upgrade)=>new Promise((resolve,reject)=>{const r=indexedDB.open(name,version);r.onupgradeneeded=()=>upgrade(r.result);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
 const put=(db,data)=>new Promise((resolve,reject)=>{const tx=db.transaction(Object.keys(data),'readwrite');for(const [store,values]of Object.entries(data))for(const row of values)tx.objectStore(store).put(row);tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error);});
 const d=await open('kana-study-dictionary',1,db=>{db.createObjectStore('metadata',{keyPath:'id'});const s=db.createObjectStore('terms',{keyPath:'id'});s.createIndex('expression',['dictionaryId','expression']);s.createIndex('reading',['dictionaryId','reading']);s.createIndex('dictionaryId','dictionaryId');});
 const now='2026-10-24T12:00:00Z';await put(d,{metadata:[{id:'active',dictionaryId:'release-audit',title:'JMdict Spanish audit',revision:'bundled',status:'ready',count:rows.length,updatedAt:now}],terms:rows.map((r,i)=>({id:'release:'+i,dictionaryId:'release-audit',expression:r[0],reading:r[1],definitionTags:r[2],rules:r[3],score:r[4],glossaries:r[5],sequence:r[6],termTags:r[7]}))});d.close();
 const m=await open('kana-study-manga',2,db=>{db.createObjectStore('volumes',{keyPath:'id'});db.createObjectStore('pages',{keyPath:['volumeId','pageIndex']}).createIndex('volumeId','volumeId');db.createObjectStore('reading-progress',{keyPath:'volumeId'});db.createObjectStore('provisioning',{keyPath:'id'});});
 const image=new Blob(['<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="white"/></svg>'],{type:'image/svg+xml'});
 const ocr={img_path:'audit.svg',img_width:800,img_height:600,blocks:[{box:[40,80,760,130],vertical:false,font_size:32,lines:[sentence],lines_coords:[[[40,80],[760,80],[760,130],[40,130]]]}]};
 await put(m,{volumes:[{id:'release-audit',title:'Release audit (synthetic)',pageCount:1,storageBytes:image.size,mokuro:{version:'0.2.0',title:'Audit',volume:'1'},createdAt:now,updatedAt:now,complete:true}],pages:[{volumeId:'release-audit',pageIndex:0,image,ocr}]});m.close();
},{rows,sentence});}
try{
 for(const [language,colorScheme,width]of [['es','dark',1280],['en','light',390],['ca','dark',320]]){
  const profile=await fs.mkdtemp(path.resolve('.cache/release-public-'+language+'-'));
  const requests=[],errors=[];let context;
  async function launch(){
   context=await chromium.launchPersistentContext(profile,{headless:true,colorScheme,viewport:{width,height:900}});
   await context.route('**/*',route=>{const url=new URL(route.request().url());if(url.protocol==='http:'||url.protocol==='https:'){requests.push({method:route.request().method(),url:url.href});if(url.origin!==origin)return route.abort();}return route.continue();});
   const page=context.pages()[0];page.on('pageerror',error=>errors.push(error.message));return page;
  }
  try{
   let page=await launch();await page.addInitScript(({language,colorScheme})=>{
    localStorage.setItem('kana-study.settings.v1',JSON.stringify({language,theme:colorScheme}));
    localStorage.setItem('kana-study.manga-reader-preferences.v1',JSON.stringify({ocrVisible:true,dictionaryEnabled:true,fitMode:'width'}));
    for(const key of ['CUSTOM_DECKS_ENABLED','MANGA_DECK_ASSISTED_ENABLED','CUSTOM_DECK_SYNC_ENABLED','CUSTOM_REMOTE_UPLOAD_APPROVED'])localStorage.setItem(key,'true');
   },{language,colorScheme});
   await page.goto(origin+base+'#/anki?customDecks=true&experimental=true');await expect(page.locator('app-deck-card')).toHaveCount(1);await expect(page.locator('a[href="#/anki/japanese-1500/study"]')).toBeVisible();
   assert.equal(await page.evaluate(()=>!!window.ng),false,'optimized production must have no Angular debug inspector');
   await install(page);await page.goto(origin+base+'#/manga/read/release-audit?customDecks=true&experimental=true');await select(page);
   await expect(page.locator('app-dictionary-popup .reading')).toHaveText('だいじょうぶ');
   for(const gloss of rows[0][5])await expect(page.locator('app-dictionary-popup article').first()).toContainText(gloss);
   await page.locator('app-dictionary-popup details summary').first().click();await expect(page.locator('app-dictionary-popup details')).toContainText('だいじょぶ');
   await expect(page.locator('app-dictionary-popup .tabs button')).toHaveCount(3);
   await page.locator('app-dictionary-popup .tabs button').nth(1).click();await expect(page.locator('.context-actions')).toBeVisible();
   await page.locator('app-dictionary-popup .tabs button').nth(2).click();await expect(page.locator('app-manga-grammar-reference')).toBeVisible();
   await page.locator('app-dictionary-popup .tabs button').nth(0).click();
   await expect(page.locator('.add-to-deck')).toHaveCount(0);await expect(page.locator('app-manga-deck-review')).toHaveCount(0);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   await page.screenshot({path:'.cache/release-public-'+language+'-'+colorScheme+'.png',fullPage:true});
   await page.reload();await select(page);await expect(page.locator('.add-to-deck')).toHaveCount(0);
   await context.close();context=null;page=await launch();
   await page.goto(origin+base+'#/manga/read/release-audit');await select(page);await expect(page.locator('app-dictionary-popup .reading')).toHaveText('だいじょうぶ');await expect(page.locator('app-manga-deck-review')).toHaveCount(0);
   await page.goto(origin+base+'#/manga/vocabulary/release-audit?customDecks=true');await expect(page.locator('app-home-page')).toBeVisible();await expect(page.locator('app-manga-volume-vocabulary')).toHaveCount(0);
   await page.goto(origin+base+'#/anki/backups?customDecks=true');await expect(page.locator('app-home-page')).toBeVisible();await expect(page.locator('app-anki-backup')).toHaveCount(0);
   await page.goto(origin+base+'#/anki/md-release-audit/study');
   const copy=JSON.parse(await fs.readFile('src/assets/i18n/'+language+'.json','utf8'));
   await expect(page.locator('app-anki-study-page .end-state h1')).toHaveText(copy['anki.deckNotFound']);await expect(page.locator('.ratings')).toHaveCount(0);await expect(page.locator('app-anki-study-page [role=alert]')).toHaveCount(0);
   assert.deepEqual(errors,[]);assert.equal(requests.filter(r=>r.method==='POST'||new URL(r.url).origin!==origin).length,0,'no remote attempts or custom/AI writes');
   results.push({language,colorScheme,width,productionInspector:false,dictionary:true,defaultGatesHidden:true,urlAndStorageCannotEnable:true,reload:true,browserRestart:true,remoteAttempts:0,posts:0});
   console.log('PASS optimized Pages: '+language+'/'+colorScheme+'/'+width+'; dictionary, hidden gates, reload, real browser restart, zero remote attempts');
  }finally{await context?.close();}
 }
 await fs.writeFile('.cache/release-public-results.json',JSON.stringify(results,null,2));console.log('3/3 production browser audit scenarios passed. No public gates enabled.');
}finally{await new Promise(r=>server.close(r));}
