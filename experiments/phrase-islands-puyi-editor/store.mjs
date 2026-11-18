import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { readJson, REPO, safePath, sha, fingerprint } from '../../scripts/phrase-islands-admin-lib.mjs';
import { DEFAULT_PHRASE_SYNTHESIS } from '../../src/app/core/models/phrase-admin-contract.ts';
import { DRAFT_BYTES, draftEntries, draftIds, editorialIssues, readPuyiDraft, validDraftId } from '../../src/app/features/puyi-editor/puyi-draft-contract.ts';
import { validateAttempt } from '../phrase-islands-puyi-review/audio.mjs';

export const draftRoot = path.join(REPO, '.phrase-islands-authoring', 'puyi', 'drafts-p6');
export const synthesisFingerprint = entry => sha(JSON.stringify({
  japanese: entry.japanese, reading: entry.reading, synthesis: DEFAULT_PHRASE_SYNTHESIS,
}));

export class DraftError extends Error {
  constructor(code, status = 400, issues = []) {
    super(code);
    this.status = status;
    this.issues = issues;
  }
}

function immutableJson(file, value, max = DRAFT_BYTES) {
  const bytes = Buffer.from(JSON.stringify(value) + '\n');
  if (bytes.length > max) throw new DraftError('size', 413);
  const temp = file + '.' + randomUUID() + '.tmp';
  const fd = fs.openSync(temp, 'wx');
  try {
    try {
      fs.writeFileSync(fd, bytes);
      fs.fsyncSync(fd);
    } finally {
      fs.closeSync(fd);
    }
    // NTFS hard link makes a complete revision visible without replacing an existing one.
    fs.linkSync(temp, file);
  } finally {
    fs.unlinkSync(temp);
  }
}

function checked(value, local = false) {
  const { document, issues } = readPuyiDraft(value, local);
  if (!document) throw new DraftError('invalid', 400, issues);
  return document;
}

function entryContent(entry) {
  const { revision, status, audio, ...content } = entry;
  return fingerprint(content);
}

function titleKey(title) {
  return title.trim().replace(/\s+/gu, ' ').toLocaleLowerCase('es');
}

export class DraftStore {
  constructor(root = draftRoot) {
    this.root = root;
    fs.mkdirSync(safePath(root, 'islands'), { recursive: true });
  }

  folder(id) {
    if (!validDraftId(id)) throw new DraftError('id');
    return safePath(this.root, 'islands/' + id);
  }

  history(id) {
    const folder = this.folder(id);
    if (!fs.existsSync(folder)) return [];
    return fs.readdirSync(folder)
      .filter(name => /^[1-9]\d*\.json$/.test(name))
      .map(name => Number(name.slice(0, -5))).sort((a, b) => b - a);
  }

  get(id, revision = this.history(id)[0]) {
    if (!Number.isSafeInteger(revision) || revision < 1) throw new DraftError('missing', 404);
    const file = safePath(this.folder(id), revision + '.json');
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) throw new DraftError('missing', 404);
    const raw = readJson(file);
    const document = checked(raw.document, true);
    if (raw.revision !== revision || document.island.id !== id) throw new DraftError('integrity', 409);
    return { revision, savedAt: raw.savedAt, document };
  }

  latest() {
    return fs.readdirSync(safePath(this.root, 'islands'), { withFileTypes: true })
      .filter(entry => entry.isDirectory() && validDraftId(entry.name) && this.history(entry.name).length)
      .map(entry => this.get(entry.name));
  }

  list() {
    return this.latest().map(({ revision, document }) => ({
      id: document.island.id, title: document.island.title, titleJa: document.island.titleJa, revision,
      approved: !editorialIssues(document).length && draftEntries(document).every(entry => entry.status === 'approved'),
    }));
  }

  entryRevisions(id) {
    const revisions = new Map();
    for (const version of this.history(id)) {
      for (const entry of draftEntries(this.get(id, version).document)) {
        revisions.set(entry.id, Math.max(revisions.get(entry.id) ?? 0, entry.revision));
      }
    }
    return revisions;
  }

  save(value, expected, review = null) {
    const document = checked(value);
    if (!Number.isSafeInteger(expected) || expected < 0) throw new DraftError('revision');
    if (review !== null && review !== 'reviewed' && review !== 'approved') throw new DraftError('choice');
    const id = document.island.id;
    const previousNumber = this.history(id)[0] ?? 0;
    if (previousNumber !== expected) throw new DraftError(expected === 0 ? 'duplicateIsland' : 'conflict', 409);
    const previous = previousNumber ? this.get(id, previousNumber).document : null;
    if (review) {
      const issues = editorialIssues(document);
      if (issues.length) throw new DraftError('editorial', 400, issues);
    }
    this.checkCollisions(document);
    const oldById = new Map(previous ? draftEntries(previous).map(entry => [entry.id, entry]) : []);
    const revisions = this.entryRevisions(id);
    for (const entry of draftEntries(document)) {
      const old = oldById.get(entry.id);
      const same = old && entryContent(entry) === entryContent(old);
      entry.revision = same ? old.revision : (revisions.get(entry.id) ?? 0) + 1;
      entry.status = review ?? (same ? old.status : old ? 'pending' : entry.status);
      if (old?.audio && old.audio.status !== 'unverified') {
        entry.audio = { ...old.audio };
        if (synthesisFingerprint(entry) !== entry.audio.synthesisFingerprint) entry.audio.status = 'stale';
      } else if (entry.audio && synthesisFingerprint(entry) !== entry.audio.synthesisFingerprint) {
        entry.audio.status = 'stale';
      }
    }
    return this.append(document, expected);
  }

  restore(id, revision, expected) {
    if (this.history(id)[0] !== expected) throw new DraftError('conflict', 409);
    const { document } = this.get(id, revision);
    this.checkCollisions(document);
    const latest = this.entryRevisions(id);
    for (const entry of draftEntries(document)) {
      entry.revision = Math.max(entry.revision, latest.get(entry.id) ?? 0) + 1;
      // Restoration recovers the saved text and audio references. Confirm the restored text before synthesis.
      if (entry.status === 'approved') entry.status = 'reviewed';
    }
    return this.append(document, expected);
  }

  checkCollisions(document) {
    const ids = new Set(draftIds(document));
    const refs = new Map(draftEntries(document).flatMap(entry => entry.audio ? [[entry.audio.assetId, entry.id]] : []));
    const title = titleKey(document.island.title.es || document.island.titleJa);
    for (const { document: other } of this.latest()) {
      const same = other.island.id === document.island.id;
      if (!same && title && title === titleKey(other.island.title.es || other.island.titleJa)) throw new DraftError('duplicateIsland', 409);
      for (const revision of this.history(other.island.id)) {
        const historic = this.get(other.island.id, revision).document;
        if (!same && draftIds(historic).some(id => ids.has(id))) throw new DraftError('duplicateId', 409);
        if (draftEntries(historic).some(entry => entry.audio && refs.has(entry.audio.assetId) &&
          (!same || refs.get(entry.audio.assetId) !== entry.id))) throw new DraftError('audio', 409);
      }
    }
  }

  append(document, expected) {
    const folder = this.folder(document.island.id);
    fs.mkdirSync(folder, { recursive: true });
    const snapshot = { revision: expected + 1, savedAt: new Date().toISOString(), document };
    try {
      immutableJson(safePath(folder, snapshot.revision + '.json'), snapshot);
    } catch (error) {
      if (error.code === 'EEXIST') throw new DraftError('conflict', 409);
      throw error;
    }
    return snapshot;
  }

  prepareAudio(id, itemId, expected) {
    const snapshot = this.get(id);
    if (snapshot.revision !== expected) throw new DraftError('conflict', 409);
    const item = draftEntries(snapshot.document).find(entry => entry.id === itemId);
    if (!item || item.status !== 'approved') throw new DraftError('approval');
    const issues = editorialIssues(snapshot.document);
    if (issues.length) throw new DraftError('editorial', 400, issues);
    const digest = synthesisFingerprint(item);
    if (item.audio?.synthesisFingerprint === digest && ['generated', 'approved'].includes(item.audio.status)) {
      throw new DraftError('audioExists', 409);
    }
    const jobs = safePath(this.root, `audio-jobs/${id}/${item.id}`);
    let latest = item.audio?.revision ?? 0;
    if (fs.existsSync(jobs)) {
      for (const name of fs.readdirSync(jobs)) {
        const match = /^r(\d+)\.([0-9a-f-]+)$/.exec(name);
        if (!match || !validDraftId(match[2])) continue;
        latest = Math.max(latest, Number(match[1]));
        const job = safePath(jobs, name + '/job.json');
        if (fs.existsSync(job) && readJson(job).synthesisFingerprint === digest) {
          return { job, revision: Number(match[1]), synthesisFingerprint: digest };
        }
      }
    }
    const revision = latest + 1;
    const folder = safePath(jobs, `r${revision}.${randomUUID()}`);
    fs.mkdirSync(folder, { recursive: true });
    const job = safePath(folder, 'job.json');
    immutableJson(job, {
      phrase: { id: item.id, japanese: item.japanese, reading: item.reading },
      synthesis: DEFAULT_PHRASE_SYNTHESIS, synthesisFingerprint: digest, revision: String(revision), outputDir: folder, ffmpeg: 'ffmpeg',
    });
    return { job, revision, synthesisFingerprint: digest };
  }

  registerAudio(jobPath, approvedSha) {
    const relative = path.relative(this.root, path.resolve(jobPath)).split(path.sep).join('/');
    const match = /^audio-jobs\/([^/]+)\/([^/]+)\/r([1-9]\d*)\.([^/]+)\/job\.json$/.exec(relative);
    if (!match || ![match[1], match[2], match[4]].every(validDraftId)) throw new DraftError('audio');
    const [, id, itemId, revision, assetId] = match;
    const current = this.get(id);
    const item = draftEntries(current.document).find(entry => entry.id === itemId);
    if (!item || item.status !== 'approved') throw new DraftError('approval');
    const file = safePath(this.root, relative);
    const job = readJson(file);
    const digest = synthesisFingerprint(item);
    if (job.phrase.id !== itemId || job.synthesisFingerprint !== digest ||
        job.phrase.japanese !== item.japanese || job.phrase.reading !== item.reading || job.revision !== revision ||
        fingerprint(job.synthesis) !== fingerprint(DEFAULT_PHRASE_SYNTHESIS)) throw new DraftError('audio');
    const folder = path.dirname(file);
    for (const name of ['result.json', 'audio.mp3', 'original.wav', 'query.json', 'ACML-1.0.md']) safePath(folder, name);
    const clip = validateAttempt(folder, item, { id: itemId, contentRevision: item.revision });
    if (approvedSha && (approvedSha !== clip.hash || item.audio?.assetId !== assetId ||
        item.audio.sha256 !== clip.hash || !['generated', 'approved'].includes(item.audio.status))) throw new DraftError('audio');
    if (item.audio?.status === 'approved' && item.audio.assetId === assetId && item.audio.sha256 === clip.hash) return current;
    item.audio = { assetId, itemId, revision: Number(revision), sha256: clip.hash, synthesisFingerprint: digest,
      status: approvedSha ? 'approved' : 'generated' };
    this.checkCollisions(current.document);
    return this.append(current.document, current.revision);
  }
}
