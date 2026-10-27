// Local PostgreSQL/WASM only. No credentials, remote requests or production changes.
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const runtime=process.argv[2];
const {PGlite}=await import(runtime?pathToFileURL(runtime).href:'../.cache/h4a-sql-runtime/node_modules/@electric-sql/pglite/dist/index.js');
const pg=new PGlite(),a='00000000-0000-0000-0000-000000000001',b='00000000-0000-0000-0000-000000000002';
let passed=0;const test=async(name,run)=>{await run();console.log('ok',++passed,name);};
const account=async id=>pg.exec(`reset role;set role authenticated;select set_config('request.jwt.claim.sub','${id}',false)`);
try{
 await pg.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);
 insert into auth.users values('${a}'),('${b}');
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth to authenticated,anon;`);
 await pg.exec(await readFile(new URL('../supabase/migrations/202610270001_grammar_beta_access.sql',import.meta.url),'utf8'));
 await test('migration has RLS and grants nobody by default',async()=>{
  assert.equal((await pg.query('select * from public.grammar_beta_access')).rows.length,0);
  assert.equal((await pg.query("select relrowsecurity from pg_class where oid='public.grammar_beta_access'::regclass")).rows[0].relrowsecurity,true);
 });
 await test('trusted administration grants A; A sees only its permission',async()=>{
  await pg.query('insert into public.grammar_beta_access(user_id,enabled) values($1,true),($2,false)',[a,b]);
  await account(a);assert.deepEqual((await pg.query('select user_id,enabled from public.grammar_beta_access')).rows,[{user_id:a,enabled:true}]);
  assert.equal((await pg.query('select * from public.grammar_beta_access where user_id=$1',[b])).rows.length,0);
 });
 await test('B cannot read A or self-assign, update or delete permissions',async()=>{
  await account(b);assert.equal((await pg.query('select enabled from public.grammar_beta_access where user_id=$1',[a])).rows.length,0);
  for(const sql of ["insert into public.grammar_beta_access(user_id,enabled) values(current_user::uuid,true)",
   'update public.grammar_beta_access set enabled=true','delete from public.grammar_beta_access','truncate public.grammar_beta_access'])
   await assert.rejects(()=>pg.exec(sql),/permission denied/);
 });
 await test('anonymous cannot read or write, even with a forged subject',async()=>{
  await pg.exec(`reset role;set role anon;select set_config('request.jwt.claim.sub','${a}',false)`);
  await assert.rejects(()=>pg.exec('select * from public.grammar_beta_access'),/permission denied/);
  await assert.rejects(()=>pg.exec('update public.grammar_beta_access set enabled=true'),/permission denied/);
 });
 await test('missing authenticated subject sees no permissions',async()=>{
  await account('');assert.deepEqual((await pg.query('select * from public.grammar_beta_access')).rows,[]);
 });
 await test('administrator revokes without deleting data; A reads disabled',async()=>{
  await pg.exec('reset role');await pg.query('update public.grammar_beta_access set enabled=false,updated_at=now() where user_id=$1',[a]);
  await account(a);assert.equal((await pg.query('select enabled from public.grammar_beta_access')).rows[0].enabled,false);
 });
 await test('new users remain ungranted and unknown UUIDs cannot be authorized',async()=>{
  await pg.exec('reset role');const c='00000000-0000-0000-0000-000000000003';
  await assert.rejects(()=>pg.query('insert into public.grammar_beta_access(user_id,enabled) values($1,true)',[c]),/foreign key/);
  await pg.query('insert into auth.users values($1)',[c]);await account(c);
  assert.deepEqual((await pg.query('select * from public.grammar_beta_access')).rows,[]);
 });
 console.log(`${passed}/${passed} local PostgreSQL access scenarios passed. JWT gateway and real Supabase Auth are not tested.`);
}finally{await pg.close();}
