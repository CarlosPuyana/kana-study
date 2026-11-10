import {test,expect,Page,chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
const BASE='2026-11-09T12:00:00.000Z';
export async function configure(page:Page,name:string){
 await page.route('**/supabase-config.js',r=>r.fulfill({contentType:'text/javascript',body:'window.__KANA_STUDY_CONFIG__={};'}));await page.route('**/*.supabase.co/**',r=>r.abort());
 await page.addInitScript(({language,theme})=>localStorage.setItem('kana-study.settings.v1',JSON.stringify({language,theme})),{language:name.includes('-en-')?'en':name.includes('-ca-')?'ca':'es',theme:name.includes('light')?'light':'dark'});
}
async function seed(page:Page,delay=120000,complete=false){
 await page.locator('app-kanji-page').evaluate((node,{delay,complete})=>{
  const c=(window as any).ng.getComponent(node),p=c.progress,now=Date.now(),at=new Date(now-1000).toISOString();
  const progress=Object.fromEntries(p.activeUnits().map((u:any,i:number)=>[u.key,{...u,fsrs:{due:new Date(now+(i?3*86400000:delay)).toISOString(),stability:1,difficulty:5,elapsedDays:0,scheduledDays:0,learningSteps:0,reps:1,lapses:0,state:'learning',lastReview:at},firstSeenAt:at,lastSeenAt:at,totalAttempts:1,totalFirstTrySuccesses:1,totalFailures:0,lastRating:'good'}]));
  p.storage.set('kana-study.kanji-progress.v1',progress);p.storage.cloudRevision.update((n:number)=>n+1);
  if(complete)c.daily.history.record({module:'kanji',sessionId:'k1-browser-daily',completedAt:new Date().toISOString(),mode:'self-assessment',exercisesCompleted:10,firstTrySuccesses:9,attempts:11,needsPracticeCount:1,durationSeconds:30});
 },{delay,complete});
 await page.clock.runFor(20);
}
const state=(page:Page)=>page.locator('app-kanji-availability-notice').first().evaluate(node=>(window as any).ng.getComponent(node).availability.state());
test.beforeEach(async({page},info)=>{await configure(page,info.project.name);await page.clock.install({time:new Date(BASE)});await page.goto('./#/kanji');await expect(page.locator('.play-button')).toBeEnabled();await page.clock.pauseAt(new Date(Date.parse(BASE)+60000));});
test('exact deadline updates home and start panel without reload or stored-date changes',async({page},info)=>{
 await page.locator('.play-button').click();await page.clock.runFor(20);await seed(page);await expect(page.locator('app-kanji-start-panel .mode').first()).toBeDisabled();
 const before=await page.evaluate(()=>localStorage.getItem('kana-study.kanji-progress.v1'));await page.clock.runFor(119979);expect((await state(page)).due).toBe(0);
 await page.clock.runFor(1);expect((await state(page)).due).toBe(1);await page.clock.runFor(20);await expect(page.locator('app-kanji-start-panel .mode').first()).toBeEnabled();expect(await page.evaluate(()=>localStorage.getItem('kana-study.kanji-progress.v1'))).toBe(before);
 await page.screenshot({path:info.outputPath('deadline-panel.png'),fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await page.clock.resume();await page.locator('app-kanji-start-panel .mode').nth(1).click();await expect(page.locator('.exercise')).toBeVisible();await page.locator('.reveal').click();await page.locator('.ratings .yes').click();await expect(page.locator('.results')).toBeVisible();
 await expect(page.locator('.next-round')).toHaveCount(0);await expect(page.locator('.results button')).toHaveCount(1);expect((await state(page)).blocked).toBe(true);
 while(await page.locator('.medal-dialog button').count())await page.locator('.medal-dialog button').click();
 await page.locator('.results button').click();await expect(page.locator('.play-button')).toBeDisabled();
});
test('daily block acknowledges overdue reviews and preserves voluntary navigation',async({page},info)=>{
 await seed(page,-1,true);await expect(page.locator('.play-button')).toBeDisabled();expect(await state(page)).toMatchObject({due:1,blocked:true,status:'completedDue'});
 const notice=page.locator('app-kanji-availability-notice');await expect(notice).not.toContainText('kanji.availability.');await page.screenshot({path:info.outputPath('blocked-due.png'),fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await page.clock.resume();await page.locator('.writing-link').click();await expect(page.locator('.configuration')).toBeVisible();await page.goto('./#/kanji/selection');await expect(page.locator('app-kanji-availability-notice')).toBeVisible();expect(await state(page)).toMatchObject({due:1,blocked:true});
});
test('hidden return across Madrid midnight refreshes due counts and daily policy',async({page})=>{
 await page.clock.setSystemTime(new Date('2026-11-09T22:59:00Z'));await seed(page,120000,true);await expect(page.locator('.play-button')).toBeDisabled();
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
 await page.clock.setSystemTime(new Date('2026-11-09T23:02:00Z'));await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});
 await page.clock.runFor(20);
 await expect(page.locator('.play-button')).toBeEnabled();expect(await state(page)).toMatchObject({due:1,blocked:false});
});
test('workspace A→B→A refreshes the visible count without altering Guest progress',async({page})=>{
 await seed(page,120000);const before=await page.evaluate(()=>localStorage.getItem('kana-study.kanji-progress.v1'));
 await page.locator('app-kanji-page').evaluate(n=>(window as any).ng.getComponent(n).availability.workspace.activateUser('k1-synthetic-b'));await page.clock.runFor(20);await expect(page.locator('.play-button')).toBeEnabled();expect(await state(page)).toMatchObject({due:0,fresh:80});
 await page.locator('app-kanji-page').evaluate(n=>(window as any).ng.getComponent(n).availability.workspace.activateGuest());await page.clock.runFor(20);await expect(page.locator('.play-button')).toBeDisabled();expect(await state(page)).toMatchObject({due:0,fresh:0});expect(await page.evaluate(()=>localStorage.getItem('kana-study.kanji-progress.v1'))).toBe(before);
 await page.clock.runFor(120000);await expect(page.locator('.play-button')).toBeEnabled();
});
test('real browser zoom 125% keeps translated availability readable',async({},info)=>{
 const extension=info.outputPath('extension');await mkdir(extension,{recursive:true});await writeFile(path.join(extension,'manifest.json'),JSON.stringify({manifest_version:3,name:'Kanji K1 local zoom QA',version:'1.0',permissions:['tabs'],background:{service_worker:'worker.js'}}));await writeFile(path.join(extension,'worker.js'),"chrome.tabs.onUpdated.addListener((id,c,t)=>{if(c.status==='complete'&&t.url?.startsWith('http://127.0.0.1:4424/'))chrome.tabs.setZoom(id,1.25);});");
 const context=await chromium.launchPersistentContext(info.outputPath('profile'),{channel:'msedge',headless:true,viewport:null,ignoreDefaultArgs:['--disable-extensions'],args:['--window-size=1366,768','--disable-extensions-except='+extension,'--load-extension='+extension]});
 try{const page=await context.newPage();await configure(page,info.project.name);await page.clock.install({time:new Date(BASE)});await page.goto('http://127.0.0.1:4424/#/kanji');await expect(page.locator('.play-button')).toBeEnabled();await page.clock.pauseAt(new Date(Date.parse(BASE)+60000));await seed(page,-1,true);const worker=context.serviceWorkers()[0]??await context.waitForEvent('serviceworker');expect(await worker.evaluate(async()=>{const api=(globalThis as any).chrome;const tabs=await api.tabs.query({});const tab=tabs.find((t:any)=>t.url?.includes('4424'));await api.tabs.setZoom(tab.id,1.25);return api.tabs.getZoom(tab.id);})).toBe(1.25);expect(await page.evaluate(()=>devicePixelRatio)).toBe(1.25);await expect(page.locator('.play-button')).toBeDisabled();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);const cdp=await context.newCDPSession(page),shot=await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(info.outputPath('zoom125.png'),Buffer.from(shot.data,'base64'));await cdp.detach();}finally{await context.close();}
});
