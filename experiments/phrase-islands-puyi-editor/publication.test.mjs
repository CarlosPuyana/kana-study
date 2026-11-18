import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { randomUUID, createHash } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { preparePublication, verifyPublication } from './publication.mjs';
import { publishIsland, verifyIsland } from './publish-grappling.mjs';
import { synthesisFingerprint } from './store.mjs';
import { draftEntries } from '../../src/app/features/puyi-editor/puyi-draft-contract.ts';

const fixture = () => JSON.parse(readFileSync(new URL('./example.json', import.meta.url), 'utf8'));
const scratch = () => mkdtempSync(path.join(os.tmpdir(), 'puyi-publication-fixture-'));

test('a proposal fails before creating any packet', () => {
  const root = scratch();
  assert.throws(() => preparePublication(fixture(), () => { throw new Error('Unexpected audio access'); }, root), /pending explicit approval/);
  assert.deepEqual(readdirSync(root), []);
});

test('a fictional approved fixture forms a verified private packet and detects changed bytes', () => {
  const root = scratch();
  const draft = fixture();
  const file = 'public/audio/phrase-islands/v1/' + readdirSync('public/audio/phrase-islands/v1').find(
    name => name.startsWith('pi-everyday-001') && name.endsWith('.mp3'));
  const data = readFileSync(file);
  const hash = createHash('sha256').update(data).digest('hex');
  for (const entry of draftEntries(draft)) {
    entry.status = 'approved';
    entry.audio = { assetId: randomUUID(), itemId: entry.id, revision: 1, sha256: hash,
      synthesisFingerprint: synthesisFingerprint(entry), status: 'approved' };
  }
  const packet = preparePublication(draft, () => ({ file, hash, duration: 1, revision: 1, bytes: data.length }), root);
  const id = path.basename(packet);
  const manifest = verifyPublication(id, root);
  assert.equal(manifest.audio.length, 3);
  const payload = JSON.parse(readFileSync(path.join(packet, 'payload.json'), 'utf8'));
  assert.equal(payload.entries.filter(entry => entry.kind === 'phrase').length, 2);
  assert.equal(payload.answers[0].phrase_id, draft.blocks[0].phrases[0].id);
  writeFileSync(path.join(packet, 'media', manifest.audio[0].key), 'tampered fixture');
  assert.throws(() => verifyPublication(id, root));
});

test('the authenticated publisher resumes an interrupted upload, verifies the release and repeats without writes', async () => {
  const data = Buffer.from('bytes from a synthetic clip');
  const sha256 = createHash('sha256').update(data).digest('hex');
  const island = randomUUID(), block = randomUUID(), entry = randomUUID(), id = randomUUID();
  const asset = { id, revision: 1, sha256, bytes: data.length };
  const key = `${island}/${id}/r1-${sha256}.mp3`;
  const document = {
    title_ja: '例', title: { es: 'Muestra' }, description: {}, blocks: [{ id: block }], assets: [asset],
    entries: [{ id: entry, block_id: block, kind: 'phrase', japanese: 'きく。', audio_id: id }], answers: [],
  };
  const manifest = { island, bucket: 'puyi-islands-private', audio: [{ key, sha256, bytes: data.length }] };
  const rows = {
    puyi_island_revisions: [document], puyi_island_blocks: document.blocks, puyi_island_entries: document.entries,
    puyi_island_answers: [], puyi_island_audio: [asset],
  };
  const ok = data => ({ data, error: null });
  const writes = [];
  let stage = null, object = null, rejectUpload = true;
  const client = {
    rpc(name, params) {
      switch (name) {
        case 'puyi_island_access': return ok('owner');
        case 'puyi_island_editor_state': return ok(stage);
        case 'puyi_island_save':
          assert.equal(params.p_expected, 0);
          writes.push('save');
          stage = { current: 1, published: null };
          return ok(1);
        case 'puyi_island_publish':
          assert.deepEqual(params, { p_island: island, p_expected: 1, p_expected_published: null, p_revision: 1 });
          assert(object);
          writes.push('publish');
          stage.published = 1;
          return ok(null);
        case 'puyi_island_catalog': return ok([{ id: island, revision: stage.published }]);
        case 'puyi_island_detail': return ok({ revision: stage.published, blocks: document.blocks });
        case 'puyi_island_block': return ok([{ id: entry, japanese: 'きく。', kind: 'phrase', audioKey: key, audioBytes: data.length, answers: [] }]);
        default: assert.fail(`Unexpected RPC ${name}`);
      }
    },
    from(name) {
      return {
        select() { return this; }, eq() { return this; }, in() { return this; },
        maybeSingle: () => ok(rows[name][0]), then: resolve => resolve(ok(rows[name])),
      };
    },
    storage: { from(bucket) {
      assert.equal(bucket, manifest.bucket);
      return {
        download(actualKey) {
          assert.equal(actualKey, key);
          return object ? ok(object) : { error: { status: 404 } };
        },
        upload(actualKey, buffer, options) {
          assert.equal(actualKey, key);
          assert.equal(options.upsert, false);
          assert.equal(options.contentType, 'audio/mpeg');
          writes.push('upload');
          if (rejectUpload) return { error: { status: 503 } };
          object = new Blob([buffer], { type: options.contentType });
          return ok(null);
        },
      };
    } },
  };
  const run = candidate => publishIsland(client, manifest, candidate, () => data);

  await assert.rejects(() => run(document), /subir el MP3/);
  assert.deepEqual(stage, { current: 1, published: null });
  await assert.rejects(() => run({ ...document, title_ja: '別' }), /revisión distinta/);
  rejectUpload = false;
  assert.equal(await run(document), 1);
  assert.equal(await verifyIsland(client, manifest, document, 1), 1);
  assert.equal(await run(document), 1);
  assert.deepEqual(writes, ['save', 'upload', 'upload', 'publish']);

  object = new Blob([Buffer.alloc(data.length)]);
  await assert.rejects(() => run(document), /SHA-256/);
  assert.deepEqual(writes, ['save', 'upload', 'upload', 'publish']);
});
