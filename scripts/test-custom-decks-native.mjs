// Native PostgreSQL and actual PostgREST JWT verification. Loopback, synthetic data only.
// No environment database URL or production credential is consumed.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {createHmac,randomBytes} from 'node:crypto';
import {readFile,writeFile,mkdtemp,unlink,mkdir} from 'node:fs/promises';
import {resolve,delimiter} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createServer} from 'node:net';
import pg from '../.cache/h4a1-runtime/node_modules/pg/lib/index.js';
import {fixture,publish,change,review} from '../supabase/tests/custom-decks.fixture.mjs';

const root=fileURLToPath(new URL('..',import.meta.url));
const runtime=resolve(root,'.cache/h4a1-runtime');
const bin=resolve(runtime,'node_modules/@embedded-postgres/windows-x64/native/bin');
const postgrestBin=resolve(runtime,'postgrest-v16.5/postgrest.exe');
const a='00000000-0000-0000-0000-000000000001',b='00000000-0000-0000-0000-000000000002';
const password=randomBytes(32).toString('hex'),jwtSecret=randomBytes(48).toString('hex');
const clients=new Set(); let postgres,rest;let nativePassed=0,httpPassed=0,overlaps=0,transferOverlaps=0;
let pgLog='',restLog='';const startupRuns=[];
const redact=value=>String(value).replaceAll(password,'[redacted]').replaceAll(jwtSecret,'[redacted]').replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,'[redacted-jwt]');
const results=[];
async function freePort(){const s=createServer();s.listen(0,'127.0.0.1');await once(s,'listening');const p=s.address().port;await new Promise(r=>s.close(r));return p;}
const port=await freePort(),httpPort=await freePort();
await mkdir(runtime,{recursive:true});const runDir=await mkdtemp(resolve(runtime,'run-'));
const passFile=resolve(runDir,'init-password');
function launch(exe,args,options={}){return spawn(exe,args,{cwd:root,windowsHide:true,stdio:['ignore','pipe','pipe'],...options});}
async function command(exe,args,options={}){
 const child=launch(exe,args,options);let out='';child.stdout.on('data',x=>out+=x);child.stderr.on('data',x=>out+=x);
 child.on('error',()=>{});const [code]=await once(child,'exit');assert.equal(code,0,out);return out.trim();
}
async function waitUntil(check,label,timeout=15000){
 const end=Date.now()+timeout;while(Date.now()<end){if(await check())return;await new Promise(r=>setTimeout(r,20));}
 throw new Error('Readiness/barrier timed out: '+label);
}
async function connect(database='h4a1',owner=null){
 const c=new pg.Client({host:'127.0.0.1',port,user:'postgres',password,database});await c.connect();clients.add(c);
 await c.query("set statement_timeout='10s'; set lock_timeout='5s'; set deadlock_timeout='100ms'");
 if(owner){await c.query('set role authenticated');await c.query("select set_config('request.jwt.claims',$1,false)",[JSON.stringify({sub:owner,role:'authenticated'})]);}
 return c;
}
const apply=async(c,op)=>(await c.query('select public.apply_custom_deck_operation_v1($1::jsonb) r',[JSON.stringify(op)])).rows[0].r;
const row=async(c,kind,id)=>(await c.query('select * from public.custom_sync_entities_v1 where kind=$1 and entity_id=$2',[kind,id])).rows[0];
const bundle=async(c,id)=>(await c.query('select public.get_custom_deck_bundle_v1($1) r',[id])).rows[0].r;
async function test(group,name,fn){await fn();if(group==='native')nativePassed++;else httpPassed++;console.log(`ok ${group} ${name}`);results.push({group,name});}
async function rebase(c,op){op.changes=await Promise.all(op.changes.map(async x=>({...x,baseRevision:String((await row(c,x.kind,x.id))?.revision??0)})));return op;}
async function undo(c,q,token){
 const pr=await row(c,'progress',q.card.id),ev=await row(c,'review-event',pr.head);
 const dc=review(q).changes.find(x=>x.kind==='daily'),day=await row(c,'daily',dc.id);
 return {schemaVersion:1,operationId:token,action:'undo',expectedHead:pr.head,before:pr.payload.card,changes:[
 change('progress',q.card.id,ev.payload.cardBefore,pr.revision),change('review-event',ev.entity_id,ev.payload,ev.revision),
 change('daily',day.entity_id,{...day.payload,introducedEntryIds:[]},day.revision)]};
}
// Winner stays uncommitted. A distinct backend MUST be observed blocked by it before COMMIT.
async function race(observer,first,second,left,right){
 assert.notEqual(first.processID,second.processID);await first.query('begin');await second.query('begin');
 let pending;try{
  const winner=await apply(first,left);pending=apply(second,right);pending.catch(()=>{});
  await waitUntil(async()=>{const r=await observer.query('select $1::int=any(pg_blocking_pids($2::int)) blocked',[first.processID,second.processID]);return r.rows[0].blocked;},'independent transaction lock overlap',3000);
  overlaps++;await first.query('commit');const loser=await pending;await second.query('commit');
  assert.equal(winner.status,'accepted',JSON.stringify({operationId:left.operationId,reason:winner.reason}));assert.equal(loser.status,'conflict');
  assert.deepEqual(await apply(second,right),loser);assert.deepEqual(await apply(first,left),winner);
  const evidence=(await second.query('select evidence from public.custom_sync_conflicts_v1 where operation_id=$1',[right.operationId])).rows[0];
  assert.deepEqual(evidence.evidence,right);return [winner,loser];
 }catch(error){await first.query('rollback');if(pending)await pending.catch(()=>{});await second.query('rollback');throw error;}
}
const jwt=(sub,extra={},secret=jwtSecret)=>{
 const header=Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url');
 const payload=Buffer.from(JSON.stringify({role:'authenticated',sub,iat:Math.floor(Date.now()/1000)-1,exp:Math.floor(Date.now()/1000)+300,...extra})).toString('base64url');
 return header+'.'+payload+'.'+createHmac('sha256',secret).update(header+'.'+payload).digest('base64url');
};
async function http(path,{token=jwt(a),method='POST',body}={}){
 const response=await fetch(`http://127.0.0.1:${httpPort}/${path}`,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(10000)});
 const text=await response.text();let data;try{data=JSON.parse(text);}catch{data=text;}return {status:response.status,data};
}
async function rpc(name,body,token){return http('rpc/'+name,{body,token});}
const operation=async(op,token)=>rpc('apply_custom_deck_operation_v1',{op},token);
const migrations=['202609300001_local_first_accounts.sql','202610040002_profile_leaderboard.sql','202610080003_manga_saved_sync.sql','202610080004_completed_sessions_grammar.sql','202610080005_manga_study_v3.sql','202610220001_custom_decks_foundation.sql'];
try{
 await writeFile(passFile,password,{mode:0o600});
 await command(resolve(bin,'initdb.exe'),['-D',resolve(runDir,'data'),'-U','postgres','--auth=scram-sha-256','--pwfile='+passFile,'--encoding=UTF8','--locale=C']);await unlink(passFile);
 postgres=launch(resolve(bin,'postgres.exe'),['-D',resolve(runDir,'data'),'-p',String(port),'-h','127.0.0.1']);
 postgres.stderr.on('data',x=>pgLog+=x);postgres.stdout.resume();postgres.on('error',()=>{});
 await waitUntil(async()=>{if(postgres.exitCode!==null)throw new Error('PostgreSQL exited: '+pgLog);try{const c=new pg.Client({host:'127.0.0.1',port,user:'postgres',password,database:'postgres'});await c.connect();await c.end();return true;}catch{return false;}},'PostgreSQL startup');
 const admin=await connect('postgres');console.log('Environment:',(await admin.query('select version() v')).rows[0].v);
 await admin.query('create database h4a1');await admin.query('create database h4a1_legacy_suite');
 // Execute the original 23 scenarios through a native connection, in a separate database.
 console.log(await command(process.execPath,[resolve(root,'scripts/test-custom-decks-sql.mjs'),resolve(root,'supabase/tests/native-pg-adapter.mjs')],
  {env:{...process.env,H4A1_PG_PORT:String(port),H4A1_PG_PASSWORD:password,H4A1_SQL_ENGINE:'PostgreSQL native (single-session regression)'}}));
 const setup=await connect();
 // Roles were created by the original suite and are cluster-wide. No superuser HTTP login.
 await setup.query(`create schema auth; create table auth.users(id uuid primary key,raw_user_meta_data jsonb not null default '{}');insert into auth.users values('${a}'),('${b}');
 create function auth.uid() returns uuid language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claim.sub',true),''),nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid$$;
 grant usage on schema auth to authenticated,anon;`);
 for(const name of migrations)await setup.query(await readFile(resolve(root,'supabase/migrations',name),'utf8'));
 const left=await connect('h4a1',a),right=await connect('h4a1',a);
 // Repeat critical conflicts with different synthetic objects; ordering controlled by the database barrier.
 for(let iteration=0;iteration<3;iteration++){
  await test('native',`same-deck writers and canonical manifest, repetition ${iteration+1}`,async()=>{
   const q=fixture('native-edit-'+iteration);await apply(left,publish(q));const d=await row(left,'deck',q.deck.id),m=await row(left,'manifest',q.deck.id);
   const edit=(id,title,at)=>({schemaVersion:1,operationId:id,action:'publish',changes:[change('deck',d.entity_id,{...d.payload,title,updatedAt:at},d.revision),change('manifest',m.entity_id,{schemaVersion:1,deckId:q.deck.id,cardIds:[q.card.id]},m.revision)]});
   await race(setup,left,right,edit('edit-win-'+iteration,'Winner','2000-01-01T00:00:00Z'),edit('edit-lose-'+iteration,'Future clock loser','2099-01-01T00:00:00Z'));
   assert.equal((await row(left,'deck',q.deck.id)).payload.title,'Winner');assert.equal((await bundle(left,q.deck.id)).status,'complete');
  });
  await test('native',`two reviews preserve one FSRS branch, repetition ${iteration+1}`,async()=>{
   const q=fixture('native-review-'+iteration);await apply(left,publish(q));const one=review(q,'nr-win-'+iteration),two=review(q,'nr-lose-'+iteration);
   await race(setup,left,right,one,two);assert.deepEqual((await row(left,'progress',q.card.id)).payload,one.changes[0].payload);
   assert.equal(await row(left,'review-event',two.changes[1].id),undefined);assert.deepEqual((await row(left,'review-event',one.changes[1].id)).payload,one.changes[1].payload);
  });
  for(const undoFirst of [false,true])await test('native',`review/undo ${undoFirst?'undo':'review'} wins, repetition ${iteration+1}`,async()=>{
   const q=fixture(`native-undo-${iteration}-${undoFirst}`);await apply(left,publish(q));await apply(left,review(q,`nu-first-${iteration}-${undoFirst}`));
   const pr=await row(left,'progress',q.card.id),next=await rebase(left,review(q,`nu-next-${iteration}-${undoFirst}`,pr.head,pr.payload.card)),back=await undo(left,q,`nu-undo-${iteration}-${undoFirst}`);
   await race(setup,left,right,...(undoFirst?[back,next]:[next,back]));
   assert.equal((await row(left,'progress',q.card.id)).head,undoFirst?null:next.changes[1].id);
   assert.equal((await row(left,'review-event',pr.head)).voided_by,undoFirst?back.operationId:null);
   if(undoFirst)assert.equal(await row(left,'review-event',next.changes[1].id),undefined);
  });
 }
 await test('native','different card additions conflict atomically; explicit rebase retains both',async()=>{
  const q=fixture('native-add'),dog=fixture('native-add','犬','いぬ'),bird=fixture('native-add','鳥','とり');await apply(left,publish(q));const m=await row(left,'manifest',q.deck.id);
  const append=(p,id,ids,rev)=>({schemaVersion:1,operationId:id,action:'publish',intent:p,changes:[...publish(p).changes.filter(c=>['identity','card','confirmation'].includes(c.kind)),change('manifest',q.deck.id,{schemaVersion:1,deckId:q.deck.id,cardIds:ids},rev)]});
  await race(setup,left,right,append(dog,'add-dog-native',[q.card.id,dog.card.id],m.revision),append(bird,'add-bird-native',[q.card.id,bird.card.id],m.revision));
  assert.equal(await row(left,'card',bird.card.id),undefined);assert.equal(await row(left,'identity',bird.confirmation.entity.id),undefined);
  await apply(left,append(bird,'add-bird-resolved-native',[q.card.id,dog.card.id,bird.card.id],(await row(left,'manifest',q.deck.id)).revision));
  assert.equal((await row(left,'card',bird.card.id)).payload.order,3);assert.equal((await bundle(left,q.deck.id)).status,'complete');
 });
 await test('native','delete versus edit and restore versus old operations preserve tombstones',async()=>{
  const q=fixture('native-delete');await apply(left,publish(q));const c=await row(left,'card',q.card.id),m=await row(left,'manifest',q.deck.id);
  const stale={schemaVersion:1,operationId:'stale-delete-edit',action:'edit',changes:[change('card',q.card.id,{...c.payload,contentVersion:2},c.revision),change('manifest',q.deck.id,{schemaVersion:1,deckId:q.deck.id,cardIds:[q.card.id]},m.revision)]};
  await race(setup,left,right,{schemaVersion:1,operationId:'native-delete-card',action:'delete',changes:[change('card',q.card.id,null,c.revision)]},stale);
  const gone=await row(left,'card',q.card.id);assert.ok(gone.deleted_at);
  await race(setup,left,right,{schemaVersion:1,operationId:'native-restore-card',action:'restore',changes:[change('card',q.card.id,c.payload,gone.revision)]},{...stale,operationId:'stale-after-restore'});
  assert.equal((await row(left,'card',q.card.id)).deleted_at,null);assert.equal((await bundle(left,q.deck.id)).status,'complete');
 });
 await test('native','lost response retry on a fresh connection retains original ACK without rewinding state',async()=>{
  const q=fixture('native-lost'),op=publish(q);const ack=await apply(left,op);const current=await row(left,'deck',q.deck.id);
  await apply(left,{schemaVersion:1,operationId:'archive-after-ack',action:'archive',changes:[change('deck',q.deck.id,null,current.revision)]});
  const newer=await row(left,'deck',q.deck.id);const fresh=await connect('h4a1',a);assert.deepEqual(await apply(fresh,op),ack);assert.deepEqual(await row(fresh,'deck',q.deck.id),newer);
 });
 await test('native','uncommitted publication is invisible across backends and becomes complete only after commit',async()=>{
  const q=fixture('native-publication-visibility');await left.query('begin');
  try{assert.equal((await apply(left,publish(q))).status,'accepted');assert.equal(await bundle(right,q.deck.id),null);
   assert.equal(await row(right,'identity',q.confirmation.entity.id),undefined);await left.query('commit');
  }catch(error){await left.query('rollback');throw error;}
  const ready=await bundle(right,q.deck.id);assert.equal(ready.status,'complete');
  for(const ref of ready.manifest.payload.references){const e=ready.entities.find(e=>e.kind===ref.kind&&e.id===ref.id);assert.ok(e);assert.equal(e.revision,ref.revision);}
 });

 // PostgREST verifies actual HS256 signatures/expiry before role switching.
 // These are real local auth.users fixtures, not a GoTrue signup/refresh integration.
 await setup.query(`create role h4a1_authenticator login noinherit password '${password}';grant authenticated,anon to h4a1_authenticator;`);
 // Bound the portable Windows HTTP fixture to one libpq pool connection.
 // Native concurrency above still uses distinct simultaneous PostgreSQL backends.
 const config=resolve(runDir,'postgrest.conf');await writeFile(config,`db-schemas = "public"\ndb-anon-role = "anon"\ndb-pool = 1\nserver-host = "127.0.0.1"\nserver-port = ${httpPort}\n`);
 // Normalize locale to isolate a possible Windows libpq/gettext startup variable.
 // This is an isolated Windows runtime setting, not an authentication or RLS exception.
 const env={...process.env,LC_ALL:'C',LANG:'C',PATH:bin+delimiter+process.env.PATH,PGRST_DB_URI:`postgres://h4a1_authenticator:${password}@127.0.0.1:${port}/h4a1`,PGRST_JWT_SECRET:jwtSecret};
 console.log('PostgREST:',await command(postgrestBin,['--version'],{env}));
 const startRest=async()=>{
  rest=launch(postgrestBin,[config],{env});const startup={pid:rest.pid,startedAt:new Date().toISOString(),ready:false,exitCode:null,signal:null,dbPool:1,locale:'C',host:'127.0.0.1',postgrest:'16.5'};startupRuns.push(startup);rest.on('exit',(code,signal)=>{startup.exitCode=code;startup.signal=signal;});rest.stdout.on('data',x=>restLog+=x);rest.stderr.on('data',x=>restLog+=x);rest.on('error',()=>{});
  await waitUntil(async()=>{if(rest.exitCode!==null)throw new Error(`PostgREST exited (${rest.exitCode}, ${rest.signalCode}): `+redact(restLog));try{return (await http('',{method:'GET',token:null})).status===200;}catch{return false;}},'PostgREST startup');startup.ready=true;startup.readyAfterMs=Date.now()-Date.parse(startup.startedAt);
 };
 const probes=Number(process.argv.find(x=>x.startsWith('--startup-probes='))?.split('=')[1]??1);assert.ok(Number.isInteger(probes)&&probes>=1&&probes<=10);
 for(let i=0;i<probes;i++){
  if(i){startupRuns.at(-1).stopRequested=true;rest.kill();await once(rest,'exit');}await startRest();console.log(`ok startup probe ${i+1}/${probes}`);
 }
 const q=fixture('http-content'),op=publish(q);let ack;
 await test('http','signed user A calls operation, bundle and paged changes RPCs',async()=>{
  const r=await operation(op);assert.equal(r.status,200,JSON.stringify(r.data));ack=r.data;assert.equal(ack.status,'accepted');
  const content=await rpc('get_custom_deck_bundle_v1',{deck:q.deck.id});assert.equal(content.status,200);assert.equal(content.data.status,'complete');
  const feed=await rpc('get_custom_deck_changes_v1',{after_revision:0,page_size:2});assert.equal(feed.status,200);assert.equal(feed.data.entities.length,2);
 });
 await test('http','user B cannot read or mutate A; original IDs remain scoped by owner',async()=>{
  const content=await rpc('get_custom_deck_bundle_v1',{deck:q.deck.id},jwt(b));assert.equal(content.status,200);assert.equal(content.data,null);
  const r=await operation({schemaVersion:1,operationId:'b-targets-a',action:'edit',changes:[change('card',q.card.id,q.card,(await row(left,'card',q.card.id)).revision)]},jwt(b));
  assert.equal(r.status,200);assert.equal(r.data.status,'conflict');assert.deepEqual((await row(left,'card',q.card.id)).payload,{...q.card,order:1});
  for(const table of ['custom_sync_entities_v1','custom_sync_receipts_v1','custom_sync_conflicts_v1']){
   const rows=await http(table+'?user_id=eq.'+a,{method:'GET',token:jwt(b)});assert.equal(rows.status,200);assert.deepEqual(rows.data,[]);
  }
 });
 await test('http','anonymous, invalid, expired and tampered JWTs are rejected by gateway',async()=>{
  const forged=jwt(a).split('.');forged[1]=Buffer.from(JSON.stringify({role:'authenticated',sub:b,exp:Math.floor(Date.now()/1000)+300})).toString('base64url');
  // Mutate an actual signature byte: the final base64url character can differ only in unused bits.
  const tampered=jwt(a).split('.');tampered[2]=(tampered[2][0]==='a'?'b':'a')+tampered[2].slice(1);
  for(const token of [null,'not-a-jwt',jwt(a,{},randomBytes(48).toString('hex')),jwt(a,{exp:Math.floor(Date.now()/1000)-600}),tampered.join('.'),forged.join('.')]){
   for(const [name,body] of [['apply_custom_deck_operation_v1',{op}],['get_custom_deck_bundle_v1',{deck:q.deck.id}],['get_custom_deck_changes_v1',{after_revision:0,page_size:2}]]){
    const r=await rpc(name,body,token);assert.ok([401,403].includes(r.status),name+': '+r.status);
   }
  }
 });
 await test('http','forged body owner and privileged role claims cannot impersonate',async()=>{
  assert.ok((await operation({...op,userId:b})).status>=400);
  const r=await operation(op,jwt(a,{role:'postgres'}));assert.ok(r.status>=400);
 });
 await test('http','idempotent original receipt, changed request rejection and CAS evidence',async()=>{
  assert.deepEqual((await operation(op)).data,ack);
  assert.ok((await operation({...op,intent:{...op.intent,expectedContentVersion:1}})).status>=400);
  const r=await operation({...op,operationId:'http-stale'});assert.equal(r.status,200);assert.equal(r.data.status,'conflict');
  for(const [table,id] of [['custom_sync_receipts_v1',op.operationId],['custom_sync_conflicts_v1','http-stale']]){
   const owned=await http(table+'?operation_id=eq.'+id,{method:'GET'});assert.equal(owned.status,200);assert.equal(owned.data.length,1);
   const other=await http(table+'?operation_id=eq.'+id,{method:'GET',token:jwt(b)});assert.deepEqual(other.data,[]);
  }
 });
 await test('http','direct REST DML and oversized RPC payload denied without partial state',async()=>{
  for(const method of ['POST','PATCH','DELETE']){
   const r=await http('custom_sync_entities_v1?entity_id=eq.'+q.card.id,{method,body:method==='DELETE'?undefined:{payload:{}}});assert.ok(r.status>=400);
  }
  const huge=publish(fixture('http-huge'));huge.intent.rawOcr='x'.repeat(524288);assert.ok((await operation(huge)).status>=400);
  assert.equal(await row(left,'deck',huge.intent.deck.id),undefined);assert.equal((await left.query('select * from public.custom_sync_receipts_v1 where operation_id=$1',[huge.operationId])).rows.length,0);
  const invalid=publish(fixture('http-rollback'));invalid.changes.find(c=>c.kind==='manifest').payload.cardIds=[];
  assert.ok((await operation(invalid)).status>=400);assert.equal(await row(left,'deck',invalid.intent.deck.id),undefined);
  assert.equal(await row(left,'identity',invalid.intent.confirmation.entity.id),undefined);
  assert.equal((await left.query('select * from public.custom_sync_receipts_v1 where operation_id=$1',[invalid.operationId])).rows.length,0);
 });
 await test('http','partial publication is unavailable; pagination detects generation changes and retains unrelated tombstones',async()=>{
  const staged=fixture('http-staged'),stage=publish(staged);stage.action='stage';stage.changes=stage.changes.filter(c=>c.kind!=='manifest');assert.equal((await operation(stage)).data.status,'accepted');
  assert.equal((await rpc('get_custom_deck_bundle_v1',{deck:staged.deck.id})).data,null);
  const first=(await rpc('get_custom_deck_changes_v1',{after_revision:0,page_size:2})).data;
  const generationBefore=(await rpc('get_custom_deck_bundle_v1',{deck:q.deck.id})).data.manifest.revision;
  const c=await row(left,'card',q.card.id);assert.equal((await operation({schemaVersion:1,operationId:'http-delete',action:'delete',changes:[change('card',q.card.id,null,c.revision)]})).data.status,'accepted');
  const other=fixture('http-unrelated');assert.equal((await operation(publish(other))).data.status,'accepted');
  const otherCard=await row(left,'card',other.card.id);
  assert.equal((await operation({schemaVersion:1,operationId:'http-other-delete',action:'delete',changes:[change('card',other.card.id,null,otherCard.revision)]})).data.status,'accepted');
  assert.equal((await operation({schemaVersion:1,operationId:'http-other-restore',action:'restore',changes:[change('card',other.card.id,otherCard.payload,(await row(left,'card',other.card.id)).revision)]})).data.status,'accepted');
  const newBundle=(await rpc('get_custom_deck_bundle_v1',{deck:q.deck.id})).data;
  assert.ok(BigInt(newBundle.manifest.revision)>BigInt(generationBefore));assert.deepEqual(newBundle.manifest.payload.cardIds,[]);
  let cursor='0',found=false,last;do{
   last=(await rpc('get_custom_deck_changes_v1',{after_revision:cursor,page_size:2})).data;
   for(const entity of last.entities){if(entity.id===q.card.id&&entity.deleted)found=true;cursor=entity.revision;}
  }while(last.entities.length);
  assert.ok(found);assert.ok(BigInt(last.serverRevision)>BigInt(first.serverRevision));assert.ok((await row(left,'card',q.card.id)).deleted_at);
 });
 await test('http','function ownership, search_path, invoker/definer, grants and RLS catalog',async()=>{
  const fs=(await setup.query("select p.proname,p.prosecdef,p.proconfig,r.rolname owner from pg_proc p join pg_roles r on r.oid=p.proowner where proname in ('apply_custom_deck_operation_v1','get_custom_deck_bundle_v1','get_custom_deck_changes_v1')")).rows;
  assert.equal(fs.length,3);for(const f of fs){assert.equal(f.owner,'postgres');assert.ok(f.proconfig.some(x=>x==='search_path=""'));assert.equal(f.prosecdef,f.proname==='apply_custom_deck_operation_v1');}
  const role=(await setup.query("select rolsuper,rolbypassrls,rolinherit from pg_roles where rolname='h4a1_authenticator'")).rows[0];assert.deepEqual(role,{rolsuper:false,rolbypassrls:false,rolinherit:false});
  const tables=(await setup.query("select relname,relrowsecurity from pg_class where relnamespace='public'::regnamespace and relname like 'custom_sync_%' and relkind='r'")).rows;
  assert.equal(tables.length,4);assert.ok(tables.every(t=>t.relrowsecurity));
  const grants=(await setup.query("select has_table_privilege('authenticated','public.custom_sync_entities_v1','SELECT') readable,has_table_privilege('authenticated','public.custom_sync_entities_v1','UPDATE') writable,has_function_privilege('anon','public.apply_custom_deck_operation_v1(jsonb)','EXECUTE') anon_execute")).rows[0];
  assert.deepEqual(grants,{readable:true,writable:false,anon_execute:false});
  for(const table of tables){
   const policy=(await setup.query('select roles,cmd,qual,with_check from pg_policies where schemaname=$1 and tablename=$2',['public',table.relname])).rows;
   assert.equal(policy.length,1);assert.equal(policy[0].cmd,'SELECT');assert.ok(policy[0].qual.includes('auth.uid()'));assert.equal(policy[0].with_check,null);
   for(const privilege of ['INSERT','UPDATE','DELETE'])assert.equal((await setup.query('select has_table_privilege($1,$2,$3) allowed',['authenticated','public.'+table.relname,privilege])).rows[0].allowed,false);
  }
  const helpers=(await setup.query("select p.oid::regprocedure::text signature from pg_proc p where pronamespace='public'::regnamespace and proname like 'cd_%_v1'")).rows;
  assert.ok(helpers.length);for(const helper of helpers)assert.equal((await setup.query("select has_function_privilege('authenticated',$1,'EXECUTE') allowed",[helper.signature])).rows[0].allowed,false);
 });
 if(process.argv.includes('--transfers')){
  const before=(await setup.query("select oid::regprocedure::text name,pg_get_functiondef(oid) definition from pg_proc where pronamespace='public'::regnamespace and (proname like 'cd_%_v1' or proname in ('apply_custom_deck_operation_v1','get_custom_deck_bundle_v1','get_custom_deck_changes_v1')) order by oid")).rows;
  await setup.query(await readFile(resolve(root,'supabase/migrations/202610220002_custom_transfers_v2.sql'),'utf8'));
  await setup.query("notify pgrst, 'reload schema'");
  await waitUntil(async()=>Boolean((await http('',{method:'GET'})).data?.paths?.['/rpc/apply_custom_transfer_v2']),'PostgREST V2 schema cache');
  assert.deepEqual((await setup.query("select oid::regprocedure::text name,pg_get_functiondef(oid) definition from pg_proc where pronamespace='public'::regnamespace and (proname like 'cd_%_v1' or proname in ('apply_custom_deck_operation_v1','get_custom_deck_bundle_v1','get_custom_deck_changes_v1')) order by oid")).rows,before);
  const {runNativeTransfers}=await import('../supabase/tests/custom-transfers-native.mjs');
  transferOverlaps=(await runNativeTransfers({setup,left,right,a,b,connect,waitUntil,test,apply,row,rpc,http,jwt})).provenOverlaps;
 }
 assert.ok(!/deadlock detected/i.test(pgLog));
 const summary={postgres:(await setup.query('select version() v')).rows[0].v,node:process.version,postgrest:'16.5',nativePassed,httpPassed,observedBlockedTransactions:overlaps,transferBlockedTransactions:transferOverlaps,legacyNativeScenarios:23,results};
 await writeFile(resolve(runDir,'results.json'),JSON.stringify(summary,null,2));
 console.log(`PASS: native ${nativePassed}, HTTP/JWT ${httpPassed}, proven overlaps ${overlaps}, native regression 23. Results: ${resolve(runDir,'results.json')}`);
 if((process.argv.includes('--browser-tests')||process.argv.includes('--guest-tests')||process.argv.includes('--hardening-tests')||process.argv.includes('--client-v2-tests'))){
  const browserUsers=Array.from({length:48},(_,i)=>'00000000-0000-0000-0000-'+String(i+3).padStart(12,'0'));
  for(const id of browserUsers)await setup.query('insert into auth.users(id,raw_user_meta_data) values($1,$2::jsonb)',[id,JSON.stringify({username:'h4ba_'+id.slice(-12),display_name:'Synthetic H4BA'})]);
  if(process.argv.includes('--client-v2-tests'))await setup.query('insert into public.custom_transfer_usage_v2(user_id,bytes) values($1,67108864)',[browserUsers[47]]);
  let largeDeck;
  if(process.argv.includes('--hardening-tests')){const {measureCustomLimits}=await import('../supabase/tests/custom-decks-limits.mjs');const client=await connect('h4a1',browserUsers[27]);const measured=await measureCustomLimits({apply:op=>apply(client,op),bundle:id=>bundle(client,id),row:(kind,id)=>row(client,kind,id),query:(sql,args)=>client.query(sql,args)});largeDeck=measured.largeDeck;await writeFile(resolve(runDir,'hardening-limits.json'),JSON.stringify(measured,null,2));console.log('SQL limits:',JSON.stringify(measured.samples));}
  console.log('Starting isolated two-browser H4B-A/B tests (JWT remains in Node test process).');
  const browserOutput=await command(process.execPath,[resolve(root,'node_modules/@playwright/test/cli.js'),'test',...(process.argv.includes('--client-v2-tests')?['e2e/custom-decks-v2.spec.ts']:[]),...(process.argv.includes('--browser-tests')?['e2e/custom-decks-sync.spec.ts']:[]),...(process.argv.includes('--guest-tests')?['e2e/custom-decks-guest.spec.ts']:[]),...(process.argv.includes('--hardening-tests')?['e2e/custom-decks-hardening.spec.ts']:[]),'--project=desktop-dark'],
    {env:{...process.env,H4BC_LARGE_DECK:largeDeck??'',H4BA_HTTP_URL:`http://127.0.0.1:${httpPort}`,H4BA_USERS:JSON.stringify(browserUsers.map(id=>({id,token:jwt(id,{exp:Math.floor(Date.now()/1000)+1800})})))}});
  await writeFile(resolve(runDir,'browser-tests.log'),redact(browserOutput));console.log(browserOutput);
 }
}catch(error){await writeFile(resolve(runDir,'failure.log'),redact(error.message));console.error('H4A.1 FAILED:',redact(error.message));process.exitCode=1;}
finally{
 await unlink(passFile).catch(error=>{if(error.code!=='ENOENT')throw error;});
 if(rest&&rest.exitCode===null){startupRuns.at(-1).stopRequested=true;rest.kill();await once(rest,'exit');}
 for(const c of clients)await c.end().catch(()=>{});
 if(postgres&&postgres.exitCode===null)await command(resolve(bin,'pg_ctl.exe'),['-D',resolve(runDir,'data'),'stop','-m','fast']).catch(()=>{postgres.kill();});
 await writeFile(resolve(runDir,'postgrest-startups.json'),JSON.stringify(startupRuns,null,2));
 await writeFile(resolve(runDir,'postgres.log'),redact(pgLog));await writeFile(resolve(runDir,'postgrest.log'),redact(restLog));
}
