import {test,expect,Page} from '@playwright/test';
import {open,confirmed,data,rate,sync,users,initialize} from './custom-decks-sync.fixture';
async function panel(page:Page){await page.goto('/#/profile');await expect(page.locator('app-custom-cloud-panel')).toBeVisible();await page.evaluate(()=>{(window as any).h4bc=(window as any).ng.getComponent(document.querySelector('app-custom-cloud-panel'));});}
const recover=(page:Page)=>page.evaluate(()=>(window as any).h4bc.recovery.inspect());

test('submitted rejection survives local-device loss, explicit resolution and tombstone, with no canonical replay',async({browser})=>{
 const a=await open(browser,22),b=await open(browser,22),other=await open(browser,23);let clean:Awaited<ReturnType<typeof open>>|undefined;
 try{
  const p=await confirmed(a.page,'durability');await sync(a.page);await sync(b.page);
  const base=await rate(a.page,p.deck.id,'2026-10-21T12:00:00Z');await sync(a.page);await sync(b.page);
  const winner=await rate(a.page,p.deck.id,'2026-10-22T12:00:00Z'),loser=await rate(b.page,p.deck.id,'2026-10-22T12:01:00Z');await sync(a.page);await sync(b.page,false);
  const neverSent=await rate(b.page,p.deck.id,'2026-10-23T12:00:00Z');await panel(b.page);const before=await data(b.page,p.deck.id);const local=await recover(b.page);
  expect(local.conflicts[0].events[0]).toEqual(loser);expect(local.conflicts[0].ancestors).toEqual([base]);expect(local.conflicts[0].canonicalProgress.card.reps).toBe(2);expect(JSON.stringify(local)).not.toContain(neverSent.id);expect(local.conflicts[0].localTail).toBe('unknown');expect(await data(b.page,p.deck.id)).toEqual(before);
  clean=await open(browser,22);await panel(clean.page);expect((await data(clean.page,p.deck.id)).events).toEqual([]);const fresh=await recover(clean.page);expect(fresh.conflicts[0].operation).toEqual(local.conflicts[0].operation);expect((await data(clean.page,p.deck.id)).events).toEqual([]);
  const conflict=await b.page.evaluate(async()=>(await (window as any).h4bc.resolver.list())[0]);expect(await b.page.evaluate(async id=>(window as any).h4bc.resolver.resolve(id,'keep',true),conflict.id)).toBe(true);await b.context.close();
  const resolved=await recover(clean.page);expect(resolved.conflicts[0].resolutions).toHaveLength(1);expect(resolved.conflicts[0].applied).toBe(false);await sync(clean.page);expect((await data(clean.page,p.deck.id)).events.map((e:any)=>e.id).sort()).toEqual([base.id,winner.id].sort());
  await a.page.evaluate(async({id,deck})=>(window as any).h4ba.repo.lifecycle('after-conflict-delete','delete','card',id,deck),{id:p.card.id,deck:p.deck.id});await sync(a.page);
  const deleted=await recover(clean.page);expect(deleted.conflicts[0].deleted).toBe(true);expect(deleted.conflicts[0].events[0].elapsedAnswerMs).toBe(900);expect(deleted.conflicts[0].provenance.lexicalIdentity).toEqual(p.card.lexicalIdentity);
  await panel(other.page);expect((await recover(other.page)).conflicts).toEqual([]);
  await clean.page.evaluate(async()=>(window as any).h4bc.transfer.consent(false));expect((await recover(clean.page)).conflicts).toHaveLength(1);expect(clean.controls.applies??0).toBe(0);
  let release!:()=>void,entered!:()=>void;const barrier=new Promise<void>(r=>release=r),waiting=new Promise<void>(r=>entered=r);clean.controls.pauseEvidence={entered,wait:barrier};
  const delayed=recover(clean.page).then(()=>false,()=>true);await waiting;await clean.page.evaluate(({a,b})=>{const h=(window as any).h4ba;h.driver.owner=b;h.workspace.activateUser(b);h.driver.owner=a;h.workspace.activateUser(a);},{a:users[22].id,b:users[23].id});release();expect(await delayed).toBe(true);
 }finally{await a.context.close();await b.context.close();await other.context.close();await clean?.context.close();}
});
async function family(page:Page,children:number){const p=await confirmed(page,'atomic-family');await rate(page,p.deck.id,'2026-10-22T12:00:00Z');await page.evaluate(async({deck,children})=>{const h=(window as any).h4ba;for(let i=0;i<children;i++){const definition=(await h.repo.list()).find((d:any)=>d.id===deck),card=(await h.repo.content(deck))[0],progress=(await h.repo.getDeckProgress(deck))[0],choice={entryId:card.id,kind:'review',progress};const now=new Date(Date.parse('2026-10-22T13:00:00Z')+i*1000),preview=h.study.preview(definition,choice,now),event=await h.study.rate(definition,choice,preview,'good',900,now);await h.study.undo(event);}}, {deck:p.deck.id,children});return p;}
async function start(page:Page){return page.evaluate(async()=>{const b=(window as any).h4bc,h=(window as any).h4ba;h.workspace.activateUser(h.driver.owner);await b.transfer.consent(true);const ok=await b.transfer.start(true);return {ok,status:b.transfer.status(),failure:String(b.transfer.failure())};});}

test('V2 preserves large original review/undo families without splitting any frozen V1 request',async({browser})=>{
 const blocked=await open(browser,24,{pages:0},true),supported=await open(browser,25,{pages:0},true),receiver=await open(browser,25);try{
  const p=await family(blocked.page,62);await panel(blocked.page);const source=await blocked.page.evaluate(()=>(window as any).h4bc.transfer.inventory());expect(await start(blocked.page)).toMatchObject({ok:true});expect(blocked.controls.applies??0).toBe(0);
  const frozen=await blocked.page.evaluate(async()=>Object.values((await (window as any).h4ba.repo.syncSnapshot((window as any).h4ba.workspace.active())).state.transfers).flatMap((t:any)=>t.bodies.flatMap((b:string)=>JSON.parse(b))));expect(frozen.every((r:any)=>r.value.changes.length<=64)).toBe(true);expect((await data(blocked.page,p.deck.id)).events).toHaveLength(1);expect(await blocked.page.evaluate(()=>(window as any).h4bc.transfer.inventory())).toEqual(source);
  const q=await family(supported.page,61);await panel(supported.page);const result=await start(supported.page);expect(result,JSON.stringify(result)).toMatchObject({ok:true});await sync(receiver.page);expect((await data(receiver.page,q.deck.id)).events).toHaveLength(1);expect((await data(receiver.page,q.deck.id)).progress[0].card.reps).toBe(1);
 }finally{await blocked.context.close();await supported.context.close();await receiver.context.close();}
});

test('a real bundle over 4 MiB publishes through the validated paged feed in two clean browsers',async({browser})=>{
 const a=await open(browser,27,{pages:0,pageSize:25}),b=await open(browser,27,{pages:0,pageSize:25});try{
  const deck=process.env.H4BC_LARGE_DECK!;expect(deck).toBeTruthy();await sync(a.page);await sync(b.page);
  const first=await data(a.page,deck),second=await data(b.page,deck);expect(first.cards).toHaveLength(50);expect(second.cards).toEqual(first.cards);expect(first.events).toEqual([]);
  await a.page.reload();await initialize(a.page,users[27].id);await sync(a.page);expect((await data(a.page,deck)).cards).toEqual(first.cards);
 }finally{await a.context.close();await b.context.close();}
});

test('V2 closes the H4A content/history publication gap and resumes without exposing a fake New card',async({browser})=>{
 const a=await open(browser,26,{pages:0},true),b=await open(browser,26);try{
  const p=await confirmed(a.page,'guest-gap'),event=await rate(a.page,p.deck.id,'2026-10-22T12:00:00Z');await panel(a.page);const original=await a.page.evaluate(()=>(window as any).h4bc.transfer.inventory());
  a.controls.transferLose='chunk';expect(await start(a.page)).toMatchObject({ok:false});expect(await a.page.evaluate(()=>(window as any).h4ba.adapter.status())).not.toBe('synced');
  // Staged content is absent from both V1 readers and study until the final V2 commit.
  await sync(b.page);const partial=await data(b.page,p.deck.id);expect(partial.cards).toHaveLength(0);expect(partial.progress).toEqual([]);expect(partial.events).toEqual([]);
  expect(await a.page.evaluate(()=>(window as any).h4bc.transfer.inventory())).toEqual(original);const pending=await a.page.evaluate(async()=>Object.values(await (window as any).h4bc.transfer.plans())[0] as any);expect(pending.status).toBe('blocked');expect(pending.published).not.toBe(true);
  const result=await start(a.page);expect(result,JSON.stringify(result)).toMatchObject({ok:true});await sync(b.page);expect((await data(b.page,p.deck.id)).events).toEqual([event]);expect((await data(b.page,p.deck.id)).progress[0].card.reps).toBe(1);expect(await a.page.evaluate(()=>(window as any).h4bc.transfer.inventory())).toEqual(original);
  // A second browser imports the same copied source with a different local journal/checkpoint.
  await panel(b.page);await b.page.evaluate(async({p,source})=>{const h=(window as any).h4ba;h.workspace.activateGuest();await h.repo.confirmMangaCard(p);await h.repo.commitReview(source.records.progress[0].value,source.records.events[0].value,source.records.daily[0].value);},{p,source:original});
  const repeated=await start(b.page);expect(repeated,JSON.stringify(repeated)).toMatchObject({ok:false,status:'blocked'});expect(b.controls.applies??0).toBe(0);expect((await data(b.page,p.deck.id)).events).toEqual([event]);
 }finally{await a.context.close();await b.context.close();}
});
