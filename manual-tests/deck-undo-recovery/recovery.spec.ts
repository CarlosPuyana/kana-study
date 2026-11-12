import {test,expect} from '@playwright/test';
import {setup,events,answer} from '../decks-anki-parity/fixture';
test.beforeEach(async({page},info)=>setup(page,info.project.name));
for(const id of ['japanese-1500','mazo-puyi','md-parity']){
 test(id+': IndexedDB abort before commit survives reload',async({page})=>{
  await page.locator('a[href="#/anki/'+id+'/study"]').click();await expect(page.locator('.study-card')).toBeVisible();await answer(page,'again');const before=await events(page);
  await page.evaluate(custom=>{
    const del=IDBObjectStore.prototype.delete,put=IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.delete=function(...args:any[]){if(!custom&&this.name==='review-events')throw new DOMException('Synthetic undo quota','QuotaExceededError');return del.apply(this,args as [IDBValidKey]);};
    IDBObjectStore.prototype.put=function(...args:any[]){if(custom&&this.name==='progress')throw new DOMException('Synthetic undo quota','QuotaExceededError');return put.apply(this,args as [any,IDBValidKey?]);};
  },id.startsWith('md-'));
  await page.locator('.study-header .undo').click();await expect(page.locator('.storage-error')).toBeVisible();expect(await events(page)).toEqual(before);
  await page.reload();await expect(page.locator('.storage-error')).toBeVisible();await expect(page.locator('.study-card')).toHaveCount(0);
  await page.locator('.storage-error button').evaluate((b:HTMLButtonElement)=>{b.click();b.click();});
  await expect(page.locator('.storage-error')).toHaveCount(0);await expect(page.locator('.study-card')).toBeVisible();expect(await events(page)).toEqual([]);
 });
 test(`${id}: undo automatic closure survives a post-commit failure and reload`,async({page})=>{
  await page.goto('./#/anki/'+id+'/study');await answer(page,'good');await expect(page.locator('.study-card')).toBeVisible();
  const before=await events(page);await answer(page,'good');await expect(page.locator('.end-state')).toBeVisible();
  const all=await events(page),last=all.at(-1);await expect(page.locator('.study-header .undo')).toBeEnabled();
  await page.locator('app-anki-study-page').evaluate(node=>{
   const c=(window as any).ng.getComponent(node),undo=c.study.undo.bind(c.study),state=c.study.undoState.bind(c.study);let reads=0;
   c.study.undo=async(...args:any[])=>{await undo(...args);throw Error('Synthetic post-commit failure');};
   c.study.undoState=async(...args:any[])=>{if(++reads===2)throw new DOMException('Synthetic verification read failure','UnknownError');return state(...args);};
  });
  await page.locator('.study-header .undo').click();await expect(page.locator('.storage-error')).toBeVisible();expect(await events(page)).toEqual(before);
  await page.reload();await expect(page.locator('.study-card')).toBeVisible();await expect(page.locator('.storage-error')).toHaveCount(0);expect(await events(page)).toEqual(before);
  const result=await page.locator('app-anki-study-page').evaluate(async(node,last)=>{const c=(window as any).ng.getComponent(node),p=c.study.database.bind(c.deck.id);return {progress:(await p.getDeckProgress(c.deck.id)).find((p:any)=>p.entryId===last.entryId)?.card,daily:await p.getDailyState(c.deck.id,c.day)};},last);
  expect(result.progress).toEqual(last.cardBefore);expect(result.daily.completedAt).toBeNull();
 });
 test(`${id}: a previously blocked committed Undo recovers after midnight`,async({page})=>{
  await page.goto('./#/anki/'+id+'/study');await answer(page,'again');
  const before=await events(page),last=before.at(-1);
  await page.locator('app-anki-study-page').evaluate(async(node,event)=>{
   const c=(window as any).ng.getComponent(node);c.undoPendingStore.begin(event,false);await c.study.undo(event);
  },last);
  await page.clock.setFixedTime(new Date('2026-11-10T12:00:00Z'));await page.reload();
  await expect(page.locator('.study-card')).toBeVisible();await expect(page.locator('.storage-error')).toHaveCount(0);expect(await events(page)).toEqual([]);
  await answer(page,'again');expect(await events(page)).toHaveLength(1);
 });
 test(`${id}: voluntary closure remains locked after reload`,async({page})=>{
  await page.goto('./#/anki/'+id+'/study');await page.locator('.finish-today').click();await expect(page.locator('.end-state')).toBeVisible();await expect(page.locator('.study-header .undo')).toBeDisabled();
  await page.reload();await expect(page.locator('.end-state')).toBeVisible();await expect(page.locator('.study-header .undo')).toBeDisabled();
 });
}
