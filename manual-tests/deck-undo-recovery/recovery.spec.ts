import {test,expect} from '@playwright/test';
import {setup,events,answer} from '../decks-anki-parity/fixture';
test.beforeEach(async({page},info)=>setup(page,info.project.name));
for(const id of ['japanese-1500','mazo-puyi','md-parity']){
 for(const kind of ['not-executed','committed','expired','invalid'])test(`${id}: disabled Undo preserves ${kind} evidence and resumes canonical study`,async({page})=>{
  await page.goto('./#/anki/'+id+'/study');await expect(page.locator('.study-card')).toBeVisible();await answer(page,'again');
  const saved=await events(page),event=saved.at(-1);
  const raw=await page.locator('app-anki-study-page').evaluate(async(node,{event,kind})=>{
   const c=(window as any).ng.getComponent(node);
   if(kind==='committed')await c.study.undo(event);
   const raw=kind==='invalid'?'{legacy-invalid':JSON.stringify({event:kind==='expired'?{...event,reviewedAt:event.reviewedAt-86400000}:event,reopen:false});
   localStorage.setItem('kana-study.deck-undo-pending.v1.'+c.deck.id,raw);return raw;
  },{event,kind});
  const canonical=await events(page);
  const before=await page.locator('app-anki-study-page').evaluate(async node=>{const c=(window as any).ng.getComponent(node);return c.study.database.bind(c.deck.id).getDeckProgress(c.deck.id);});
  await page.reload();await expect(page.locator('.study-card')).toBeVisible();await expect(page.locator('.storage-error,.study-header .undo')).toHaveCount(0);
  expect(await events(page)).toEqual(canonical);
  expect(await page.locator('app-anki-study-page').evaluate(async node=>{const c=(window as any).ng.getComponent(node);return c.study.database.bind(c.deck.id).getDeckProgress(c.deck.id);})).toEqual(before);
  expect(await page.evaluate(id=>localStorage.getItem('kana-study.deck-undo-pending.v1.'+id),id)).toBe(raw);
  await page.clock.setFixedTime(new Date('2026-11-10T12:00:00Z'));await page.reload();await expect(page.locator('.study-card')).toBeVisible();await expect(page.locator('.storage-error,.study-header .undo')).toHaveCount(0);expect(await events(page)).toEqual(canonical);
  await answer(page,'again');expect(await events(page)).toHaveLength(canonical.length+1);
 });
 test(`${id}: voluntary close remains closed, with no Undo action`,async({page})=>{
  await page.goto('./#/anki/'+id+'/study');await page.locator('.finish-today').click();await expect(page.locator('.end-state')).toBeVisible();await page.reload();await expect(page.locator('.end-state')).toBeVisible();await expect(page.locator('.study-header .undo')).toHaveCount(0);
 });
}
