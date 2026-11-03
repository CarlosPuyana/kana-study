// Loopback only. Reuses the already installed native PostgreSQL/PostgREST test runtime.
// Synthetic JWTs; never reads a Supabase project/key, credentials or database URL.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {createHmac,randomBytes,randomUUID} from 'node:crypto';
import {writeFile,mkdtemp,unlink} from 'node:fs/promises';
import {resolve,delimiter} from 'node:path';
import {createServer} from 'node:net';
import pg from '../.cache/h4a1-runtime/node_modules/pg/lib/index.js';
import {puyiContract,adminId,readerId,content} from '../supabase/tests/puyi-contract.mjs';
const root=process.cwd(),runtime=resolve(root,'.cache/h4a1-runtime'),bin=resolve(runtime,'node_modules/@embedded-postgres/windows-x64/native/bin');
const password=randomBytes(32).toString('hex'),secret=randomBytes(48).toString('hex');
const run=await mkdtemp(resolve(root,'.cache/puyi/native-')),pass=resolve(run,'password');let postgres,rest,client;
const redact=s=>String(s).replaceAll(password,'[redacted]').replaceAll(secret,'[redacted]').replace(/eyJ[\w-]+\.[\w-]+\.[\w-]+/g,'[jwt]');
const launch=(file,args,options={})=>spawn(file,args,{cwd:root,windowsHide:true,stdio:['ignore','pipe','pipe'],...options});
async function command(file,args,options={}){const c=launch(file,args,options);let text='';c.stdout.on('data',x=>text+=x);c.stderr.on('data',x=>text+=x);const [code]=await once(c,'exit');assert.equal(code,0,redact(text));return redact(text);}
async function freePort(){const s=createServer();s.listen(0,'127.0.0.1');await once(s,'listening');const port=s.address().port;await new Promise(r=>s.close(r));return port;}
async function ready(check){const end=Date.now()+20000;while(Date.now()<end){try{if(await check())return;}catch{}await new Promise(r=>setTimeout(r,30));}throw Error('Local server readiness timeout');}
const port=await freePort(),httpPort=await freePort();
const jwt=(sub,claims={},key=secret)=>{const h=Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url'),p=Buffer.from(JSON.stringify({role:'authenticated',sub,exp:Math.floor(Date.now()/1000)+600,...claims})).toString('base64url');return h+'.'+p+'.'+createHmac('sha256',key).update(h+'.'+p).digest('base64url');};
async function http(path,{token=null,method='GET',body,profile='public'}={}){const r=await fetch(`http://127.0.0.1:${httpPort}/${path}`,{method,headers:{'Content-Type':'application/json','Accept-Profile':profile,'Content-Profile':profile,...(token?{Authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(10000)});const text=await r.text();let data;try{data=JSON.parse(text);}catch{data=text;}return {status:r.status,data};}
let httpPassed=0;const test=async(name,fn)=>{await fn();console.log('ok HTTP',++httpPassed,name);};
let pgLog='',restLog='';
try{
 await writeFile(pass,password,{mode:0o600});await command(resolve(bin,'initdb.exe'),['-D',resolve(run,'data'),'-U','postgres','--auth=scram-sha-256','--pwfile='+pass,'--encoding=UTF8','--locale=C']);await unlink(pass);
 postgres=launch(resolve(bin,'postgres.exe'),['-D',resolve(run,'data'),'-p',String(port),'-h','127.0.0.1']);postgres.stderr.on('data',x=>pgLog+=x);postgres.stdout.resume();
 await ready(async()=>{const c=new pg.Client({host:'127.0.0.1',port,user:'postgres',password,database:'postgres'});try{await c.connect();return true;}finally{await c.end().catch(()=>{});}});
 client=new pg.Client({host:'127.0.0.1',port,user:'postgres',password,database:'postgres'});await client.connect();
 const sqlPassed=await puyiContract({query:(...args)=>client.query(...args),exec:q=>client.query(q)});
 await client.query(`create role puyi_authenticator login noinherit password '${password}';grant anon,authenticated to puyi_authenticator;`);
 const config=resolve(run,'postgrest.conf');await writeFile(config,`db-schemas = "public, storage"\ndb-anon-role = "anon"\ndb-pool = 2\nserver-host = "127.0.0.1"\nserver-port = ${httpPort}\n`);
 rest=launch(resolve(runtime,'postgrest-v16.5/postgrest.exe'),[config],{env:{...process.env,LC_ALL:'C',LANG:'C',PATH:bin+delimiter+process.env.PATH,PGRST_DB_URI:`postgres://puyi_authenticator:${password}@127.0.0.1:${port}/postgres`,PGRST_JWT_SECRET:secret}});rest.stdout.on('data',x=>restLog+=x);rest.stderr.on('data',x=>restLog+=x);
 await ready(async()=>rest.exitCode===null&&(await http('')).status===200);
 const id=randomUUID(),payload={p_id:id,p_expected_version:0,p_content:{...content,word:'鳥',kana:'とり'}};
 await test('anonymous public read, mutation and raw writes denied',async()=>{assert.equal((await http('puyi_cards')).status,200);assert.equal((await http('rpc/puyi_save_card',{method:'POST',body:payload})).status,401);assert.equal((await http('puyi_cards',{method:'POST',body:{id,...content}})).status,401);});
 await test('signed ordinary user cannot create, edit, delete or self-assign',async()=>{for(const body of [payload,{...payload,p_expected_version:1},{...payload,p_delete:true}])assert.equal((await http('rpc/puyi_save_card',{method:'POST',body,token:jwt(readerId)})).status,403);assert.equal((await http('puyi_administrator',{method:'POST',body:{user_id:readerId},token:jwt(readerId)})).status,403);});
 await test('forged signature, expired JWT and role escalation rejected by gateway',async()=>{for(const token of [jwt(adminId,{},'wrong-signature-but-long-enough-for-HS256'),jwt(adminId,{exp:1}),jwt(adminId,{role:'postgres'},'wrong-secret')])assert.equal((await http('rpc/puyi_save_card',{method:'POST',body:payload,token})).status,401);});
 await test('administrator creates and edits, anonymous reads exact literal content',async()=>{const token=jwt(adminId);const created=await http('rpc/puyi_save_card',{method:'POST',body:payload,token});assert.equal(created.status,200,JSON.stringify(created.data));assert.equal(created.data.version,1);const edited=await http('rpc/puyi_save_card',{method:'POST',body:{...payload,p_expected_version:1,p_content:{...payload.p_content,meaning:'pájaro'}},token});assert.equal(edited.data.id,id);assert.equal(edited.data.version,2);assert.equal((await http(`puyi_cards?id=eq.${id}`)).data[0].meaning,'pájaro');});
 await test('direct Storage metadata API requires reservation/admin and cannot overwrite live content',async()=>{const path=randomUUID()+'.png';const body={bucket_id:'puyi-images',name:path,metadata:{mimetype:'image/png',size:12}};assert.equal((await http('objects',{profile:'storage',method:'POST',token:jwt(readerId),body})).status,403);assert.equal((await http('objects',{profile:'storage',method:'POST',token:jwt(adminId),body})).status,403);await http('rpc/puyi_reserve_image',{method:'POST',body:{p_path:path},token:jwt(adminId)});assert.equal((await http('objects',{profile:'storage',method:'POST',token:jwt(adminId),body})).status,201);});
 await test('administrator deletes without exposing tombstone or private progress',async()=>{assert.equal((await http('rpc/puyi_save_card',{method:'POST',body:{...payload,p_expected_version:2,p_delete:true},token:jwt(adminId)})).status,200);assert.deepEqual((await http(`puyi_cards?id=eq.${id}`)).data,[]);assert.deepEqual((await http('deck_settings?deck_id=eq.japanese-1500',{token:jwt(adminId)})).data,[]);});
 // A database barrier proves overlap between independent writers, without sleeps or timing assumptions.
 const second=new pg.Client({host:'127.0.0.1',port,user:'postgres',password,database:'postgres'});await second.connect();
 try{
  for(const c of [client,second]){await c.query('set role authenticated');await c.query("select set_config('request.jwt.claims',$1,false)",[JSON.stringify({sub:adminId,role:'authenticated'})]);}
  const raceId=randomUUID(),save=(c,version,meaning)=>c.query('select public.puyi_save_card($1,$2,$3::jsonb) result',[raceId,version,JSON.stringify({...content,word:'競争',kana:'きょうそう',meaning})]);
  await save(client,0,'base');await client.query('begin');await second.query('begin');await save(client,1,'winner');
  const pending=save(second,1,'loser');pending.catch(()=>{});
  await ready(async()=>(await client.query('select $1::int=any(pg_blocking_pids($2::int)) blocked',[client.processID,second.processID])).rows[0].blocked);
  await client.query('commit');await assert.rejects(()=>pending,/puyi_conflict/);await second.query('rollback');
  assert.equal((await client.query('select meaning from public.puyi_cards where id=$1',[raceId])).rows[0].meaning,'winner');
  await client.query('select public.puyi_save_card($1,2,$2::jsonb,null,true)',[raceId,'{}']);await client.query('reset role');console.log('ok native concurrency 1/1: independent writers overlap; CAS rejects stale edit');
 }finally{await second.end();}
 console.log(`${sqlPassed}/${sqlPassed} native SQL and ${httpPassed}/${httpPassed} signed HTTP scenarios passed. Supabase Auth and actual Storage object service remain untested.`);
 if(process.argv.includes('--browser'))console.log(await command(process.execPath,[resolve(root,'node_modules/@playwright/test/cli.js'),'test','--config=playwright.puyi.config.ts','--output=.cache/puyi/browser'],{env:{...process.env,PUYI_TEST_REST:`http://127.0.0.1:${httpPort}`,PUYI_TEST_ADMIN:jwt(adminId),PUYI_TEST_READER:jwt(readerId)}}));
}catch(error){console.error(redact(error.stack));process.exitCode=1;}
finally{if(rest&&rest.exitCode===null){rest.kill();await once(rest,'exit');}if(client)await client.end().catch(()=>{});if(postgres&&postgres.exitCode===null)await command(resolve(bin,'pg_ctl.exe'),['-D',resolve(run,'data'),'stop','-m','fast']).catch(()=>postgres.kill());await unlink(pass).catch(()=>{});await writeFile(resolve(run,'postgres.log'),redact(pgLog));await writeFile(resolve(run,'postgrest.log'),redact(restLog));}
