import {test,expect} from '@playwright/test';
import {open,initialize,confirmed,sync,data,rate,users} from './custom-decks-sync.fixture';

test('content, real study, lost response, reload, canonical progress and confirmed gloss edit',async({browser})=>{
 const a=await open(browser,0),b=await open(browser,0);try{
  const p=await confirmed(a.page,'browser-roundtrip');
  let release!:()=>void,entered!:()=>void;const waiting=new Promise<void>(r=>entered=r),barrier=new Promise<void>(r=>release=r);a.controls.pauseApply={entered,wait:barrier};
  const oldAck=sync(a.page,false);await waiting;
  await a.page.evaluate(async deck=>{const h=(window as any).h4ba;await h.repo.saveSettings('new-write-before-old-ack',deck,{...(await h.repo.list())[0].settings,newCardsPerDay:7});},p.deck.id);
  release();expect((await oldAck).status).toBe('pending');
  expect(await a.page.evaluate(async()=>((await (window as any).h4ba.repo.list())[0].settings.newCardsPerDay))).toBe(7);
  await sync(a.page);await sync(b.page);
  expect((await data(b.page,p.deck.id)).cards[0].id).toBe(p.card.id);
  await b.page.goto('/#/anki/'+p.deck.id+'/study');await expect(b.page.locator('.front h1')).toHaveText('猫');
  await b.page.getByRole('button',{name:/mostrar respuesta/i}).click();await expect(b.page.locator('.back-content')).toContainText('Confirmed user meaning');
  await b.page.locator('.good').click();await expect(b.page.locator('.end-state')).toBeVisible();
  b.controls.lose=true;await sync(b.page,false);await b.page.reload();await initialize(b.page,users[0].id);await sync(b.page);await sync(a.page);
  const stateA=await data(a.page,p.deck.id),stateB=await data(b.page,p.deck.id);expect(stateA.progress).toEqual(stateB.progress);expect(stateA.events).toEqual(stateB.events);expect(stateA.events).toHaveLength(1);
  const edited=structuredClone(p);edited.confirmation.id='browser-gloss-edit';edited.confirmation.confirmedMeaning='gato confirmado';edited.confirmation.reusedEntity=true;
  edited.card.contentVersion=2;edited.expectedContentVersion=1;edited.card.glosses[0]={text:'gato confirmado',language:'es',source:{kind:'user',sourceId:edited.confirmation.id,revision:'receipt-v1'}};
  await a.page.evaluate(async p=>{await (window as any).h4ba.repo.confirmMangaCard(p);},edited);await sync(a.page);await sync(b.page);
  const changed=await data(b.page,p.deck.id);expect(changed.cards[0].glosses[0].text).toBe('gato confirmado');expect(changed.progress).toEqual(stateB.progress);expect(changed.events).toEqual(stateB.events);
  // Re-reading an old accepted receipt never applies its historical payload to local content.
  await b.page.reload();await initialize(b.page,users[0].id);await sync(b.page);expect((await data(b.page,p.deck.id)).cards[0].contentVersion).toBe(2);
 }finally{await a.context.close();await b.context.close();}
});
test('offline branches preserve real FSRS conflict evidence; tombstone defeats stale client',async({browser})=>{
 const a=await open(browser,2),b=await open(browser,2);try{
  const p=await confirmed(a.page,'browser-offline');await sync(a.page);await sync(b.page);
  await a.context.setOffline(true);await b.context.setOffline(true);
  const branchA=await rate(a.page,p.deck.id,'2026-10-23T12:00:00Z'),branchB=await rate(b.page,p.deck.id,'2026-10-23T12:00:01Z');
  expect((await sync(a.page,false)).status).toBe('offline');expect((await sync(b.page,false)).status).toBe('offline');
  await a.context.setOffline(false);await b.context.setOffline(false);await sync(a.page);expect((await sync(b.page,false)).status).toBe('conflict');
  const losing=await data(b.page,p.deck.id);expect(losing.events[0].id).toBe(branchB.id);expect((await data(a.page,p.deck.id)).events[0].id).toBe(branchA.id);
  const conflicts=await b.page.evaluate(async()=>Object.values(await (window as any).h4ba.adapter.conflicts()));expect(conflicts).toHaveLength(1);
  await b.page.reload();await initialize(b.page,users[2].id);expect((await sync(b.page,false)).status).toBe('conflict');expect((await data(b.page,p.deck.id)).events[0].id).toBe(branchB.id);
  // A third clean browser receives the winning branch; tombstones are retained remotely.
  const c=await open(browser,2),stale=await open(browser,2);try{await sync(c.page);await sync(stale.page);expect((await data(c.page,p.deck.id)).events[0].id).toBe(branchA.id);
   await stale.context.setOffline(true);await stale.page.evaluate(async({deck,id})=>{await (window as any).h4ba.repo.lifecycle('stale-browser-restore','restore','card',id,deck);},{deck:p.deck.id,id:p.card.id});
   await a.page.evaluate(async({deck,id})=>{await (window as any).h4ba.repo.lifecycle('browser-delete','delete','card',id,deck);},{deck:p.deck.id,id:p.card.id});await sync(a.page);await sync(c.page);expect((await data(c.page,p.deck.id)).cards).toEqual([]);
   await stale.context.setOffline(false);expect((await sync(stale.page,false)).status).toBe('conflict');
   // The stale losing browser retains evidence and cannot resurrect through an old ACK/reload.
   expect((await sync(b.page,false)).status).toBe('conflict');await sync(c.page);expect((await data(c.page,p.deck.id)).cards).toEqual([]);
  }finally{await c.context.close();await stale.context.close();}
 }finally{await a.context.close();await b.context.close();}
});
test('workspace fence, interrupted paged feed and shared-tab journal CAS recover after reload',async({browser})=>{
 const a=await open(browser,4),b=await open(browser,4);try{
  const p=await confirmed(a.page,'browser-pages');await sync(a.page);
  b.controls.pages=0;b.controls.interrupt=2;await sync(b.page,false);expect(await b.page.evaluate(async()=>!!(await (window as any).h4ba.repo.syncSnapshot((window as any).h4ba.workspace.active())).state.stage)).toBe(true);
  b.controls.interrupt=undefined;await b.page.reload();await initialize(b.page,users[4].id);await sync(b.page);expect((await data(b.page,p.deck.id)).cards).toHaveLength(1);
  let release!:()=>void,entered!:()=>void;const waiting=new Promise<void>(r=>entered=r),barrier=new Promise<void>(r=>release=r);b.controls.pause={entered,wait:barrier};
  const inFlight=sync(b.page,false);await waiting;await b.page.evaluate(owner=>(window as any).h4ba.workspace.activateUser(owner),users[5].id);release();await inFlight;
  expect(await b.page.evaluate(async()=>await (window as any).h4ba.repo.list())).toEqual([]);
  await initialize(b.page,users[4].id);await sync(b.page);
  // Same-origin tab shares IDB, separate adapter instance: one CAS may lose, neither drops journal.
  const tab=await a.context.newPage();await tab.exposeBinding('h4baRemote',async(_s,packet)=>{
   const actor=users[4],path=packet.kind==='receipt'?`custom_sync_receipts_v1?select=user_id,request,result&user_id=eq.${actor.id}&operation_id=eq.${encodeURIComponent(packet.id)}`:'rpc/'+({apply:'apply_custom_deck_operation_v1',changes:'get_custom_deck_changes_v1',bundle:'get_custom_deck_bundle_v1'} as any)[packet.kind];
   const r=await fetch(endpoint+'/'+path,{method:packet.kind==='receipt'?'GET':'POST',headers:{Authorization:'Bearer '+actor.token,'Content-Type':'application/json'},body:packet.kind==='receipt'?undefined:JSON.stringify(packet.kind==='apply'?{op:packet.op}:packet.kind==='bundle'?{deck:packet.id}:{after_revision:packet.cursor,page_size:2})});const value=await r.json();if(!r.ok)throw new Error('local HTTP');return {owner:actor.id,value:packet.kind==='receipt'?value[0]??null:value};
  });await tab.route('**/supabase-config.js',r=>r.fulfill({body:'window.__KANA_STUDY_CONFIG__={};',contentType:'text/javascript'}));await initialize(tab,users[4].id);
  await a.page.evaluate(async deck=>{const h=(window as any).h4ba;await h.repo.saveSettings('browser-shared-settings',deck,{...(await h.repo.list())[0].settings,newCardsPerDay:8});},p.deck.id);
  await Promise.all([a.page.evaluate(()=>(window as any).h4ba.adapter.syncNow()),tab.evaluate(()=>(window as any).h4ba.adapter.syncNow())]);await sync(a.page);expect((await data(a.page,p.deck.id)).journal.filter((o:any)=>o.id==='browser-shared-settings')).toHaveLength(1);await tab.close();
 }finally{await a.context.close();await b.context.close();}
});
