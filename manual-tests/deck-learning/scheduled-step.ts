import {Page,expect} from '@playwright/test';
/** Advance only the synthetic clock to the persisted short-step deadline. */
export async function resumeScheduledStep(page:Page){
 await expect(page.locator('.end-state')).toBeVisible();
 const due=await page.evaluate(async()=>{const db=await new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open('kana-study-decks');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});try{return await new Promise<number>((resolve,reject)=>{const r=db.transaction('card-progress').objectStore('card-progress').getAll();r.onsuccess=()=>resolve(Math.min(...r.result.filter(p=>[1,3].includes(p.card.state)).map(p=>p.due)));r.onerror=()=>reject(r.error);});}finally{db.close();}});
 expect(Number.isFinite(due)).toBe(true);await page.clock.setFixedTime(new Date(due));await page.reload();await expect(page.locator('.front h1')).toBeVisible();
}
