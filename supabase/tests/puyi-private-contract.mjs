import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { PGlite } from '../../.cache/h4a-sql-runtime/node_modules/@electric-sql/pglite/dist/index.js';

const owner = '70000000-0000-4000-8000-000000000001';
const readers = [2, 3, 4].map(n => '70000000-0000-4000-8000-00000000000' + n);
const outsider = '70000000-0000-4000-8000-000000000005';
const unverified = '70000000-0000-4000-8000-000000000006';
const island = '71000000-0000-4000-8000-000000000001';
const otherIsland = '71000000-0000-4000-8000-000000000002';
const block = '72000000-0000-4000-8000-000000000001';
const entries = [1, 2].map(n => '73000000-0000-4000-8000-00000000000' + n);
const assets = [1, 2].map(n => '74000000-0000-4000-8000-00000000000' + n);
const sha = 'a'.repeat(64);
const bucket = 'puyi-islands-private';
const key = n => `${island}/${assets[n]}/r1-${sha}.mp3`;
const payload = () => ({
  schemaVersion: 1, title_ja: '架空の島', title: { es: 'Isla ficticia' }, description: {},
  blocks: [{ id: block, position: 1, name: { es: 'Planes' } }],
  entries: entries.map((id, index) => ({
    id, block_id: block, position: 1, kind: index ? 'question' : 'phrase',
    japanese: 'きく。', reading: 'きく。', segments: [{ text: 'きく。' }],
    translation: { es: 'Escuchar.' }, structural: {}, explanation: {}, vocabulary: [],
    register: 'neutral', text_approved: true, audio_approved: true, audio_id: assets[index],
    original_context: 'Contexto ficticio únicamente para la prueba.',
  })),
  answers: [{ question_id: entries[1], phrase_id: entries[0], position: 1 }],
  assets: assets.map((id, index) => ({ id, entry_id: entries[index], revision: 1, sha256: sha,
    fingerprint: 'b'.repeat(64), japanese: 'きく。', reading: 'きく。', bytes: 1234, duration_seconds: 1 })),
});

test('private islands RLS and revision contract on local PostgreSQL', async t => {
  const pg = new PGlite();
  t.after(() => pg.close());
  const sql = async (query, args) => (await pg.query(query, args)).rows;
  const one = async (query, args) => (await sql(query, args))[0]?.value;
  const role = async (user = null, as = 'authenticated', anonymous = false) => {
    await pg.exec('reset role; set role ' + as);
    await sql("select set_config('request.jwt.claims', $1, false)", [JSON.stringify({ sub: user, role: as, is_anonymous: anonymous })]);
  };
  const save = (expected, doc = payload(), id = island) =>
    one('select public.puyi_island_save($1,$2,$3::jsonb) value', [id, expected, JSON.stringify(doc)]);
  const publish = (expected, published, revision) =>
    sql('select public.puyi_island_publish($1,$2,$3,$4)', [island, expected, published, revision]);
  const summary = () => one('select public.puyi_island_catalog() value');
  const detail = () => one('select public.puyi_island_detail($1) value', [island]);
  const getBlock = (revision = 1) => one('select public.puyi_island_block($1,$2,$3) value', [island, revision, block]);
  const getMedia = () => sql('select name from storage.objects where bucket_id=$1 order by name', [bucket]);
  const insertMedia = name => sql('insert into storage.objects(bucket_id,name,metadata) values($1,$2,$3::jsonb)',
    [bucket, name, JSON.stringify({ mimetype: 'audio/mpeg', size: 1234 })]);

  await pg.exec(`create role anon; create role authenticated; create schema auth;
    create table auth.users(id uuid primary key, raw_user_meta_data jsonb not null default '{}');
    create function auth.jwt() returns jsonb language sql stable as $$select nullif(current_setting('request.jwt.claims',true),'')::jsonb$$;
    create function auth.uid() returns uuid language sql stable as $$select (auth.jwt()->>'sub')::uuid$$;
    create function auth.role() returns text language sql stable as $$select auth.jwt()->>'role'$$;
    grant usage on schema auth,public to anon,authenticated;
    create schema storage;
    create table storage.buckets(id text primary key,name text not null,public boolean not null,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text not null references storage.buckets(id),
      name text not null,metadata jsonb,unique(bucket_id,name));
    alter table storage.buckets enable row level security;
    alter table storage.objects enable row level security;
    grant usage on schema storage to anon,authenticated;
    grant select,insert,update,delete on storage.objects,storage.buckets to anon,authenticated;`);
  for (const user of [owner, ...readers, outsider, unverified]) await sql('insert into auth.users(id) values($1)', [user]);
  for (const migration of ['202609300001_local_first_accounts.sql', '202611030001_puyi_public_deck.sql',
    '202611180001_puyi_private_islands.sql', '202611180002_puyi_island_editorial.sql']) {
    await pg.exec(await readFile(new URL('../migrations/' + migration, import.meta.url), 'utf8'));
  }
  await pg.exec(`create policy broad_objects on storage.objects for all to anon,authenticated using(true) with check(true);
    create policy broad_buckets on storage.buckets for all to anon,authenticated using(true) with check(true);
    insert into storage.buckets(id,name,public) values('other-fixture','other-fixture',true);
    insert into storage.objects(bucket_id,name) values('other-fixture','other.mp3');`);

  await t.test('migration grants nobody access, even the public deck administrator', async () => {
    await sql('insert into public.puyi_administrator(user_id) values($1)', [outsider]);
    await role(outsider);
    assert.equal(await one('select public.puyi_island_access() value'), null);
    await assert.rejects(() => save(0), /puyi_forbidden/);
    assert.deepEqual(await summary(), []);
  });
  await pg.exec('reset role');
  await sql("insert into public.puyi_island_members values($1,'owner',now(),null)", [owner]);
  for (const reader of readers) await sql("insert into public.puyi_island_members values($1,'reader',now(),null)", [reader]);
  await sql("insert into public.puyi_island_members(user_id,role) values($1,'reader')", [unverified]);

  await t.test('owner saves an immutable draft; another role cannot write, self-grant or read it by known ID', async () => {
    await role(owner);
    assert.equal(await save(0), 1);
    assert.equal((await sql('select * from public.puyi_island_contexts')).length, 2);
    assert.deepEqual(await summary(), []);
    for (const user of [...readers, outsider, unverified]) {
      await role(user);
      assert.equal(await detail(), null);
      assert.equal(await getBlock(), null);
      assert.deepEqual(await sql('select id from public.puyi_island_entries where id=$1', [entries[0]]), []);
      assert.deepEqual(await sql('select entry_id from public.puyi_island_contexts'), []);
      await assert.rejects(() => save(1), /puyi_forbidden/);
      await assert.rejects(() => publish(1, null, 1), /puyi_forbidden/);
      await assert.rejects(() => sql('update public.puyi_island_members set role=\'owner\''), /permission denied/);
      await assert.rejects(() => sql('update public.puyi_island_entries set japanese=\'x\''), /permission denied/);
    }
  });
  await t.test('only a reserved owner upload can be staged; bucket flags and existing objects are immutable', async () => {
    await role(owner);
    await assert.rejects(() => publish(1, null, 1), /puyi_not_ready/);
    await assert.rejects(() => insertMedia('unreserved.mp3'), /row-level/);
    for (const index of [0, 1]) await insertMedia(key(index));
    await assert.rejects(() => insertMedia(key(0)), /duplicate/);
    assert.deepEqual(await sql("update storage.objects set metadata='{}' where bucket_id=$1 returning id", [bucket]), []);
    assert.deepEqual(await sql('delete from storage.objects where bucket_id=$1 returning id', [bucket]), []);
    assert.deepEqual(await sql('update storage.buckets set public=true where id=$1 returning id', [bucket]), []);
    assert.equal((await sql('select public from storage.buckets where id=$1', [bucket]))[0].public, false);
    assert.equal((await sql("select name from storage.objects where bucket_id='other-fixture'")).length, 1);
    await publish(1, null, 1);
  });
  await t.test('all three readers can get only approved data and audio while drafts and contexts remain private', async () => {
    await role(owner);
    const edited = payload();
    edited.title.es = 'Borrador nuevo';
    edited.entries[0].audio_approved = false;
    assert.equal(await save(1, edited), 2);
    await assert.rejects(() => publish(2, 1, 2), /puyi_not_ready/);
    for (const reader of readers) {
      await role(reader);
      assert.equal(await one('select public.puyi_island_access() value'), 'reader');
      assert.equal((await summary())[0].title.es, 'Isla ficticia');
      assert.equal((await detail()).blocks[0].phraseCount, 1);
      assert.deepEqual((await getBlock()).find(row => row.kind === 'question').answers, [entries[0]]);
      assert.equal(await getBlock(2), null);
      assert.deepEqual(await sql('select revision from public.puyi_island_revisions where revision=2'), []);
      assert.deepEqual(await sql('select entry_id from public.puyi_island_contexts'), []);
      await assert.rejects(() => sql('select current_revision from public.puyi_islands'), /permission denied/);
      assert.equal((await getMedia()).length, 2);
      await assert.rejects(() => insertMedia(key(0)), /row-level/);
      assert.deepEqual(await sql('delete from storage.objects where bucket_id=$1 returning id', [bucket]), []);
    }
  });
  await t.test('guest without JWT, anonymous Auth, outsider, unverified and revoked fail the direct content and object checks', async () => {
    await pg.exec('reset role');
    await sql('update public.puyi_island_members set revoked_at=now() where user_id=$1', [readers[0]]);
    await role(null, 'anon');
    await assert.rejects(() => detail(), /permission denied/);
    assert.deepEqual(await getMedia(), []);
    for (const [user, anonymous] of [[owner, true], [outsider, false], [unverified, false], [readers[0], false]]) {
      await role(user, 'authenticated', anonymous);
      assert.equal(await one('select public.puyi_island_access() value'), null);
      assert.deepEqual(await summary(), []);
      assert.equal(await detail(), null);
      assert.equal(await getBlock(), null);
      assert.deepEqual(await sql('select id from public.puyi_island_entries where id=$1', [entries[0]]), []);
      assert.deepEqual(await sql('select name from storage.objects where name=$1', [key(0)]), []);
      await assert.rejects(() => insertMedia(key(0)), /row-level/);
    }
  });
  await t.test('stale revision, edited asset and cross-island relationships are rejected atomically', async () => {
    await role(owner);
    await assert.rejects(() => save(1), /puyi_conflict/);
    await assert.rejects(() => publish(2, null, 1), /puyi_conflict/);
    const altered = payload();
    altered.assets[0].sha256 = 'c'.repeat(64);
    await assert.rejects(() => save(2, altered), /puyi_audio_conflict/);
    const cross = payload();
    cross.assets = [];
    cross.entries = [{ ...cross.entries[1], audio_id: null }];
    await assert.rejects(() => save(0, cross, otherIsland), /foreign key/);
    const state = await one('select public.puyi_island_editor_state($1) value', [island]);
    assert.deepEqual(state, { current: 2, published: 1 });
    const translationOnly = payload();
    translationOnly.entries[0].translation.es = 'Escucha revisada.';
    assert.equal(await save(2, translationOnly), 3);
    await publish(3, 1, 3);
    await publish(3, 3, 1);
    await publish(3, 1, null);
    await role(readers[1]);
    assert.equal(await getBlock(), null);
    assert.deepEqual(await getMedia(), []);
  });
});
