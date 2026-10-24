// Original synthetic fixtures. Hash exact UTF-8 JSON text, not reserialized FSRS floats.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {fixture,publish,review,change} from './custom-decks.fixture.mjs';
export const sha=body=>createHash('sha256').update(body).digest('hex');
export const request=(transferId,operationId,action,expectedRevision,extra={})=>({schemaVersion:2,transferId,operationId,action,expectedRevision:String(expectedRevision),...extra});
export function guestFixture(name,base='0',history=true){
 const p=fixture(name),content=publish(p),study=review(p,'history-'+name);study.action='import-history';study.expectedHead=study.changes[1].id;
 study.changes[1].parentHead=null;
 const ops=history?[content,study]:[content];
 const bodies=ops.map(value=>JSON.stringify([{type:'operation',value}]));
 const entities=[...new Map(ops.flatMap(o=>o.changes.map(c=>[c.kind+':'+c.id,{kind:c.kind,id:c.id}]))).values()];
 const manifest={schemaVersion:2,source:'guest',namespace:p.confirmation.entity.registryNamespace,baseServerRevision:String(base),
  chunks:bodies.map((body,index)=>({index,sha256:sha(body),bytes:Buffer.byteLength(body)})),entities,
  cards:[{id:p.card.id,deckId:p.deck.id,identityKey:p.card.lexicalIdentity.key,contentVersion:1,confirmationId:p.confirmation.id,
   history:history?'history':'new',snapshot:history?study.changes[0].payload:null,head:history?study.expectedHead:null,eventIds:history?[study.expectedHead]:[]}]};
 return {p,content,study,ops,bodies,manifest};
}
export async function runTransfers({query,account,a,b,test}){
 const call=async op=>(await query('select public.apply_custom_transfer_v2($1::jsonb) r',[JSON.stringify(op)])).rows[0].r;
 const get=async(id,after=-1)=>(await query('select public.get_custom_transfer_v2($1,$2) r',[id,after])).rows[0].r;
 const clock=async()=>(await query('select revision::text r from public.custom_sync_clock_v1 where user_id=auth.uid()')).rows[0]?.r??'0';
 const bundle=async id=>(await query('select public.get_custom_deck_bundle_v1($1) r',[id])).rows[0].r;
 const begin=async(q,id)=>call(request(id,id+'-begin','begin',0,{kind:'guest-import',manifest:q.manifest}));
 const upload=async(q,id,start=1)=>{let r;for(let i=0;i<q.bodies.length;i++)r=await call(request(id,id+'-chunk-'+i,'chunk',start+i,{index:i,body:q.bodies[i]}));return r;};
 await account(a);
 await test('V2 new Guest: staging is absent from V1 raw feed/bundle; validation has no side effects; explicit commit publishes',async()=>{
  const q=guestFixture('v2-new',await clock(),false),id='new';await begin(q,id);
  assert.equal(await bundle(q.p.deck.id),null);assert.equal((await get(id)).state,'staging');
  await upload(q,id);assert.equal(await bundle(q.p.deck.id),null);
  assert.equal((await query('select * from public.custom_sync_entities_v1 where entity_id=$1',[q.p.card.id])).rows.length,0);
  const ready=await call(request(id,'new-check','validate',2));assert.equal(ready.state,'ready-to-publish');assert.equal(await bundle(q.p.deck.id),null);
  assert.equal((await query('select * from public.custom_sync_receipts_v1 where operation_id=$1',[q.content.operationId])).rows.length,0);
  const op=request(id,'new-final','publish',3),ack=await call(op);assert.equal(ack.state,'published');assert.equal((await bundle(q.p.deck.id)).status,'complete');
  assert.deepEqual(await call(op),ack);await assert.rejects(()=>call({...op,action:'cancel'}));
  assert.equal((await query("select * from public.custom_sync_entities_v1 where kind='progress' and entity_id=$1",[q.p.card.id])).rows.length,0);
 });
 await test('V2 interruption after content, missing history blocked, resumable upload from another reader, exact FSRS publication',async()=>{
  const q=guestFixture('v2-history',await clock()),id='history';await begin(q,id);
  const first=request(id,'history-c0','chunk',1,{index:0,body:q.bodies[0]});const ack=await call(first);assert.deepEqual(await call(first),ack);
  await assert.rejects(()=>call({...first,body:first.body+' '}));assert.equal((await get(id)).chunk.body,q.bodies[0]);
  assert.equal((await call(request(id,'history-incomplete','validate',2))).state,'blocked');assert.equal(await bundle(q.p.deck.id),null);
  assert.equal((await call(request(id,'history-c1','chunk',3,{index:1,body:q.bodies[1]}))).state,'staging');
  assert.equal((await call(request(id,'history-check','validate',4))).state,'ready-to-publish');assert.equal(await bundle(q.p.deck.id),null);
  assert.equal((await call(request(id,'history-final','publish',5))).state,'published');
  const pr=(await query("select * from public.custom_sync_entities_v1 where kind='progress' and entity_id=$1",[q.p.card.id])).rows[0];assert.deepEqual(pr.payload,q.study.changes[0].payload);assert.equal(pr.head,q.study.expectedHead);
  const event=(await query("select payload from public.custom_sync_entities_v1 where kind='review-event' and entity_id=$1",[q.study.expectedHead])).rows[0].payload;assert.deepEqual(event,q.study.changes[1].payload);assert.equal(event.elapsedAnswerMs,900);
 });
 await test('V2 false New and closed inventory reject atomically; cancellation remains nonpublic',async()=>{
  const q=guestFixture('v2-false-new',await clock()),id='false-new';q.manifest.cards[0].history='new';q.manifest.cards[0].snapshot=null;q.manifest.cards[0].head=null;q.manifest.cards[0].eventIds=[];
  await begin(q,id);await upload(q,id);assert.equal((await call(request(id,'false-check','validate',3))).reason,'false-new-card');assert.equal(await bundle(q.p.deck.id),null);
  assert.equal((await call(request(id,'false-cancel','cancel',4))).state,'cancelled');await assert.rejects(()=>call(request(id,'false-publish','publish',5)));
  const z=guestFixture('v2-inventory',await clock(),false);z.manifest.entities.pop();await begin(z,'inventory');await upload(z,'inventory');assert.equal((await call(request('inventory','inventory-check','validate',2))).state,'blocked');assert.equal(await bundle(z.p.deck.id),null);
 });
 await test('V2 changed owner revision between ready and publish blocks whole generation, including tombstone',async()=>{
  const q=guestFixture('v2-stale',await clock()),id='stale';await begin(q,id);await upload(q,id);assert.equal((await call(request(id,'stale-check','validate',3))).state,'ready-to-publish');
  await query('select public.apply_custom_deck_operation_v1($1::jsonb)',[JSON.stringify({schemaVersion:1,operationId:'v2-delete-staged',action:'delete',changes:[change('card',q.p.card.id,null)]})]);
  const ack=await call(request(id,'stale-final','publish',4));assert.equal(ack.state,'blocked');assert.equal(ack.reason,'destination-revision-conflict');assert.equal(await bundle(q.p.deck.id),null);
  assert.equal((await query("select deleted_at is not null deleted from public.custom_sync_entities_v1 where kind='card' and entity_id=$1",[q.p.card.id])).rows[0].deleted,true);
 });
 await test('V2 rejected branch: complete ordered archive recovers exact extra offline operations without changing canonical FSRS',async()=>{
  const p=fixture('v2-branch');await query('select public.apply_custom_deck_operation_v1($1::jsonb)',[JSON.stringify(publish(p))]);
  const win=review(p,'v2-win'),lose=review(p,'v2-lose');await query('select public.apply_custom_deck_operation_v1($1::jsonb)',[JSON.stringify(win)]);
  const rejected=(await query('select public.apply_custom_deck_operation_v1($1::jsonb) r',[JSON.stringify(lose)])).rows[0].r;assert.equal(rejected.status,'conflict');
  const next=review(p,'v2-never-applied',lose.changes[1].id,lose.changes[0].payload.card);next.changes[1].payload.elapsedAnswerMs=1234;
  const bodies=[lose,next].map(value=>JSON.stringify([{type:'operation',value}]));
  const manifest={schemaVersion:2,cardId:p.card.id,identityKey:p.card.lexicalIdentity.key,baseHead:null,head:next.changes[1].id,conflictOperationId:lose.operationId,
   operationIds:[lose.operationId,next.operationId],ancestorIds:[],resolutionIds:[],chunks:bodies.map((body,index)=>({index,sha256:sha(body),bytes:Buffer.byteLength(body)}))};
  const before=(await query('select * from public.custom_sync_entities_v1 order by revision')).rows;
  await call(request('branch','branch-begin','begin',0,{kind:'branch-archive',manifest}));
  await call(request('branch','branch-c0','chunk',1,{index:0,body:bodies[0]}));
  const partial=await get('branch');assert.equal(partial.state,'staging');assert.equal((await get('branch',0)).chunk,null);
  await assert.rejects(()=>call(request('branch','branch-incomplete','complete',2)));
  assert.equal(await get('never-transmitted'),null); // no manifest/operation was ever sent
  await call(request('branch','branch-c1','chunk',2,{index:1,body:bodies[1]}));
  const op=request('branch','branch-final','complete',3),ack=await call(op);assert.equal(ack.state,'complete');assert.deepEqual(await call(op),ack);
  const recovered=[];for(let cursor=-1;;){const page=await get('branch',cursor);if(!page.chunk)break;assert.equal(sha(page.chunk.body),page.chunk.sha256);recovered.push(...JSON.parse(page.chunk.body));cursor=page.chunk.index;}
  assert.deepEqual(recovered.map(x=>x.value),[lose,next]);assert.deepEqual((await query('select * from public.custom_sync_entities_v1 order by revision')).rows,before);
  assert.equal((await query('select * from public.custom_sync_receipts_v1 where operation_id=$1',[next.operationId])).rows.length,0);
  await account(b);assert.equal(await get('branch'),null);assert.equal((await query('select * from public.custom_transfer_chunks_v2')).rows.length,0);await account(a);
  for(const table of ['custom_transfers_v2','custom_transfer_chunks_v2','custom_transfer_receipts_v2','custom_transfer_usage_v2'])await assert.rejects(()=>query('delete from public.'+table));
 });
 await test('V2 manifest/chunk/owner quotas and input boundaries fail without partial publication',async()=>{
  const q=guestFixture('v2-limits',await clock(),false);
  await assert.rejects(()=>begin({...q,manifest:{...q.manifest,chunks:Array.from({length:129},(_,index)=>({...q.manifest.chunks[0],index}))}},'too-many'));
  await assert.rejects(()=>begin({...q,manifest:{...q.manifest,chunks:Array.from({length:17},(_,index)=>({index,sha256:'a'.repeat(64),bytes:524288}))}},'too-large'));
  await assert.rejects(()=>begin({...q,manifest:{...q.manifest,cards:Array(1001).fill(q.manifest.cards[0])}},'too-many-cards'));
  await assert.rejects(()=>call({...request('forged','forged','begin',0,{kind:'guest-import',manifest:q.manifest}),user_id:b}));
  await begin(q,'limits');await assert.rejects(()=>call(request('limits','bad-hash','chunk',1,{index:0,body:q.bodies[0]+' '})));
  assert.equal((await get('limits')).chunk,null);assert.equal(await bundle(q.p.deck.id),null);
 });
 await test('V2 64-change atomic FSRS family retains all voided descendants; 65 is blocked with staged evidence intact',async()=>{
  const make=async(name,children)=>{
   const q=guestFixture(name,await clock());
   for(let i=0;i<children;i++){
    const child=review(q.p,name+'-void-'+i,q.study.expectedHead,q.study.changes[0].payload.card).changes[1];
    child.parentHead=q.study.expectedHead;child.voidedBy='undo-'+child.id;q.study.changes.push(child);q.manifest.cards[0].eventIds.push(child.id);
    q.manifest.entities.push({kind:'review-event',id:child.id});
   }
   q.bodies[1]=JSON.stringify([{type:'operation',value:q.study}]);q.manifest.chunks[1]={index:1,sha256:sha(q.bodies[1]),bytes:Buffer.byteLength(q.bodies[1])};return q;
  };
  const q=await make('v2-family64',61);assert.equal(q.study.changes.length,64);await begin(q,'family64');await upload(q,'family64');
  assert.equal((await call(request('family64','family64-check','validate',3))).state,'ready-to-publish');assert.equal((await call(request('family64','family64-publish','publish',4))).state,'published');
  const events=(await query("select entity_id,payload,voided_by from public.custom_sync_entities_v1 where kind='review-event' and deck_id=$1",[q.p.deck.id])).rows;
  assert.equal(events.length,62);assert.equal(events.filter(e=>e.voided_by).length,61);
  for(const ev of events)assert.deepEqual(ev.payload,q.study.changes.find(c=>c.id===ev.entity_id).payload);
  const z=await make('v2-family65',62);await begin(z,'family65');await upload(z,'family65');
  assert.equal((await call(request('family65','family65-check','validate',3))).state,'blocked');assert.equal(await bundle(z.p.deck.id),null);assert.equal((await get('family65',0)).chunk.body,z.bodies[1]);
 });
 await test('V2 branch archive proves canonical ancestors and retains ordered review/undo without resurrecting a tombstone',async()=>{
  const p=fixture('v2-undo-archive');await query('select public.apply_custom_deck_operation_v1($1::jsonb)',[JSON.stringify(publish(p))]);
  const root=review(p,'v2-archive-root');await query('select public.apply_custom_deck_operation_v1($1::jsonb)',[JSON.stringify(root)]);
  const lose=review(p,'v2-archive-loser',root.changes[1].id,root.changes[0].payload.card);await query('select public.apply_custom_deck_operation_v1($1::jsonb)',[JSON.stringify(lose)]);
  const undo={schemaVersion:1,operationId:'v2-archive-undo',action:'undo',expectedHead:lose.changes[1].id,before:lose.changes[0].payload.card,
   changes:[change('progress',p.card.id,root.changes[0].payload),change('review-event',lose.changes[1].id,lose.changes[1].payload),lose.changes[2]]};
  const records=[{type:'ancestor',value:{...root.changes[1],parentHead:null,voidedBy:null}},{type:'operation',value:lose},{type:'operation',value:undo}];
  const body=JSON.stringify(records),id='archive-undo',manifest={schemaVersion:2,cardId:p.card.id,identityKey:p.card.lexicalIdentity.key,baseHead:root.changes[1].id,head:root.changes[1].id,
   conflictOperationId:lose.operationId,operationIds:[lose.operationId,undo.operationId],ancestorIds:[root.changes[1].id],resolutionIds:[],chunks:[{index:0,sha256:sha(body),bytes:Buffer.byteLength(body)}]};
  await call(request(id,id+'-begin','begin',0,{kind:'branch-archive',manifest}));await call(request(id,id+'-chunk','chunk',1,{index:0,body}));assert.equal((await call(request(id,id+'-done','complete',2))).state,'complete');
  const card=(await query("select revision::text r from public.custom_sync_entities_v1 where kind='card' and entity_id=$1",[p.card.id])).rows[0];
  await query('select public.apply_custom_deck_operation_v1($1::jsonb)',[JSON.stringify({schemaVersion:1,operationId:'v2-archive-delete',action:'delete',changes:[change('card',p.card.id,null,card.r)]})]);
  assert.equal((await get(id)).chunk.body,body);assert.equal((await query("select deleted_at is not null deleted from public.custom_sync_entities_v1 where kind='card' and entity_id=$1",[p.card.id])).rows[0].deleted,true);
  // A different origin importing the same inventory cannot replace already confirmed progress.
  const duplicate=guestFixture('v2-family64',await clock());await begin(duplicate,'other-origin');await upload(duplicate,'other-origin');assert.equal((await call(request('other-origin','other-origin-check','validate',3))).state,'blocked');
 });
 await test('V2 declared boundaries accept 128 chunks/8 MiB and 1000 cards; reject one more and null action',async()=>{
  const q=guestFixture('v2-declared-limits',await clock(),false);
  q.manifest.chunks=Array.from({length:128},(_,index)=>({index,sha256:'a'.repeat(64),bytes:65536}));
  assert.equal((await begin(q,'declared-max-chunks')).state,'staging');
  const over=structuredClone(q);over.manifest.chunks[127].bytes++;await assert.rejects(()=>begin(over,'declared-over-bytes'));
  const cards=guestFixture('v2-declared-cards',await clock(),false);cards.manifest.cards=Array.from({length:1000},(_,i)=>({...cards.manifest.cards[0],id:'declared-card-'+i}));
  assert.equal((await begin(cards,'declared-max-cards')).state,'staging');cards.manifest.cards.push({...cards.manifest.cards[0],id:'declared-card-1000'});await assert.rejects(()=>begin(cards,'declared-over-cards'));
  await assert.rejects(()=>call({...request('none','null-action',null,0)}));
  assert.equal(await bundle(q.p.deck.id),null);assert.equal(await bundle(cards.p.deck.id),null);
 });
 await test('V2 fully undone history is declared history with null snapshot, never a genuinely New card',async()=>{
  const base=await clock(),q=guestFixture('v2-undone',base),id='undone';
  const studied=review(q.p,'v2-undone-review'),start=BigInt(base)+BigInt(q.content.changes.length);
  const undone={schemaVersion:1,operationId:'v2-undone-undo',action:'undo',expectedHead:studied.changes[1].id,before:studied.changes[0].payload.card,
   changes:[change('progress',q.p.card.id,null,String(start+1n)),change('review-event',studied.changes[1].id,studied.changes[1].payload,String(start+2n)),
    change('daily',studied.changes[2].id,{...studied.changes[2].payload,introducedEntryIds:[]},String(start+3n))]};
  q.bodies=[q.content,studied,undone].map(value=>JSON.stringify([{type:'operation',value}]));q.manifest.chunks=q.bodies.map((body,index)=>({index,sha256:sha(body),bytes:Buffer.byteLength(body)}));
  q.manifest.cards[0].snapshot=null;q.manifest.cards[0].head=null;q.manifest.cards[0].eventIds=[studied.changes[1].id];
  q.manifest.entities=q.manifest.entities.filter(e=>e.kind!=='review-event');q.manifest.entities.push({kind:'review-event',id:studied.changes[1].id});
  await begin(q,id);await upload(q,id);assert.equal((await call(request(id,id+'-check','validate',4))).state,'ready-to-publish');assert.equal((await call(request(id,id+'-publish','publish',5))).state,'published');
  const progress=(await query("select payload,head from public.custom_sync_entities_v1 where kind='progress' and entity_id=$1",[q.p.card.id])).rows[0];assert.deepEqual(progress,{payload:null,head:null});
  const event=(await query("select payload,voided_by from public.custom_sync_entities_v1 where kind='review-event' and entity_id=$1",[studied.changes[1].id])).rows[0];assert.deepEqual(event.payload,studied.changes[1].payload);assert.equal(event.voided_by,undone.operationId);
 });
 await test('V2 interruption halfway through ancestor chunks exposes neither ancestor events nor content to V1',async()=>{
  const q=guestFixture('v2-mid-events',await clock()),id='mid-events',root=review(q.p,'v2-mid-root');
  const ancestor={schemaVersion:1,operationId:'v2-mid-ancestor',action:'import-history',changes:[{...root.changes[1],parentHead:null}]};
  const tail=review(q.p,'v2-mid-tail',root.changes[1].id,root.changes[0].payload.card);tail.action='import-history';tail.expectedHead=tail.changes[1].id;tail.changes[1].parentHead=root.changes[1].id;
  q.bodies=[q.content,ancestor,tail].map(value=>JSON.stringify([{type:'operation',value}]));q.manifest.chunks=q.bodies.map((body,index)=>({index,sha256:sha(body),bytes:Buffer.byteLength(body)}));
  q.manifest.entities=[...new Map([q.content,ancestor,tail].flatMap(o=>o.changes.map(c=>[c.kind+':'+c.id,{kind:c.kind,id:c.id}]))).values()];
  Object.assign(q.manifest.cards[0],{snapshot:tail.changes[0].payload,head:tail.expectedHead,eventIds:[root.changes[1].id,tail.changes[1].id]});
  await begin(q,id);for(let i=0;i<2;i++)await call(request(id,id+'-c'+i,'chunk',i+1,{index:i,body:q.bodies[i]}));
  assert.equal(await bundle(q.p.deck.id),null);assert.equal((await query('select * from public.custom_sync_entities_v1 where entity_id=$1',[root.changes[1].id])).rows.length,0);
  assert.equal((await call(request(id,id+'-partial','validate',3))).reason,'incomplete-chunks');
  await call(request(id,id+'-c2','chunk',4,{index:2,body:q.bodies[2]}));assert.equal((await call(request(id,id+'-ready','validate',5))).state,'ready-to-publish');
  assert.equal((await call(request(id,id+'-publish','publish',6))).state,'published');
  const events=(await query("select entity_id,payload from public.custom_sync_entities_v1 where kind='review-event' and deck_id=$1",[q.p.deck.id])).rows;assert.equal(events.length,2);
  assert.deepEqual(events.find(e=>e.entity_id===root.changes[1].id).payload,root.changes[1].payload);assert.deepEqual(events.find(e=>e.entity_id===tail.changes[1].id).payload,tail.changes[1].payload);
 });
 return {call,get,clock,begin,upload};
}
