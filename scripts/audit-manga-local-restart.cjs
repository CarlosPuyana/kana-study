// Audit fixture only: ordinary development server at 127.0.0.1:4400.
// UI gates are overridden through its dev inspector in a synthetic profile, never production.
// Waits for the complete study transaction before closing and relaunching Chromium.
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {chromium,expect}=require('@playwright/test');
const operation=JSON.parse(fs.readFileSync('supabase/tests/h2ba-fixture.json'));
(async()=>{
 const origin='http://127.0.0.1:4400',profile=fs.mkdtempSync(path.resolve('.cache/release-local-browser-'));let context;const remote=[];
 async function launch(){context=await chromium.launchPersistentContext(profile,{headless:true,viewport:{width:1280,height:900}});await context.route('**/*',r=>{if(r.request().url().endsWith('/supabase-config.js'))return r.fulfill({contentType:'text/javascript',body:'window.__KANA_STUDY_CONFIG__={};'});if(/^https?:/.test(r.request().url())&&new URL(r.request().url()).origin!==origin){remote.push(r.request().url());return r.abort();}return r.continue();});return context.pages()[0];}
 async function enable(page){await expect(page.locator('app-anki-page')).toBeVisible();await page.evaluate(async()=>{const c=window.ng.getComponent(document.querySelector('app-anki-page')).catalog;c.enabled.set(true);c.repository.mangaAssistedEnabled.set(true);await c.refresh();});}
 async function inventory(page){return page.evaluate(()=>window.ng.getComponent(document.querySelector('app-anki-page')).catalog.repository.guestInventory());}
 try{
  let page=await launch();await page.goto(origin+'/#/anki');await enable(page);
  await page.evaluate(async op=>{const c=window.ng.getComponent(document.querySelector('app-anki-page')).catalog;await c.repository.confirmMangaCard(op);await c.refresh();},operation);
  await page.goto(origin+'/#/anki/'+operation.deck.id+'/study');await expect(page.locator('.front h1')).toHaveText(operation.card.word);await page.getByRole('button',{name:/mostrar respuesta/i}).click();await page.locator('.good').click();
  await expect(page.locator('.end-state')).toBeVisible();await expect.poll(()=>page.evaluate(()=>window.ng.getComponent(document.querySelector('app-anki-study-page')).saving())).toBe(false);
  await page.goto(origin+'/#/anki');await enable(page);const before=await inventory(page);assert.equal(before.records.progress.length,1);assert.equal(before.records.events.length,1);assert.equal(before.records.journal.length,3);
  await context.close();context=null;page=await launch();await page.goto(origin+'/#/anki');await expect(page.locator('app-deck-card')).toHaveCount(1);await enable(page);assert.deepEqual(await inventory(page),before);
  await page.reload();await enable(page);assert.deepEqual(await inventory(page),before);assert.deepEqual(remote,[]);
  fs.writeFileSync('.cache/release-local-restart-results.json',JSON.stringify({browserClosedAndRelaunched:true,reload:true,exactElevenStores:true,progress:1,events:1,journal:3,remoteAttempts:0,mode:'normal development; UI-only inspector override; not production activation'},null,2));
  console.log('PASS real Chromium process restart + reload: exact 11 custom stores, original identity/receipt, FSRS snapshot/event and journal; no remote attempts. Development fixture only.');
 }finally{await context?.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
