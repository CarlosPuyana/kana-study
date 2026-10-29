import {test,expect,Page} from '@playwright/test';
import fs from 'node:fs';
import crypto from 'node:crypto';
const root='public/assets/kaishi/esp-v1-3fdaef081150-r2/';
const descriptor=(id:string)=>JSON.parse(fs.readFileSync(root+'cards/'+crypto.createHash('sha256').update(id).digest('hex')+'.json','utf8'));
const first=descriptor('n-jp1500-en-ue*r{>Er!]');
test.beforeEach(async({page},info)=>{
 await page.clock.setFixedTime(new Date('2026-10-29T11:00:00Z'));
 const language=info.project.name.includes('-en-')?'en':info.project.name.includes('-ca-')?'ca':'es';
 const theme=info.project.name.endsWith('nora-dark')?'nora-dark':info.project.name.endsWith('light')?'light':info.project.name.endsWith('nora')?'nora':info.project.name.endsWith('anime')?'anime':'dark';
 await page.addInitScript(({language,theme})=>{
  localStorage.setItem('kana-study.settings.v1',JSON.stringify({language,theme}));
  const Native=window.Audio;(window as any).clips=[];
  window.Audio=class extends Native{constructor(src?:string){super(src);for(const type of ['play','ended','pause'])this.addEventListener(type,()=>{(window as any).clips.push(type);});}};
 },{language,theme});
});
async function prepare(page:Page,n=1){
 await page.goto('./#/anki/japanese-1500/settings');await page.locator('.auto-audio-option input').uncheck();await page.locator('input[type=number]').fill(String(n));await page.locator('.save-button').click();await expect(page.locator('.save-row [role=status]')).toBeVisible();
 await page.goto('./#/anki/japanese-1500/study');
 for(let i=0;i<n*3;i++){await page.locator('.reveal').click();await page.locator(i<n?'.again':'.good').click();}
 await expect(page.locator('.difficulties li')).toHaveCount(n);
}
async function state(page:Page){return page.evaluate(async()=>{
 const result:Record<string,unknown>={};for(const {name}of await indexedDB.databases()){
  if(!name||name.includes('kaishi'))continue;
  const db=await new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open(name);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
  try{const names=[...db.objectStoreNames];if(!names.length)continue;const tx=db.transaction(names);result[name]=await Promise.all(names.map(n=>new Promise(resolve=>{const r=tx.objectStore(n).getAll();r.onsuccess=()=>resolve([n,r.result]);})));}finally{db.close();}
 }return {databases:result,local:Object.fromEntries(Object.entries(localStorage).sort()),session:Object.fromEntries(Object.entries(sessionStorage).sort())};
});}
async function accessible(page:Page,fit=false){
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 const b=await page.locator('.practice-primary').boundingBox();expect(b).not.toBeNull();expect(b!.y).toBeGreaterThanOrEqual(0);expect(b!.y+b!.height).toBeLessThanOrEqual(page.viewportSize()!.height+1);expect(b!.height).toBeGreaterThanOrEqual(44);
 if(fit)expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1)).toBe(true);
}
test('multiple words loop in ranking order for three passes, with native Space and coherent focus',async({page})=>{
 await prepare(page,2);const words=await page.locator('.practice-selection strong').allTextContents();
 // Reselecting must not change ranking order.
 await page.locator('.practice-selection input').first().uncheck();await page.locator('.practice-selection input').first().check();const before=await state(page);
 await page.locator('.practice-start').click();await expect(page.locator('.practice-primary')).toBeFocused();await expect(page.locator('.practice-word')).toHaveText(words[0]);
 await expect(page.locator('.study-header,[role=timer]')).toHaveCount(0);await expect(page.locator('.practice-position')).toHaveText(/^1 (de|of) 2$/);
 await page.keyboard.press('Space');await expect(page.locator('.practice-meaning')).toBeVisible();
 const translation=page.locator('.practice-translation summary');await translation.focus();await page.keyboard.press('Space');await expect(page.locator('.practice-translation')).toHaveAttribute('open','');await expect(page.locator('.practice-position')).toHaveText(/^1 (de|of) 2$/);
 const audio=page.locator('.audio-button').first();await audio.focus();await page.keyboard.press('Space');await expect.poll(()=>page.evaluate(()=>(window as any).clips.filter((x:string)=>x==='play').length)).toBe(1);await expect(page.locator('.practice-position')).toHaveText(/^1 (de|of) 2$/);
 await page.locator('.practice-primary').focus();await page.keyboard.down('Space');await page.keyboard.down('Space');await page.keyboard.up('Space');
 await expect(page.locator('.practice-word')).toHaveText(words[1]);await expect(page.locator('.practice-position')).toHaveText(/^2 (de|of) 2$/);await expect(page.locator('app-kaishi-card-media')).toHaveCount(0);await expect(page.locator('.practice-primary')).toBeFocused();
 // The document shortcut handles a noninteractive target, once per key press.
 await page.locator('.practice-word').click();await page.keyboard.down('Space');await page.keyboard.down('Space');await page.keyboard.up('Space');await expect(page.locator('.practice-meaning')).toBeVisible();await expect(page.locator('.practice-position')).toHaveText(/^2 (de|of) 2$/);
 await page.locator('.practice-primary').click();await expect(page.locator('.practice-word')).toHaveText(words[0]);await expect(page.locator('.practice-position')).toHaveText(/^1 (de|of) 2$/);await expect(page.locator('app-kaishi-card-media,.practice-end,.practice-restart,.practice-close')).toHaveCount(0);await expect(page.locator('.practice-primary')).toBeFocused();
 for(let pass=0;pass<2;pass++)for(let i=0;i<2;i++){await expect(page.locator('.practice-word')).toHaveText(words[i]);await expect(page.locator('.practice-position')).toHaveText(new RegExp('^'+(i+1)+' (de|of) 2$'));await page.locator('.practice-primary').click();await page.locator('.practice-primary').click();}
 expect(await state(page)).toEqual(before);await page.locator('.practice-exit').click();await expect(page.locator('.practice-start')).toBeFocused();await expect(page.locator('.difficulties li')).toHaveCount(2);expect(await state(page)).toEqual(before);
 await page.reload();await expect(page.locator('app-deck-intensive-practice')).toHaveCount(0);await expect(page.locator('.difficulties li')).toHaveCount(2);expect(await state(page)).toEqual(before);
});
test('one word starts fresh autoaudio on each appearance, remains silent on the front and exits safely',async({page})=>{
 await prepare(page);await page.goto('./#/anki/japanese-1500/settings');await page.locator('.auto-audio-option input').check();await page.goto('./#/anki/japanese-1500/study');await expect(page.locator('.practice-start')).toBeVisible();const before=await state(page);
 await page.locator('.practice-start').click();await page.locator('.practice-primary').click();
 await expect.poll(()=>page.evaluate(()=>(window as any).clips.filter((x:string)=>x==='ended').length)).toBe(2);
 expect(await page.evaluate(()=>(window as any).clips.filter((x:string)=>x==='play'||x==='ended'))).toEqual(['play','ended','play','ended']);
 await page.locator('.practice-primary').click();await expect(page.locator('app-kaishi-card-media')).toHaveCount(0);await expect(page.locator('.practice-position')).toHaveText(/^1 (de|of) 1$/);expect(await page.evaluate(()=>(window as any).clips.filter((x:string)=>x==='play').length)).toBe(2);
 await page.locator('.practice-primary').click();await expect.poll(()=>page.evaluate(()=>(window as any).clips.filter((x:string)=>x==='ended').length)).toBe(4);
 await page.locator('.practice-primary').click();await expect(page.locator('app-kaishi-card-media')).toHaveCount(0);await page.locator('.practice-primary').click();await expect.poll(()=>page.evaluate(()=>(window as any).clips.filter((x:string)=>x==='play').length)).toBe(5);
 await page.locator('.practice-exit').click();await expect(page.locator('.difficulties')).toBeVisible();await expect(page.locator('.practice-start')).toBeFocused();expect(await state(page)).toEqual(before);await expect.poll(()=>page.evaluate(()=>(window as any).clips.filter((x:string)=>x==='pause').length)).toBeGreaterThan(0);
});
test('advancing aborts an audio download, cancels its queued sentence and another pass starts cleanly',async({page})=>{
 await prepare(page);await page.goto('./#/anki/japanese-1500/settings');await page.locator('.auto-audio-option input').check();await page.goto('./#/anki/japanese-1500/study');const before=await state(page);
 let held:any,aborted=false;const requests:string[]=[];page.on('request',r=>requests.push(r.url()));page.on('requestfailed',r=>{if(r.url().endsWith(first.resources.wordAudio.path))aborted=true;});
 await page.route('**/'+first.resources.wordAudio.path,r=>{held=r;});await page.locator('.practice-start').click();await page.locator('.practice-primary').click();await expect.poll(()=>!!held).toBe(true);
 await page.locator('.practice-primary').click();await expect(page.locator('app-kaishi-card-media')).toHaveCount(0);await expect(page.locator('.practice-position')).toHaveText(/^1 (de|of) 1$/);await expect.poll(()=>aborted).toBe(true);await held.continue().catch(()=>{});
 expect(requests.some(u=>u.endsWith(first.resources.sentenceAudio.path))).toBe(false);expect(await state(page)).toEqual(before);
 await page.unroute('**/'+first.resources.wordAudio.path);await expect(page.locator('app-kaishi-card-media')).toHaveCount(0);await page.locator('.practice-primary').click();await expect.poll(()=>page.evaluate(()=>(window as any).clips.filter((x:string)=>x==='ended').length)).toBe(2);expect(await state(page)).toEqual(before);
});
test('practice layout, open translation and zoom retain readable content and accessible actions',async({page},info)=>{
 await prepare(page);await page.locator('.practice-start').click();await page.locator('.practice-primary').click();await expect(page.locator('.practice-card img')).toBeVisible();
 await accessible(page,info.project.name.startsWith('laptop')||info.project.name.startsWith('mobile'));
 const img=page.locator('.practice-card img');expect(await img.evaluate((e:HTMLImageElement)=>getComputedStyle(e).objectFit)).toBe('contain');
 const audio=await page.locator('.audio-button').first().boundingBox();expect(audio!.width).toBeGreaterThanOrEqual(44);expect(audio!.height).toBeGreaterThanOrEqual(44);
 await page.locator('.practice-translation summary').click();
 // Explicit layout-only stress fixture; the catalog and persisted data are untouched.
 await page.locator('.practice-translation p').evaluate(el=>el.append(' Texto extenso de prueba de maquetación. '.repeat(12)));await page.evaluate(()=>document.documentElement.style.zoom='2');await accessible(page);await page.locator('.practice-translation p').scrollIntoViewIfNeeded();await accessible(page);
 await page.screenshot({path:'.cache/deck-continuous/zoom-'+info.project.name+'.png',fullPage:true});
});
