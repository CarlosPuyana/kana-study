import {test,expect,Page,Browser,BrowserContext} from '@playwright/test';
import {readFileSync} from 'node:fs';
const fixture=(_volume:string)=>JSON.parse(readFileSync('supabase/tests/h2ba-fixture.json','utf8'));
export const users=JSON.parse(process.env.H4BA_USERS??'[]') as {id:string;token:string}[];
const endpoint=process.env.H4BA_HTTP_URL;
export type Controls={pageSize?:number;applies?:number;transferCalls?:string[];transferLose?:string;transferPause?:{action:string;index?:number;before?:boolean;entered:()=>void;wait:Promise<void>};missingV2?:boolean;pauseEvidence?:{entered:()=>void;wait:Promise<void>};lose?:boolean;interrupt?:number;pages:number;pause?:{entered:()=>void;wait:Promise<void>};pauseApply?:{entered:()=>void;wait:Promise<void>};duringPage?:()=>Promise<void>};
export async function open(browser:Browser,userIndex:number,controls:Controls={pages:0},guest=false,sharedContext?:BrowserContext){
 const context=sharedContext??await browser.newContext();const page=await context.newPage();
 await page.route('**/supabase-config.js',r=>r.fulfill({contentType:'text/javascript',body:'window.__KANA_STUDY_CONFIG__={};'}));
 await page.exposeBinding('h4baRemote',async(_source,{owner,kind,op,id,cursor,size,after}:{owner:string;kind:string;op?:any;id?:string;cursor?:string;size?:number;after?:number})=>{
  const actor=users.find(u=>u.id===owner);if(!actor)throw new Error('Unapproved test owner');
  if(kind==='apply')controls.applies=(controls.applies??0)+1;
  if(kind.startsWith('transfer')&&controls.missingV2)throw new Error('V2 migration unavailable');
  if(kind==='transferApply'){(controls.transferCalls??=[]).push(op.action);if(controls.transferPause?.before&&controls.transferPause.action===op.action&&(controls.transferPause.index===undefined||controls.transferPause.index===op.index)){const p=controls.transferPause;controls.transferPause=undefined;p.entered();await p.wait;}}
  if(kind==='conflictEvidence'&&controls.pauseEvidence){const p=controls.pauseEvidence;controls.pauseEvidence=undefined;p.entered();await p.wait;}
  if(kind==='changes'){
   controls.pages++;if(controls.interrupt===controls.pages)throw new Error('Interrupted page');
   if(controls.pause){const barrier=controls.pause;controls.pause=undefined;barrier.entered();await barrier.wait;}
   if(controls.duringPage){const run=controls.duringPage;controls.duringPage=undefined;await run();}
  }
  const read=['receipt','confirmationReceipt','conflictEvidence','conflictResolutions','transferReceipt'].includes(kind);
  const path=kind==='transferReceipt'?`custom_transfer_receipts_v2?user_id=eq.${owner}&operation_id=eq.${encodeURIComponent(id!)}`:kind==='conflictEvidence'?`custom_sync_conflicts_v1?select=user_id,operation_id,reason,evidence&user_id=eq.${owner}&order=operation_id&limit=8${cursor?'&operation_id=gt.'+encodeURIComponent(cursor):''}`:kind==='conflictResolutions'?`custom_sync_receipts_v1?select=user_id,request,result&user_id=eq.${owner}&request=cs.${encodeURIComponent(JSON.stringify({resolvesOperationId:id}))}&result->>status=eq.accepted&limit=101`:kind==='confirmationReceipt'?`custom_sync_receipts_v1?select=user_id,request,result&user_id=eq.${owner}&request=cs.${encodeURIComponent(JSON.stringify({changes:[{kind:'confirmation',id}]}))}&result->>status=eq.accepted&limit=1`:kind==='receipt'?`custom_sync_receipts_v1?select=user_id,request,result&user_id=eq.${owner}&operation_id=eq.${encodeURIComponent(id!)}`:
   'rpc/'+({transferApply:'apply_custom_transfer_v2',transferGet:'get_custom_transfer_v2',apply:'apply_custom_deck_operation_v1',bundle:'get_custom_deck_bundle_v1',changes:'get_custom_deck_changes_v1'} as Record<string,string>)[kind];
  const response=await fetch(endpoint+'/'+path,{method:read?'GET':'POST',headers:{Authorization:'Bearer '+actor.token,'Content-Type':'application/json'},
   body:read?undefined:JSON.stringify(kind==='apply'||kind==='transferApply'?{op}:kind==='transferGet'?{transfer_id:id,after_index:after??-1}:kind==='bundle'?{deck:id}:{after_revision:cursor,page_size:Math.min(size??100,controls.pageSize??2)}),signal:AbortSignal.timeout(10000)});
  const data=await response.json();if(!response.ok)throw new Error(`Local PostgREST ${response.status}: ${data.message??data.code}`);
  if(kind==='transferApply'&&controls.transferPause&&!controls.transferPause.before&&controls.transferPause.action===op.action&&(controls.transferPause.index===undefined||controls.transferPause.index===op.index)){const p=controls.transferPause;controls.transferPause=undefined;p.entered();await p.wait;}
  if(kind==='transferApply'&&controls.transferLose===op.action){controls.transferLose=undefined;throw new Error('V2 response lost after commit');}
  if(kind==='apply'&&controls.pauseApply){const barrier=controls.pauseApply;controls.pauseApply=undefined;barrier.entered();await barrier.wait;}
  if(kind==='apply'&&controls.lose){controls.lose=false;throw new Error('Response lost after remote commit');}
  return {owner,value:kind==='conflictEvidence'||kind==='conflictResolutions'?data:read?(data[0]??null):data};
 });
 await initialize(page,users[userIndex].id,guest);return {page,context,controls};
}
export async function initialize(page:Page,owner:string,guest=false){
 await page.goto('/#/anki');await expect(page.locator('app-anki-page')).toBeVisible();
 await page.evaluate(async ({owner,guest})=>{
  const c=(window as any).ng.getComponent(document.querySelector('app-anki-page')),catalog=c.catalog,repo=catalog.repository,adapter=catalog.customSync;
  await Promise.resolve();await Promise.resolve(); // Auth without configuration completes its normal Guest initialization.
  repo.customEnabled.set(true);repo.mangaAssistedEnabled.set(true);const workspace=repo.workspace;guest?workspace.activateGuest():workspace.activateUser(owner);adapter.enabled.set(true);
  const call=(kind:string,args:object)=>{if(!navigator.onLine)return Promise.reject(new TypeError('offline'));return (window as any).h4baRemote({owner:driver.owner,kind,...args});};
  const auth=adapter.transport.auth;auth.userState.set({id:owner,email:"synthetic@example.test"});auth.importState.set(guest);
  const driver={owner};Object.assign(adapter.transport,{principal:()=>driver.owner,apply:(_owner:string,op:unknown)=>call('apply',{op}),receipt:(_owner:string,id:string)=>call('receipt',{id}),confirmationReceipt:(_owner:string,id:string)=>call('confirmationReceipt',{id}),conflictEvidence:(_owner:string,cursor:string|null,size:number)=>call('conflictEvidence',{cursor,size}),conflictResolutions:(_owner:string,id:string)=>call('conflictResolutions',{id}),
   transferApply:(_owner:string,op:unknown)=>call('transferApply',{op}),transferGet:(_owner:string,id:string,after:number)=>call('transferGet',{id,after}),transferReceipt:(_owner:string,id:string)=>call('transferReceipt',{id}),
   changes:(_owner:string,cursor:string,size:number)=>call('changes',{cursor,size}),bundle:(_owner:string,id:string)=>call('bundle',{id})});
  (window as any).h4ba={catalog,repo,adapter,workspace,study:c.study,auth,driver};
  const consent=(await repo.syncSnapshot(workspace.active())).state.consent;if(!guest&&!consent?.accepted)await repo.setCustomConsent(workspace.active(),true);await catalog.refresh();
 },{owner,guest});
}
export async function confirmed(page:Page,volume:string){
 const p=fixture(volume);const owner=await page.evaluate(()=>(window as any).h4ba.workspace.active());p.confirmation.workspace=owner;p.confirmation.actor.workspace=owner;
 await page.evaluate(async p=>{await (window as any).h4ba.repo.confirmMangaCard(p);await (window as any).h4ba.catalog.refresh();},p);return p;
}
export async function sync(page:Page,expected=true){
 const result=await page.evaluate(async()=>{const a=(window as any).h4ba.adapter;const ok=await a.syncNow();return {ok,status:a.status(),error:a.failure()?.message??null};});
 expect(result,JSON.stringify(result)).toMatchObject({ok:expected});return result;
}
export async function data(page:Page,deck:string){return page.evaluate(async deck=>{const r=(window as any).h4ba.repo;return {cards:await r.content(deck),progress:await r.getDeckProgress(deck),events:await r.getDeckReviewEvents(deck),journal:await r.journal()};},deck);}
export async function rate(page:Page,deck:string,at:string){
 return page.evaluate(async({deck,at})=>{const {repo,study}=(window as any).h4ba;const d=(await repo.list()).find((d:any)=>d.id===deck),card=(await repo.content(deck))[0];
  const progress=(await repo.getDeckProgress(deck)).find((p:any)=>p.entryId===card.id)??null,choice={entryId:card.id,kind:progress?'review':'new',progress};
  const now=new Date(at),preview=study.preview(d,choice,now);return study.rate(d,choice,preview,'good',900,now);
 },{deck,at});
}

