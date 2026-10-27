// Candidate -> prepared feature-off -> rebuilt public commit -> candidate, SAME origin and browser profile.
// No Git rollback, no production deployment, no private Auth/configuration and no storage deletion.
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {chromium,expect} from '@playwright/test';
const stable=JSON.parse(await fs.readFile('.cache/release3-stable-rebuild.json','utf8'));
assert.equal(stable.commit,'09793158fbdfa52b7ecf20d135f1e7c3cc42a789');
const roots={candidate:path.resolve('dist/kana-study-candidate/browser'),disabled:path.resolve('dist/kana-study/browser'),public:stable.artifact};
let mode='candidate';const base='/kana-study/',types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.woff2':'font/woff2','.svg':'image/svg+xml'};
const server=http.createServer(async(req,res)=>{try{
 const u=new URL(req.url,'http://127.0.0.1');if(!u.pathname.startsWith(base)){res.writeHead(404).end();return;}
 if(u.pathname===base+'supabase-config.js'){res.writeHead(200,{'Content-Type':'text/javascript'}).end('window.__KANA_STUDY_CONFIG__={};');return;}
 const root=roots[mode],file=path.resolve(root,decodeURIComponent(u.pathname.slice(base.length))||'index.html');
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 const data=await fs.readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]??'application/octet-stream','Cache-Control':'no-store'}).end(data);
}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port,url=origin+base;
const backupPath=path.resolve('.cache/release2c-backup-es.json'),backup=JSON.parse(await fs.readFile(backupPath,'utf8')),deck=backup.records.decks[0].value.id;
const copy=JSON.parse(await fs.readFile('src/assets/i18n/es.json','utf8'));assert(backup.records.events.some(e=>e.voidedBy));
const manual=JSON.parse(await fs.readFile('.cache/release3-manual-fixture.json','utf8'));
async function inventory(page){return page.evaluate(async()=>{
 const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('kana-study-custom-decks-v1');r.onupgradeneeded=()=>r.transaction.abort();r.onerror=()=>reject(r.error);r.onsuccess=()=>resolve(r.result);});
 try{return await new Promise((resolve,reject)=>{const stores=[...db.objectStoreNames],tx=db.transaction(stores,'readonly'),rows={};for(const s of stores){const r=tx.objectStore(s).getAll();r.onsuccess=()=>rows[s]=r.result;}tx.oncomplete=()=>resolve({version:db.version,rows});tx.onabort=()=>reject(tx.error);});}finally{db.close();}
});}
const results=[];
try{
 for(const [name,options]of [['chromium',{}],['chrome-installed',{channel:'chrome'}]]){
  const profile=await fs.mkdtemp(path.resolve('.cache/release3-rollback-'+name+'-'));let context;const errors=[],external=[];
  async function launch(){
   context=await chromium.launchPersistentContext(profile,{...options,headless:true,viewport:{width:1280,height:900}});
   await context.route('**/*',r=>{const u=new URL(r.request().url());if(/^https?:$/.test(u.protocol)&&u.origin!==origin){external.push(u.origin+u.pathname);return r.abort();}return r.continue();});
   const p=context.pages()[0];p.on('pageerror',e=>errors.push(e.message));return p;
  }
  try{
   mode='candidate';let page;
   try{page=await launch();}catch(e){if(name==='chrome-installed'&&/Executable doesn't exist|distribution.*not found/i.test(String(e))){results.push({engine:name,available:false,reason:String(e).split('\n')[0]});continue;}throw e;}
   const browserVersion=context.browser()?.version();
   await page.goto(url+'#/manga');assert.equal(await page.evaluate(()=>!!window.ng),false);
   await page.locator('app-manga-page input[accept=".zip,.cbz"]').setInputFiles(path.resolve(manual.file));await expect(page.getByRole('heading',{name:manual.title,exact:true})).toBeVisible();
   await page.goto(url+'#/anki/backups');
   await expect(page.locator('app-anki-backup')).toBeVisible();await page.locator('app-anki-backup input[type=file]').setInputFiles(backupPath);await expect(page.getByRole('heading',{name:copy['deckBackup.preview'],exact:true})).toBeVisible();await page.getByRole('checkbox').check();await page.getByRole('button',{name:copy['deckBackup.restore'],exact:true}).click();await expect(page.getByRole('status')).toHaveText(copy['deckBackup.restored']);
   // Synthetic historical account rows make the preservation check cover every owner, without a real login.
   await page.evaluate(async()=>{const db=await new Promise(resolve=>{const r=indexedDB.open('kana-study-custom-decks-v1');r.onsuccess=()=>resolve(r.result);});try{
    await new Promise((resolve,reject)=>{const stores=[...db.objectStoreNames],tx=db.transaction(stores,'readwrite');for(const s of stores){const r=tx.objectStore(s).index('workspace').getAll('guest');r.onsuccess=()=>{for(const row of r.result)tx.objectStore(s).put({...row,workspace:'user:rollback-synthetic-account'});};}tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error);});
   }finally{db.close();}});
   const before=await inventory(page);assert.equal(before.version,3);assert.equal(Object.keys(before.rows).length,11);await page.goto(url+'#/anki');await expect(page.locator('app-deck-card')).toHaveCount(2);
   await context.close();context=null;
   for(const next of ['disabled','public']){
    mode=next;page=await launch();await page.goto(url+'#/anki?customDecks=true');await expect(page.locator('app-deck-card')).toHaveCount(1);await expect(page.locator('a[href="#/anki/japanese-1500/study"]')).toBeVisible();assert.equal(await page.evaluate(()=>!!window.ng),false);assert.deepEqual(await inventory(page),before);
    await page.goto(url+'#/anki/'+deck+'/study');await expect(page.locator('.end-state h1')).toHaveText(copy['anki.deckNotFound']);assert.deepEqual(await inventory(page),before);
    await page.screenshot({path:'.cache/release3-rollback-'+name+'-'+next+'.png',fullPage:true});await context.close();context=null;
   }
   mode='candidate';page=await launch();await page.goto(url+'#/anki');await expect(page.locator('app-deck-card')).toHaveCount(2);assert.deepEqual(await inventory(page),before);
   await page.goto(url+'#/anki/'+deck+'/study');await expect(page.locator('.front h1')).toBeVisible();await expect(page.locator('[role=alert]')).toHaveCount(0);assert.deepEqual(await inventory(page),before);
   await page.goto(url+'#/anki/backups');const download=page.waitForEvent('download');await page.getByRole('button',{name:copy['deckBackup.export'],exact:true}).click();const file=await (await download).path(),returned=JSON.parse(await fs.readFile(file,'utf8'));
   const guest=Object.fromEntries(Object.entries(before.rows).map(([s,rows])=>[s,rows.filter(r=>r.workspace==='guest')]));assert.deepEqual(returned.records,guest);assert.deepEqual(await inventory(page),before);
   await page.screenshot({path:'.cache/release3-rollback-'+name+'-reenabled.png',fullPage:true});assert.deepEqual(external,[]);assert.deepEqual(errors,[]);
   const result={engine:name,browserVersion,available:true,sameOrigin:true,sameProfile:true,stages:['candidate','prepared-disabled','public-0979315','candidate'],stores:11,databaseVersion:3,allOwnersExact:true,fsrsIdentitiesJournalExact:true,exportAfterReturnExact:true,externalAttempts:0,publicCommit:stable.commit,publicArtifact:'rebuilt from commit, not original Actions artifact'};results.push(result);console.log('PASS rollback '+name+': candidate -> disabled -> public commit -> candidate; 11 stores/all owners exact, usable study and export');
  }finally{await context?.close();}
 }
 await fs.writeFile('.cache/release3-rollback-results.json',JSON.stringify({backupPath,sourceBackupExportedAt:backup.exportedAt,stable,results},null,2));console.log(JSON.stringify(results,null,2));
}finally{await new Promise(r=>server.close(r));}
