import {test,expect,Page} from '@playwright/test';
import fs from 'node:fs';
import crypto from 'node:crypto';
const root='public/assets/kaishi/esp-v1-3fdaef081150-r2/';
const card=(id:string)=>JSON.parse(fs.readFileSync(root+'cards/'+crypto.createHash('sha256').update(id).digest('hex')+'.json','utf8'));
const first=card('n-jp1500-en-ue*r{>Er!]');
test.beforeEach(async({page},info)=>{
 await page.clock.setFixedTime(new Date('2026-10-29T11:00:00Z'));
 const language=info.project.name.includes('-en-')?'en':info.project.name.includes('-ca-')?'ca':'es';
 const theme=info.project.name.endsWith('nora-dark')?'nora-dark':info.project.name.endsWith('light')?'light':info.project.name.endsWith('nora')?'nora':info.project.name.endsWith('anime')?'anime':'dark';
 await page.addInitScript(({language,theme})=>{
  localStorage.setItem('kana-study.settings.v1',JSON.stringify({language,theme}));
  const Native=window.Audio;(window as any).clips=[];(window as any).players=0;
  window.Audio=class extends Native{constructor(src?:string){super(src);(window as any).players++;for(const type of ['play','ended','pause'])this.addEventListener(type,()=>{(window as any).clips.push({type,src:this.src});});}};
 },{language,theme});
});
async function counts(page:Page,n:number,r:number,v:number){await expect(page.locator('.count-new b')).toHaveText(String(n));await expect(page.locator('.count-repeat b')).toHaveText(String(r));await expect(page.locator('.count-review b')).toHaveText(String(v));}
async function records(page:Page){return page.evaluate(async()=>{
 const result:Record<string,unknown>={};
 for(const {name} of await indexedDB.databases()){
  if(!name||name.includes('kaishi'))continue;
  const db=await new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open(name);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
  try{const stores=[...db.objectStoreNames];if(!stores.length)continue;const tx=db.transaction(stores);result[name]=await Promise.all(stores.map(store=>new Promise(resolve=>{const r=tx.objectStore(store).getAll();r.onsuccess=()=>resolve([store,r.result]);})));}finally{db.close();}
 }
 return result;
});}
async function geometry(page:Page,fit=false){
 const overflow=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,items:[...document.querySelectorAll('main *')].map(el=>({tag:el.tagName,cls:el.className,left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right})).filter(b=>b.right>innerWidth+1||b.left< -1).slice(0,15)}));expect(overflow.scroll,JSON.stringify(overflow)).toBeLessThanOrEqual(overflow.width+1);
 for(const el of await page.locator('.ratings button').all()){
  const b=await el.boundingBox();expect(b).not.toBeNull();expect(b!.y).toBeGreaterThanOrEqual(0);expect(b!.y+b!.height).toBeLessThanOrEqual(page.viewportSize()!.height+1);expect(b!.height).toBeGreaterThanOrEqual(44);
 }
 if(fit)expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1)).toBe(true);
}
test('default automatic word then sentence, compact original back, manual controls and persisted opt-out',async({page},info)=>{
 const requests:string[]=[];page.on('request',r=>{if(r.url().includes('/assets/kaishi/'))requests.push(r.url());});
 await page.goto('./#/anki/japanese-1500/study');await expect(page.locator('.front h1')).toHaveText('私');expect(requests).toEqual([]);await counts(page,10,0,0);const before=await records(page);
 // Keyboard reveal exercises the browser gesture path as well as the click cases below.
 await page.locator('body').click({position:{x:2,y:2}});await page.keyboard.press('Space');await expect(page.locator('.back-content')).toBeVisible();
 await expect.poll(()=>page.evaluate(()=>(window as any).clips.filter((x:any)=>x.type==='ended').length)).toBe(2);
 const clips=await page.evaluate(()=>(window as any).clips.filter((x:any)=>['play','ended'].includes(x.type)));
 expect(clips.map((x:any)=>x.type)).toEqual(['play','ended','play','ended']);expect(await page.evaluate(()=>(window as any).players)).toBe(1);
 expect(requests.filter(p=>p.includes('/cards/'))).toHaveLength(1);expect(requests.filter(p=>p.endsWith('.mp3'))).toHaveLength(2);expect(await records(page)).toEqual(before);
 await expect(page.locator('app-kaishi-card-media img')).toBeVisible();await expect(page.locator('.notes')).not.toHaveAttribute('open','');
 await geometry(page,info.project.name.startsWith('laptop')||info.project.name.startsWith('mobile'));
 await page.screenshot({path:'.cache/mazos-roadmap/back-'+info.project.name+'.png',fullPage:true});
 const audio=page.locator('.audio-button').first();const box=await audio.boundingBox();expect(box!.width).toBeGreaterThanOrEqual(44);await audio.click();await expect.poll(()=>page.evaluate(()=>(window as any).clips.filter((x:any)=>x.type==='play').length)).toBe(3);
 await page.goto('./#/anki/japanese-1500/settings');await expect(page.locator('.auto-audio-option input')).toBeChecked();await page.locator('.auto-audio-option input').uncheck();
 await page.reload();await expect(page.locator('.auto-audio-option input')).not.toBeChecked();await expect(page.locator('.pitch-option input')).toBeChecked();
 await page.goto('./#/anki/japanese-1500/study');await page.locator('.reveal').click();await expect(page.locator('app-kaishi-card-media img')).toBeVisible();expect(await page.evaluate(()=>(window as any).clips.filter((x:any)=>x.type==='play').length)).toBe(0);
});
test('future repeats survive reload and Space on Undo retains native behaviour',async({page})=>{
 await page.goto('./#/anki/japanese-1500/study');await page.locator('.reveal').click();await page.locator('.again').click();await counts(page,9,1,0);
 await expect(page.locator('.front h1')).toHaveText('あなた');await page.locator('.undo').focus();await page.keyboard.press('Space');await expect(page.locator('.front h1')).toHaveText('私');await counts(page,10,0,0);await expect(page.locator('.back-content')).toHaveCount(0);
 await page.locator('.reveal').click();await page.locator('.good').click();await counts(page,9,1,0);await page.reload();await counts(page,9,1,0);
});
test('daily ranking, adjustable selection and intensive blocks leave every normal store unchanged',async({page},info)=>{
 await page.goto('./#/anki/japanese-1500/settings');await page.locator('.auto-audio-option input').uncheck();await page.locator('input[type=number]').fill('1');await page.locator('.save-button').click();await expect(page.locator('.save-row [role=status]')).toBeVisible();
 await page.goto('./#/anki/japanese-1500/study');
 for(const rating of ['again','again','good','good']){await page.locator('.reveal').click();await page.locator('.'+rating).click();}
 await expect(page.locator('.difficulties li')).toHaveCount(1);await expect(page.locator('.difficulties li')).toContainText('2');await counts(page,0,0,0);
 await page.reload();await expect(page.locator('.difficulties li')).toHaveCount(1);
 await page.screenshot({path:'.cache/mazos-roadmap/results-'+info.project.name+'.png',fullPage:true});
 const selection=page.locator('.practice-selection input');await selection.uncheck();await expect(page.locator('.practice-start')).toBeDisabled();await selection.check();
 const before=await records(page);await page.locator('.practice-start').click();
 for(let i=0;i<20;i++){await page.locator('.practice-reveal').click();await page.locator('.practice-again').click();}
 await expect(page.locator('.practice-continue')).toBeVisible();expect(await records(page)).toEqual(before);await page.locator('.practice-continue').click();
 for(let i=0;i<2;i++){await page.locator('.practice-reveal').click();await page.locator('.practice-good').click();}
 await expect(page.locator('.practice-close')).toBeVisible();await expect(page.locator('.practice-continue')).toHaveCount(0);expect(await records(page)).toEqual(before);
 await page.screenshot({path:'.cache/mazos-roadmap/practice-'+info.project.name+'.png',fullPage:true});await page.locator('.practice-close').click();await expect(page.locator('.difficulties li')).toHaveCount(1);expect(await records(page)).toEqual(before);
});
test('image failure cannot delay autoaudio; browser denial has manual recovery and no automatic retry',async({page})=>{
 await page.route('**/'+first.resources.picture.path,r=>r.fulfill({status:503,body:'image unavailable'}));
 await page.addInitScript(()=>{const play=HTMLMediaElement.prototype.play;(window as any).denied=true;(window as any).attempts=0;HTMLMediaElement.prototype.play=function(){(window as any).attempts++;return (window as any).denied?Promise.reject(new DOMException('blocked','NotAllowedError')):play.call(this);};});
 await page.goto('./#/anki/japanese-1500/study');await page.locator('.reveal').click();await expect(page.locator('app-kaishi-card-media')).toContainText(/bloque|blocked/);expect(await page.evaluate(()=>(window as any).attempts)).toBe(1);await expect(page.locator('figure')).toHaveCount(0);
 await page.getByRole('button',{name:/Reintentar multimedia|Retry media|Torna a provar/}).click();await expect(page.locator('app-kaishi-card-media .media-status[role=status]').filter({hasText:/Preparando|Preparing|Preparant/})).toHaveCount(0);expect(await page.evaluate(()=>(window as any).attempts)).toBe(1);
 await page.evaluate(()=>(window as any).denied=false);await page.locator('.audio-button').first().click();await expect.poll(()=>page.evaluate(()=>(window as any).clips.filter((x:any)=>x.type==='ended').length)).toBe(1);expect(await page.evaluate(()=>(window as any).attempts)).toBe(2);
});
test('long content and CSS zoom 200 percent retain document scrolling and reachable actions',async({page},info)=>{
 await page.goto('./#/anki/japanese-1500/study');await page.locator('.reveal').click();await expect(page.locator('app-kaishi-card-media img')).toBeVisible();
 await page.locator('.notes summary').click();await page.locator('.translation-toggle').click();await page.evaluate(()=>{document.documentElement.style.zoom='2';});
 await geometry(page);await page.locator('.notes p').scrollIntoViewIfNeeded();await geometry(page);await expect(page.locator('.notes p')).toBeVisible();
 await page.screenshot({path:'.cache/mazos-roadmap/zoom-'+info.project.name+'.png',fullPage:true});
});

test('answering aborts slow audio and hiding cancels a queued sentence without restarting on return',async({page})=>{
 let held:any;let wordRequested=false;
 await page.route('**/'+first.resources.wordAudio.path,r=>{held=r;wordRequested=true;});
 const requests:string[]=[];page.on('request',r=>requests.push(r.url()));
 await page.goto('./#/anki/japanese-1500/study');await page.locator('.reveal').click();await expect.poll(()=>wordRequested).toBe(true);
 await expect(page.locator('app-kaishi-card-media .media-status').filter({hasText:/Preparando|Preparing|Preparant/})).toBeVisible();
 expect(await page.evaluate(()=>(window as any).clips.filter((x:any)=>x.type==='play').length)).toBe(0);
 await page.locator('.again').click();await expect(page.locator('.front h1')).toHaveText('あなた');await held.continue().catch(()=>{});
 expect(requests.some(u=>u.endsWith(first.resources.sentenceAudio.path))).toBe(false);
 await page.unroute('**/'+first.resources.wordAudio.path);await page.locator('.undo').click();await page.locator('.reveal').click();
 await expect.poll(()=>page.evaluate(()=>(window as any).clips.filter((x:any)=>x.type==='play').length)).toBe(1);
 // Deterministic visibility event; a physical backgrounded Safari/iOS tab remains manual QA.
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
 await expect(page.locator('.stop-audio')).toHaveCount(0);
 await page.evaluate(()=>{Reflect.deleteProperty(document,'hidden');document.dispatchEvent(new Event('visibilitychange'));});
 await page.locator('.audio-button').first().click();await expect.poll(()=>page.evaluate(()=>(window as any).clips.filter((x:any)=>x.type==='ended').length)).toBe(1);
 expect(requests.some(u=>u.endsWith(first.resources.sentenceAudio.path))).toBe(false);
});
