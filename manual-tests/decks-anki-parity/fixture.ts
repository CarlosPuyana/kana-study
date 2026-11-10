import {Page,expect} from '@playwright/test';
import {JAPANESE_1500_ENTRIES} from '../../src/app/data/japanese-1500.generated';
import {customDeck,customCard} from '../../src/app/core/services/custom-deck.fixture';
export const BASE='2026-11-09T12:00:00Z';
export const kore=JAPANESE_1500_ENTRIES.find(e=>e.word==='これ')!;
export async function setup(page:Page,name:string){
 await page.clock.install({time:new Date(BASE)});
 await page.route('**/supabase-config.js',r=>r.fulfill({contentType:'text/javascript',body:'window.__KANA_STUDY_CONFIG__={supabaseUrl:"https://anki-parity-fixture.supabase.co",supabasePublishableKey:"synthetic-anki-public-key-not-a-secret"};'}));
 await page.route('https://anki-parity-fixture.supabase.co/**',r=>{
  if(r.request().method()==='GET'&&new URL(r.request().url()).pathname==='/rest/v1/puyi_cards')return r.fulfill({json:[{id:'00000000-0000-0000-0000-000000000001',position:1,version:1,word:'これ',kana:'これ',meaning:'esto',exampleSentence:'これは本です。',exampleTranslation:'Esto es un libro.',image_path:null,created_at:BASE,updated_at:BASE,author_id:'00000000-0000-0000-0000-000000000099'}]});
  return r.abort();
 });
 await page.addInitScript(({language,theme})=>{
  if(localStorage.getItem('qa-anki-parity'))return;localStorage.setItem('qa-anki-parity','1');localStorage.setItem('kana-study.settings.v1',JSON.stringify({language,theme}));localStorage.setItem('kana-study.deck-settings.v1',JSON.stringify(Object.fromEntries(['japanese-1500','mazo-puyi'].map(id=>[id,{desiredRetention:.9,newCardsPerDay:1,newCardOrder:'before-reviews'}]))));
 },{language:name.includes('-en-')?'en':name.includes('-ca-')?'ca':'es',theme:name.includes('light')?'light':'dark'});
 await page.goto('./#/anki');await expect(page.locator('app-deck-card')).toHaveCount(2);
 await page.evaluate(async({ids,target,base})=>{
  const db=await new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open('kana-study-decks');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});try{await new Promise<void>((resolve,reject)=>{const tx=db.transaction('card-progress','readwrite');for(const entryId of ids){if(entryId===target)continue;const due=Date.parse(base)+30*86400000,card={due,state:2,stability:30,difficulty:5,reps:10,lapses:1,learningSteps:0,scheduledDays:30,elapsedDays:30,lastReview:Date.parse(base)-86400000};tx.objectStore('card-progress').put({deckId:'japanese-1500',entryId,due,state:2,card});}tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error);});}finally{db.close();}
 },{ids:JAPANESE_1500_ENTRIES.map(e=>e.id),target:kore.id,base:BASE});
 const deck=customDeck('md-parity'),card=await customCard('md-parity');await page.locator('app-anki-page').evaluate(async(node,{deck,card})=>{const c=(window as any).ng.getComponent(node);await c.catalog.repository.create('parity-create',{...deck,settings:{...deck.settings,newCardsPerDay:1}},[card]);await c.catalog.refresh();},{deck,card});await expect(page.locator('app-deck-card')).toHaveCount(3);
}
export async function events(page:Page){await expect.poll(()=>page.locator('app-anki-study-page').evaluate(node=>(window as any).ng.getComponent(node).deck?.id??null)).not.toBeNull();return page.locator('app-anki-study-page').evaluate(async node=>{const c=(window as any).ng.getComponent(node);const events=await c.study.database.bind(c.deck.id).getDeckReviewEvents(c.deck.id);return events.sort((a:any,b:any)=>a.reviewedAt-b.reviewedAt||(a.cardBefore?.reps??0)-(b.cardBefore?.reps??0));});}
export async function current(page:Page){return page.locator('app-anki-study-page').evaluate(node=>{const c=(window as any).ng.getComponent(node);return {choice:c.choice(),preview:c.preview(),saving:c.saving(),error:c.error(),seconds:c.clock.seconds()};});}
export async function answer(page:Page,rating:'again'|'good'){await page.locator('.reveal').click();await expect(page.locator('.ratings button')).toHaveCount(2);await page.locator('.ratings .'+rating).click();}
