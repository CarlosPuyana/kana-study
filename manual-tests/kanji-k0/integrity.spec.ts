import {test,expect,Page} from '@playwright/test';
async function begin(page:Page,quick=false){
 await page.goto('./#/kanji');await page.locator('.play-button').click();await page.locator('app-kanji-start-panel .mode').nth(quick?0:1).click();await expect(page.locator('.exercise')).toBeVisible();
}
const state=(page:Page)=>page.locator('app-kanji-play-page').evaluate(node=>{const l=(window as any).ng.getComponent(node).learning;return {attempts:l.session()?.attempts,key:l.currentUnit()?.key,saving:l.saving(),error:l.error()};});
const journal=(page:Page)=>page.evaluate(()=>JSON.parse(localStorage.getItem('kana-study.kanji-answer-intent.v1')??'null'));
async function failWrites(page:Page,suffix:string){await page.evaluate(suffix=>{const original=Storage.prototype.setItem;(window as any).auditFail=true;Storage.prototype.setItem=function(k,v){if((window as any).auditFail&&k.endsWith(suffix))throw new DOMException('Synthetic K0 quota','QuotaExceededError');original.call(this,k,v);};},suffix);}
async function countAttempts(page:Page){return page.evaluate(async()=>{const db=await new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open('kana-study-attempts-v1');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});try{return await new Promise<number>((resolve,reject)=>{const r=db.transaction('events').objectStore('events').getAll();r.onsuccess=()=>resolve(r.result.filter(e=>e.workspace==='guest'&&e.module==='kanji').length);r.onerror=()=>reject(r.error);});}finally{db.close();}});}
test.beforeEach(async({page},info)=>{
 await page.route('**/supabase-config.js',r=>r.fulfill({contentType:'text/javascript',body:'window.__KANA_STUDY_CONFIG__={};'}));await page.route('**/*.supabase.co/**',r=>r.abort());
 await page.addInitScript(({language,theme})=>{localStorage.setItem('kana-study.settings.v1',JSON.stringify({language,theme}));},{language:info.project.name.includes('-en-')?'en':info.project.name.includes('-ca-')?'ca':'es',theme:info.project.use.colorScheme});
});
test('partial quota holds the same question and snapshot; explicit retry saves one review',async({page},info)=>{
 await begin(page);const before=await state(page);await page.locator('.reveal').click();await failWrites(page,'kanji-review-events.v1');await page.locator('.ratings .yes').click();await expect(page.locator('.play-shell [role=alert]')).toBeVisible();expect(await state(page)).toMatchObject({attempts:0,key:before.key,error:true});const intent=await journal(page);expect(intent.after.fsrs.reps).toBe(1);
 await page.locator('.play-shell > button.primary').click();expect((await journal(page)).after.fsrs).toEqual(intent.after.fsrs);expect((await state(page)).attempts).toBe(0);
 await page.screenshot({path:info.outputPath('save-error.png'),fullPage:true});await page.evaluate(()=>(window as any).auditFail=false);await page.locator('.play-shell > button.primary').click();
 await expect.poll(async()=>(await state(page)).attempts).toBe(1);expect(await journal(page)).toBeNull();expect(await countAttempts(page)).toBe(1);
 const saved=await page.evaluate(()=>({progress:JSON.parse(localStorage.getItem('kana-study.kanji-progress.v1')!),events:JSON.parse(localStorage.getItem('kana-study.kanji-review-events.v1')!),weak:JSON.parse(localStorage.getItem('kana-study.weaknesses.v1')!)}));expect(saved.events).toHaveLength(1);expect(saved.progress[before.key!].fsrs).toEqual(intent.after.fsrs);expect(saved.weak[0].attempts).toBe(1);
});
test('reload rolls forward a partial answer once and does not restore an obsolete round',async({page})=>{
 await begin(page);await page.locator('.reveal').click();await failWrites(page,'weaknesses.v1');await page.locator('.ratings .no').click();await expect(page.locator('.play-shell [role=alert]')).toBeVisible();const intent=await journal(page);await page.reload();await expect(page.locator('.missing')).toBeVisible();await expect.poll(()=>journal(page)).toBeNull();
 expect(await countAttempts(page)).toBe(1);const events=await page.evaluate(()=>JSON.parse(localStorage.getItem('kana-study.kanji-review-events.v1')!));expect(events).toHaveLength(1);expect(events[0].fsrsAfter).toEqual(intent.after.fsrs);
 await page.locator('.missing button').click();await page.locator('.play-button').click();await page.locator('app-kanji-start-panel .mode').nth(1).click();await expect(page.locator('.exercise')).toBeVisible();expect((await state(page)).attempts).toBe(0);
});
test('quick double click waits for confirmation and only counts one answer',async({page})=>{
 await begin(page,true);await page.locator('.options button').first().dblclick();await expect(page.locator('.feedback')).toBeVisible();expect((await state(page)).attempts).toBe(1);expect(await countAttempts(page)).toBe(1);expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('kana-study.kanji-review-events.v1')!).length)).toBe(1);
});
test('A→B→A during an outstanding IDB insert cannot revive the original round or write to B',async({page})=>{
 await begin(page);await page.locator('.reveal').click();await page.locator('app-kanji-play-page').evaluate(node=>{const l=(window as any).ng.getComponent(node).learning,repo=l.store.attempts,original=repo.insert.bind(repo);let held=false;const gate=new Promise<void>(r=>(window as any).releaseKanji=r);repo.insert=async(...args:any[])=>{if(!held){held=true;await gate;}return original(...args);};});
 await page.locator('.ratings .yes').click();await expect.poll(async()=>(await state(page)).saving).toBe(true);await page.locator('app-kanji-play-page').evaluate(node=>{const l=(window as any).ng.getComponent(node).learning;l.workspace.activateUser('browser-k0-b');l.workspace.activateGuest();});
 await expect(page.locator('.missing')).toBeVisible();await page.evaluate(()=>(window as any).releaseKanji());await expect.poll(()=>journal(page)).toBeNull();await expect(page.locator('.missing')).toBeVisible();
 expect(await page.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('kana-study.workspace.browser-k0-b.')&&(k.includes('kanji-progress')||k.includes('weaknesses'))))).toEqual([]);expect(await countAttempts(page)).toBe(1);
});
test('writing retains ink and the question on failure, then confirms without touching FSRS',async({page},info)=>{
 await page.goto('./#/kanji/writing');await page.locator('.configuration .primary').click();const canvas=page.locator('.writing-surface');await expect(canvas).toBeVisible();await canvas.scrollIntoViewIfNeeded();const b=(await canvas.boundingBox())!;await page.mouse.move(b.x+b.width*.2,b.y+b.height*.5);await page.mouse.down();await page.mouse.move(b.x+b.width*.7,b.y+b.height*.5,{steps:4});await page.mouse.up();await expect(canvas.locator('.ink')).toHaveCount(1);await page.locator('.practice > .primary').click();
 const meaning=await page.locator('.practice h2').innerText();await failWrites(page,'weaknesses.v1');await page.locator('.answer .choices .primary').click();await expect(page.locator('.writing-shell > [role=alert]')).toBeVisible();await expect(canvas.locator('.ink')).toHaveCount(1);await expect(page.locator('.practice h2')).toHaveText(meaning);
 await page.screenshot({path:info.outputPath('writing-save-error.png'),fullPage:true});await page.evaluate(()=>(window as any).auditFail=false);await page.locator('.writing-shell > button').click();await expect(page.locator('.progress')).toHaveText(/1\s*\/\s*80/);await expect(page.locator('.writing-surface .ink')).toHaveCount(0);
 expect(await countAttempts(page)).toBe(1);expect(await page.evaluate(()=>localStorage.getItem('kana-study.kanji-progress.v1'))).toBeNull();
});
