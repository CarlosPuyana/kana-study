import {test,expect,Page} from '@playwright/test';
import {open,confirmed,data,rate,sync,users,initialize} from './custom-decks-sync.fixture';
async function panel(page:Page){await page.goto('/#/profile');await expect(page.locator('app-custom-cloud-panel')).toBeVisible();await page.evaluate(()=>{(window as any).d2=(window as any).ng.getComponent(document.querySelector('app-custom-cloud-panel'));});}
async function importing(page:Page){return page.evaluate(async()=>{const h=(window as any).h4ba,t=(window as any).d2.transfer;h.workspace.activateUser(h.driver.owner);await t.consent(true);const ok=await t.start(true);return {ok,failure:String(t.failure())};});}
test('V2 Guest staging is invisible to browser B; publication and lost ACK recover original real FSRS',async({browser})=>{
 const a=await open(browser,30,{pages:0},true),b=await open(browser,30);try{
  const p=await confirmed(a.page,'v2-ui');const original=await rate(a.page,p.deck.id,'2026-10-23T12:00:00Z');await panel(a.page);
  let release!:()=>void,entered!:()=>void;const wait=new Promise<void>(r=>release=r),ready=new Promise<void>(r=>entered=r);a.controls.transferPause={action:'chunk',entered,wait};
  const pending=importing(a.page);await ready;await sync(b.page);expect((await data(b.page,p.deck.id)).cards).toHaveLength(0);expect(a.controls.applies??0).toBe(0);
  a.controls.transferLose='publish';release();expect(await pending).toMatchObject({ok:false});
  await sync(b.page);expect((await data(b.page,p.deck.id)).events).toEqual([original]);
  await a.page.reload();await initialize(a.page,users[30].id);await panel(a.page);
  const result=await a.page.evaluate(async()=>{const t=(window as any).d2.transfer;const ok=await t.resume(Object.keys(await t.plans())[0]);return {ok,failure:String(t.failure())};});expect(result,JSON.stringify(result)).toMatchObject({ok:true});
  expect(a.controls.transferCalls?.filter(a=>a==='publish')).toHaveLength(1);expect((await data(a.page,p.deck.id)).events).toEqual([original]);
  await b.page.goto('/#/anki/'+p.deck.id+'/study');await expect(b.page.locator('app-anki-study-page')).toBeVisible();
  const beforeStudy=(await data(b.page,p.deck.id)).progress[0].card,next=await rate(b.page,p.deck.id,'2026-10-24T12:00:00Z');expect(next.cardBefore).toEqual(beforeStudy);expect(next.entryId).toBe(p.card.id);
 }finally{await a.context.close();await b.context.close();}
});
test('V2 archives an actual rejected FSRS branch plus its unsent tail and recovers it in a clean browser',async({browser})=>{
 const a=await open(browser,31),b=await open(browser,31),c=await open(browser,31);try{
  const p=await confirmed(a.page,'v2-branch-ui');await sync(a.page);await sync(b.page);
  const winner=await rate(a.page,p.deck.id,'2026-10-23T12:00:00Z'),loser=await rate(b.page,p.deck.id,'2026-10-23T12:01:00Z');await sync(a.page);await sync(b.page,false);
  const tail=await rate(b.page,p.deck.id,'2026-10-24T12:00:00Z');await panel(b.page);const before=await data(b.page,p.deck.id);
  const archived=await b.page.evaluate(async()=>{const d=(window as any).d2,conflicts=await d.resolver.list();return d.recovery.archives.archive(conflicts[0].id,true);});expect(archived.complete).toBe(true);expect(await data(b.page,p.deck.id)).toEqual(before);
  await b.context.close();await panel(c.page);const fresh=await c.page.evaluate(async id=>(window as any).d2.recovery.archives.inspect(id),archived.id);expect(fresh.verified).toBe(true);expect(fresh.operations.map((o:any)=>o.changes.find((x:any)=>x.kind==='review-event').payload)).toEqual([loser,tail]);expect(fresh.canonicalProgress.payload.card.reps).toBe(winner.cardBefore?winner.cardBefore.reps+1:1);expect((await data(c.page,p.deck.id)).events).toEqual([]);
  expect(await c.page.evaluate(async()=>(window as any).d2.recovery.archives.inspect('never-sent'))).toBe(null);
  await c.page.evaluate(async id=>{const d=(window as any).d2;d.archiveId=id;await d.inspectArchive();},archived.id);
  await expect(c.page.getByText('Archivo completo: integridad verificada.',{exact:true})).toBeVisible();
  await c.page.screenshot({path:'.cache/h4bd2-desktop-dark.png',fullPage:true});
  await c.page.setViewportSize({width:390,height:844});await c.page.evaluate(()=>(window as any).d2.i18n.settingsService.setTheme('light'));
  await c.page.screenshot({path:'.cache/h4bd2-mobile-light.png',fullPage:true});expect(await c.page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 }finally{await a.context.close();await b.context.close();await c.context.close();}
});
test('V2 missing migration and remote quota never fall back to V1 or erase Guest',async({browser})=>{
 for(const index of [32,47]){const a=await open(browser,index,{pages:0,missingV2:index===32},true);try{
  const p=await confirmed(a.page,'v2-errors');await rate(a.page,p.deck.id,'2026-10-23T12:00:00Z');await panel(a.page);const source=await a.page.evaluate(()=>(window as any).d2.transfer.inventory());
  expect(await importing(a.page)).toMatchObject({ok:false});expect(a.controls.applies??0).toBe(0);expect(await a.page.evaluate(()=>(window as any).d2.transfer.inventory())).toEqual(source);
  expect((await data(a.page,p.deck.id)).cards).toHaveLength(0);expect(await a.page.evaluate(async()=>Object.values((await (window as any).d2.transfer.plans())[Object.keys(await (window as any).d2.transfer.plans())[0]].inventory.records).length)).toBeGreaterThan(0);
 }finally{await a.context.close();}}
});
test('V2 partial chunk, withdrawal before next upload, reload and explicit resume preserve bytes',async({browser})=>{
 const a=await open(browser,33,{pages:0},true),b=await open(browser,33);try{
  const p=await confirmed(a.page,'v2-withdraw');await rate(a.page,p.deck.id,'2026-10-23T12:00:00Z');await panel(a.page);
  let release!:()=>void,entered!:()=>void;const wait=new Promise<void>(r=>release=r),ready=new Promise<void>(r=>entered=r);a.controls.transferPause={action:'chunk',entered,wait};
  const pending=importing(a.page);await ready;await a.page.evaluate(()=>(window as any).d2.transfer.consent(false));release();expect(await pending).toMatchObject({ok:false});expect(a.controls.transferCalls).toEqual(['begin','chunk']);await sync(b.page);expect((await data(b.page,p.deck.id)).cards).toHaveLength(0);
  const before=await a.page.evaluate(async()=>Object.values((await (window as any).h4ba.repo.syncSnapshot((window as any).h4ba.workspace.active())).state.transfers).map((t:any)=>({id:t.id,bodies:t.bodies})));
  await a.page.reload();await initialize(a.page,users[33].id);await panel(a.page);expect(await importing(a.page)).toMatchObject({ok:true});
  expect(await a.page.evaluate(async()=>Object.values((await (window as any).h4ba.repo.syncSnapshot((window as any).h4ba.workspace.active())).state.transfers).map((t:any)=>({id:t.id,bodies:t.bodies})))).toEqual(before);await sync(b.page);expect((await data(b.page,p.deck.id)).progress[0].card.reps).toBe(1);
 }finally{await a.context.close();await b.context.close();}
});
test('V2 A-B-A discards an old chunk ACK and cannot commit it to another activation',async({browser})=>{
 const a=await open(browser,34,{pages:0},true);try{
  const p=await confirmed(a.page,'v2-account');await rate(a.page,p.deck.id,'2026-10-23T12:00:00Z');await panel(a.page);
  let release!:()=>void,entered!:()=>void;const wait=new Promise<void>(r=>release=r),ready=new Promise<void>(r=>entered=r);a.controls.transferPause={action:'chunk',entered,wait};
  const pending=importing(a.page);await ready;await a.page.evaluate(({a,b})=>{const h=(window as any).h4ba;h.driver.owner=b;h.workspace.activateUser(b);h.driver.owner=a;h.workspace.activateUser(a);},{a:users[34].id,b:users[35].id});release();expect(await pending).toMatchObject({ok:false});
  expect((await data(a.page,p.deck.id)).cards).toHaveLength(0);expect(await importing(a.page)).toMatchObject({ok:true});expect(a.controls.transferCalls?.filter(a=>a==='chunk')).toHaveLength(2);
 }finally{await a.context.close();}
});
test('V2 source changes and destination revisions remain blocked without silently rebasing',async({browser})=>{
 const a=await open(browser,36,{pages:0},true),b=await open(browser,36);try{
  const p=await confirmed(a.page,'v2-global');await rate(a.page,p.deck.id,'2026-10-23T12:00:00Z');await panel(a.page);
  let release!:()=>void,entered!:()=>void;const wait=new Promise<void>(r=>release=r),ready=new Promise<void>(r=>entered=r);a.controls.transferPause={action:'validate',before:true,entered,wait};
  const pending=importing(a.page);await ready;
  await b.page.evaluate(async id=>{const h=(window as any).h4ba;return h.adapter.transport.apply(h.driver.owner,{schemaVersion:1,operationId:'v2-tombstone',action:'delete',changes:[{kind:'card',id,baseRevision:'0',payload:null}]});},p.card.id);await sync(b.page);
  release();expect(await pending).toMatchObject({ok:false});expect((await data(a.page,p.deck.id)).cards).toHaveLength(0);expect(a.controls.transferCalls?.includes('publish')).toBe(false);
  expect(await a.page.evaluate(async()=>{const s=await (window as any).h4ba.repo.syncSnapshot((window as any).h4ba.workspace.active());return Object.values(s.state.transfers).map((t:any)=>t.state);})).toEqual(['blocked']);
 }finally{await a.context.close();await b.context.close();}
});
test('V2 local publication quota failure after remote commit recovers without another publish',async({browser})=>{
 const a=await open(browser,37,{pages:0},true),b=await open(browser,37);try{
  const p=await confirmed(a.page,'v2-local-quota');const original=await rate(a.page,p.deck.id,'2026-10-23T12:00:00Z');await panel(a.page);
  await a.page.evaluate(()=>{const r=(window as any).h4ba.repo,commit=r.syncCommit.bind(r);let fail=true;r.syncCommit=(...args:any[])=>{if(fail){fail=false;throw new DOMException('quota','QuotaExceededError');}return commit(...args);};});
  expect(await importing(a.page)).toMatchObject({ok:false});expect((await data(a.page,p.deck.id)).cards).toHaveLength(0);await sync(b.page);expect((await data(b.page,p.deck.id)).events).toEqual([original]);
  expect(await importing(a.page)).toMatchObject({ok:true});expect(a.controls.transferCalls?.filter(a=>a==='publish')).toHaveLength(1);expect((await data(a.page,p.deck.id)).events).toEqual([original]);
 }finally{await a.context.close();await b.context.close();}
});
test('V2 detects Guest edits during upload and preserves an incompatible old V1 checkpoint',async({browser})=>{
 const a=await open(browser,38,{pages:0},true),b=await open(browser,38);try{
  const p=await confirmed(a.page,'v2-source-changed');await rate(a.page,p.deck.id,'2026-10-23T12:00:00Z');await panel(a.page);
  let release!:()=>void,entered!:()=>void;const wait=new Promise<void>(r=>release=r),ready=new Promise<void>(r=>entered=r);a.controls.transferPause={action:'chunk',entered,wait};
  const pending=importing(a.page);await ready;await a.page.evaluate(async deck=>(window as any).h4ba.repo.saveSettings('guest-edit-in-flight',deck,{...(await (window as any).h4ba.repo.list('guest'))[0].settings,newCardsPerDay:4},'guest'),p.deck.id);release();expect(await pending).toMatchObject({ok:false});
  expect(await a.page.evaluate(async()=>Object.values(await (window as any).d2.transfer.plans()).some((p:any)=>p.sourceChanged))).toBe(true);expect((await data(a.page,p.deck.id)).cards).toHaveLength(0);await sync(b.page);expect((await data(b.page,p.deck.id)).cards).toHaveLength(0);
  const legacy=await a.page.evaluate(async()=>{const h=(window as any).h4ba,t=(window as any).d2.transfer,source=await t.inventory();await h.repo.changeCoordination(h.workspace.active(),()=>{},(s:any)=>{s.imports.legacy={id:'legacy',source:'guest',destination:h.driver.owner,fingerprint:'old',inventory:source,status:'pending',steps:[{kind:'content',id:'original',operation:{original:'frozen'}}],createdCards:[],blocked:[],sourceChanged:false};});const ok=await t.resume('legacy');const plan=(await t.plans()).legacy;return {ok,operation:plan.steps[0].operation,blocked:plan.blocked,version:plan.protocolVersion??null};});
  expect(legacy).toEqual({ok:false,operation:{original:'frozen'},blocked:['legacy-v1-checkpoint-preserved'],version:null});expect(a.controls.applies??0).toBe(0);
 }finally{await a.context.close();await b.context.close();}
});
test('ordinary V1 content rebase stays explicit and preserves FSRS beside the V2 Guest flow',async({browser})=>{
 const a=await open(browser,39),b=await open(browser,39);try{
  const p=await confirmed(a.page,'ordinary-rebase');await sync(a.page);await rate(a.page,p.deck.id,'2026-10-23T12:00:00Z');await sync(a.page);await sync(b.page);const before=await data(a.page,p.deck.id);
  const edit=(id:string,text:string)=>{const q=structuredClone(p);q.confirmation.id=id;q.confirmation.reusedEntity=true;q.confirmation.confirmedMeaning=text;q.card.contentVersion=2;q.expectedContentVersion=1;q.card.glosses[0]={text,language:'es',source:{kind:'user',sourceId:id,revision:'receipt-v1'}};return q;};
  await a.page.evaluate(async p=>(window as any).h4ba.repo.confirmMangaCard(p),edit('ordinary-winner','primera edición'));await b.page.evaluate(async p=>(window as any).h4ba.repo.confirmMangaCard(p),edit('ordinary-loser','edición elegida'));
  await sync(a.page);await sync(b.page,false);await panel(b.page);const resolved=await b.page.evaluate(async()=>{const d=(window as any).d2,c=(await d.resolver.list())[0];const ok=await d.resolver.resolve(c.id,'rebase',true);const s=(await (window as any).h4ba.repo.syncSnapshot((window as any).h4ba.workspace.active())).state;return {ok,error:String(d.resolver.failure()),adapter:String(d.transfer.adapter.failure()),status:d.transfer.adapter.status(),resolutions:Object.values(s.resolutions??{}).map((r:any)=>({status:r.receipt?.status,reason:r.receipt?.reason}))};});expect(resolved,JSON.stringify(resolved)).toMatchObject({ok:true});
  await sync(a.page);const after=await data(a.page,p.deck.id);expect(after.cards[0].glosses[0].text).toBe('edición elegida');expect(after.progress).toEqual(before.progress);expect(after.events).toEqual(before.events);
 }finally{await a.context.close();await b.context.close();}
});
test('a partial branch is not complete, withdrawal stops complete, and a clean owner can verify the resumed archive',async({browser})=>{
 const a=await open(browser,40),b=await open(browser,40),c=await open(browser,40),other=await open(browser,41);try{
  const p=await confirmed(a.page,'partial-archive');await sync(a.page);await rate(a.page,p.deck.id,'2026-10-22T12:00:00Z');await sync(a.page);await sync(b.page);
  await rate(a.page,p.deck.id,'2026-10-23T12:00:00Z');await rate(b.page,p.deck.id,'2026-10-23T12:01:00Z');await sync(a.page);await sync(b.page,false);await rate(b.page,p.deck.id,'2026-10-24T12:00:00Z');await panel(b.page);await panel(c.page);await panel(other.page);
  let release!:()=>void,entered!:()=>void;const wait=new Promise<void>(r=>release=r),ready=new Promise<void>(r=>entered=r);b.controls.transferPause={action:'chunk',index:0,entered,wait};
  const pending=b.page.evaluate(async()=>{const d=(window as any).d2;try{return await d.recovery.archives.archive((await d.resolver.list())[0].id,true);}catch{return null;}});await ready;
  const id=await b.page.evaluate(async()=>Object.keys((await (window as any).h4ba.repo.syncSnapshot((window as any).h4ba.workspace.active())).state.transfers)[0]);
  const partial=await c.page.evaluate(async id=>(window as any).d2.recovery.archives.inspect(id),id);expect(partial.verified).toBe(false);expect(partial.missing).toBe(1);expect(partial.operations).toEqual([]);
  let finish!:()=>void,arrived!:()=>void;const finalWait=new Promise<void>(r=>finish=r),finalReady=new Promise<void>(r=>arrived=r);b.controls.transferPause={action:'chunk',index:1,entered:arrived,wait:finalWait};release();await finalReady;
  await b.page.evaluate(()=>(window as any).d2.transfer.consent(false));finish();expect(await pending).toBe(null);expect(b.controls.transferCalls?.includes('complete')).toBe(false);
  await b.page.evaluate(()=>(window as any).d2.transfer.consent(true));const resumed=await b.page.evaluate(async()=>{const d=(window as any).d2;return d.recovery.archives.archive((await d.resolver.list())[0].id,true);});expect(resumed).toMatchObject({id,complete:true});
  expect((await c.page.evaluate(async id=>(window as any).d2.recovery.archives.inspect(id),id)).verified).toBe(true);expect(await other.page.evaluate(async id=>(window as any).d2.recovery.archives.inspect(id),id)).toBe(null);expect((await data(c.page,p.deck.id)).events).toEqual([]);
 }finally{await a.context.close();await b.context.close();await c.context.close();await other.context.close();}
});
test('an actual partially committed V1 Guest import is preserved and blocked without replaying or converting it',async({browser})=>{
 const a=await open(browser,42,{pages:0},true);try{
  const p=await confirmed(a.page,'legacy-partial');await rate(a.page,p.deck.id,'2026-10-23T12:00:00Z');await panel(a.page);
  const result=await a.page.evaluate(async()=>{
   const h=(window as any).h4ba,t=(window as any).d2.transfer,source=await t.inventory(),j=source.records.journal.find((r:any)=>r.value.kind==='manga-confirmation').value,p=j.payload;
   h.workspace.activateUser(h.driver.owner);await t.consent(true);const change=(kind:string,id:string,payload:any)=>({kind,id,payload,baseRevision:'0'});
   const original={schemaVersion:1,operationId:j.id,action:'publish',intent:p,changes:[change('identity',p.confirmation.entity.id,p.confirmation.entity),change('deck',p.deck.id,p.deck),change('card',p.card.id,p.card),change('confirmation',p.confirmation.id,p.confirmation),change('volume-link',p.deck.id,{schemaVersion:1,deckId:p.deck.id,volumeId:p.confirmation.source.volumeId}),change('manifest',p.deck.id,{schemaVersion:1,deckId:p.deck.id,cardIds:[p.card.id]})]};
   const ack=await h.adapter.transport.apply(h.driver.owner,original);if(ack.value.status!=='accepted')throw new Error('legacy setup rejected');
   await h.repo.changeCoordination(h.workspace.active(),()=>{},(s:any)=>{s.imports={legacy:{id:'legacy',source:'guest',destination:h.driver.owner,fingerprint:'legacy-capture',inventory:source,status:'pending',steps:[{kind:'content',id:j.id,operation:original,receipt:ack.value,done:true},{kind:'history',id:source.records.events[0].key}],createdCards:[p.card.id],blocked:[],sourceChanged:false}};});
   const before=(await t.plans()).legacy.steps,ok=await t.resume('legacy'),after=(await t.plans()).legacy;return {ok,before,after:after.steps,blocked:after.blocked,version:after.protocolVersion??null,sourceUnchanged:JSON.stringify(await t.inventory())===JSON.stringify(source)};
  });expect(result.ok).toBe(false);expect(result.after).toEqual(result.before);expect(result.blocked).toEqual(['legacy-v1-checkpoint-preserved']);expect(result.version).toBe(null);expect(result.sourceUnchanged).toBe(true);expect(a.controls.applies).toBe(1);expect(a.controls.transferCalls??[]).toEqual([]);
 }finally{await a.context.close();}
});


