// Optional local PostgreSQL/WASM check. No Supabase credentials or remote SQL execution.
// Pass the installed @electric-sql/pglite module path; it is not a frontend dependency.
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {validateMangaSavedItem, mangaSavedPayloadBytes} from '../src/app/core/models/manga-study-saved.model.ts';
import {dictionaryLimitItem, payloadLimitItem} from '../src/app/core/models/manga-study-saved-limits.fixtures.ts';
const {PGlite}=await import(process.argv[2]?pathToFileURL(process.argv[2]).href:'@electric-sql/pglite');
const pg=new PGlite();
const a='00000000-0000-0000-0000-000000000001',b='00000000-0000-0000-0000-000000000002';
try{
  await pg.exec(`create role authenticated; create role anon; create schema auth;
    create table auth.users(id uuid primary key);
    insert into auth.users values('${a}'),('${b}');
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth to authenticated,anon;`);
  await pg.exec(await readFile(new URL('../supabase/migrations/202610080003_manga_saved_sync.sql',import.meta.url),'utf8'));
  const account=async id=>pg.exec(`set role authenticated;select set_config('request.jwt.claim.sub','${id}',false);`);
  await account(a);
  const item=id=>({schemaVersion:1,id,expression:'食べる',reading:'たべる',kanji:['食'],context:'First context',source:{volumeId:'fixture',pageNumber:3},createdAt:100});
  const apply=async(id,revision,token,payload,deleted=false,initial=false)=>(await pg.query(
    'select * from public.apply_manga_saved_change_v1($1,$2,$3,$4::jsonb,$5,$6)',[id,revision,token,payload?JSON.stringify(payload):null,deleted,initial])).rows[0];
  let row=await apply('word',0,'save',item('word'));assert.equal(row.revision,1);
  assert.equal((await apply('word',0,'duplicate',{...item('word'),context:'Other context'})).payload.context,'First context');
  row=await apply('word',1,'delete',null,true);assert.equal(row.revision,2);assert.ok(row.deleted_at);
  assert.ok((await apply('word',1,'stale',item('word'))).deleted_at);
  assert.ok((await apply('word',2,'bootstrap',item('word'),false,true)).deleted_at);
  row=await apply('word',2,'restore',item('word'));assert.equal(row.revision,3);assert.equal(row.deleted_at,null);
  assert.equal((await apply('word',1,'old-delete',null,true)).deleted_at,null);
  assert.equal((await apply('word',2,'restore',item('word'))).revision,3);
  for(const deleteFirst of [false,true]){
    const id=`race-${deleteFirst}`;
    const save=()=>apply(id,0,'s',item(id));const remove=()=>apply(id,0,'d',null,true);
    await Promise.all(deleteFirst?[remove(),save()]:[save(),remove()]);
    assert.ok((await pg.query('select deleted_at from public.manga_saved_items where item_id=$1',[id])).rows[0].deleted_at);
  }
  for(const payload of [{...item('bad'),images:['blob']},{...item('bad'),context:'x'.repeat(1201)},
    {...item('bad'),source:{volumeId:'fixture'}},{...item('bad'),source:{pageNumber:1}},{schemaVersion:1,id:'bad'}])
    await assert.rejects(()=>apply('bad',0,'bad',payload));
  // Every boundary item is validated locally, then passed through the real RPC,
  // including long incompressible keys that cannot fit a PostgreSQL text B-tree.
  const boundaryItems=['x','漢','"','\\','\u0001','😀'].map(char=>dictionaryLimitItem(char.repeat(1600/char.length),char.repeat(1600/char.length)));
  boundaryItems.push(dictionaryLimitItem(Array.from({length:1600},(_,i)=>String.fromCharCode(0x4e00+i)).join(''),'r'.repeat(1600)));
  const exact=payloadLimitItem(mangaSavedPayloadBytes,65536);boundaryItems.push(exact);
  boundaryItems.push({...item('integers'),createdAt:Number.MAX_SAFE_INTEGER,source:{volumeId:'v',pageNumber:Number.MAX_SAFE_INTEGER}});
  for(const [index,fixture] of boundaryItems.entries()){
    const valid=validateMangaSavedItem(fixture);
    const existing=(await pg.query('select revision from public.manga_saved_items where item_id=$1',[valid.id])).rows[0];
    const revision=existing?(await apply(valid.id,existing.revision,'boundary-delete-'+index,null,true)).revision:0;
    const stored=await apply(valid.id,revision,'boundary-'+index,valid);
    assert.equal(stored.item_id,valid.id);assert.deepEqual(stored.payload,valid);
    const measured=(await pg.query('select octet_length($1::jsonb::text) as bytes',[JSON.stringify(valid)])).rows[0].bytes;
    assert.equal(measured,mangaSavedPayloadBytes(valid));
  }
  const oversized={...exact,context:exact.context+'x'};assert.throws(()=>validateMangaSavedItem(oversized));
  await assert.rejects(()=>apply(oversized.id,0,'oversized',oversized));
  for(const [field,limit] of Object.entries({expression:1600,reading:1600,baseForm:1600,vocabularyId:256,meaning:300,surface:160,context:1200})){
    const boundary={...item('field-'+field),[field]:'x'.repeat(limit)};
    await apply(boundary.id,0,'field-'+field,validateMangaSavedItem(boundary));
    const invalid={...boundary,[field]:'x'.repeat(limit+1)};
    assert.throws(()=>validateMangaSavedItem(invalid));await assert.rejects(()=>apply(invalid.id,0,'bad-field',invalid));
  }
  const source={...item('source'),source:{volumeId:'v'.repeat(1024),pageNumber:1,volumeTitle:'t'.repeat(160)},kanji:Array.from({length:64},()=> '漢'.repeat(64))};
  await apply(source.id,0,'source',validateMangaSavedItem(source));
  for(const invalid of [{...source,source:{...source.source,volumeId:'v'.repeat(1025)}},
    {...source,source:{...source.source,volumeTitle:'t'.repeat(161)}},{...source,kanji:[...source.kanji,'漢']},
    {...source,kanji:['漢'.repeat(65)]}]){
    assert.throws(()=>validateMangaSavedItem(invalid));await assert.rejects(()=>apply(invalid.id,0,'bad-source',invalid));
  }
  for(const bad of [{...item('id'),id:'x'.repeat(19219)}, {...item('bytes'),id:'😀'.repeat(4804)+'xxx'},
    {...item('fraction'),createdAt:1.5},{...item('unsafe'),source:{volumeId:'v',pageNumber:9007199254740992}},
    {...item('nul'),context:'\u0000'},{...item('surrogate'),context:'\ud800'}]){
    assert.throws(()=>validateMangaSavedItem(bad));await assert.rejects(()=>apply(bad.id,0,'bad-boundary',bad));
  }
  await assert.rejects(()=>pg.exec("update public.manga_saved_items set revision=999"));
  await assert.rejects(()=>pg.exec("delete from public.manga_saved_items"));
  await assert.rejects(()=>pg.exec("insert into public.manga_saved_items(user_id,item_id,deleted_at) values('"+a+"','bypass',now())"));
  await account(b);assert.equal((await pg.query('select * from public.manga_saved_items')).rows.length,0);
  await apply('private',0,'private',item('private'));
  await account(a);assert.equal((await pg.query("select * from public.manga_saved_items where item_id='private'")).rows.length,0);
  await pg.exec('set role anon');await assert.rejects(()=>pg.query('select * from public.manga_saved_items'));
  await assert.rejects(()=>apply('anon',0,'anon',item('anon')));
  console.log('Manga SQL: migration, payload validation, revisions, both operation orders, idempotency, owner RLS and anonymous/direct-write denial OK.');
  console.log('PGlite uses one backend: separate-session lock contention still requires validation in the target PostgreSQL project.');
}finally{await pg.close();}
