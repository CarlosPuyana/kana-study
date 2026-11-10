import {resumeScheduledStep} from './scheduled-step';
import {test,expect,Page} from '@playwright/test';
const NOW=new Date('2026-11-05T11:00:00Z');
test.beforeEach(async({page})=>{
 await page.route('**/supabase-config.js',r=>r.fulfill({contentType:'text/javascript',body:'window.__KANA_STUDY_CONFIG__={};'}));
 await page.route('**/*.supabase.co/**',r=>r.abort());
 await page.addInitScript(()=>{
  if(!localStorage.getItem('kana-study.settings.v1'))localStorage.setItem('kana-study.settings.v1',JSON.stringify({language:'es',theme:matchMedia('(prefers-color-scheme:light)').matches?'light':'dark'}));
  localStorage.setItem('kana-study.deck-settings.v1',JSON.stringify({'japanese-1500':{desiredRetention:.9,newCardsPerDay:1,newCardOrder:'mixed'}}));
 });
 await page.clock.setFixedTime(NOW);
});
async function saved(page:Page){return page.evaluate(async()=>{
 const db=await new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open('kana-study-decks');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
 const read=(name:string)=>new Promise<unknown[]>((resolve,reject)=>{const r=db.transaction(name).objectStore(name).getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
 const data=await Promise.all(['card-progress','review-events','daily-state'].map(read));db.close();return data;
});}
test('card history from All and By time is read-only and survives reload',async({page},info)=>{
 await page.goto('./#/anki/japanese-1500/study');
 for(const [i,rating] of ['again','good','good'].entries()){if(i)await resumeScheduledStep(page);await page.locator('.reveal').click();await page.locator('.ratings .'+rating).click();}
 await expect(page.locator('.result-hero')).toBeVisible();const before=await saved(page);
 await page.goto('./#/anki/japanese-1500/cards');await page.getByRole('searchbox').fill('#1');await page.locator('.entry-card').click();
 await page.locator('.history>summary').click();await expect(page.locator('.timeline>li')).toHaveCount(3);
 await expect(page.locator('.timeline>li').first()).toContainText('BIEN');await expect(page.locator('.timeline>li').last()).toContainText('OTRA VEZ');
 await expect(page.locator('.timeline>li').last()).toContainText('Primera aparición');await expect(page.locator('.history-bars .column')).toHaveCount(3);
 await page.locator('.advanced>summary').click();await expect(page.locator('.advanced')).toContainText('Recuperabilidad estimada ahora');
 expect(await saved(page)).toEqual(before);
 await page.locator('.history figure').scrollIntoViewIfNeeded();
 await page.locator('.history figure').screenshot({path:`.cache/deck-history/history-chart-${info.project.name}.png`});
 await page.locator('.advanced').scrollIntoViewIfNeeded();
 await page.screenshot({path:`.cache/deck-history/history-fsrs-${info.project.name}.png`,fullPage:true});
 await page.locator('.timeline>li').first().scrollIntoViewIfNeeded();
 await page.screenshot({path:`.cache/deck-history/history-${info.project.name}.png`,fullPage:true});
 await page.locator('.close').click();await page.getByRole('button',{name:'Por Tiempo',exact:true}).click();
 await page.locator('.time-heading').click();await page.locator('.entry-card').click();await page.locator('.history>summary').click();
 await expect(page.locator('.timeline>li')).toHaveCount(3);expect(await saved(page)).toEqual(before);
 await page.reload();await page.getByRole('searchbox').fill('#1');await page.locator('.entry-card').click();await page.locator('.history>summary').click();
 await expect(page.locator('.timeline>li')).toHaveCount(3);expect(await saved(page)).toEqual(before);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
test('unreviewed cards have no invented history and main storage notice is only a contextual link',async({page},info)=>{
 await page.goto('./#/anki/japanese-1500/cards');await page.locator('.entry-card').first().click();await page.locator('.history>summary').click();
 await expect(page.locator('.empty-history')).toBeVisible();await expect(page.locator('.history figure')).toHaveCount(0);
 await page.goto('./#/anki');await expect(page.locator('app-local-deck-notice .storage-link')).toBeVisible();await expect(page.locator('app-local-deck-notice aside')).toHaveCount(0);
 await page.screenshot({path:`.cache/deck-history/main-${info.project.name}.png`,fullPage:true});
 await page.locator('.storage-link').click();await expect(page.locator('#deck-storage')).toBeVisible();
 await expect(page.locator('#deck-storage')).toHaveAttribute('open','');
 await expect(page.locator('#deck-storage')).toContainText('solo en este navegador');
 await page.screenshot({path:`.cache/deck-history/storage-${info.project.name}.png`,fullPage:true});
});
test('history and contextual storage links are translated in English and Catalan',async({page})=>{
 for(const language of ['en','ca']){
  await page.goto('./#/anki/japanese-1500/cards');await page.evaluate(lang=>localStorage.setItem('kana-study.settings.v1',JSON.stringify({...JSON.parse(localStorage.getItem('kana-study.settings.v1')!),language:lang})),language);
  await page.reload();await page.locator('.entry-card').first().click();await page.locator('.history>summary').click();
  await expect(page.locator('.history>summary')).toHaveText(language==='en'?'Learning history':'Historial d’aprenentatge');
  await expect(page.locator('.history')).not.toContainText('anki.results.history.');
  await page.goto('./#/anki');await expect(page.locator('.storage-link')).toContainText(language==='en'?'local storage':'emmagatzematge local');
 }
});
