// Manual-only regression; default automatic playback is covered by mazos-roadmap.
import {test,expect} from '@playwright/test';
test.beforeEach(async({page})=>{await page.addInitScript(()=>localStorage.setItem('kana-study.kaishi-auto-audio.v1','false'));});

test('original media loads automatically on reveal in a clean profile; audio is manual and progress remains unchanged',async({page},info)=>{
 const paths:string[]=[];
 page.on('request',r=>{if(r.url().includes('/assets/kaishi/'))paths.push(new URL(r.url()).pathname);});
 await page.addInitScript(()=>{const Native=window.Audio;(window as any).audioPlays=0;window.Audio=class extends Native{constructor(src?:string){super(src);this.addEventListener('play',()=>{(window as any).audioPlays++;});}};});
 await page.goto('./');
 if(info.project.name==='mobile-light'){await page.goto('./#/settings');await page.locator('.themes button').filter({hasText:'Claro'}).click();}
 await page.goto('./#/anki/japanese-1500/study');await expect(page.locator('.front h1')).toHaveText('私');expect(paths).toEqual([]);
 const snapshot=()=>page.evaluate(async()=>{const db=await new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open('kana-study-decks');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});try{const names=['card-progress','review-events','daily-state'],tx=db.transaction(names);return await Promise.all(names.map(name=>new Promise<unknown>((resolve,reject)=>{const r=tx.objectStore(name).getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);})));}finally{db.close();}});
 const before=await snapshot();await page.locator('.reveal').click();const media=page.locator('app-kaishi-card-media');
 await expect(media.locator('img')).toBeVisible();await expect.poll(()=>media.locator('img').evaluate((e:HTMLImageElement)=>e.naturalWidth)).toBeGreaterThan(0);
 await expect(media.locator('.pitch')).toBeVisible();await expect(media).not.toContainText('Recursos de prueba');expect(await page.evaluate(()=>(window as any).audioPlays)).toBe(0);
 expect(paths.filter(p=>p.includes('/resources/'))).toHaveLength(1);
 await media.getByRole('button',{name:'Reproducir palabra',exact:true}).click();await expect.poll(()=>page.evaluate(()=>(window as any).audioPlays)).toBe(1);
 await media.getByRole('button',{name:'Reproducir frase',exact:true}).click();await expect.poll(()=>page.evaluate(()=>(window as any).audioPlays)).toBe(2);
 expect(paths.filter(p=>p.endsWith('.mp3'))).toHaveLength(2);expect(await snapshot()).toEqual(before);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await page.screenshot({path:(process.env['KAISHI_AUTO_EVIDENCE_DIR']??'.cache/kaishi-auto')+'/original-'+info.project.name+'.png',fullPage:true});
 await page.goto('./#/anki/japanese-1500/settings');await expect(page.locator('.kaishi-credits')).toContainText('Donkuri');await expect(page.locator('.local-package')).not.toHaveAttribute('open','');
});
