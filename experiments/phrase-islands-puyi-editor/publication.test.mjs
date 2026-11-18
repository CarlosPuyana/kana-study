import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { randomUUID, createHash } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { preparePublication, verifyPublication } from './publication.mjs';
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
