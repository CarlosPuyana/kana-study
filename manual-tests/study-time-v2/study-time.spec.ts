import {test,expect,Page} from '@playwright/test';
const BASE=new Date('2026-11-09T11:00:00Z'),PAUSE=new Date('2026-11-09T11:10:00Z');
const format=(seconds:number)=>`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
test.beforeEach(async({page},info)=>{
 await page.route('**/supabase-config.js',r=>r.fulfill({contentType:'text/javascript',body:'window.__KANA_STUDY_CONFIG__={};'}));await page.route('**/*.supabase.co/**',r=>r.abort());
 await page.addInitScript(theme=>{if(localStorage.getItem('time-v2-qa'))return;localStorage.setItem('time-v2-qa','1');localStorage.setItem('kana-study.settings.v1',JSON.stringify({language:'es',theme,learning:{categories:{hiragana:{basic:true,dakuten:false,handakuten:false,combination:false},katakana:{basic:false,dakuten:false,handakuten:false,combination:false}},questionTypes:['kana-to-romaji']}}));localStorage.setItem('kana-study.rush.kana-settings.v1',JSON.stringify({selectedContentIds:['hiragana:basic'],questionTypes:['kana-to-romaji']}));Math.random=()=>.99999;},info.project.use.colorScheme==='light'?'light':'dark');
 await page.clock.install({time:BASE});
});
async function calibrate(page:Page,selector:string,field:string){
 await page.waitForFunction(()=>{const root=document.querySelector('app-root');return root&&(window as any).ng.getComponent(root).auth.ready();});
 await page.clock.pauseAt(PAUSE);
 // Only setup: start the measurement at zero after real UI setup, never at reveal or a pause.
 await page.locator(selector).evaluate((node,field)=>{const component=(window as any).ng.getComponent(node),clock=field==='clock'?component.clock:component[field].clock;clock.reset();clock.startAppearance();clock.attach();},field);
 await page.clock.runFor(20);
}
async function kana(page:Page){await page.goto('/#/');await page.locator('.learn-button').click();await page.locator('app-learning-start-panel .mode').nth(1).click();await expect(page.locator('app-learn-page .exercise')).toBeVisible();await calibrate(page,'app-learn-page','learning');}
async function visible(page:Page,value:boolean){await page.evaluate(value=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>!value});Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>value?'visible':'hidden'});document.dispatchEvent(new Event('visibilitychange'));},value);await page.clock.runFor(20);}
const counter=(page:Page)=>page.locator('app-study-timer').first();
async function grade(page:Page){await page.keyboard.press('Space');await page.clock.runFor(20);await expect(page.locator('.ratings button')).toHaveCount(3);await page.keyboard.press('3');await page.clock.runFor(20);while(await page.locator('.medal-unlock-dialog').count()){await page.keyboard.press('Escape');await page.clock.runFor(20);}}
async function events(page:Page){return page.evaluate(async()=>{const db=await new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open('kana-study-decks');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});try{return await new Promise<any[]>((resolve,reject)=>{const r=db.transaction('review-events').objectStore('review-events').getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}finally{db.close();}});}

test('Kana: 40 visible + five minutes hidden + 20 visible, reveal shares 180s and the next card has a new allowance',async({page},info)=>{
 await kana(page);await page.clock.runFor(40000);await expect(counter(page)).toContainText('00:40');await visible(page,false);await page.clock.runFor(300000);await expect(counter(page)).toContainText('00:40');await visible(page,true);await page.clock.runFor(20000);await expect(counter(page)).toContainText('01:00');
 await page.keyboard.press('Space');await page.clock.runFor(120000);await expect(counter(page)).toContainText('03:00');await page.clock.runFor(60000);await expect(counter(page)).toContainText('03:00');await expect(page.locator('.ratings button')).toHaveCount(3);await page.keyboard.press('3');await page.clock.runFor(20);while(await page.locator('.medal-unlock-dialog').count()){await page.keyboard.press('Escape');await page.clock.runFor(20);}
 await page.clock.runFor(25000);await expect(counter(page)).toContainText('03:25');await grade(page);for(let i=0;i<20&&await page.locator('.results').count()===0;i++)await grade(page);await expect(page.locator('.results')).toBeVisible();
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('kana-study.completed-sessions.v1')!).at(-1).durationSeconds)).toBe(205);await page.clock.runFor(300000);await expect(counter(page)).toContainText('03:25');await page.screenshot({path:info.outputPath('kana-final-time.png')});
});
test('suspension jump is discarded; navigation/reload never count absence or create an incomplete history',async({page})=>{
 await kana(page);await page.clock.runFor(25000);await page.clock.fastForward(300000);await expect(counter(page)).toContainText('00:25');await page.clock.runFor(5250);await expect(counter(page)).toContainText('00:30');
 await page.goto('/#/more');await page.clock.runFor(60000);await expect(page.locator('app-study-timer')).toHaveCount(0);await page.reload();await expect(page.locator('app-more-page')).toBeVisible();expect(await page.evaluate(()=>localStorage.getItem('kana-study.completed-sessions.v1'))).toBeNull();
});
test('initial hidden state and focus changes; A→B→A cannot carry the old counter',async({page})=>{
 await page.addInitScript(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});Object.defineProperty(document,'visibilityState',{configurable:true,get:()=> 'hidden'});});await kana(page);await page.clock.runFor(300000);await expect(counter(page)).toContainText('00:00');await visible(page,true);await page.clock.runFor(25000);await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await page.clock.runFor(5000);await expect(counter(page)).toContainText('00:30');
 expect(await page.locator('app-learn-page').evaluate(node=>{const service=(window as any).ng.getComponent(node).learning,w=service.workspace;w.activateUser('time-qa-a');w.activateUser('time-qa-b');w.activateUser('time-qa-a');return service.clock.commitAppearance();})).toBe(0);await page.clock.runFor(20000);expect(await page.evaluate(()=>Object.entries(localStorage).filter(([key])=>key.includes('completed-sessions')).length)).toBe(0);
});
test('Mazos: long cards still rate normally, event time is 180000, preview unchanged and Undo subtracts it once',async({page},info)=>{
 await page.goto('/#/anki/japanese-1500/study');await expect(page.locator('.front')).toBeVisible();await calibrate(page,'app-anki-study-page','clock');
 await page.clock.runFor(120000);await page.locator('.reveal').click();const preview=await page.locator('app-anki-study-page').evaluate(node=>JSON.stringify((window as any).ng.getComponent(node).preview()));await page.clock.runFor(120000);await expect(counter(page)).toContainText('03:00');expect(await page.locator('app-anki-study-page').evaluate(node=>JSON.stringify((window as any).ng.getComponent(node).preview()))).toBe(preview);await expect(page.locator('.good')).toBeEnabled();await page.locator('.good').click();await page.clock.runFor(20);await expect.poll(()=>events(page)).toHaveLength(1);expect((await events(page))[0].elapsedAnswerMs).toBe(180000);await page.screenshot({path:info.outputPath('deck-180-seconds.png')});
 // IndexedDB resolves outside the paused frame clock; render its completed-save state before Undo.
 await page.clock.runFor(20);await expect(page.locator('.undo')).toBeEnabled();await page.locator('.undo').click();await page.clock.runFor(20);expect(await events(page)).toHaveLength(0);await expect(counter(page)).toContainText('00:00');
});
test('RUSH keeps Reveal→Next mechanics, excludes hidden time and ignores the unfinished card on exit',async({page})=>{
 await page.goto('/#/rush');await expect(page.locator('.rush-shell')).toBeVisible();await calibrate(page,'app-kana-rush-page','rush');await page.clock.runFor(40000);await visible(page,false);await page.clock.runFor(300000);await visible(page,true);await page.clock.runFor(20000);await page.locator('.action').click();await page.clock.runFor(10000);await expect(counter(page)).toContainText('01:10');await page.locator('.action').click();await page.clock.runFor(20);await page.clock.runFor(300000);await page.locator('.back').click();await page.clock.runFor(20);await expect(page.locator('.summary')).toBeVisible();await expect(counter(page)).toContainText('01:10');expect(await page.evaluate(()=>localStorage.getItem('kana-study.review-events.v1'))).toBeNull();
});
