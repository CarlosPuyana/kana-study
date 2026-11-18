import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { readJson, REPO, safePath, sha, fingerprint } from '../../scripts/phrase-islands-admin-lib.mjs';
import { draftEntries, editorialIssues, readPuyiDraft, validDraftId } from '../../src/app/features/puyi-editor/puyi-draft-contract.ts';
import { DraftStore, draftRoot, synthesisFingerprint } from './store.mjs';
import { getAudio, getDecision, validateAttempt } from '../phrase-islands-puyi-review/audio.mjs';
import { loadReview } from '../phrase-islands-puyi-review/review.mjs';

const releaseRoot = path.join(REPO, '.phrase-islands-authoring', 'puyi', 'releases-p71');
const model = 'aida-shigeru-normal';
const bucket = 'puyi-islands-private';
const hashPattern = /^[0-9a-f]{64}$/;
const bytes = filename => {
  assert(fs.statSync(filename).isFile(), 'Expected a regular file');
  return fs.readFileSync(filename);
};
const objectKey = (island, asset) => `${island}/${asset.id}/r${asset.revision}-${asset.sha256}.mp3`;
const putJson = (filename, value) => fs.writeFileSync(filename, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });

function contentFromP2(review) {
  const { approved, clips } = getAudio(review);
  assert(approved, 'The exact P2 review lacks explicit text approval');
  function item(entry) {
    const clip = clips.get(entry.id);
    assert(clip && getDecision(review, entry.id, clip)?.decision === 'accepted', 'A P2 clip is pending listening approval');
    const value = fingerprint([review.proposal.island.id, entry.id, clip.revision, clip.hash]);
    const assetId = `${value.slice(0, 8)}-${value.slice(8, 12)}-8${value.slice(13, 16)}-8${value.slice(17, 20)}-${value.slice(20, 32)}`;
    return {
      ...entry, natural: entry.natural ?? entry.translation, context: entry.original?.context ?? '',
      status: 'approved', revision: Number(entry.contentRevision ?? entry.revision),
      audio: { assetId, itemId: entry.id, revision: Number(clip.revision), sha256: clip.hash,
        synthesisFingerprint: synthesisFingerprint(entry), status: 'approved' },
    };
  }
  const { island, blocks } = review.proposal;
  return {
    document: { schemaVersion: 1, island,
      blocks: blocks.map(block => ({ ...block, phrases: block.phrases.map(item), prompts: block.prompts.map(item) })) },
    findClip: entry => clips.get(entry.id),
  };
}

function p6Clip(island, entry) {
  const audio = entry.audio;
  const folder = safePath(draftRoot, `audio-jobs/${island}/${entry.id}/r${audio.revision}.${audio.assetId}`);
  for (const file of ['job.json', 'result.json', 'original.wav', 'query.json', 'audio.mp3', 'ACML-1.0.md']) safePath(folder, file);
  const job = readJson(safePath(folder, 'job.json'));
  assert(job.phrase.id === entry.id && job.phrase.japanese === entry.japanese && job.phrase.reading === entry.reading);
  assert.equal(job.synthesisFingerprint, synthesisFingerprint(entry));
  return validateAttempt(folder, entry, { id: entry.id, contentRevision: entry.revision });
}

/** Returns an offline packet. The caller must supply media from the checked, local authoring records. */
export function preparePublication(raw, findClip, root = releaseRoot) {
  const { document } = readPuyiDraft(raw, true);
  assert(document && editorialIssues(document).length === 0 && document.island.titleJa.trim(), 'The text is incomplete');
  const island = document.island.id;
  const media = new Map();
  const assets = draftEntries(document).map(entry => {
    const audio = entry.audio;
    assert(entry.status === 'approved' && audio?.status === 'approved', 'Text or audio is pending explicit approval');
    assert.equal(audio.synthesisFingerprint, synthesisFingerprint(entry), 'The audio is for a different reading');
    const clip = findClip(entry);
    assert(clip && Number(clip.revision) === audio.revision && clip.hash === audio.sha256 &&
      Number.isFinite(clip.duration) && clip.duration > 0 && clip.duration <= 120, 'The media reference has changed');
    const content = bytes(clip.file);
    assert(content.length === clip.bytes && content.length <= 2097152 && sha(content) === audio.sha256);
    const asset = {
      id: audio.assetId, entry_id: entry.id, revision: audio.revision, sha256: audio.sha256,
      fingerprint: audio.synthesisFingerprint, japanese: entry.japanese, reading: entry.reading,
      bytes: clip.bytes, duration_seconds: clip.duration,
    };
    media.set(objectKey(island, asset), content);
    return asset;
  });
  const payload = {
    schemaVersion: 1, title_ja: document.island.titleJa, title: document.island.title, description: document.island.description,
    blocks: document.blocks.map((block, index) => ({ id: block.id, position: index + 1, name: block.name })),
    entries: document.blocks.flatMap(block => [block.phrases, block.prompts].flatMap((entries, kind) =>
      entries.map((entry, index) => ({
        id: entry.id, block_id: block.id, position: index + 1, kind: kind ? 'question' : 'phrase',
        japanese: entry.japanese, reading: entry.reading, segments: entry.segments, translation: entry.natural,
        structural: entry.structural, explanation: entry.explanation, vocabulary: entry.vocabulary, register: entry.register,
        text_approved: true, audio_approved: true, audio_id: entry.audio.assetId,
        original_context: entry.context, editorial_note: entry.editorialNote,
      })))),
    answers: document.blocks.flatMap(block => block.prompts.flatMap(question =>
      question.answerPhraseIds.map((phrase, index) => ({ question_id: question.id, phrase_id: phrase, position: index + 1 })))),
    assets,
  };
  const releaseId = randomUUID();
  const folder = safePath(root, releaseId);
  fs.mkdirSync(folder, { recursive: true });
  for (const [key, content] of media) {
    const destination = safePath(folder, 'media/' + key);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, content, { flag: 'wx' });
  }
  const payloadFile = safePath(folder, 'payload.json');
  putJson(payloadFile, payload);
  putJson(safePath(folder, 'manifest.json'), {
    schemaVersion: 1, releaseId, island, bucket, voice: model, engineVersion: '1.2.0',
    payloadSha256: sha(bytes(payloadFile)),
    audio: assets.map(asset => ({ key: objectKey(island, asset), sha256: asset.sha256, bytes: asset.bytes })),
  });
  verifyPublication(releaseId, root);
  return folder;
}

export function verifyPublication(id, root = releaseRoot) {
  assert(validDraftId(id), 'Invalid packet ID');
  const folder = safePath(root, id);
  const manifest = readJson(safePath(folder, 'manifest.json'));
  const payloadFile = safePath(folder, 'payload.json');
  assert(manifest.schemaVersion === 1 && manifest.releaseId === id && validDraftId(manifest.island) &&
    manifest.bucket === bucket && manifest.voice === model && manifest.engineVersion === '1.2.0');
  assert.equal(manifest.payloadSha256, sha(bytes(payloadFile)));
  const payload = readJson(payloadFile);
  assert.deepEqual(manifest.audio, payload.assets.map(asset => ({
    key: objectKey(manifest.island, asset), sha256: asset.sha256, bytes: asset.bytes,
  })));
  for (const audio of manifest.audio) {
    assert(hashPattern.test(audio.sha256));
    const content = bytes(safePath(folder, 'media/' + audio.key));
    assert.equal(content.length, audio.bytes);
    assert.equal(sha(content), audio.sha256);
  }
  return manifest;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [command, id, revision] = process.argv.slice(2);
    if (command === 'verify') {
      const manifest = verifyPublication(id);
      console.log('Paquete local verificado. MP3: ' + manifest.audio.length);
    } else if (command === 'draft') {
      const { document } = new DraftStore().get(id, revision === undefined ? undefined : Number(revision));
      console.log(preparePublication(document, entry => p6Clip(id, entry)));
    } else if (command === 'review') {
      const { document, findClip } = contentFromP2(loadReview(id, revision));
      console.log(preparePublication(document, findClip));
    } else {
      throw new Error('Choose draft, review or verify');
    }
  } catch {
    // Do not print private text, approval contents, or absolute media paths on failure.
    console.error('Paquete rechazado. Revisa las aprobaciones, la versión y los archivos locales.');
    process.exitCode = 1;
  }
}
