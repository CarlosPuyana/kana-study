import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { adminId as publicDeckAdmin } from './puyi-contract.mjs';

const bucket = 'puyi-islands-private';
const migrators = ['202611180001_puyi_private_islands.sql', '202611180002_puyi_island_editorial.sql'];
const owner = randomUUID();
const readers = Array.from({ length: 3 }, () => randomUUID());
const outsider = randomUUID();
const anonymous = randomUUID();
const unverified = randomUUID();
const revoked = randomUUID();
const island = randomUUID();
const block = randomUUID();
const phrases = ['おはよう。', 'お茶を飲む。', '本を読む。', '雨が降る。', 'また明日。', '何をする？'];
const readings = ['おはよう。', 'おちゃをのむ。', 'ほんをよむ。', 'あめがふる。', 'またあした。', 'なにをする？'];
const translations = ['Buenos días.', 'Tomo té.', 'Leo un libro.', 'Llueve.', 'Hasta mañana.', '¿Qué haces?'];
const ids = phrases.map(() => randomUUID());
const assets = phrases.map((japanese, index) => ({
  id: randomUUID(), entry_id: ids[index], revision: 1,
  sha256: createHash('sha256').update(`synthetic-metadata-${index}`).digest('hex'),
  fingerprint: createHash('sha256').update(readings[index]).digest('hex'),
  japanese, reading: readings[index], bytes: 1000 + index, duration_seconds: 1,
}));
const objectKey = asset => `${island}/${asset.id}/r${asset.revision}-${asset.sha256}.mp3`;
const fixture = {
  schemaVersion: 1, title_ja: '練習の島', title: { es: 'Isla ficticia' }, description: {},
  blocks: [{ id: block, position: 1, name: { es: 'Frases de muestra' } }],
  entries: phrases.map((japanese, index) => ({
    id: ids[index], block_id: block, position: index + 1, kind: index === 5 ? 'question' : 'phrase',
    japanese, reading: readings[index], segments: [{ text: japanese, reading: readings[index] }],
    translation: { es: translations[index] }, structural: {}, explanation: {}, vocabulary: [],
    register: 'neutral', text_approved: true, audio_approved: true, audio_id: assets[index].id,
    original_context: 'Contexto ficticio de laboratorio.',
  })),
  answers: [{ question_id: ids[5], phrase_id: ids[2], position: 1 }], assets,
};

export async function preparePrivateIslands(client) {
  // Bootstrap in the isolated native PostgreSQL fixture. GoTrue and the object service are absent.
  await client.query(`
    create function auth.jwt() returns jsonb language sql stable
      as $$select nullif(current_setting('request.jwt.claims', true), '')::jsonb$$;
    alter table storage.buckets enable row level security;
    grant select, insert, update, delete on storage.buckets to anon, authenticated;
    create policy fixture_broad_buckets on storage.buckets for all to anon, authenticated using(true) with check(true);
  `);
  for (const migration of migrators) {
    await client.query(await readFile(new URL(`../migrations/${migration}`, import.meta.url), 'utf8'));
  }
  assert.equal((await client.query('select count(*)::int as count from public.puyi_island_members')).rows[0].count, 0);
  for (const id of [owner, ...readers, outsider, anonymous, unverified, revoked]) {
    await client.query('insert into auth.users(id) values ($1)', [id]);
  }
  for (const id of [owner, ...readers, anonymous, revoked]) {
    await client.query('insert into public.puyi_island_members(user_id, role, verified_at) values ($1, $2, now())',
      [id, id === owner ? 'owner' : 'reader']);
  }
  await client.query("insert into public.puyi_island_members(user_id, role) values ($1, 'reader')", [unverified]);
}

export async function checkPrivateIslands({ client, http, jwt, ready, test }) {
  const rpc = (name, token, body = {}) => http(`rpc/puyi_island_${name}`, { token, method: 'POST', body });
  const ownerToken = jwt(owner);
  const save = (token, expected, document = fixture) => rpc('save', token,
    { p_island: island, p_expected: expected, p_document: document });
  const publish = (token, expected, published, revision) => rpc('publish', token,
    { p_island: island, p_expected: expected, p_expected_published: published, p_revision: revision });
  const readBlock = (token, revision) => rpc('block', token, { p_island: island, p_revision: revision, p_block: block });
  const readDetail = token => rpc('detail', token, { p_island: island });
  const state = token => rpc('editor_state', token, { p_island: island });
  const raw = (path, token, options = {}) => http(path, { token, ...options });
  const metadata = (token, asset) => raw(`objects?bucket_id=eq.${bucket}&name=eq.${objectKey(asset)}&select=name`, token, { profile: 'storage' });
  const stage = (token, asset, size = asset.bytes) => raw('objects', token, {
    profile: 'storage', method: 'POST',
    body: { bucket_id: bucket, name: objectKey(asset), metadata: { mimetype: 'audio/mpeg', size } },
  });
  const expect = (response, status, data) => {
    assert.equal(response.status, status, JSON.stringify(response.data));
    if (data !== undefined) assert.deepEqual(response.data, data);
  };
  const expectError = (response, message) => {
    assert.ok(response.status >= 400, JSON.stringify(response.data));
    assert.equal(response.data?.message, message);
  };

  {
    const { rows } = await client.query(`
      select p.proname, pg_get_userbyid(p.proowner) as owner, current_user as migrator,
        p.proconfig, has_function_privilege('anon', p.oid, 'EXECUTE') as anon,
        has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated,
        exists (select 1 from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
          where a.grantee = 0 and a.privilege_type = 'EXECUTE') as public
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname like 'puyi_island_%' and p.prosecdef
    `);
    assert.equal(rows.length, 7);
    for (const row of rows) {
      assert.equal(row.owner, row.migrator);
      assert.deepEqual(row.proconfig, ['search_path=""']);
      assert.equal(row.authenticated, true);
      assert.equal(row.anon, row.proname === 'puyi_island_media_access');
      assert.equal(row.public, false);
    }
    console.log('ok native ACL: 7 private islands SECURITY DEFINER functions, search_path and EXECUTE');
  }

  await test('private islands: owner saves draft; known island, block and entry IDs stay private', async () => {
    expect(await rpc('access', ownerToken), 200, 'owner');
    expect(await save(ownerToken, 0), 200, 1);
    expect(await state(ownerToken), 200, { current: 1, published: null });
    assert.equal((await raw('puyi_island_contexts', ownerToken)).data.length, 6);
    for (const id of [...readers, outsider, publicDeckAdmin, unverified]) {
      const token = jwt(id);
      expect(await rpc('catalog', token), 200, []);
      expect(await readDetail(token), 200, null);
      expect(await readBlock(token, 1), 200, null);
      expect(await raw(`puyi_island_entries?id=eq.${ids[0]}`, token), 200, []);
      expect(await raw('puyi_island_contexts', token), 200, []);
    }
  });

  await test('private islands: three readers cannot edit, publish, alter role or stage an object', async () => {
    for (const id of readers) {
      const token = jwt(id);
      expect(await rpc('access', token), 200, 'reader');
      expect(await state(token), 403);
      expect(await save(token, 1), 403);
      expect(await publish(token, 1, null, 1), 403);
      expect(await raw(`puyi_island_members?user_id=eq.${id}`, token, { method: 'PATCH', body: { role: 'owner' } }), 403);
      expect(await raw(`puyi_island_entries?id=eq.${ids[0]}`, token, { method: 'PATCH', body: { text_approved: true } }), 403);
      expect(await stage(token, assets[0]), 403);
    }
  });

  await test('private islands: restrictive Storage metadata policies and publication prerequisites', async () => {
    expectError(await publish(ownerToken, 1, null, 1), 'puyi_not_ready');
    expect(await stage(ownerToken, { ...assets[0], id: randomUUID() }), 403);
    for (const asset of assets) expect(await stage(ownerToken, asset, asset === assets[0] ? 999 : asset.bytes), 201);
    expectError(await publish(ownerToken, 1, null, 1), 'puyi_not_ready');
    // Test-only setup repairs a deliberately invalid metadata row via the database owner.
    await client.query("update storage.objects set metadata = jsonb_set(metadata, '{size}', to_jsonb($1::int)) where bucket_id=$2 and name=$3",
      [assets[0].bytes, bucket, objectKey(assets[0])]);
    assert.equal((await metadata(ownerToken, assets[0])).data.length, 1);
    expect(await stage(ownerToken, assets[0]), 409);
    for (const method of ['PATCH', 'DELETE']) {
      expect(await raw(`objects?bucket_id=eq.${bucket}`, ownerToken, {
        method, profile: 'storage', ...(method === 'PATCH' ? { body: { metadata: {} } } : {}),
      }), 204);
    }
    expect(await raw(`buckets?id=eq.${bucket}`, ownerToken, { method: 'PATCH', profile: 'storage', body: { public: true } }), 204);
    expect(await raw(`buckets?id=eq.${bucket}&select=public`, ownerToken, { profile: 'storage' }), 200, [{ public: false }]);
    const publicBucket = await raw('buckets?id=eq.puyi-images&select=public', null, { profile: 'storage' });
    expect(publicBucket, 200, [{ public: true }]);
    expect(await publish(ownerToken, 1, null, 1), 204);
  });

  await test('private islands: published block, question and objects visible to all three readers; new draft stays hidden', async () => {
    const draft = structuredClone(fixture);
    draft.title.es = 'Borrador de laboratorio';
    draft.entries[0].audio_approved = false;
    const draftAudio = { ...assets[0], id: randomUUID(), revision: 2 };
    draft.entries[0].audio_id = draftAudio.id;
    draft.assets[0] = draftAudio;
    expect(await save(ownerToken, 1, draft), 200, 2);
    expect(await stage(ownerToken, draftAudio), 201);
    expect(await metadata(ownerToken, draftAudio), 200, [{ name: objectKey(draftAudio) }]);
    expectError(await publish(ownerToken, 2, 1, 2), 'puyi_not_ready');
    for (const id of readers) {
      const token = jwt(id);
      const catalog = await rpc('catalog', token);
      expect(catalog, 200);
      assert.equal(catalog.data[0].title.es, fixture.title.es);
      assert.equal((await readDetail(token)).data.blocks[0].phraseCount, 5);
      const response = await readBlock(token, 1);
      expect(response, 200);
      assert.deepEqual(response.data.map(entry => entry.japanese), phrases);
      assert.deepEqual(response.data.at(-1).answers, [ids[2]]);
      assert.ok(response.data.every(entry => !('original_context' in entry)));
      expect(await readBlock(token, 2), 200, null);
      expect(await raw('puyi_island_revisions?revision=eq.2', token), 200, []);
      expect(await raw('puyi_island_contexts', token), 200, []);
      expect(await raw(`puyi_islands?id=eq.${island}&select=current_revision`, token), 403);
      expect(await metadata(token, assets[0]), 200, [{ name: objectKey(assets[0]) }]);
      expect(await metadata(token, draftAudio), 200, []);
      expect(await raw(`puyi_island_audio?id=eq.${draftAudio.id}`, token), 200, []);
    }
  });

  await test('private islands: revocation blocks the same JWT; guest, anonymous, outsider and unverified stay outside', async () => {
    const revokedToken = jwt(revoked);
    expect(await rpc('access', revokedToken), 200, 'reader');
    assert.equal((await readBlock(revokedToken, 1)).data.length, phrases.length);
    await client.query('update public.puyi_island_members set revoked_at=now() where user_id=$1', [revoked]);
    expect(await readBlock(null, 1), 401);
    expect(await rpc('access', null), 401);
    expect(await metadata(null, assets[0]), 200, []);
    for (const token of [revokedToken, jwt(outsider), jwt(publicDeckAdmin), jwt(unverified), jwt(anonymous, { is_anonymous: true })]) {
      expect(await rpc('access', token), 200, null);
      expect(await rpc('catalog', token), 200, []);
      expect(await readDetail(token), 200, null);
      expect(await readBlock(token, 1), 200, null);
      expect(await raw(`puyi_island_audio?id=eq.${assets[0].id}`, token), 200, []);
      expect(await metadata(token, assets[0]), 200, []);
      expect(await stage(token, assets[0]), 403);
      expect(await publish(token, 2, 1, 1), 403);
    }
  });

  await test('private islands: hashes and relationships reject the whole revision on error', async () => {
    const changed = structuredClone(fixture);
    changed.assets[0].sha256 = 'c'.repeat(64);
    expectError(await save(ownerToken, 2, changed), 'puyi_audio_conflict');
    const broken = structuredClone(fixture);
    broken.answers[0].phrase_id = randomUUID();
    expect(await save(ownerToken, 2, broken), 409);
    expect(await state(ownerToken), 200, { current: 2, published: 1 });
  });

  await test('private islands: overlapping HTTP edits admit one winner; rollback and unpublish recheck readers', async () => {
    const results = [];
    await client.query('begin');
    try {
      await client.query('select id from public.puyi_islands where id=$1 for update', [island]);
      for (const label of ['Edición A', 'Edición B']) {
        const edited = structuredClone(fixture);
        edited.title.es = label;
        results.push(save(ownerToken, 2, edited));
        results.at(-1).catch(() => {});
      }
      await ready(async () => {
        await client.query('select pg_stat_clear_snapshot()');
        const { rows } = await client.query(`select count(*)::int as count from pg_stat_activity
          where pid <> pg_backend_pid() and query like '%puyi_island_save%' and cardinality(pg_blocking_pids(pid)) > 0`);
        return rows[0].count === 2;
      });
    } finally {
      await client.query('rollback');
    }
    const edits = await Promise.all(results);
    expect(edits.find(result => result.status === 200), 200, 3);
    expectError(edits.find(result => result.status !== 200), 'puyi_conflict');
    expectError(await publish(ownerToken, 2, 1, 3), 'puyi_conflict');
    expect(await publish(ownerToken, 3, 1, 3), 204);
    const token = jwt(readers[0]);
    assert.equal((await readDetail(token)).data.revision, 3);
    expect(await publish(ownerToken, 3, 3, 1), 204);
    assert.equal((await readDetail(token)).data.revision, 1);
    expect(await readBlock(token, 3), 200, null);
    expect(await publish(ownerToken, 3, 1, null), 204);
    expect(await readBlock(token, 1), 200, null);
    expect(await metadata(token, assets[0]), 200, []);
  });
}
