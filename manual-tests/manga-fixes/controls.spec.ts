import {test,expect} from '@playwright/test';
import {rushWord,rushIndex} from '../../src/app/core/services/manga-rush.fixture';
test('lexical counts and focused RUSH controls with no learning writes',async({page},info)=>{
 await page.route('**/supabase-config.js',r=>r.fulfill({body:'window.__KANA_STUDY_CONFIG__={};',contentType:'text/javascript'}));
 await page.addInitScript(({language,theme})=>localStorage.setItem('kana-study.settings.v1',JSON.stringify({language,theme})),{language:info.project.name.includes('-en-')?'en':info.project.name.includes('-ca-')?'ca':'es',theme:info.project.use.colorScheme});
 await page.goto('./#/manga/practice/synthetic');await expect(page.locator('app-manga-rush')).toBeVisible();
 const words=[rushWord(),rushWord('うん','うん',2),rushWord('あ','あ',3),rushWord('は','は',4,1,'functional'),rushWord('の','の',5,1,'unclassified')];
 await page.locator('app-manga-rush').evaluate((node,index)=>{const c=(window as any).ng.getComponent(node);c.indexService.cached=async()=>index;c.indexService.load=async()=>index;c.knowledge.load=async()=>({units:[]});},rushIndex(words,'synthetic'));
 await page.goto('./#/manga/analysis/synthetic');await expect(page.locator('.words > details')).toHaveCount(2);await expect(page.locator('.frequency').first()).toHaveText('3');
 await page.screenshot({path:info.outputPath('analysis.png'),fullPage:true});
 await page.locator('.practice-action').click();await expect(page.locator('.configuration button[type=submit]')).toBeEnabled();
 await page.evaluate(()=>{
  (window as any).writes=[];
  for(const method of ['put','add'] as const){const original=IDBObjectStore.prototype[method];(IDBObjectStore.prototype as any)[method]=function(...args:any[]){(window as any).writes.push(this.name);return (original as any).apply(this,args);};}
  const original=Storage.prototype.setItem;Storage.prototype.setItem=function(...args:[string,string]){(window as any).writes.push('storage');return original.apply(this,args);};
 });
 await page.locator('.configuration button[type=submit]').click();await expect(page.locator('.reveal')).toBeFocused();
 await page.keyboard.press('Space');await expect(page.locator('.ratings button')).toHaveCount(2);
 await page.keyboard.press('Enter');await expect(page.locator('.session-progress')).toContainText('0 / 2');
 const negative=page.locator('.ratings button').first(),positive=page.locator('.ratings button').last();
 await expect(negative).toHaveAttribute('aria-keyshortcuts','1');await expect(positive).toHaveClass('action');
 const left=await negative.boundingBox(),right=await positive.boundingBox();expect(left!.x).toBeLessThan(right!.x);expect(left!.y).toBe(right!.y);
 await page.screenshot({path:info.outputPath('rush.png'),fullPage:true});
 await negative.focus();await page.keyboard.press('1');await expect(page.locator('.session-progress')).toContainText('1 / 2');await expect(page.locator('.reveal')).toBeVisible();
 await page.keyboard.press('2');await expect(page.locator('.session-progress')).toContainText('1 / 2');
 await page.locator('.reveal').focus();await page.keyboard.press('Enter');await positive.click();await expect(page.locator('.summary')).toBeVisible();
 const summary=await page.locator('app-manga-rush').evaluate(node=>(window as any).ng.getComponent(node).rush.summary());expect(summary).toMatchObject({total:2,knew:1,didNotKnow:1});
 await page.locator('.summary .actions .action').click();await page.locator('.configuration button[type=submit]').click();await page.locator('.reveal').click();
 if(info.project.use.hasTouch)await negative.tap();else await negative.click();
 await expect(page.locator('.session-progress')).toContainText('1 / 2');await page.locator('.reveal').click();await positive.focus();await page.keyboard.press('2');
 await expect(page.locator('.summary')).toBeVisible();
 expect(await page.evaluate(()=>(window as any).writes)).toEqual([]);
});
