import assert from 'node:assert/strict';
import {runTransfers,guestFixture,request,sha} from './custom-transfers-v2.mjs';
import {change,publish,fixture,review} from './custom-decks.fixture.mjs';
export async function runNativeTransfers({setup,left,right,a,b,connect,waitUntil,test,apply,row,rpc,http,jwt}){
 let provenOverlaps=0;
 const invoke=async(c,op)=>(await c.query('select public.apply_custom_transfer_v2($1::jsonb) r',[JSON.stringify(op)])).rows[0].r;
 const tools=await runTransfers({query:(s,p)=>left.query(s,p),account:async owner=>left.query("select set_config('request.jwt.claims',$1,false)",[JSON.stringify({sub:owner,role:'authenticated'})]),a,b,test:(n,f)=>test('native','D1 '+n,f)});
 const prepare=async(name)=>{const q=guestFixture(name,await tools.clock());await tools.begin(q,name);await tools.upload(q,name);assert.equal((await tools.call(request(name,name+'-ready','validate',3))).state,'ready-to-publish');return q;};
 async function overlap(first,second,release){
  let pending;await left.query('begin');await right.query('begin');
  try{
   const one=await first();pending=second().then(value=>({value}),error=>({error}));
   await waitUntil(async()=>(await setup.query('select $1::int=any(pg_blocking_pids($2::int)) blocked',[left.processID,right.processID])).rows[0].blocked,'V2 independent backends blocked',3000);
   provenOverlaps++;
   if(release)await release(one);await left.query('commit');const two=await pending;await right.query('commit');return {one,...two};
  }catch(e){await left.query('rollback');if(pending)await pending;await right.query('rollback');throw e;}
 }
 await test('native','D1 two publishers, lost ACK and V1 readers see one atomic content/history commit',async()=>{
  const id='v2-native-race',q=await prepare(id),op=request(id,id+'-publish','publish',4);
  const third=await connect('h4a1',a);
  const results=await overlap(()=>invoke(left,op),()=>invoke(right,op),async()=>{
   assert.equal((await third.query('select public.get_custom_deck_bundle_v1($1) r',[q.p.deck.id])).rows[0].r,null);
   assert.equal((await third.query('select * from public.custom_sync_entities_v1 where entity_id=$1',[q.p.card.id])).rows.length,0);
  });
  assert.equal(results.one.state,'published');assert.deepEqual(results.value,results.one);
  assert.deepEqual(await invoke(third,op),results.one);
  const all=(await third.query("select kind,payload from public.custom_sync_entities_v1 where deck_id=$1",[q.p.deck.id])).rows;
  assert.ok(all.some(x=>x.kind==='card'));assert.deepEqual(all.find(x=>x.kind==='progress').payload,q.study.changes[0].payload);
 });
 await test('native','D1 distinct final operationIds serialize; stale transfer CAS is rejected',async()=>{
  const id='v2-native-two';await prepare(id);
  const result=await overlap(()=>invoke(left,request(id,id+'-one','publish',4)),()=>invoke(right,request(id,id+'-two','publish',4)));
  assert.equal(result.one.state,'published');assert.equal(result.error?.code,'40001');
 });
 await test('native','D1 V1 delete wins while V2 publication waits; staged content cannot resurrect',async()=>{
  const id='v2-native-delete',q=await prepare(id);
  const result=await overlap(()=>apply(left,{schemaVersion:1,operationId:id+'-delete',action:'delete',changes:[change('card',q.p.card.id,null)]}),()=>invoke(right,request(id,id+'-publish','publish',4)));
  assert.equal(result.one.status,'accepted');assert.equal(result.value.state,'blocked');assert.equal(result.value.reason,'destination-revision-conflict');assert.ok((await row(left,'card',q.p.card.id)).deleted_at);
 });
 await test('native','D1 concurrent restore or review on destination invalidates the closed owner generation',async()=>{
  const old=fixture('v2-native-existing');await apply(left,publish(old));const card=await row(left,'card',old.card.id);
  await apply(left,{schemaVersion:1,operationId:'v2-existing-delete',action:'delete',changes:[change('card',old.card.id,null,card.revision)]});
  const deleted=await row(left,'card',old.card.id),id='v2-native-restore',q=await prepare(id);
  const result=await overlap(()=>apply(left,{schemaVersion:1,operationId:'v2-existing-restore',action:'restore',changes:[change('card',old.card.id,card.payload,deleted.revision)]}),()=>invoke(right,request(id,id+'-publish','publish',4)));
  assert.equal(result.one.status,'accepted');assert.equal(result.value.state,'blocked');assert.equal(await row(left,'card',q.p.card.id),undefined);
  const id2='v2-native-review';await prepare(id2);
  const result2=await overlap(()=>apply(left,review(old,'v2-existing-review')),()=>invoke(right,request(id2,id2+'-publish','publish',4)));
  assert.equal(result2.one.status,'accepted');assert.equal(result2.value.state,'blocked');
 });
 await test('native','D1 exact 512 KiB envelope accepted, plus one byte rejected without storing chunk',async()=>{
  const q=guestFixture('v2-exact-bytes',await tools.clock(),false),id='exact-bytes';
  const shell=request(id,id+'-chunk','chunk',1,{index:0,body:q.bodies[0]});
  const size=(await left.query('select octet_length($1::jsonb::text) n',[JSON.stringify(shell)])).rows[0].n;
  shell.body+=' '.repeat(524288-size);q.bodies[0]=shell.body;q.manifest.chunks[0]={index:0,sha256:sha(shell.body),bytes:Buffer.byteLength(shell.body)};
  await tools.begin(q,id);assert.equal((await invoke(left,shell)).state,'staging');
  assert.equal((await left.query('select octet_length($1::jsonb::text) n',[JSON.stringify(shell)])).rows[0].n,524288);
  await assert.rejects(()=>invoke(left,{...shell,operationId:id+'-over!',body:shell.body+' '}),e=>e.code==='22023');
  assert.equal((await tools.get(id)).chunk.body,shell.body);
 });
 await test('native','D1 quotas reserve receipt overhead and roll back the whole write at owner byte boundary',async()=>{
  const user='00000000-0000-0000-0000-000000009991';await setup.query('insert into auth.users(id) values($1)',[user]);const c=await connect('h4a1',user);
  const q=guestFixture('quota',0,false),manifestBytes=(await c.query('select octet_length($1::jsonb::text) n',[JSON.stringify(q.manifest)])).rows[0].n;
  await setup.query('insert into public.custom_transfer_usage_v2(user_id,bytes) values($1,$2)',[user,67108864-manifestBytes-2048]);
  assert.equal((await invoke(c,request('quota','quota-b','begin',0,{kind:'guest-import',manifest:q.manifest}))).state,'staging');
  assert.equal((await c.query('select bytes::text b from public.custom_transfer_usage_v2')).rows[0].b,'67108864');
  await assert.rejects(()=>invoke(c,request('quota','quota-c','chunk',1,{index:0,body:q.bodies[0]})),e=>e.code==='23514');
  assert.equal((await c.query('select * from public.custom_transfer_chunks_v2')).rows.length,0);assert.equal((await c.query('select count(*)::int n from public.custom_transfer_receipts_v2')).rows[0].n,1);
  await setup.query('update public.custom_transfer_usage_v2 set bytes=0,transfers=32 where user_id=$1',[user]);
  await assert.rejects(()=>invoke(c,request('quota2','quota2-b','begin',0,{kind:'guest-import',manifest:q.manifest})),e=>e.code==='54000');
  await setup.query('update public.custom_transfer_usage_v2 set receipts=8192 where user_id=$1',[user]);
  await assert.rejects(()=>invoke(c,request('quota','quota-cancel','cancel',1)),e=>e.code==='54000');
 });
 await test('http','D1 signed HTTP resumes staging from a clean client, validates and publishes; V1 sees no partial data',async()=>{
  const id='v2-http',q=guestFixture(id,await tools.clock()),begin=request(id,id+'-begin','begin',0,{kind:'guest-import',manifest:q.manifest});
  const ack=await rpc('apply_custom_transfer_v2',{op:begin});assert.equal(ack.status,200);assert.deepEqual((await rpc('apply_custom_transfer_v2',{op:begin})).data,ack.data);
  for(let i=0;i<q.bodies.length;i++){
   assert.equal((await rpc('apply_custom_transfer_v2',{op:request(id,id+'-c'+i,'chunk',i+1,{index:i,body:q.bodies[i]})})).data.state,'staging');
   assert.equal((await rpc('get_custom_deck_bundle_v1',{deck:q.p.deck.id})).data,null);
  }
  const clean=await rpc('get_custom_transfer_v2',{transfer_id:id,after_index:-1},jwt(a));assert.equal(clean.data.chunk.body,q.bodies[0]);
  assert.equal((await rpc('apply_custom_transfer_v2',{op:request(id,id+'-check','validate',3)})).data.state,'ready-to-publish');
  assert.equal((await rpc('get_custom_deck_bundle_v1',{deck:q.p.deck.id})).data,null);
  const final=request(id,id+'-final','publish',4),done=await rpc('apply_custom_transfer_v2',{op:final});assert.equal(done.data.state,'published');assert.deepEqual((await rpc('apply_custom_transfer_v2',{op:final})).data,done.data);
  assert.equal((await rpc('get_custom_deck_bundle_v1',{deck:q.p.deck.id})).data.status,'complete');
 });
 await test('http','D1 archive recovery over HTTP has exact chunks, visible incompleteness and owner isolation',async()=>{
  let cursor=-1;const recovered=[];
  for(;;){const r=await rpc('get_custom_transfer_v2',{transfer_id:'branch',after_index:cursor});assert.equal(r.status,200);assert.equal(r.data.state,'complete');if(!r.data.chunk)break;assert.equal(sha(r.data.chunk.body),r.data.chunk.sha256);recovered.push(...JSON.parse(r.data.chunk.body));cursor=r.data.chunk.index;}
  assert.deepEqual(recovered.map(r=>r.value.operationId),['v2-lose','v2-never-applied']);
  assert.equal((await rpc('get_custom_transfer_v2',{transfer_id:'limits',after_index:-1})).data.state,'staging');
  assert.equal((await rpc('get_custom_transfer_v2',{transfer_id:'never-sent',after_index:-1})).data,null);
  assert.equal((await rpc('get_custom_transfer_v2',{transfer_id:'branch',after_index:-1},jwt(b))).data,null);
  for(const table of ['custom_transfers_v2','custom_transfer_chunks_v2','custom_transfer_receipts_v2','custom_transfer_usage_v2']){
   assert.deepEqual((await http(table+'?user_id=eq.'+a,{method:'GET',token:jwt(b)})).data,[]);
   // An empty PATCH is a PostgREST no-op and does not exercise SQL UPDATE privileges.
   for(const method of ['POST','PATCH','DELETE']){const r=await http(table,{method,body:method==='DELETE'?undefined:{user_id:a}});assert.ok(r.status>=400,table+' '+method+': '+r.status);}
  }
  for(const token of [null,'invalid',jwt(a,{exp:1})])for(const [name,body] of [['get_custom_transfer_v2',{transfer_id:'branch',after_index:-1}],['apply_custom_transfer_v2',{op:request('none','anon','cancel',0)}]])assert.ok((await rpc(name,body,token)).status>=400);
  const functions=(await setup.query("select oid::regprocedure::text signature,proconfig from pg_proc where pronamespace='public'::regnamespace and proname like 'cd_%_v2'")).rows;
  for(const f of functions){assert.ok(f.proconfig.includes('search_path=""'));assert.equal((await setup.query("select has_function_privilege('authenticated',$1,'EXECUTE') x",[f.signature])).rows[0].x,false);}
 });
 return {provenOverlaps};
}
