import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { once } from 'node:events';
import { test } from 'node:test';
import { editorialIssues, parsePuyiDraft, readPuyiDraft } from '../../src/app/features/puyi-editor/puyi-draft-contract.ts';
import { DraftStore, synthesisFingerprint } from './store.mjs';
import { editorServer } from './server.mjs';

const sample = () => JSON.parse(readFileSync(new URL('./example.json', import.meta.url), 'utf8'));
const store = () => new DraftStore(mkdtempSync(path.join(os.tmpdir(), 'puyi-p6-test-')));
const code = expected => error => error.message === expected;

test('invalid JSON, versions and shapes give actionable errors; Unicode and one block round-trip', () => {
  assert.equal(parsePuyiDraft('{').issues[0].code, 'json');
  assert.equal(readPuyiDraft({ schemaVersion: 2 }).issues[0].code, 'schema');
  assert.equal(readPuyiDraft({ ...sample(), blocks: {} }).issues[0].code, 'shape');
  const { document } = parsePuyiDraft('\uFEFF' + JSON.stringify(sample()));
  assert(document);
  assert.equal(document.blocks[0].phrases[0].japanese, '公園を散歩する。');
  assert.deepEqual(parsePuyiDraft(JSON.stringify(document)).document, document);
  assert.equal(editorialIssues(document).length, 0);
});

test('accepts a variable number of blocks, entries and links to answers in another block of the same island', () => {
  const value = sample();
  for (let index = 0; index < 9; index++) {
    value.blocks.push({
      id: randomUUID(), name: { es: 'Bloque ' + index },
      phrases: Array.from({ length: index }, () => ({ id: randomUUID() })),
    });
  }
  value.blocks[0].prompts[0].answerPhraseIds.push(value.blocks[9].phrases[0].id);
  const { document } = readPuyiDraft(value);
  assert.equal(document.blocks.length, 10);
  assert.equal(document.blocks[9].phrases.length, 8);
  assert.equal(document.blocks[0].prompts[0].answerPhraseIds.length, 2);
  assert(editorialIssues(document).length > 0);
});

test('rejects duplicate block/phrase IDs, invalid answer links and audio from another phrase', () => {
  const value = sample();
  value.blocks.push({ id: value.blocks[0].id, phrases: [{ id: value.blocks[0].phrases[0].id }] });
  value.blocks[0].prompts[0].answerPhraseIds.push(randomUUID());
  const first = value.blocks[0].phrases[0];
  first.audio = { assetId: randomUUID(), itemId: value.blocks[0].phrases[1].id, revision: 1,
    sha256: 'a'.repeat(64), synthesisFingerprint: synthesisFingerprint(first), status: 'approved' };
  const result = readPuyiDraft(value);
  assert.equal(result.document, null);
  assert.equal(result.issues.filter(issue => issue.code === 'duplicateId').length, 2);
  assert(result.issues.some(issue => issue.code === 'relation'));
  assert(result.issues.some(issue => issue.code === 'audio'));
});

test('import stays a proposal, accepts incomplete drafts and cannot prepare audio until explicit approval', () => {
  const value = sample();
  const first = value.blocks[0].phrases[0];
  first.status = 'approved';
  first.reading = '';
  const db = store();
  const draft = db.save(value, 0);
  assert.equal(draft.document.blocks[0].phrases[0].status, 'proposed');
  assert.throws(() => db.prepareAudio(draft.document.island.id, first.id, 1), code('approval'));
  assert.throws(() => db.save(draft.document, 1, 'approved'), code('editorial'));
  assert.deepEqual(db.history(draft.document.island.id), [1]);
});

test('protects imports, stable IDs, compare-and-swap, and restoration from snapshots', () => {
  const value = sample();
  const db = store();
  const original = db.save(value, 0);
  const id = original.document.island.id;
  assert.throws(() => db.save(value, 0), code('duplicateIsland'));
  const duplicate = structuredClone(value);
  duplicate.island.id = randomUUID();
  assert.throws(() => db.save(duplicate, 0), code('duplicateIsland'));
  duplicate.island.title.es = 'Prueba distinta';
  assert.throws(() => db.save(duplicate, 0), code('duplicateId'));
  const edit = structuredClone(original.document);
  edit.blocks[0].phrases.reverse();
  edit.blocks[0].phrases[1].natural.es = 'Otra traducción.';
  const updated = db.save(edit, 1);
  assert.equal(updated.document.blocks[0].phrases[1].id, original.document.blocks[0].phrases[0].id);
  assert.equal(updated.document.blocks[0].phrases[1].revision, 2);
  assert.throws(() => db.save(edit, 1), code('conflict'));
  assert.deepEqual(db.get(id, 1), original);
  const restored = db.restore(id, 1, 2);
  assert.equal(restored.revision, 3);
  assert.deepEqual(restored.document.blocks[0].phrases.map(item => item.id), original.document.blocks[0].phrases.map(item => item.id));
  assert.deepEqual(db.history(id), [3, 2, 1]);
  assert.deepEqual(readPuyiDraft(restored.document).document.island, original.document.island);
  const removed = structuredClone(restored.document);
  const previousEntry = removed.blocks[0].phrases.shift();
  removed.blocks[0].prompts[0].answerPhraseIds = [];
  db.save(removed, 3);
  const recovered = db.restore(id, 1, 4);
  assert(recovered.document.blocks[0].phrases[0].revision > previousEntry.revision);
});

test('audio is tied to text/reading and item; approval in JSON is untrusted', () => {
  const db = store();
  const pending = db.save(sample(), 0);
  const approved = db.save(pending.document, 1, 'approved');
  const item = approved.document.blocks[0].phrases[0];
  const id = approved.document.island.id;
  const job = db.prepareAudio(id, item.id, 2);
  assert.equal(db.prepareAudio(id, item.id, 2).job, job.job);
  const payload = JSON.parse(readFileSync(job.job, 'utf8'));
  assert.equal(payload.synthesis.engineVersion, '1.2.0');
  assert.equal(payload.synthesis.voice, 'aida-shigeru-normal');
  assert.equal(payload.phrase.id, item.id);
  assert.throws(() => db.registerAudio(job.job)); // No generated media exists.

  // Emulate a previously verified local receipt; this never creates or approves media in the actual authoring area.
  item.audio = { assetId: randomUUID(), itemId: item.id, revision: 1, sha256: 'a'.repeat(64),
    synthesisFingerprint: synthesisFingerprint(item), status: 'approved' };
  assert.equal(readPuyiDraft(approved.document).document.blocks[0].phrases[0].audio.status, 'unverified');
  const trusted = db.append(approved.document, 2);
  const reference = trusted.document.blocks[0].phrases[0].audio;
  const edit = structuredClone(trusted.document);
  edit.blocks[0].phrases[0].natural.es = 'Traducción revisada.';
  const translation = db.save(edit, 3);
  assert.deepEqual(translation.document.blocks[0].phrases[0].audio, reference);
  translation.document.blocks[0].phrases[0].reading += '。';
  const spoken = db.save(translation.document, 4);
  assert.equal(spoken.document.blocks[0].phrases[0].audio.status, 'stale');
  assert.equal(db.get(id, 3).document.blocks[0].phrases[0].audio.status, 'approved');
  const reassign = spoken.document;
  reassign.blocks[0].phrases[0].audio = null;
  reassign.blocks[0].phrases[1].audio = { ...reference, itemId: reassign.blocks[0].phrases[1].id };
  assert.throws(() => db.save(reassign, 5), code('audio'));
});

test('server rejects cross-origin writes and serves only explicit assets and local APIs', async t => {
  const db = store();
  const server = editorServer({ store: db });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => server.close());
  const url = 'http://127.0.0.1:' + server.address().port;
  const headers = { 'Content-Type': 'application/json', Origin: url };
  const body = JSON.stringify({ document: sample(), expected: 0 });
  assert.equal((await fetch(url + '/api/save', { method: 'POST', headers: { ...headers, Origin: 'https://example.org' }, body })).status, 403);
  assert.equal(db.list().length, 0);
  assert.equal((await fetch(url + '/api/check', { method: 'POST', headers, body })).status, 200);
  assert.equal(db.list().length, 0);
  assert.equal((await fetch(url + '/api/save', { method: 'POST', headers, body })).status, 200);
  assert.equal((await fetch(url + '/api/check', { method: 'POST', headers, body })).status, 409);
  const list = await fetch(url + '/api/drafts');
  assert.equal(list.headers.get('cache-control'), 'no-store');
  assert.equal((await list.json()).length, 1);
  assert.equal((await fetch(url + '/.phrase-islands-authoring/puyi/')).status, 404);
  assert.equal((await fetch(url + '/audio/phrase-islands/v1/fixture.mp3')).status, 404);
});
