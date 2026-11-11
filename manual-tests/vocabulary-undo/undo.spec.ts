import {test,expect,Page} from '@playwright/test';
const state=(page:Page)=>page.locator('app-vocabulary-play-page').evaluate(node=>{const s=(window as any).ng.getComponent(node).learning;return {unit:s.currentUnit(),session:s.session(),feedback:s.feedback(),counts:s.ratingCounts()};});
const ledger=(page:Page)=>page.locator('app-vocabulary-play-page').evaluate(async node=>{const p=(window as any).ng.getComponent(node).progress;await p.flushAttempts();const events:any[]=[];await p.store.attempts.scan({from:'0000',to:'9999',module:'vocabulary'},(e:any)=>{events.push(e);});return events;});
async function begin(page:Page,quick=false){await page.goto('./#/vocabulary');await page.locator('.play-button').click();await page.locator(quick?'app-vocabulary-start-panel .mode:not(.secondary-start)':'app-vocabulary-start-panel .secondary-start').click();await expect(page.locator('.exercise')).toBeVisible();}
test.beforeEach(async({page},info)=>{
  await page.route('**/supabase-config.js',r=>r.fulfill({contentType:'text/javascript',body:'window.__KANA_STUDY_CONFIG__={};'}));await page.route('**/*.supabase.co/**',r=>r.abort());
  await page.addInitScript(({language,theme})=>{if(!localStorage.getItem('undo-fixture')){localStorage.clear();localStorage.setItem('undo-fixture','1');localStorage.setItem('kana-study.settings.v1',JSON.stringify({language,theme}));}},
    {language:info.project.name.includes('-en-')?'en':info.project.name.includes('-ca-')?'ca':'es',theme:info.project.name.includes('-light')?'light':'dark'});
  await page.clock.install({time:new Date('2026-11-10T12:00:00Z')});
});
test('undo restores exactly the same question and removes its FSRS event and shared attempt; answering again has a new ID',async({page},info)=>{
  await begin(page);const before=await state(page);await page.locator('.reveal').click();await page.locator('.ratings .no').click();expect(await ledger(page)).toHaveLength(1);
  const previous=(await ledger(page))[0];await expect(page.locator('.undo-answer')).toHaveAccessibleName(/Deshacer última respuesta|Undo last answer|Desfés l’última resposta/);
  await page.screenshot({path:info.outputPath('undo-available.png'),fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await page.locator('.undo-answer').focus();await page.keyboard.press('Enter');await expect(page.locator('.undo-answer')).toHaveCount(0);await expect(page.locator('.reveal')).toBeVisible();
  expect(await state(page)).toEqual(before);expect(await ledger(page)).toEqual([]);expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('kana-study.vocabulary-review-events.v1')!))).toEqual([]);
  await page.locator('.reveal').click();await page.locator('.ratings .yes').click();const next=await ledger(page);expect(next).toHaveLength(1);expect(next[0].id).not.toBe(previous.id);
  await page.reload();await expect(page.locator('.exercise')).toBeVisible();await page.locator('.undo-answer').click();await expect(page.locator('.undo-answer')).toHaveCount(0);expect((await state(page)).unit).toEqual(before.unit);expect(await ledger(page)).toEqual([]);
});
test('a failed reverse projection blocks ratings; reload and explicit retry finish the same durable undo',async({page},info)=>{
  await begin(page);const before=await state(page);await page.locator('.reveal').click();await page.locator('.ratings .yes').click();await ledger(page);
  await page.evaluate(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key.endsWith('vocabulary-review-events.v1'))throw Error('Synthetic reverse write failure');original.call(this,key,value);};});
  await page.locator('.undo-answer').click();await expect(page.locator('.save-error')).toBeVisible();await expect(page.locator('.reveal')).toBeDisabled();
  expect(await page.evaluate(()=>!!localStorage.getItem('kana-study.vocabulary-undo-pending.v1'))).toBe(true);await page.screenshot({path:info.outputPath('undo-error.png'),fullPage:true});
  await page.reload();await expect(page.locator('.save-error')).toBeVisible();await expect(page.locator('.reveal')).toBeDisabled();await page.locator('.save-error button').click();await expect(page.locator('.save-error')).toHaveCount(0);
  expect(await state(page)).toEqual(before);expect(await ledger(page)).toEqual([]);expect(await page.evaluate(()=>localStorage.getItem('kana-study.vocabulary-undo-pending.v1'))).toBeNull();
  await page.locator('.reveal').click();await page.locator('.ratings .yes').click();expect(await ledger(page)).toHaveLength(1);
});
test('objective feedback can be undone before Continue without retaining an answer or a streak',async({page})=>{
  await begin(page,true);const before=await state(page);await page.locator('.options button').first().click();await expect(page.locator('.feedback')).toBeVisible();await page.locator('.undo-answer').click();
  await expect(page.locator('.feedback')).toHaveCount(0);await expect(page.locator('.options button').first()).toBeEnabled();expect(await state(page)).toEqual(before);expect(await ledger(page)).toEqual([]);
});
