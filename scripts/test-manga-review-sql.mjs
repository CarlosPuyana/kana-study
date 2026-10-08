// Execute real PostgreSQL locally via optional PGlite; no Supabase credentials.
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const {PGlite}=await import(process.argv[2]?pathToFileURL(process.argv[2]).href:'@electric-sql/pglite');
const pg=new PGlite(),a='00000000-0000-0000-0000-000000000001',b='00000000-0000-0000-0000-000000000002';
try {
  await pg.exec(`create role authenticated;create role anon;create schema auth;
    create table auth.users(id uuid primary key,raw_user_meta_data jsonb not null default '{}');
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth to authenticated,anon;`);
  const apply=async name=>pg.exec(await readFile(new URL(`../supabase/migrations/${name}`,import.meta.url),'utf8'));
  await apply('202609300001_local_first_accounts.sql');await apply('202610040002_profile_leaderboard.sql');
  await pg.exec(`insert into auth.users(id,raw_user_meta_data) values('${a}','{"username":"fixture_a"}'),('${b}','{"username":"fixture_b"}')`);
  const session=(id,module,owner=a,logicalId=id,extra={})=>pg.query(`insert into public.completed_sessions(id,user_id,module,completed_at,spain_day,payload,device_id)
    values($1,$2,$3,'2026-10-08T12:00:00Z','2026-10-08',$4::jsonb,'fixture') on conflict(id) do update set payload=excluded.payload`,
    [id,owner,module,JSON.stringify({sessionId:logicalId,module,durationSeconds:7,completedAt:'2026-10-08T12:00:00Z',...extra})]);
  await session('historic','kana');
  const historic=(await pg.query("select * from public.completed_sessions where id='historic'")).rows;
  const schema=()=>pg.query(`select tablename,policyname,roles,cmd,qual,with_check from pg_policies where tablename in ('completed_sessions','review_events') order by tablename,policyname`);
  const policies=(await schema()).rows;
  const indexes=(await pg.query("select indexdef from pg_indexes where tablename in ('completed_sessions','review_events') order by indexname")).rows;
  const permissions=(await pg.query("select relname,relacl,relrowsecurity from pg_class where relname in ('completed_sessions','review_events') order by relname")).rows;
  await assert.rejects(session('grammar-before','grammar'),e=>e.code==='23514');
  await apply('202610080004_completed_sessions_grammar.sql');await session('grammar','grammar');
  await assert.rejects(session('manga-before','manga'),e=>e.code==='23514');
  await apply('202610080005_manga_study_v3.sql');
  assert.deepEqual((await schema()).rows,policies);
  assert.deepEqual((await pg.query("select indexdef from pg_indexes where tablename in ('completed_sessions','review_events') order by indexname")).rows,indexes);
  assert.deepEqual((await pg.query("select relname,relacl,relrowsecurity from pg_class where relname in ('completed_sessions','review_events') order by relname")).rows,permissions);
  assert.deepEqual((await pg.query("select * from public.completed_sessions where id='historic'")).rows,historic);
  await pg.exec(`set role authenticated;select set_config('request.jwt.claim.sub','${a}',false)`);
  for(const module of ['kana','flags','kanji','vocabulary','grammar','manga'])await session(`module-${module}`,module);
  await session('module-manga','manga',a,'module-manga',{mangaSessionKind:'fsrs'});
  await pg.query(`insert into public.review_events(id,user_id,module,unit_key,reviewed_at,rating,payload,device_id)
    values('manga-answer',$1,'manga',$2,'2026-10-08T12:00:00Z','good',$3::jsonb,'fixture')`,
    [a,'dictionary:'+JSON.stringify(['龍','りゅう']),JSON.stringify({id:'manga-answer',savedItemId:'dictionary:word',correct:true})]);
  for(const grade of [1,3]) {
    const event={id:`fsrs-${grade}`,key:'dictionary:word',savedItemId:'dictionary:word',sessionId:'module-manga',
      reviewedAt:'2026-10-08T12:00:00Z',exerciseType:'meaning',correct:grade===3,repetition:false,
      answerMode:'self-assessment',rating:grade===1?'again':'good',reviewKind:'fsrs',fsrsVersion:1,fsrsGrade:grade};
    for(let retry=0;retry<2;retry++)await pg.query(`insert into public.review_events(id,user_id,module,unit_key,reviewed_at,rating,payload,device_id)
      values($1,$2,'manga',$3,$4,$5,$6::jsonb,'fixture') on conflict(id) do update set payload=excluded.payload`,
      [`${a}:${event.id}`,a,event.key,event.reviewedAt,event.rating,JSON.stringify(event)]);
    const rows=(await pg.query('select payload from public.review_events where id=$1',[`${a}:${event.id}`])).rows;
    assert.equal(rows.length,1);assert.deepEqual(rows[0].payload,event);
  }
  await pg.query(`insert into public.user_preferences(user_id,preference_key,payload)
    values($1,'kana-study.manga-fsrs-settings.v1','{"enabled":true}')`,[a]);
  assert.equal((await pg.query("select count(*)::int as n from public.completed_sessions where id='module-manga'")).rows[0].n,1);
  await assert.rejects(session('invalid','imaginary'),e=>e.code==='23514');
  await assert.rejects(pg.query("update public.review_events set module='imaginary'"),e=>e.code==='23514');
  const board=(await pg.query('select * from public.get_leaderboard_v1()')).rows;
  assert.equal(Number(board.find(row=>row.is_current_user).study_seconds),56);
  await pg.exec(`select set_config('request.jwt.claim.sub','${b}',false)`);
  assert.equal((await pg.query('select * from public.completed_sessions')).rows.length,0);
  assert.equal((await pg.query('select * from public.review_events')).rows.length,0);
  await assert.rejects(session('other-owner','manga'),e=>e.code==='42501');
  const importedEvent=owner=>pg.query(`insert into public.review_events(id,user_id,module,unit_key,reviewed_at,rating,payload,device_id)
    values($1,$2,'manga','word','2026-10-08T12:00:00Z','good','{"id":"guest-event"}','fixture')`,[`${owner}:guest-event`,owner]);
  await session(`${b}:guest-session`,'manga',b,'guest-session');await importedEvent(b);
  await pg.exec(`select set_config('request.jwt.claim.sub','${a}',false)`);
  await session(`${a}:guest-session`,'manga',a,'guest-session');await importedEvent(a);
  await pg.exec('reset role');
  assert.equal((await pg.query("select count(*)::int as n from public.completed_sessions where payload->>'sessionId'='guest-session'")).rows[0].n,2);
  assert.equal((await pg.query("select count(*)::int as n from public.review_events where payload->>'id'='guest-event'")).rows[0].n,2);
  await pg.exec('reset role;set role anon');
  await assert.rejects(pg.query('select * from public.completed_sessions'),e=>e.code==='42501');
  console.log('Manga V3/V4 SQL OK: real CHECKs, historical rows, Grammar, FSRS grades 1/3 and preference, idempotent sessions/events, leaderboard, indexes, grants and owner/anonymous RLS.');
} catch(error) {console.error('Manga V3 SQL failed:',error.code??'assertion',error.message);process.exitCode=1;}
finally {await pg.close();}
