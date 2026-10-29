// Manual-only regression; default automatic playback is covered by mazos-roadmap.
import {test,expect,Page} from '@playwright/test';
import fs from 'node:fs';import crypto from 'node:crypto';
const shots=process.env['KAISHI_AUTO_EVIDENCE_DIR']??'.cache/kaishi-auto';
const version='esp-v1-3fdaef081150-r2',prefix='/kana-study/assets/kaishi/'+version+'/',first='n-jp1500-en-ue*r{>Er!]',second='n-jp1500-en-N*bTdF#y|q';
const key=(id:string)=>crypto.createHash('sha256').update(id).digest('hex');
const descriptor=(id:string)=>JSON.parse(fs.readFileSync('.cache/kaishi-auto/fixtures/cards/'+key(id)+'.json','utf8'));
async function records(page:Page){return page.evaluate(async()=>{
 const db=await new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open('kana-study-decks');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});try{const tx=db.transaction(['card-progress','review-events','daily-state']);return await Promise.all(['card-progress','review-events','daily-state'].map(name=>new Promise<any[]>((resolve,reject)=>{const r=tx.objectStore(name).getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);})));
 }finally{db.close();}
});}
test.beforeEach(async({page})=>{
 await page.route('**/supabase-config.js',r=>r.fulfill({contentType:'text/javascript',body:'window.__KANA_STUDY_CONFIG__={};'}));
 await page.addInitScript(()=>{const NativeAudio=window.Audio;(window as any).mediaPlayback={play:0,ended:0,pause:0};window.Audio=class extends NativeAudio{constructor(src?:string){super(src);for(const name of ['play','ended','pause'])this.addEventListener(name,()=>{(window as any).mediaPlayback[name]++;});}};});
});
test.beforeEach(async({page})=>{await page.addInitScript(()=>localStorage.setItem('kana-study.kaishi-auto-audio.v1','false'));});

test('clean profile: automatic per-card media, manual audio, default pitch, explicit opt-out and unchanged progress',async({page},info)=>{
 const requests:string[]=[],external:string[]=[];page.on('request',r=>{const u=new URL(r.url());if(u.pathname.startsWith(prefix))requests.push(u.pathname);if(u.protocol.startsWith('http')&&u.hostname!=='127.0.0.1')external.push(u.origin);});
 await page.goto('./');expect(await page.evaluate(()=>localStorage.getItem('kana-study.kaishi-pitch.v1'))).toBeNull();expect(requests).toEqual([]);
 if(info.project.name==='mobile-light'){await page.goto('./#/settings');await page.locator('.themes button').filter({hasText:'Claro'}).click();}
 await page.goto('./#/anki/japanese-1500/study');await expect(page.locator('.front h1')).toHaveText('私');expect(requests).toEqual([]);const before=await records(page);
 await page.locator('.reveal').click();const media=page.locator('app-kaishi-card-media');await expect(media.locator('img')).toBeVisible();await expect(media.locator('.pitch')).toBeVisible();await expect(media).toContainText('Recursos de prueba');
 await expect.poll(()=>media.locator('img').evaluate((e:HTMLImageElement)=>e.naturalWidth)).toBe(128);
 const data=descriptor(first);expect([...new Set(requests)].sort()).toEqual([prefix+'catalog.json',prefix+'cards/'+key(first)+'.json',prefix+data.resources.picture.path].sort());
 expect(await page.evaluate(()=>(window as any).mediaPlayback.play)).toBe(0);
 await media.getByRole('button',{name:'Reproducir palabra',exact:true}).click();await expect.poll(()=>page.evaluate(()=>(window as any).mediaPlayback.ended)).toBeGreaterThan(0);
 expect(requests).toContain(prefix+data.resources.wordAudio.path);expect(requests).not.toContain(prefix+data.resources.sentenceAudio.path);
 await media.getByRole('button',{name:'Reproducir frase',exact:true}).click();await expect.poll(()=>page.evaluate(()=>(window as any).mediaPlayback.play)).toBeGreaterThanOrEqual(2);await media.getByRole('button',{name:'Detener audio',exact:true}).click();
 expect(requests).toContain(prefix+data.resources.sentenceAudio.path);expect(await records(page)).toEqual(before);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await page.screenshot({path:`${shots}/card-${info.project.name}.png`,fullPage:true});
 await page.goto('./#/anki/japanese-1500/settings');await expect(page.locator('.pitch-option input')).toBeChecked();await expect(page.locator('.local-package')).not.toHaveAttribute('open','');
 await page.locator('.pitch-option input').uncheck();expect(await page.evaluate(()=>localStorage.getItem('kana-study.kaishi-pitch.v1'))).toBe('false');await page.screenshot({path:`${shots}/settings-${info.project.name}.png`,fullPage:true});
 await page.goto('./#/anki/japanese-1500/study');await page.locator('.reveal').click();await expect(page.locator('app-kaishi-card-media img')).toBeVisible();await expect(page.locator('app-kaishi-card-media .pitch')).toHaveCount(0);await page.reload();await page.locator('.reveal').click();await expect(page.locator('app-kaishi-card-media img')).toBeVisible();await expect(page.locator('app-kaishi-card-media .pitch')).toHaveCount(0);expect(await records(page)).toEqual(before);expect(external).toEqual([]);
});
test('missing image and failed audio remain recoverable without blank image area or autoplay',async({page})=>{
 const data=descriptor(first);let failImage=true,failAudio=true;
 await page.route('**/'+data.resources.picture.path,r=>failImage?r.fulfill({status:503,body:'unavailable'}):r.continue());
 await page.route('**/'+data.resources.wordAudio.path,r=>failAudio?r.fulfill({status:404,body:'missing'}):r.continue());
 await page.goto('./#/anki/japanese-1500/study');await page.locator('.reveal').click();const media=page.locator('app-kaishi-card-media');await expect(media.getByRole('button',{name:'Reintentar multimedia',exact:true})).toBeVisible();await expect(media.locator('figure')).toHaveCount(0);await expect(page.locator('.back-content')).toContainText('yo (general');
 failImage=false;await media.getByRole('button',{name:'Reintentar multimedia',exact:true}).click();await expect(media.locator('img')).toBeVisible();expect(await page.evaluate(()=>(window as any).mediaPlayback.play)).toBe(0);
 await media.getByRole('button',{name:'Reproducir palabra',exact:true}).click();await expect(media).toContainText('No se pudo reproducir el audio');failAudio=false;
 await media.getByRole('button',{name:'Reproducir palabra',exact:true}).click();await expect.poll(()=>page.evaluate(()=>(window as any).mediaPlayback.ended)).toBeGreaterThan(0);
});
test('a late old-card descriptor is cancelled and does not request its image or alter scheduling',async({page})=>{
 let release!:()=>void,entered!:()=>void,aborted=false;const gate=new Promise<void>(r=>release=r),seen=new Promise<void>(r=>entered=r),images:string[]=[];
 page.on('requestfailed',r=>{if(r.url().endsWith('/cards/'+key(first)+'.json'))aborted=true;});
 page.on('request',r=>{if(r.url().endsWith('.png'))images.push(new URL(r.url()).pathname);});
 await page.route('**/cards/'+key(first)+'.json',async r=>{entered();await gate;await r.fulfill({json:descriptor(first)}).catch(()=>{});});
 await page.goto('./#/anki/japanese-1500/study');await page.locator('.reveal').click();await seen;await page.locator('.good').click();await expect(page.locator('.front h1')).toHaveText('あなた');const before=await records(page);expect(before[0][0].state).toBe(1);expect(before[0][0].due-before[1][0].reviewedAt).toBe(600000);
 await page.locator('.reveal').click();await expect(page.locator('app-kaishi-card-media img')).toBeVisible();await expect.poll(()=>aborted).toBe(true);release();await expect(page.locator('app-kaishi-card-media img')).toHaveAttribute('alt',/あなた/);expect(images).not.toContain(prefix+descriptor(first).resources.picture.path);expect(await records(page)).toEqual(before);
});

test('a previous local-store image takes priority while missing local audio uses static references',async({page})=>{
 const data=descriptor(first),image=fs.readFileSync('.cache/kaishi-auto/fixtures/'+data.resources.picture.path),paths:string[]=[];
 await page.goto('./');
 await page.evaluate(async({entry,bytes,ref})=>{
  const generation='11111111-1111-4111-8111-111111111111';
  const db=await new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open('kana-study-kaishi-media-v1',1);r.onupgradeneeded=()=>{r.result.createObjectStore('meta',{keyPath:'id'});for(const name of ['links','resources'])r.result.createObjectStore(name,{keyPath:['generation','id']}).createIndex('generation','generation');};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
  try{await new Promise<void>((resolve,reject)=>{const tx=db.transaction(['meta','links','resources'],'readwrite');tx.objectStore('meta').put({id:generation,phase:'ready',count:4353,bytes:109484291,installedAt:1});tx.objectStore('meta').put({id:'active',generation});tx.objectStore('links').put({generation,id:entry,picture:['1',bytes.length,ref.path.split('/')[1].split('.')[0],'image/png']});tx.objectStore('resources').put({generation,id:'1',blob:new Blob([new Uint8Array(bytes)],{type:'image/png'})});tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error);});}finally{db.close();}
 },{entry:first,bytes:[...image],ref:data.resources.picture});
 page.on('request',r=>{if(new URL(r.url()).pathname.startsWith(prefix))paths.push(new URL(r.url()).pathname);});
 await page.goto('./#/anki/japanese-1500/study');await page.locator('.reveal').click();await expect(page.locator('app-kaishi-card-media img')).toBeVisible();await expect(page.getByRole('button',{name:'Reproducir palabra',exact:true})).toBeVisible();expect(paths).not.toContain(prefix+data.resources.picture.path);expect(paths.filter(p=>p.endsWith('.wav'))).toEqual([]);
 await page.getByRole('button',{name:'Reproducir palabra',exact:true}).click();await expect.poll(()=>page.evaluate(()=>(window as any).mediaPlayback.ended)).toBeGreaterThan(0);expect(paths).toContain(prefix+data.resources.wordAudio.path);expect((await records(page))[0]).toEqual([]);
});
