import {test,expect,Page} from '@playwright/test';
import {open,initialize,confirmed,data,rate,sync,users} from './custom-decks-sync.fixture';
async function panel(page:Page){await page.goto('/#/profile');await expect(page.locator('app-custom-cloud-panel')).toBeVisible();await page.evaluate(()=>{(window as any).h4bb=(window as any).ng.getComponent(document.querySelector('app-custom-cloud-panel'));});}
async function importGuest(page:Page){return page.evaluate(async()=>{const h=(window as any).h4ba,b=(window as any).h4bb;h.workspace.activateUser(h.driver.owner);await b.transfer.consent(true);const ok=await b.transfer.start(true);return {ok,status:b.transfer.status(),failure:String(b.transfer.failure()),adapter:String(h.adapter.failure())};});}
async function inventory(page:Page){return page.evaluate(async()=>(window as any).h4bb.transfer.inventory());}

test('explicit account/merge UI preserves Guest, provenance, real FSRS, repeated import and separate owners',async({browser})=>{
 const a=await open(browser,6,{pages:0},true),b=await open(browser,6);try{
  const p=await confirmed(a.page,'guest');const event=await rate(a.page,p.deck.id,'2026-10-22T12:00:00Z');await panel(a.page);const original=await inventory(a.page);
  await a.page.getByRole('button',{name:'Utilizar mi cuenta',exact:true}).click();await expect.poll(async()=>(await data(a.page,p.deck.id)).cards.length).toBe(0);expect(await inventory(a.page)).toEqual(original);
  expect(await a.page.evaluate(async()=>Object.keys((await (window as any).h4ba.repo.syncSnapshot((window as any).h4ba.workspace.active())).state.imports??{}))).toEqual([]);
  await a.page.getByRole('button',{name:'Revisar fusión Guest',exact:true}).click();await expect(a.page.getByRole('button',{name:'Fusionar Guest',exact:true})).toBeDisabled();
  await a.page.getByRole('checkbox',{name:/He leído/}).check();await a.page.getByRole('checkbox',{name:/Confirmo la importación/}).check();await a.page.getByRole('button',{name:'Fusionar Guest',exact:true}).click();
  await expect.poll(async()=>a.page.evaluate(()=>(window as any).h4bb.busy())).toBe(false);
  const result=await a.page.evaluate(()=>({status:(window as any).h4bb.transfer.status(),failure:String((window as any).h4bb.transfer.failure()),adapter:String((window as any).h4ba.adapter.failure())}));expect(result,JSON.stringify(result)).toMatchObject({status:'complete'});
  await sync(b.page);const target=await data(b.page,p.deck.id);expect(target.cards).toHaveLength(1);expect(target.events.map((e:any)=>e.id)).toEqual([event.id]);expect(target.events[0].elapsedAnswerMs).toBe(900);expect(target.cards[0].context).toEqual(p.card.context);expect(target.cards[0].glosses).toEqual(p.card.glosses);
  expect(await inventory(a.page)).toEqual(original);expect(await importGuest(a.page)).toMatchObject({ok:true});expect((await data(a.page,p.deck.id)).events).toHaveLength(1);
  const proof=await a.page.evaluate(async()=>(window as any).h4ba.repo.permanentRegistry());expect(proof.confirmations[0].confirmation.workspace).toBe('guest');expect(proof.confirmations[0].confirmation.actor).toEqual(p.confirmation.actor);
  await a.page.evaluate(owner=>{const h=(window as any).h4ba;h.driver.owner=owner;h.auth.userState.set({id:owner});h.workspace.activateUser(owner);},users[7].id);expect(await importGuest(a.page)).toMatchObject({ok:true});expect((await data(a.page,p.deck.id)).events[0].id).toBe(event.id);expect(await inventory(a.page)).toEqual(original);
  await a.page.evaluate(()=>(window as any).h4ba.auth.signOut());expect((await data(a.page,p.deck.id)).events[0].id).toBe(event.id);
 }finally{await a.context.close();await b.context.close();}
});

test('lost ACK, network interruption, reload and changed Guest resume with stable receipts',async({browser})=>{
 const a=await open(browser,8,{pages:0},true),b=await open(browser,8);try{
  const p=await confirmed(a.page,'guest-resume');await rate(a.page,p.deck.id,'2026-10-22T12:01:00Z');await panel(a.page);const original=await inventory(a.page);
  a.controls.transferLose='publish';expect(await importGuest(a.page)).toMatchObject({ok:false});expect(await inventory(a.page)).toEqual(original);
  const before=await a.page.evaluate(async()=>Object.values((await (window as any).h4bb.transfer.plans()) as any).map((p:any)=>({id:p.id,op:p.transferId})));
  await a.page.reload();await initialize(a.page,users[8].id);await panel(a.page);
  expect(await a.page.evaluate(async()=>{const t=(window as any).h4bb.transfer;return t.resume(Object.keys(await t.plans())[0]);})).toBe(true);
  expect(await a.page.evaluate(async()=>Object.values(await (window as any).h4bb.transfer.plans()).map((p:any)=>({id:p.id,op:p.transferId})))).toEqual(before);
  await sync(b.page);expect((await data(b.page,p.deck.id)).events).toHaveLength(1);expect(await inventory(a.page)).toEqual(original);
  await a.context.setOffline(true);expect(await importGuest(a.page)).toMatchObject({ok:true});await a.context.setOffline(false);expect(await importGuest(a.page)).toMatchObject({ok:true});
 }finally{await a.context.close();await b.context.close();}
});

test('divergent Guest progress is blocked before upload, remains evidence and never overwrites canonical FSRS',async({browser})=>{
 const a=await open(browser,10,{pages:0},true),b=await open(browser,10);try{
  const p=await confirmed(a.page,'guest-divergent');await panel(a.page);expect(await importGuest(a.page)).toMatchObject({ok:true});await sync(b.page);
  const winner=await rate(b.page,p.deck.id,'2026-10-22T12:02:00Z');await sync(b.page);const canonical=await data(b.page,p.deck.id);
  await a.page.evaluate(()=>(window as any).h4ba.workspace.activateGuest());const loser=await rate(a.page,p.deck.id,'2026-10-22T12:03:00Z');const source=await inventory(a.page);
  const r=await importGuest(a.page);expect(r).toMatchObject({ok:false,status:'blocked'});expect(await inventory(a.page)).toEqual(source);
  await sync(b.page);const after=await data(b.page,p.deck.id);expect(after.progress).toEqual(canonical.progress);expect(after.events.map((e:any)=>e.id)).toEqual([winner.id]);
  const plans=await a.page.evaluate(async()=>Object.values(await (window as any).h4bb.transfer.plans()));expect(JSON.stringify(plans)).toContain(loser.id);expect(JSON.stringify(plans)).toContain('900');expect(await inventory(a.page)).toEqual(source);expect(a.controls.applies??0).toBe(0);
 }finally{await a.context.close();await b.context.close();}
});

test('overlapping Guest content requires an explicit safe decision; FSRS and remote tombstones remain intact',async({browser})=>{
 const a=await open(browser,12,{pages:0},true),b=await open(browser,12);try{
  const p=await confirmed(a.page,'guest-content');await panel(a.page);expect(await importGuest(a.page)).toMatchObject({ok:true});await sync(b.page);await rate(b.page,p.deck.id,'2026-10-22T12:04:00Z');await sync(b.page);const before=await data(b.page,p.deck.id);
  await a.page.evaluate(()=>(window as any).h4ba.workspace.activateGuest());const edit=structuredClone(p);edit.confirmation.id='guest-content-edit';edit.confirmation.confirmedMeaning='significado elegido';edit.confirmation.reusedEntity=true;edit.card.contentVersion=2;edit.expectedContentVersion=1;edit.card.glosses[0]={text:'significado elegido',language:'es',source:{kind:'user',sourceId:edit.confirmation.id,revision:'receipt-v1'}};await a.page.evaluate(async p=>(window as any).h4ba.repo.confirmMangaCard(p),edit);
  expect(await importGuest(a.page)).toMatchObject({ok:false,status:'blocked'});await sync(b.page);expect((await data(b.page,p.deck.id)).cards[0].glosses).toEqual(before.cards[0].glosses);expect((await data(b.page,p.deck.id)).progress).toEqual(before.progress);expect((await data(b.page,p.deck.id)).events).toEqual(before.events);
  await b.page.evaluate(async({deck,id})=>(window as any).h4ba.repo.lifecycle('delete-before-stale-guest','delete','card',id,deck),{deck:p.deck.id,id:p.card.id});await sync(b.page);
  expect(await importGuest(a.page)).toMatchObject({ok:false,status:'blocked'});await sync(b.page);expect((await data(b.page,p.deck.id)).cards).toEqual([]);expect(a.controls.applies??0).toBe(0);
  expect(JSON.stringify(await inventory(a.page))).toContain('significado elegido');
 }finally{await a.context.close();await b.context.close();}
});

test('account switches and A-B-A fence a committed response; consent withdrawal blocks further uploads',async({browser})=>{
 const a=await open(browser,14,{pages:0},true),b=await open(browser,14);try{
  const p=await confirmed(a.page,'guest-fence');await panel(a.page);const source=await inventory(a.page);
  let release!:()=>void,entered!:()=>void;const waiting=new Promise<void>(r=>entered=r),barrier=new Promise<void>(r=>release=r);a.controls.transferPause={action:'chunk',entered,wait:barrier};
  const pending=importGuest(a.page);await waiting;await a.page.evaluate(owner=>{const h=(window as any).h4ba;h.driver.owner=owner;h.auth.userState.set({id:owner});h.workspace.activateUser(owner);},users[15].id);release();expect(await pending).toMatchObject({ok:false});expect((await data(a.page,p.deck.id)).cards).toEqual([]);expect(await inventory(a.page)).toEqual(source);
  await a.page.evaluate(owner=>{const h=(window as any).h4ba;h.driver.owner=owner;h.auth.userState.set({id:owner});h.workspace.activateUser(owner);},users[14].id);
  let releaseAgain!:()=>void,enteredAgain!:()=>void;const waitingAgain=new Promise<void>(r=>enteredAgain=r),barrierAgain=new Promise<void>(r=>releaseAgain=r);a.controls.transferPause={action:'validate',entered:enteredAgain,wait:barrierAgain};
  const aba=importGuest(a.page);await waitingAgain;await a.page.evaluate(({a,b})=>{const h=(window as any).h4ba;h.driver.owner=b;h.workspace.activateUser(b);h.driver.owner=a;h.workspace.activateUser(a);},{a:users[14].id,b:users[15].id});releaseAgain();expect(await aba).toMatchObject({ok:false});
  expect(await importGuest(a.page)).toMatchObject({ok:true});await sync(b.page);
  // Consent is per workspace and absence never authorizes a new journal upload.
  await a.page.evaluate(async deck=>{const h=(window as any).h4ba;await (window as any).h4bb.transfer.consent(false);await h.repo.saveSettings('no-consent-settings',deck,{...(await h.repo.list())[0].settings,newCardsPerDay:3});},p.deck.id);
  expect((await sync(a.page,false)).status).toBe('error');await sync(b.page);expect(await b.page.evaluate(async()=>(await (window as any).h4ba.repo.list())[0].settings.newCardsPerDay)).toBe(10);
  await a.page.evaluate(async()=>(window as any).h4bb.transfer.consent(true));await sync(a.page);await sync(b.page);expect(await b.page.evaluate(async()=>(await (window as any).h4ba.repo.list())[0].settings.newCardsPerDay)).toBe(3);
 }finally{await a.context.close();await b.context.close();}
});

test('two tabs start the same captured import and a changed source needs a new explicit pass',async({browser})=>{
 const a=await open(browser,16,{pages:0},true),b=await open(browser,16);try{
  const p=await confirmed(a.page,'guest-tabs');await panel(a.page);const original=await inventory(a.page);
  const connected=await open(browser,16,{pages:0},false,a.context),tab=connected.page;await panel(tab);
  await Promise.all([importGuest(a.page),importGuest(tab)]);expect(await importGuest(a.page)).toMatchObject({ok:true});await sync(b.page);expect((await data(b.page,p.deck.id)).cards).toHaveLength(1);expect(await inventory(a.page)).toEqual(original);
  // A later Guest edit must not replace an already confirmed destination capture.
  await a.page.evaluate(()=>(window as any).h4ba.workspace.activateGuest());const edit=structuredClone(p);edit.confirmation.id='guest-tab-second';edit.confirmation.reusedEntity=true;edit.expectedContentVersion=1;edit.card.contentVersion=2;edit.confirmation.confirmedMeaning='segunda';edit.card.glosses[0]={text:'segunda',language:'es',source:{kind:'user',sourceId:edit.confirmation.id,revision:'receipt-v1'}};
  await tab.evaluate(async p=>{const h=(window as any).h4ba;h.workspace.activateGuest();await h.repo.confirmMangaCard(p);h.workspace.activateUser(h.driver.owner);},edit);
  const changed=await importGuest(a.page);expect(changed).toMatchObject({ok:false,status:'blocked'});await sync(b.page);expect((await data(b.page,p.deck.id)).cards[0].glosses).toEqual(p.card.glosses);expect(JSON.stringify(await inventory(a.page))).toContain('segunda');await tab.close();
 }finally{await a.context.close();await b.context.close();}
});

test('stale undo keeps later review; unsafe rebase stays blocked and explicit keep archives evidence',async({browser})=>{
 const a=await open(browser,18,{pages:0},true),b=await open(browser,18);try{
  const p=await confirmed(a.page,'guest-undo');await panel(a.page);expect(await importGuest(a.page)).toMatchObject({ok:true});await sync(b.page);const first=await rate(b.page,p.deck.id,'2026-10-22T12:05:00Z');await sync(b.page);await sync(a.page);
  await a.page.evaluate(async event=>(window as any).h4ba.study.undo(event),first);const second=await rate(b.page,p.deck.id,'2026-10-23T12:05:00Z');await sync(b.page);expect((await sync(a.page,false)).status).toBe('conflict');const canonical=await data(b.page,p.deck.id);
  let conflicts=await a.page.evaluate(async()=>(window as any).h4bb.resolver.list());expect(conflicts[0].kind).toBe('undo');expect(await a.page.evaluate(async id=>(window as any).h4bb.resolver.resolve(id,'rebase',true),conflicts[0].id)).toBe(false);expect(await a.page.evaluate(async()=>(window as any).h4bb.resolver.list())).toHaveLength(1);
  expect(await a.page.evaluate(async id=>(window as any).h4bb.resolver.resolve(id,'keep',true),conflicts[0].id)).toBe(true);const after=await data(a.page,p.deck.id);expect(after.progress).toEqual(canonical.progress);expect(after.events.map((e:any)=>e.id).sort()).toEqual([first.id,second.id].sort());expect([...after.events].sort((a:any,b:any)=>a.id.localeCompare(b.id))).toEqual([...canonical.events].sort((a:any,b:any)=>a.id.localeCompare(b.id)));
  await a.page.evaluate(async()=>(window as any).h4bb.refresh());await a.page.evaluate(()=>(window as any).h4bb.i18n.settingsService.setTheme('light'));await a.page.emulateMedia({colorScheme:'light'});await a.page.setViewportSize({width:390,height:844});await a.page.screenshot({path:'.cache/h4bb-mobile-light.png',fullPage:true});
  expect(await a.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await a.page.evaluate(()=>(window as any).h4bb.i18n.settingsService.setTheme('dark'));await a.page.emulateMedia({colorScheme:'dark'});await a.page.setViewportSize({width:1280,height:900});await a.page.screenshot({path:'.cache/h4bb-desktop-dark.png',fullPage:true});
  expect(await a.page.locator('app-custom-cloud-panel').innerText()).not.toContain(users[18].id);
 }finally{await a.context.close();await b.context.close();}
});

test('Guest ancestor and voided child retain exact clocks, elapsed time and all daily states after fresh-browser import',async({browser})=>{
 const a=await open(browser,20,{pages:0},true),b=await open(browser,20);try{
  const p=await confirmed(a.page,'guest-history');const first=await rate(a.page,p.deck.id,'2026-10-21T12:00:00Z'),second=await rate(a.page,p.deck.id,'2026-10-22T12:00:00Z');await a.page.evaluate(async e=>(window as any).h4ba.study.undo(e),second);await panel(a.page);
  const source=await inventory(a.page);expect(await importGuest(a.page)).toMatchObject({ok:true});expect(await inventory(a.page)).toEqual(source);await sync(b.page);const after=await data(b.page,p.deck.id);expect(after.events).toEqual([first]);
  const canonical=await b.page.evaluate(async deck=>({day1:await (window as any).h4ba.repo.getDailyState(deck,'2026-10-21'),day2:await (window as any).h4ba.repo.getDailyState(deck,'2026-10-22'),entities:(await (window as any).h4ba.repo.syncSnapshot((window as any).h4ba.workspace.active())).state.entities}),p.deck.id);
  expect(canonical.entities.find((e:any)=>e.kind==='review-event'&&e.id===second.id)).toMatchObject({payload:second,head:first.id});expect(canonical.entities.find((e:any)=>e.kind==='review-event'&&e.id===second.id).voidedBy).toBeTruthy();
  expect(canonical.day1).toEqual(source.records.daily.find((r:any)=>r.value.localDate==='2026-10-21')!.value);expect(canonical.day2).toEqual(source.records.daily.find((r:any)=>r.value.localDate==='2026-10-22')!.value);
  expect(await importGuest(a.page)).toMatchObject({ok:true});expect((await data(a.page,p.deck.id)).events).toEqual([first]);
 }finally{await a.context.close();await b.context.close();}
});

