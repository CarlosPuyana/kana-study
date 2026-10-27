// Optimized artifact, real Angular providers/SDK, UI operations only; controlled HTTP Auth is NOT Supabase Auth validation.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {chromium,firefox,webkit,expect} from '@playwright/test';
import {ZipReader,Uint8ArrayReader,TextWriter,ZipWriter,Uint8ArrayWriter,TextReader} from '@zip.js/zip.js';
import {serveCandidate} from './serve-manga-candidate.mjs';

const preview=await serveCandidate(0),url=preview.url,origin=new URL(url).origin;
const syntheticOrigin='https://release-candidate-fixture.supabase.co';
const users=['11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222'];
const rows=[],catRows=[],source=new ZipReader(new Uint8ArrayReader(await fs.readFile('public/dictionaries/JMdict_spanish.zip')));
try{for(const e of await source.getEntries())if(/^term_bank_\d+\.json$/.test(e.filename))for(const row of JSON.parse(await e.getData(new TextWriter())))if(row[0]==='大丈夫')rows.push(row);else if(row[0]==='猫'&&row[1]==='ねこ')catRows.push(row);}finally{await source.close();}assert.equal(rows.length,2);assert(catRows.length>0);
const sentence='大丈夫、大丈夫。猫がいる。',title='Candidate synthetic volume';
const copy={};for(const lang of ['es','en','ca'])copy[lang]=JSON.parse(await fs.readFile('src/assets/i18n/'+lang+'.json','utf8'));
async function zip(entries){const writer=new ZipWriter(new Uint8ArrayWriter());for(const [name,value]of entries)await writer.add(name,typeof value==='string'?new TextReader(value):new Uint8ArrayReader(value),{useWebWorkers:false});return Buffer.from(await writer.close());}
const dictionary=await zip([['index.json',JSON.stringify({title:'JMdict Spanish candidate fixture',revision:'bundled-rows',format:3,sequenced:true})],['term_bank_1.json',JSON.stringify([...rows,catRows[0]])]]);
function user(id){return {id,aud:'authenticated',role:'authenticated',email:(id===users[0]?'candidate-a':'candidate-b')+'@example.invalid',app_metadata:{provider:'email',providers:['email']},user_metadata:{},created_at:'2026-10-26T00:00:00Z'};}
function session(id){const now=Math.floor(Date.now()/1000),encode=v=>Buffer.from(JSON.stringify(v)).toString('base64url'),body=encode({alg:'HS256',typ:'JWT'})+'.'+encode({sub:id,aud:'authenticated',role:'authenticated',exp:now+3600,iat:now});return {access_token:body+'.'+createHmac('sha256','synthetic-local-fixture-only').update(body).digest('base64url'),token_type:'bearer',expires_in:3600,expires_at:now+3600,refresh_token:'synthetic-refresh-'+id,user:user(id)};}
const results=[];
async function prepare(context,language,theme,metrics){
 await context.route('**/*',async route=>{
  const r=route.request(),u=new URL(r.url());if(!/^https?:$/.test(u.protocol))return route.continue();
  if(u.origin===syntheticOrigin){
   metrics.controlledAuthRequests++;if(/\/rest\/v1\/(custom_|manga_custom)/.test(u.pathname)){metrics.customRequests.push(u.pathname);return route.fulfill({status:500,body:'Unexpected custom endpoint'});}const headers={'access-control-allow-origin':'*','access-control-allow-headers':'*','content-type':'application/json'};
   if(u.pathname.includes('/rpc/')){metrics.rpc.push(u.pathname);return route.fulfill({status:500,headers,body:JSON.stringify({message:'Unexpected RPC in local candidate'})});}
   if(r.method()==='OPTIONS')return route.fulfill({status:204,headers});
   let data=[];if(u.pathname==='/auth/v1/token'){const input=r.postDataJSON(),id=input.email?.startsWith('candidate-b')?users[1]:input.refresh_token?.includes(users[1])?users[1]:users[0];data=session(id);}
   else if(u.pathname==='/auth/v1/logout')return route.fulfill({status:204,headers});
   else if(u.pathname==='/auth/v1/user')data=user(r.headers()['authorization']?.includes(Buffer.from(users[1]).toString('base64'))?users[1]:users[0]);
   else if(u.pathname==='/rest/v1/profiles') {const id=u.searchParams.get('id')?.replace('eq.','')??users[0];data=[{id,username:id===users[0]?'candidate-a':'candidate-b',display_name:'Controlled account',created_at:'2026-10-26T00:00:00Z',updated_at:'2026-10-26T00:00:00Z'}];}
   else if(u.pathname.startsWith('/rest/v1/')){metrics.legacyRequests++;if(!['GET','HEAD'].includes(r.method())){metrics.legacyWrites++;data=r.postDataJSON()??[];}}
   else throw Error('Unexpected controlled HTTP endpoint '+u.pathname);
   return route.fulfill({status:200,headers,body:JSON.stringify(data)});
  }
  if(u.origin!==origin){metrics.external.push(u.origin+u.pathname);return route.abort();}
  if(u.pathname.endsWith('/supabase-config.js'))return route.fulfill({contentType:'text/javascript',body:'window.__KANA_STUDY_CONFIG__='+JSON.stringify({supabaseUrl:syntheticOrigin,supabasePublishableKey:'synthetic-publishable-key-local-fixture-only'})+';'});
  return route.continue();
 });
 await context.addInitScript(({language,theme})=>{
  if(!localStorage.getItem('kana-study.settings.v1'))localStorage.setItem('kana-study.settings.v1',JSON.stringify({language,theme}));
  localStorage.setItem('kana-study.manga-reader-preferences.v1',JSON.stringify({ocrVisible:true,dictionaryEnabled:true,fitMode:'width'}));
  // Hostile public switches must not affect the fixed cloud/account release policy.
  for(const [k,value] of Object.entries({CUSTOM_DECKS_ENABLED:'false',MANGA_DECK_ASSISTED_ENABLED:'false',CUSTOM_DECK_SYNC_ENABLED:'true',CUSTOM_REMOTE_UPLOAD_APPROVED:'true',CUSTOM_DECK_GUEST_ONLY:'false'}))localStorage.setItem(k,value);
 },{language,theme});
}
async function records(page,owner='guest'){
 return page.evaluate(async owner=>{
  const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('kana-study-custom-decks-v1');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.onupgradeneeded=()=>r.transaction.abort();});
  try{const result={};for(const s of db.objectStoreNames){result[s]=await new Promise((resolve,reject)=>{const r=db.transaction(s).objectStore(s).index('workspace').getAll(owner);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}return result;}finally{db.close();}
 },owner);
}
async function volume(page,lang){
 const png=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=800;c.height=600;const x=c.getContext('2d');x.fillStyle='white';x.fillRect(0,0,800,600);return c.toDataURL('image/png').split(',')[1];});
 const ocr={img_path:'001.png',img_width:800,img_height:600,blocks:[{box:[40,80,760,140],vertical:false,font_size:32,lines:[sentence],lines_coords:[[[40,80],[760,80],[760,140],[40,140]]]}]};
 const cbz=await zip([['001.png',Buffer.from(png,'base64')],['candidate.mokuro',JSON.stringify({version:'0.2.0',title:'Synthetic only',volume:title,pages:[ocr]})]]);
 await page.locator('app-manga-page input[accept=".zip,.cbz"]').setInputFiles({name:'candidate.cbz',mimeType:'application/zip',buffer:cbz});
 const card=page.locator('.library-grid article').filter({has:page.getByRole('heading',{name:title,exact:true})});await expect(card).toBeVisible();const href=await card.locator('a[href*="/manga/read/"]').getAttribute('href');return href.split('/').at(-1);
}
async function installDictionary(page){
 await page.locator('app-dictionary-install summary').click();await page.locator('app-dictionary-install input[type=file]').setInputFiles({name:'jmdict-candidate.zip',mimeType:'application/zip',buffer:dictionary});await expect(page.locator('app-dictionary-install h2')).toContainText('✓');
}
async function select(page,start=0,end=3,word='大丈夫',reading='だいじょうぶ'){const line=page.locator('.ocr-line').first();await expect(line).toBeVisible();const b=await line.evaluate((el,{start,end})=>{const r=document.createRange();r.setStart(el.firstChild,start);r.setEnd(el.firstChild,end);const b=r.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height};},{start,end});await page.mouse.move(b.x+1,b.y+b.height/2);await page.mouse.down();await page.mouse.move(b.x+b.width-1,b.y+b.height/2,{steps:8});await page.mouse.up();await expect(page.locator('app-dictionary-popup h2')).toHaveText(word);await expect(page.locator('app-dictionary-popup .reading')).toHaveText(reading);}
async function addCard(page,c,word,reading){
 await page.locator('.add-to-deck').click();const panel=page.locator('app-manga-deck-review');await expect(panel.locator('h4')).toHaveText(word);
 const readings=panel.locator('select[data-field=reading]');if(await readings.isVisible())await readings.selectOption({label:word+' · '+reading});
 const meanings=panel.locator('select[data-field=meaning]');if(await meanings.isVisible())await meanings.selectOption({index:1});
 await page.getByRole('button',{name:c['manga.deck.confirmCreate'],exact:true}).click();await expect(page.locator('app-dictionary-popup')).toHaveCount(0);
}
async function goto(page,route){await page.goto(url+'#'+route);}
async function signIn(page,c,account='candidate-a'){
 const needsChoice=await page.evaluate(id=>!localStorage.getItem('kana-study.workspace.import-decision.v1.'+id),account==='candidate-a'?users[0]:users[1]);
 await goto(page,'/auth?return=/anki');await page.locator('input[name=email]').fill(account+'@example.invalid');await page.locator('input[name=password]').fill('synthetic-password-only');
 const submit=page.locator('button[type=submit]');
 if(needsChoice){await submit.click();await Promise.all([page.waitForEvent('load'),page.getByRole('button',{name:c['localDeck.continue'],exact:true}).click()]);}
 else await Promise.all([page.waitForEvent('load'),submit.click()]);
 await expect(page.locator('app-anki-page')).toBeVisible();
}
async function signOut(page){await Promise.all([page.waitForEvent('load'),page.locator('app-profile-page .account-actions button.danger').click()]);await expect(page).toHaveURL(/#\/$/);}
async function exportFile(page,c,file){await goto(page,'/anki/backups');const p=page.waitForEvent('download');await page.getByRole('button',{name:c['deckBackup.export'],exact:true}).click();await (await p).saveAs(file);return JSON.parse(await fs.readFile(file,'utf8'));}
async function overflow(page){assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'horizontal overflow');}

try{
 for(const [lang,theme,width]of [['es','dark',1280],['en','light',390],['ca','dark',320]]){
  const c=copy[lang],metrics={rpc:[],customRequests:[],external:[],controlledAuthRequests:0,legacyRequests:0,legacyWrites:0},profile=await fs.mkdtemp(path.resolve('.cache/release2c-'+lang+'-')),target=await fs.mkdtemp(path.resolve('.cache/release2c-target-'+lang+'-'));
  let context,second;const errors=[];
  async function launch(dir){const ctx=await chromium.launchPersistentContext(dir,{headless:true,viewport:{width,height:900},colorScheme:theme});await prepare(ctx,lang,theme,metrics);return ctx;}
  try{
   context=await launch(profile);let page=context.pages()[0];page.on('pageerror',e=>errors.push(e.message));await goto(page,'/manga');await expect(page.locator('app-manga-page')).toBeVisible();assert.equal(await page.evaluate(()=>!!window.ng),false);
   await installDictionary(page);const id=await volume(page,lang);await goto(page,'/manga/read/'+id);await select(page);
   for(const gloss of rows[0][5].slice(0,4))await expect(page.locator('app-dictionary-popup article').first()).toContainText(gloss);
   await page.locator('app-dictionary-popup details summary').first().click();await expect(page.locator('app-dictionary-popup details')).toContainText('だいじょぶ');await page.locator('app-dictionary-popup .tabs button').nth(1).click();await expect(page.locator('.context-actions')).toBeVisible();await expect(page.locator('app-dictionary-popup .tabs button')).toHaveCount(2);await expect(page.locator('app-manga-grammar-reference')).toHaveCount(0);await page.locator('app-dictionary-popup .tabs button').first().click();
   await page.screenshot({path:'.cache/release2c-dictionary-'+lang+'.png',fullPage:true});await addCard(page,c,'大丈夫','だいじょうぶ');await select(page,sentence.indexOf('猫'),sentence.indexOf('猫')+1,'猫','ねこ');await addCard(page,c,'猫','ねこ');
   await goto(page,'/anki');const cards=page.locator('app-deck-card');await expect(cards).toHaveCount(2);const custom=cards.filter({has:page.getByRole('heading',{name:new RegExp(title)})});const deck=(await custom.locator('a.study').getAttribute('href')).split('/')[2];
   await custom.locator('a.study').click();await expect(page.locator('.front h1')).toHaveText('大丈夫');await page.locator('.reveal').click();await page.locator('.good').click();await page.locator('.undo').click();await expect(page.locator('.front h1')).toHaveText('大丈夫');await page.locator('.reveal').click();await page.locator('.good').click();
   await goto(page,'/anki/'+deck+'/stats');await expect(page.locator('app-anki-stats-page')).toBeVisible();await overflow(page);await page.screenshot({path:'.cache/release2c-stats-'+lang+'.png',fullPage:true});
   const original=await records(page);assert.equal(original.events.length,2);assert.equal(original.events.filter(r=>r.voidedBy).length,1);assert.equal(original.cards.length,2);assert.equal(original.progress[0].value.card.reps,1);
   const file=path.resolve('.cache/release2c-backup-'+lang+'.json'),backup=await exportFile(page,c,file);assert.deepEqual(backup.records,original);await expect(page.getByText(c['deckBackup.includes'],{exact:true})).toBeVisible();await page.screenshot({path:'.cache/release2c-backup-'+lang+'.png',fullPage:true});
   second=await launch(target);let next=second.pages()[0];await goto(next,'/anki/backups');await next.locator('input[type=file]').setInputFiles(file);await expect(next.getByRole('heading',{name:c['deckBackup.preview'],exact:true})).toBeVisible();await next.getByRole('checkbox').check();await next.getByRole('button',{name:c['deckBackup.restore'],exact:true}).click();await expect(next.getByRole('status')).toHaveText(c['deckBackup.restored']);assert.deepEqual(await records(next),original);
   await next.reload();assert.deepEqual(await records(next),original);await second.close();second=await launch(target);next=second.pages()[0];await goto(next,'/anki');await expect(next.locator('app-deck-card')).toHaveCount(2);assert.deepEqual(await records(next),original);await goto(next,'/anki/'+deck+'/study');await expect(next.locator('app-anki-study-page')).toBeVisible();await expect(next.locator('[role=alert]')).toHaveCount(0);await expect(next.locator('.front h1')).toHaveText('猫');await next.locator('.reveal').click();await next.locator('.good').click();const resumed=await records(next);assert.equal(resumed.events.length,3);for(const old of original.events)assert.deepEqual(resumed.events.find(r=>r.key===old.key),old);await next.screenshot({path:'.cache/release2c-restored-'+lang+'.png',fullPage:true});
   await goto(page,'/manga/vocabulary/'+id);await expect(page.locator('.cards h2')).toHaveCount(2);await expect(page.locator('.cards').getByRole('heading',{name:'大丈夫',exact:true})).toBeVisible();await page.getByRole('button',{name:c['ocrExplorer.find']+' · 大丈夫',exact:true}).click();await expect(page.locator('app-manga-ocr-explorer .matches li')).toHaveCount(2);await page.locator('app-manga-ocr-explorer .matches a').first().click();await expect(page.locator('app-manga-ocr-location')).toBeVisible();await expect(page.locator('.ocr-line')).toHaveCount(1);await expect(page.locator('.ocr-line.located-line')).toHaveCount(1);await expect(page.locator('app-manga-ocr-location .sequence')).toContainText('[0, 3)');await expect(page.locator('app-manga-ocr-location .sequence mark')).toHaveText('大丈夫');await expect(page.locator('app-dictionary-popup')).toHaveCount(0);await page.screenshot({path:'.cache/release2c-location-'+lang+'.png',fullPage:true});
   // Existing account rows are synthetic test setup, inserted by raw IDB; production UI never creates them.
   await page.evaluate(async({owner,deck,card})=>{const db=await new Promise(resolve=>{const r=indexedDB.open('kana-study-custom-decks-v1');r.onsuccess=()=>resolve(r.result);});try{await new Promise((resolve,reject)=>{const tx=db.transaction(['decks','cards'],'readwrite');tx.objectStore('decks').put({...deck,workspace:owner});tx.objectStore('cards').put({...card,workspace:owner});tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error);});}finally{db.close();}},{owner:'user:'+users[0],deck:original.decks[0],card:original.cards[0]});
   const accountBefore=await records(page,'user:'+users[0]);await signIn(page,c);await goto(page,'/settings?return=/anki');await page.getByRole('button',{name:lang==='es'?'Español':lang==='en'?'English':'Català',exact:true}).click();await page.getByRole('button',{name:c[theme==='light'?'settings.themeLight':'settings.themeDark'],exact:true}).click();await goto(page,'/anki');await expect(page.locator('html')).toHaveAttribute('data-theme',theme);await expect(page.locator('app-deck-card')).toHaveCount(1);await expect(page.getByText(c['localDeck.guestOnly'],{exact:true})).toBeVisible();assert.deepEqual(await records(page,'user:'+users[0]),accountBefore);assert.deepEqual(await records(page),original);
   for(const route of ['/anki/'+deck+'/study','/anki/'+deck+'/cards','/anki/'+deck+'/settings','/anki/'+deck+'/stats','/manga/vocabulary/'+id,'/anki/backups']){await goto(page,route+'?customDecks=true&guestOnly=false');await expect(page.locator('app-anki-page')).toBeVisible();await expect(page.locator('app-deck-card')).toHaveCount(1);}
   await goto(page,'/anki/japanese-1500/study');await expect(page.locator('.front h1')).toBeVisible();await page.locator('.reveal').click();await page.locator('.good').click();
   await goto(page,'/manga');const accountVolume=await volume(page,'es');await goto(page,'/manga/read/'+accountVolume);await select(page);await expect(page.locator('.add-to-deck')).toHaveCount(0);await expect(page.locator('app-dictionary-popup article').first()).toBeVisible();
   await goto(page,'/profile');await expect(page.locator('app-profile-page')).toBeVisible();await expect(page.getByText(c['localDeck.local'],{exact:true})).toBeVisible();await page.screenshot({path:'.cache/release2c-account-'+lang+'.png',fullPage:true});await signOut(page);await goto(page,'/anki');await expect(page.locator('app-deck-card')).toHaveCount(2);assert.deepEqual(await records(page),original);assert.deepEqual(await records(page,'user:'+users[0]),accountBefore);
   // Real SDK sessions, controlled HTTP responses: A→B→A, reload and a second tab.
   await signIn(page,c);await goto(page,'/profile');await signOut(page);await signIn(page,c,'candidate-b');await expect(page.locator('app-deck-card')).toHaveCount(1);await page.reload();await expect(page.locator('app-deck-card')).toHaveCount(1);
   const tab=await context.newPage();await goto(tab,'/anki');await expect(tab.locator('app-deck-card')).toHaveCount(1);await goto(page,'/profile');await signOut(page);await expect(tab.locator('app-deck-card')).toHaveCount(2);await tab.close();await signIn(page,c);assert.deepEqual(await records(page,'user:'+users[0]),accountBefore);
   await goto(page,'/profile');await signOut(page);await context.close();context=await launch(profile);page=context.pages()[0];await goto(page,'/anki');await expect(page.locator('app-deck-card')).toHaveCount(2);assert.deepEqual(await records(page),original);await overflow(page);assert.deepEqual(metrics.rpc,[]);assert.deepEqual(metrics.customRequests,[]);assert(metrics.legacyWrites>0,'Legacy study must still send its compatible REST writes');assert.deepEqual(metrics.external,[]);assert.deepEqual(errors,[]);
   results.push({language:lang,theme,width,optimized:true,debugInspector:false,uiImport:true,dictionaryActualBundledRows:3,fsrsUndo:true,backupExact:true,cleanProfileRestore:true,restart:true,controlledSdkAuth:true,realSupabaseAuth:false,accountRowsUnchanged:true,legacyStudy:true,twoTabs:true,customRpcAttempts:0,customRestAttempts:0,legacyWrites:metrics.legacyWrites,accountLocale:lang,accountTheme:theme,externalNetworkAttempts:0});console.log('PASS candidate '+lang+'/'+theme+'/'+width+'; UI import, dictionary, FSRS/undo, backup/restart, account restriction and controlled SDK login/logout');
  }catch(error){const p=context?.pages()[0];if(p){await fs.writeFile('.cache/release2c-failure-'+lang+'.txt',await p.locator('body').innerText());await p.screenshot({path:'.cache/release2c-failure-'+lang+'.png',fullPage:true});}throw error;}finally{await context?.close();await second?.close();}
 }
 // Additional available engines: report actual availability, never claim physical device QA.
 const engines=[];for(const [name,type]of [['firefox',firefox],['webkit',webkit]]){try{const browser=await type.launch({headless:true});try{const p=await browser.newPage();await p.goto(url+'#/anki');await expect(p.locator('app-deck-card')).toHaveCount(1);engines.push({name,smoke:true});}finally{await browser.close();}}catch(e){engines.push({name,smoke:false,unavailable:String(e).split('\n')[0]});}}
 await fs.writeFile('.cache/release2c-browser-results.json',JSON.stringify({scenarios:results,additionalEngines:engines},null,2));console.log('Candidate audit complete: '+results.length+'/3. '+JSON.stringify(engines));
}finally{await preview.close();}
