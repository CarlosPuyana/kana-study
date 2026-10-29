// Manual-only regression; default automatic playback is covered by mazos-roadmap.
import {copyFileSync,mkdtempSync,openSync,writeSync,closeSync,unlinkSync,rmdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {test,expect,Page} from '@playwright/test';
const path=process.env['KAISHI_MEDIA_PACKAGE'];
const evidence=process.env['KAISHI_MEDIA_EVIDENCE_DIR']??'.cache/kaishi-media1';
async function readStores(page:Page,name:string,stores:string[]){return page.evaluate(async({name,stores})=>{
 const db=await new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open(name);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.onupgradeneeded=()=>{r.transaction?.abort();reject(new Error('Expected an existing database'));};});
 try{const tx=db.transaction(stores,'readonly');return await Promise.all(stores.map(store=>new Promise<any[]>((resolve,reject)=>{const r=tx.objectStore(store).getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);})));
 }finally{db.close();}
},{name,stores});}
async function snapshot(page:Page){const [rows]=await readStores(page,'kana-study-kaishi-media-v1',['meta']);const generation=rows.find(v=>v.id==='active')?.generation;return {active:rows.find(v=>v.id===generation)??null};}
async function studyRecords(page:Page){const [progress,events]=await readStores(page,'kana-study-decks',['card-progress','review-events']);return {progress,events};}
test.beforeEach(async({page})=>{await page.addInitScript(()=>localStorage.setItem('kana-study.kaishi-auto-audio.v1','false'));});

test('real pinned package: cancellation, installation, back media, offline playback and removal preserve study',async({page,context},info)=>{
 if(!path)throw Error('Set KAISHI_MEDIA_PACKAGE to the authorized local Kaishi ESP v1.0.1 APKG; no package is bundled with tests.');
 const external:string[]=[];
 await page.route('**/*',r=>{const url=new URL(r.request().url());if(url.hostname==='127.0.0.1')return r.continue();external.push(url.origin);return r.abort();});
 // This regression explicitly tests the existing local installation when static hosting is unavailable.
 await page.route('**/assets/kaishi/**',r=>r.fulfill({status:503,body:'static media unavailable'}));
 await page.route('**/supabase-config.js',r=>r.fulfill({contentType:'text/javascript',body:'window.__KANA_STUDY_CONFIG__ = {};'}));
 await page.addInitScript(()=>{localStorage.setItem('kana-study.settings.v1',JSON.stringify({language:'es',theme:matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'}));const NativeAudio=window.Audio;(window as any).kaishiPlayback={play:0,ended:0,pause:0};window.Audio=class extends NativeAudio{constructor(src?:string){super(src);for(const name of ['play','ended','pause'])this.addEventListener(name,()=>{(window as any).kaishiPlayback[name]++;});}};});
 await page.goto('./#/anki/japanese-1500/study');await expect(page.locator('.front h1')).toBeVisible();await expect(page.locator('app-kaishi-card-media')).toHaveCount(0);
 await page.locator('.reveal').click();await expect(page.locator('app-kaishi-card-media')).toHaveCount(1);await expect(page.locator('app-kaishi-card-media .audio-button')).toHaveCount(0);
 await page.locator('.good').click();await expect(page.locator('.front h1')).toHaveText('あなた');
 const studyBefore=await studyRecords(page);
 await page.goto('./#/anki/japanese-1500/settings');const settings=page.locator('app-kaishi-media-settings');await settings.locator('summary').click();await expect(settings.locator('input[type=file]')).toBeVisible();
 await settings.locator('input[type=file]').setInputFiles({name:'different.apkg',mimeType:'application/zip',buffer:Buffer.from('not the supported package')});await expect(settings.locator('[role=alert]')).toContainText('incompatible');
 await settings.locator('input[type=file]').setInputFiles(path);await expect(settings.locator('progress')).toBeVisible({timeout:30000});await expect.poll(async()=>Number(await settings.locator('progress').getAttribute('value')),{timeout:30000}).toBeGreaterThan(0);await page.screenshot({path:`${evidence}/importing-${info.project.name}.png`,fullPage:true});await settings.getByRole('button',{name:'Cancelar importación',exact:true}).click();await expect(settings).toContainText('Importación cancelada');expect((await snapshot(page)).active).toBeNull();
 await settings.locator('input[type=file]').setInputFiles(path);await expect(settings.locator('.installed')).toBeVisible({timeout:120000});const installed=await snapshot(page);expect(installed.active).toMatchObject({phase:'ready',count:4353,bytes:109484291});
 await settings.locator('.pitch-option input').check();await page.screenshot({path:`${evidence}/installed-${info.project.name}.png`,fullPage:true});
 await page.reload();await settings.locator('summary').click();await expect(settings.locator('.installed')).toBeVisible();expect((await snapshot(page)).active?.id).toBe(installed.active?.id);await expect(settings.locator('.pitch-option input')).toBeChecked();
 const temporary=mkdtempSync(join(tmpdir(),'kana-kaishi-test-')),modified=join(temporary,'modified.apkg');
 try{copyFileSync(path,modified);const fd=openSync(modified,'r+');try{writeSync(fd,Buffer.from([0]),0,1,0);}finally{closeSync(fd);}
  await settings.locator('input[type=file]').setInputFiles(modified);await expect(settings.locator('[role=alert]')).toContainText('incompatible',{timeout:30000});expect((await snapshot(page)).active?.id).toBe(installed.active?.id);
 }finally{unlinkSync(modified);rmdirSync(temporary);}
 await settings.locator('input[type=file]').setInputFiles(path);await expect(settings.locator('progress')).toBeVisible({timeout:30000});await expect.poll(async()=>Number(await settings.locator('progress').getAttribute('value')),{timeout:30000}).toBeGreaterThan(0);await page.reload();await settings.locator('summary').click();await expect(settings.locator('.installed')).toBeVisible();expect((await snapshot(page)).active?.id).toBe(installed.active?.id);
 const [interrupted]=await readStores(page,'kana-study-kaishi-media-v1',['meta']);expect(interrupted.filter(v=>v.phase==='installing')).toHaveLength(0);
 await settings.locator('input[type=file]').setInputFiles(path);await expect(settings.locator('progress')).toBeVisible({timeout:30000});await expect.poll(async()=>Number(await settings.locator('progress').getAttribute('value')),{timeout:30000}).toBeGreaterThan(0);await settings.getByRole('button',{name:'Cancelar importación',exact:true}).click();await expect(settings).toContainText('Importación cancelada');expect((await snapshot(page)).active?.id).toBe(installed.active?.id);
 // A successful reimport must keep the old copy active until publication and reclaim it afterwards.
 const previous=(await snapshot(page)).active?.id;
 await settings.locator('input[type=file]').setInputFiles(path);await expect.poll(async()=>Number(await settings.locator('progress').getAttribute('value')),{timeout:30000}).toBeGreaterThan(0);
 expect((await snapshot(page)).active?.id).toBe(previous);
 await expect.poll(async()=>(await snapshot(page)).active?.id,{timeout:120000}).not.toBe(previous);
 await expect.poll(()=>page.evaluate(async()=>{const db=await new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open('kana-study-kaishi-media-v1');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});try{return await new Promise<number>((resolve,reject)=>{const r=db.transaction('resources').objectStore('resources').count();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}finally{db.close();}}),{timeout:30000}).toBe(4353);
 await expect(settings.locator('.pitch-option input')).toBeChecked();
 await page.evaluate(()=>{location.hash='/anki';});await expect(page.locator('app-anki-page')).toBeVisible();
 await page.evaluate(()=>{location.hash='/anki/japanese-1500/study';});await expect(page.locator('.front h1')).toBeVisible();await expect(page.locator('app-kaishi-card-media')).toHaveCount(0);
 await context.setOffline(true);await page.locator('.reveal').click();const back=page.locator('app-kaishi-card-media');await expect(back.getByRole('button',{name:'Reproducir palabra',exact:true})).toBeVisible();await expect(back.getByRole('button',{name:'Reproducir frase',exact:true})).toBeVisible();await expect(back.locator('img')).toBeVisible();await expect(back.locator('.pitch')).toBeVisible();
 await expect.poll(()=>back.locator('img').evaluate((e:HTMLImageElement)=>e.naturalWidth)).toBeGreaterThan(0);
 await back.getByRole('button',{name:'Reproducir palabra',exact:true}).click();await expect.poll(()=>page.evaluate(()=>(window as any).kaishiPlayback.ended)).toBeGreaterThan(0);
 await back.getByRole('button',{name:'Reproducir frase',exact:true}).click();await expect.poll(()=>page.evaluate(()=>(window as any).kaishiPlayback.play)).toBeGreaterThanOrEqual(2);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await page.screenshot({path:`${evidence}/back-${info.project.name}.png`,fullPage:true});
 await page.locator('.back').click();await expect(page.locator('app-anki-page')).toBeVisible();await expect.poll(()=>page.evaluate(()=>(window as any).kaishiPlayback.pause)).toBeGreaterThan(0);
 await context.setOffline(false);await page.goto('./#/anki/japanese-1500/settings');await settings.locator('summary').click();await expect(settings.locator('.installed')).toBeVisible();await settings.getByRole('button',{name:'Eliminar medios locales',exact:true}).click();await expect(settings.locator('.installed')).toHaveCount(0);
 await settings.locator('input[type=file]').setInputFiles(path);await expect(settings.locator('.installed')).toBeVisible({timeout:120000});expect((await snapshot(page)).active?.id).not.toBe(installed.active?.id);
 await page.goto('./#/anki/japanese-1500/study');await expect(page.locator('.front h1')).toBeVisible();const studyAfter=await studyRecords(page);expect(studyAfter).toEqual(studyBefore);expect(external).toEqual([]);
});
