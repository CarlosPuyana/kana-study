import {test,expect} from '@playwright/test';
import {setup} from '../decks-anki-parity/fixture';
test.beforeEach(async({page},info)=>setup(page,info.project.name));
for(const deck of ['japanese-1500','mazo-puyi','md-parity'])test(deck+' readable sentences and unchanged study navigation',async({page},info)=>{
 await page.goto('./#/anki/'+deck+'/study');await expect(page.locator('.study-card')).toBeVisible();const size=info.project.use.viewport!.width<=560?18:20;
 if(deck!=='md-parity')expect(await page.locator('.front-sentence').evaluate(e=>parseFloat(getComputedStyle(e).fontSize))).toBe(size);
 await page.locator('.reveal').click();const sentence=page.locator('.example app-deck-sentence-text,.custom-ocr-context').first();await expect(sentence).toBeVisible();expect(await sentence.evaluate(e=>parseFloat(getComputedStyle(e).fontSize))).toBe(size);
 await sentence.evaluate(e=>{e.textContent='これは長い日本語の例文です。'.repeat(15);});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await page.screenshot({path:info.outputPath(deck+'.png'),fullPage:true});
});
test('sentence volume changes on playback and survives reload',async({page})=>{
 await page.goto('./#/anki/japanese-1500/study');await page.locator('.reveal').click();const slider=page.locator('.sentence-volume input');await expect(slider).toBeVisible();
 for(const value of [0,50,100]){await slider.evaluate((e:HTMLInputElement,v)=>{e.value=String(v);e.dispatchEvent(new Event('input',{bubbles:true}));},value);for(const selector of ['.reading-row','.sentence-row']){await page.locator('app-kaishi-card-media '+selector+' .audio-button').click();expect(await page.locator('app-kaishi-card-media').evaluate(e=>(window as any).ng.getComponent(e).audio?.volume)).toBe(value/100);}}
 await slider.evaluate((e:HTMLInputElement)=>{e.value='50';e.dispatchEvent(new Event('input',{bubbles:true}));});await page.reload();await page.locator('.reveal').click();await expect(slider).toHaveValue('50');
});
