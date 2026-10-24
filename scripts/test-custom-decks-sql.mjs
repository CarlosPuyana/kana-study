// Isolated PostgreSQL/WASM. Never reads credentials or executes remote SQL.
import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {fixture,publish,change,review,hash} from '../supabase/tests/custom-decks.fixture.mjs';
const runtime=process.argv.slice(2).find(arg=>!arg.startsWith('--'));
const {PGlite}=await import(runtime?pathToFileURL(runtime).href:'../.cache/h4a-sql-runtime/node_modules/@electric-sql/pglite/dist/index.js');
const pg=new PGlite();let passed=0;
const a='00000000-0000-0000-0000-000000000001',b='00000000-0000-0000-0000-000000000002';
try{
 await pg.exec(`create role authenticated;create role anon;create schema auth;create table auth.users(id uuid primary key,raw_user_meta_data jsonb not null default '{}');
 insert into auth.users values('${a}'),('${b}');
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth to authenticated,anon;`);
 for(const name of ['202609300001_local_first_accounts.sql','202610040002_profile_leaderboard.sql','202610080003_manga_saved_sync.sql','202610080004_completed_sessions_grammar.sql','202610080005_manga_study_v3.sql'])
  await pg.exec(await readFile(new URL('../supabase/migrations/'+name,import.meta.url),'utf8'));
 await pg.query(`insert into public.completed_sessions(id,user_id,module,completed_at,spain_day,payload,device_id) values('h4a-historic',$1,'kana','2026-10-08','2026-10-08','{"durationSeconds":7}','fixture')`,[a]);
 const legacySchema=async()=>({tables:(await pg.query("select relname,relacl,relrowsecurity from pg_class where relnamespace='public'::regnamespace and relkind='r' and relname not like 'custom_sync_%' order by relname")).rows,
  policies:(await pg.query("select tablename,policyname,roles,cmd,qual,with_check from pg_policies where schemaname='public' and tablename not like 'custom_sync_%' order by tablename,policyname")).rows,
  indexes:(await pg.query("select tablename,indexdef from pg_indexes where schemaname='public' and tablename not like 'custom_sync_%' order by tablename,indexname")).rows,
  functions:(await pg.query("select proname,proacl,pg_get_functiondef(oid) definition from pg_proc where pronamespace='public'::regnamespace and proname not like 'cd_%_v1' and proname not in ('apply_custom_deck_operation_v1','get_custom_deck_bundle_v1','get_custom_deck_changes_v1') order by oid")).rows});
 const legacyBefore=await legacySchema(),historic=(await pg.query("select * from public.completed_sessions where id='h4a-historic'")).rows;
 await pg.exec(await readFile(new URL('../supabase/migrations/202610220001_custom_decks_foundation.sql',import.meta.url),'utf8'));
 const account=async id=>pg.exec(`set role authenticated;select set_config('request.jwt.claim.sub','${id}',false)`);
 const apply=async op=>(await pg.query('select public.apply_custom_deck_operation_v1($1::jsonb) result',[JSON.stringify(op)])).rows[0].result;
 const bundle=async id=>(await pg.query('select public.get_custom_deck_bundle_v1($1) result',[id])).rows[0].result;
 const row=async(kind,id)=>(await pg.query('select * from public.custom_sync_entities_v1 where kind=$1 and entity_id=$2',[kind,id])).rows[0];
 const test=async(name,run)=>{await run();passed++;console.log('ok',passed,name);};
 await account(a);const p=fixture(),op=publish(p);let accepted;
 await test('H2B-A publication preserves identity, receipt, canonical order and intent',async()=>{
  accepted=await apply(op);assert.equal(accepted.status,'accepted');
  assert.equal((await row('card',p.card.id)).payload.order,1);assert.equal(op.intent.card.order,0);
  assert.deepEqual((await row('identity',p.confirmation.entity.id)).payload,p.confirmation.entity);
  assert.deepEqual((await row('confirmation',p.confirmation.id)).payload,p.confirmation);
  assert.ok(await bundle(p.deck.id));
 });
 await test('lost receipt retry returns original result; operationId reuse is rejected',async()=>{
  assert.deepEqual(await apply(op),accepted);await assert.rejects(()=>apply({...op,intent:{...op.intent,expectedContentVersion:1}}));
 });
 await test('auth owner isolation, shared Guest IDs and raw-table RLS',async()=>{
  await account(b);assert.equal((await pg.query('select * from public.custom_sync_entities_v1')).rows.length,0);
  assert.equal(await bundle(p.deck.id),null);assert.equal((await apply(op)).status,'accepted');
  assert.equal((await row('card',p.card.id)).payload.id,p.card.id);
  await assert.rejects(()=>pg.query('update public.custom_sync_entities_v1 set revision=999'));
  await assert.rejects(()=>pg.query('delete from public.custom_sync_entities_v1'));
  await assert.rejects(()=>pg.query('insert into public.custom_sync_clock_v1 values($1,0)',[a]));
  await account(a);assert.deepEqual((await pg.query('select result from public.custom_sync_receipts_v1 where operation_id=$1',[op.operationId])).rows[0].result,accepted);
 });
 await test('anonymous and missing-auth RPCs are denied, including forged userId',async()=>{
  await pg.exec('set role anon');await assert.rejects(()=>apply(op));await assert.rejects(()=>pg.query('select * from public.custom_sync_entities_v1'));
  await account('');await assert.rejects(()=>apply(op));await account(a);await assert.rejects(()=>apply({...op,userId:b}));
 });
 await test('cross-account references cannot use another owners private identity or content',async()=>{
  const privateCard=fixture('private-b');await account(b);await apply(publish(privateCard));await account(a);
  assert.equal(await row('identity',privateCard.confirmation.entity.id),undefined);assert.equal(await bundle(privateCard.deck.id),null);
  const cross=publish(privateCard,'cross-reference');cross.action='stage';cross.changes=cross.changes.filter(c=>c.kind==='deck'||c.kind==='card');
  await assert.rejects(()=>apply(cross));assert.equal(await row('deck',privateCard.deck.id),undefined);
 });
 await test('two initial creators serialize with CAS instead of duplicating a card',async()=>{
  const q=fixture('simultaneous'),first=publish(q,'creator-one'),second=publish(q,'creator-two');
  const results=await Promise.all([apply(first),apply(second)]);assert.deepEqual(results.map(r=>r.status).sort(),['accepted','conflict']);
  assert.equal((await pg.query('select count(*)::int n from public.custom_sync_entities_v1 where kind=$1 and deck_id=$2',['card',q.deck.id])).rows[0].n,1);
 });
 await test('failed publication rolls back deck, card, identity and operation receipt',async()=>{
  const q=fixture('rollback'),bad=publish(q,'rollback');bad.changes.find(c=>c.kind==='manifest').payload.cardIds=[];
  await assert.rejects(()=>apply(bad));assert.equal(await row('deck',q.deck.id),undefined);
  assert.equal((await pg.query('select * from public.custom_sync_receipts_v1 where operation_id=$1',['rollback'])).rows.length,0);
  assert.equal((await apply(publish(q,'rollback'))).status,'accepted');
 });
 await test('staging is not an empty ready deck; later publication resumes safely',async()=>{
  const q=fixture('partial'),whole=publish(q,'partial-complete');
  const stage={schemaVersion:1,action:'stage',operationId:'partial-stage',changes:whole.changes.filter(c=>['deck','identity'].includes(c.kind))};
  const staged=await apply(stage);assert.equal(staged.status,'accepted');assert.equal(await bundle(q.deck.id),null);
  assert.deepEqual(await apply(stage),staged);
  whole.changes=whole.changes.map(c=>({...c,baseRevision:staged.entities.find(e=>e.kind===c.kind&&e.id===c.id)?.revision??'0'}));
  assert.equal((await apply(whole)).status,'accepted');assert.equal((await bundle(q.deck.id)).status,'complete');
 });
 await test('progress arriving before content cannot produce an orphan snapshot',async()=>{
  const q=fixture('orphan');await assert.rejects(()=>apply(review(q,'orphan-review')));
  assert.equal(await row('progress',q.card.id),undefined);
 });
 const append=async(q,token,ids,manifestRevision)=>({schemaVersion:1,operationId:token,action:'publish',intent:q,changes:[
  ...publish(q).changes.filter(c=>['identity','card','confirmation'].includes(c.kind)),change('manifest',p.deck.id,{schemaVersion:1,deckId:p.deck.id,cardIds:ids},manifestRevision)]});
 await test('distinct additions preserve a conflict and can explicitly rebase with a new operationId',async()=>{
  const dog=fixture('fixture-volume','犬','いぬ'),bird=fixture('fixture-volume','鳥','とり'),m=await row('manifest',p.deck.id);
  const one=await append(dog,'add-dog',[p.card.id,dog.card.id],m.revision),two=await append(bird,'add-bird',[p.card.id,bird.card.id],m.revision);
  const [r1,r2]=await Promise.all([apply(one),apply(two)]);assert.equal(r1.status,'accepted');assert.equal(r2.status,'conflict');
  assert.equal((await pg.query('select evidence from public.custom_sync_conflicts_v1 where operation_id=$1',['add-bird'])).rows[0].evidence.operationId,'add-bird');
  const rebased=await append(bird,'add-bird-rebased',[p.card.id,dog.card.id,bird.card.id],(await row('manifest',p.deck.id)).revision);
  assert.equal((await apply(rebased)).status,'accepted');assert.equal((await row('card',bird.card.id)).payload.order,3);
 });
 await test('tombstones block old writes; restore is explicit and keeps card identity',async()=>{
  const c=await row('card',p.card.id);const remove={schemaVersion:1,operationId:'delete-card',action:'delete',changes:[change('card',p.card.id,null,c.revision)]};
  const deleted=await apply(remove);assert.equal(deleted.status,'accepted');assert.ok((await row('card',p.card.id)).deleted_at);
  assert.equal((await bundle(p.deck.id)).status,'complete');assert.ok(!(await bundle(p.deck.id)).entities.some(e=>e.id===p.card.id));
  assert.equal((await apply({...publish(p),operationId:'old-device'})).status,'conflict');
  const restore={schemaVersion:1,operationId:'restore-card',action:'restore',changes:[change('card',p.card.id,c.payload,deleted.entities[0].revision)]};
  assert.equal((await apply(restore)).status,'accepted');assert.equal((await row('card',p.card.id)).deleted_at,null);
  const cards=(await pg.query("select entity_id from public.custom_sync_entities_v1 where kind='card' and deck_id=$1 and deleted_at is null",[p.deck.id])).rows.map(c=>c.entity_id);
  const republish={schemaVersion:1,operationId:'republish-restored',action:'publish',changes:[change('manifest',p.deck.id,{schemaVersion:1,deckId:p.deck.id,cardIds:cards},(await row('manifest',p.deck.id)).revision)]};
  await apply(republish);assert.equal((await bundle(p.deck.id)).status,'complete');
 });
 let reviewed,reviewRequest;
 await test('review CAS preserves independent branches and the lost receipt',async()=>{
  // Real UI: preview/snapshot clock precedes the user's answer click. Preserve both.
  const q=fixture('preview-clock'),preview=review(q,'preview-clock-first');await apply(publish(q));
  preview.changes.find(c=>c.kind==='review-event').payload.reviewedAt+=1500;
  assert.equal((await apply(preview)).status,'accepted');
  const saved=await row('progress',q.card.id),next=review(q,'preview-clock-second',saved.head,saved.payload.card);
  next.changes=await Promise.all(next.changes.map(async c=>({...c,baseRevision:String((await row(c.kind,c.id))?.revision??0)})));
  next.changes.find(c=>c.kind==='review-event').payload.reviewedAt+=2000;
  assert.equal((await apply(next)).status,'accepted');assert.deepEqual((await row('progress',q.card.id)).payload,next.changes.find(c=>c.kind==='progress').payload);
  const invalid=review(fixture('future-preview'),'future-preview');invalid.changes.find(c=>c.kind==='review-event').payload.reviewedAt-=1;
  await assert.rejects(()=>apply(invalid));
  reviewRequest=review(p,'review-one');reviewed=await apply(reviewRequest);assert.equal(reviewed.status,'accepted');
  assert.deepEqual(await apply(reviewRequest),reviewed);
  const competing=await apply(review(p,'review-other-device'));assert.equal(competing.status,'conflict');
  assert.equal((await row('progress',p.card.id)).head,'event-review-one');
  assert.equal((await row('progress',p.card.id)).payload.card.reps,1);
  assert.deepEqual((await row('progress',p.card.id)).payload,reviewRequest.changes.find(c=>c.kind==='progress').payload);
  assert.deepEqual((await row('review-event','event-review-one')).payload,reviewRequest.changes.find(c=>c.kind==='review-event').payload);
 });
 await test('undo checks the current head and preserves the voided event',async()=>{
  const progress=await row('progress',p.card.id),event=await row('review-event','event-review-one');const daily=reviewRequest.changes.find(c=>c.kind==='daily'),d=await row('daily',daily.id);
  const undo={schemaVersion:1,operationId:'undo-one',action:'undo',expectedHead:event.entity_id,before:progress.payload.card,changes:[
   change('progress',p.card.id,null,progress.revision),change('review-event',event.entity_id,event.payload,event.revision),change('daily',daily.id,{...daily.payload,introducedEntryIds:[]},d.revision)]};
  const undone=await apply(undo);assert.equal(undone.status,'accepted');assert.equal((await row('progress',p.card.id)).payload,null);assert.equal((await row('review-event',event.entity_id)).voided_by,'undo-one');
  assert.deepEqual(await apply(undo),undone);
  const next=review(p,'review-after-undo');next.changes=await Promise.all(next.changes.map(async c=>({...c,baseRevision:String((await row(c.kind,c.id))?.revision??0)})));
  assert.equal((await apply(next)).status,'accepted');assert.equal((await apply({...undo,operationId:'stale-undo'})).status,'conflict');
 });
 await test('review versus undo preserves the winning head in both submission orders',async()=>{
  for(const undoFirst of [false,true]){
   const q=fixture('review-undo-'+undoFirst);await apply(publish(q));const first=review(q,'race-first-'+undoFirst);await apply(first);
   const pr=await row('progress',q.card.id),ev=await row('review-event',first.changes.find(c=>c.kind==='review-event').id),dailyChange=first.changes.find(c=>c.kind==='daily'),day=await row('daily',dailyChange.id);
   const next=review(q,'race-next-'+undoFirst,pr.head,pr.payload.card);next.changes=await Promise.all(next.changes.map(async c=>({...c,baseRevision:String((await row(c.kind,c.id))?.revision??0)})));
   const undo={schemaVersion:1,operationId:'race-undo-'+undoFirst,action:'undo',expectedHead:pr.head,before:pr.payload.card,changes:[
    change('progress',q.card.id,null,pr.revision),change('review-event',ev.entity_id,ev.payload,ev.revision),change('daily',day.entity_id,{...day.payload,introducedEntryIds:[]},day.revision)]};
   const [winner,loser]=await Promise.all(undoFirst?[apply(undo),apply(next)]:[apply(next),apply(undo)]);
   assert.equal(winner.status,'accepted');assert.equal(loser.status,'conflict');
   assert.equal((await row('progress',q.card.id)).head,undoFirst?null:next.changes.find(c=>c.kind==='review-event').id);
  }
 });
 await test('a pre-create tombstone prevents resurrection; explicit restore can supply permanent dependencies',async()=>{
  const q=fixture('delete-before-create');const gone=await apply({schemaVersion:1,operationId:'bootstrap-delete',action:'delete',changes:[change('card',q.card.id,null)]});
  assert.equal(gone.status,'accepted');assert.equal((await apply(publish(q,'late-create'))).status,'conflict');
  const restored=publish(q,'explicit-bootstrap-restore');restored.action='restore';restored.changes.find(c=>c.kind==='card').baseRevision=gone.entities[0].revision;
  assert.equal((await apply(restored)).status,'accepted');assert.equal((await bundle(q.deck.id)).status,'complete');
 });
 await test('archiving and deleting a deck do not delete card history or a manga table',async()=>{
  const d=await row('deck',p.deck.id);assert.equal((await apply({schemaVersion:1,operationId:'archive',action:'archive',changes:[change('deck',p.deck.id,null,d.revision)]})).status,'accepted');
  assert.equal((await row('deck',p.deck.id)).archived,true);assert.ok(await row('progress',p.card.id));
  assert.equal((await bundle(p.deck.id)).status,'complete');
  const archived=await row('deck',p.deck.id);await apply({schemaVersion:1,operationId:'delete-deck',action:'delete',changes:[change('deck',p.deck.id,null,archived.revision)]});
  assert.equal(await bundle(p.deck.id),null);assert.ok(await row('confirmation',p.confirmation.id));
  const current=await row('progress',p.card.id),attempt=review(p,'review-deleted-parent',current.head,current.payload.card);
  attempt.changes=await Promise.all(attempt.changes.map(async c=>({...c,baseRevision:String((await row(c.kind,c.id))?.revision??0)})));
  assert.equal((await apply(attempt)).status,'conflict');
 });
 await test('Guest import keeps original IDs per owner, and divergent destination progress conflicts',async()=>{
  const q=fixture('guest-import'),original=structuredClone(q);await apply(publish(q,'guest-content'));
  const req=review(q,'guest-history');req.action='import-history';req.expectedHead=req.changes.find(c=>c.kind==='review-event').id;
  assert.equal((await apply(req)).status,'accepted');assert.equal((await apply({...req,operationId:'guest-again'})).status,'conflict');
  const extra=review(q,'guest-extra-evidence').changes.find(c=>c.kind==='review-event');
  assert.equal((await apply({schemaVersion:1,operationId:'guest-events-divergent',action:'import-history',changes:[extra]})).status,'conflict');
  await account(b);assert.equal((await apply(publish(q,'guest-content'))).status,'accepted');assert.equal((await apply(req)).status,'accepted');
  assert.deepEqual(q,original);await account(a);
 });
 await test('Guest history can be chunked and retain voided events separately from the effective head',async()=>{
  const q=fixture('guest-voided');await apply(publish(q));const first=review(q,'guest-voided-old'),event=first.changes.find(c=>c.kind==='review-event');
  const evidence={schemaVersion:1,operationId:'import-voided-evidence',action:'import-history',changes:[{...event,parentHead:null,voidedBy:'original-guest-undo'}]};
  assert.equal((await apply(evidence)).status,'accepted');assert.equal((await row('review-event',event.id)).voided_by,'original-guest-undo');
  const active=review(q,'guest-active-import');active.action='import-history';active.expectedHead=active.changes.find(c=>c.kind==='review-event').id;
  assert.equal((await apply(active)).status,'accepted');assert.equal((await row('progress',q.card.id)).head,active.expectedHead);
  assert.equal((await pg.query("select count(*)::int n from public.custom_sync_entities_v1 where kind='review-event' and deck_id=$1",[q.deck.id])).rows[0].n,2);
 });
 await test('daily completion is independent of FSRS and cannot drop introductions or reset a completed day',async()=>{
  const q=fixture('daily-completion');await apply(publish(q));const r=review(q,'daily-review');await apply(r);
  const key=r.changes.find(c=>c.kind==='daily').id,day=await row('daily',key),progress=await row('progress',q.card.id);
  await assert.rejects(()=>apply({schemaVersion:1,operationId:'drop-introductions',action:'daily',changes:[change('daily',key,{...day.payload,introducedEntryIds:[]},day.revision)]}));
  const completion={...day.payload,completedAt:Date.parse('2026-10-22T12:00:01Z')};
  const done=await apply({schemaVersion:1,operationId:'complete-day',action:'daily',changes:[change('daily',key,completion,day.revision)]});assert.equal(done.status,'accepted');
  const stale=await apply({schemaVersion:1,operationId:'reset-day',action:'daily',changes:[change('daily',key,day.payload,(await row('daily',key)).revision)]});assert.equal(stale.status,'conflict');
  assert.deepEqual((await row('progress',q.card.id)).payload,progress.payload);assert.deepEqual((await row('daily',key)).payload,completion);
 });
 await test('equivalences remain owner-local, revocable, and never expert certification',async()=>{
  const dog=fixture('fixture-volume','犬','いぬ'),eq={schemaVersion:1,id:'local-equivalence',left:p.card.lexicalIdentity.key,right:dog.card.lexicalIdentity.key,scope:'owner-local',evidence:'Controlled user decision, not certified',revoked:false,expertCertified:false};
  const r=await apply({schemaVersion:1,operationId:'equivalence',action:'stage',changes:[change('equivalence',eq.id,eq)]});assert.equal(r.status,'accepted');
  const revoked=await apply({schemaVersion:1,operationId:'revoke',action:'revoke',changes:[change('equivalence',eq.id,null,r.entities[0].revision)]});assert.equal(revoked.entities[0].payload.revoked,true);
 });
 await test('sizes, escaping, surrogate pairs, schema types and unknown fields are enforced',async()=>{
  const q=fixture('unicode','𠮷','よし');q.confirmation.source.fragment='𠮷"\\。';q.card.context.text=q.confirmation.source.fragment;
  // Changing OCR changes the origin/identity. Use an untouched astral fixture for the real acceptance path.
  assert.equal((await apply(publish(fixture('astral','𠮷','よし')))).status,'accepted');
  assert.equal((await apply(publish(fixture('escaped','猫"\\','ねこ')))).status,'accepted');
  for(const [index,mutate] of [p=>p.card.word=null,p=>p.card.direction=null,p=>p.card.images=['private'],p=>p.confirmation.source.fragment='x'.repeat(1201),p=>p.confirmation.expertCertified=true].entries()){
   const invalid=fixture('invalid-'+index);mutate(invalid);await assert.rejects(()=>apply(publish(invalid)));
  }
  const huge=publish(fixture('huge'));huge.intent={...huge.intent,rawOcr:'x'.repeat(524288)};await assert.rejects(()=>apply(huge));
  const malformed=publish(fixture('bad-schema'));malformed.changes[0].payload.registryNamespace=null;await assert.rejects(()=>apply(malformed));
  await assert.rejects(()=>apply({...publish(fixture('null-action')),action:null}));
  assert.equal((await pg.query('select octet_length($1::jsonb::text) n',[JSON.stringify([1e21,1e-7])])).rows[0].n,35);
  const exact=fixture('exact-context','猫','ねこ');exact.confirmation.source.fragment='猫'+('"\\'.repeat(599))+'。';exact.card.context.text=exact.confirmation.source.fragment;
  const s=exact.confirmation.source,e=exact.confirmation.entity;
  e.originReference=hash('ocr-',{volumeId:s.volumeId,page:s.pageNumber,block:s.blockIndex,line:s.lineIndex,range:s.range,fragment:s.fragment,surface:s.surface});
  e.id=hash('mce-',{registryNamespace:e.registryNamespace,originReference:e.originReference,word:e.word,reading:e.reading,branch:e.branch,policy:'manga-user-entity-v1'});
  e.identity.anchor.entryId=e.id;e.identity.key=hash('lex1-',e.identity.anchor);exact.card.id=hash('mc-',[exact.deck.id,e.identity.key,'japanese-to-meaning']);
  assert.equal(s.fragment.length,1200);assert.equal((await apply(publish(exact))).status,'accepted');
  const over=structuredClone(exact);over.confirmation.source.fragment+='x';over.card.context.text+='x';await assert.rejects(()=>apply(publish(over,'over-context')));
 });
 await test('paged change feed includes tombstones and denies invalid cursors',async()=>{
  const feed=(await pg.query('select public.get_custom_deck_changes_v1(0,2) r')).rows[0].r;assert.equal(feed.entities.length,2);assert.ok(BigInt(feed.serverRevision)>0n);
  await assert.rejects(()=>pg.query('select public.get_custom_deck_changes_v1(-1,2)'));await assert.rejects(()=>pg.query('select public.get_custom_deck_changes_v1(0,201)'));
 });
 await test('all legacy table grants, RLS policies, indexes, functions and historical durations remain unchanged',async()=>{
  await pg.exec('reset role');assert.deepEqual(await legacySchema(),legacyBefore);
  assert.deepEqual((await pg.query("select * from public.completed_sessions where id='h4a-historic'")).rows,historic);
  const fixed=JSON.parse(await readFile(new URL('../supabase/tests/h2ba-fixture.json',import.meta.url),'utf8'));assert.deepEqual(fixed,fixture());
 });
 if(process.argv.includes('--limits')){await account(a);const {measureCustomLimits}=await import('../supabase/tests/custom-decks-limits.mjs');const measured=await measureCustomLimits({apply,bundle,row,query:(sql,args)=>pg.query(sql,args)});await writeFile(new URL('../.cache/h4bc-pglite-limits.json',import.meta.url),JSON.stringify(measured,null,2));console.log('PGlite limits:',JSON.stringify(measured.samples));}
 console.log(`${passed} SQL/protocol scenarios passed on ${process.env.H4A1_SQL_ENGINE??'PostgreSQL/PGlite'}. This runner uses one connection; multisesión and HTTP/JWT are separate validations.`);
 if(process.argv.includes('--transfers')){
  await pg.exec('reset role');await pg.exec(await readFile(new URL('../supabase/migrations/202610220002_custom_transfers_v2.sql',import.meta.url),'utf8'));
  const {runTransfers}=await import('../supabase/tests/custom-transfers-v2.mjs');let v2=0;
  await runTransfers({query:(s,p)=>pg.query(s,p),account,a,b,test:async(name,fn)=>{await fn();console.log('ok V2',++v2,name);}});
  console.log('PASS V2 SQL:',v2);
 }
}catch(error){console.error('Custom SQL failed:',error.message,error.code,error.where??'',error.internalQuery??'');
 const pos=Number(error.position??error.internalPosition);if(pos)console.error('SQL context:',error.query?.slice(Math.max(0,pos-180),pos+180));process.exitCode=1;}
finally{await pg.close();}
