import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { closeSync, existsSync, lstatSync, mkdirSync, openSync, readFileSync, readdirSync, realpathSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadReview, root } from './review.mjs';

const i2 = path.join(root, '.cache/phrase-islands-i2');
const privateAudio = path.join(root, '.phrase-islands-authoring/puyi/audio');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const fileHash = file => hash(readFileSync(file));
const json = file => JSON.parse(readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
const save = (file, value) => writeFileSync(file, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });
const modelSha256 = '6dabe29de5ec2c1715e12a430805e1bff6ec64a315cccec2d26fad029df83243';
const licenseSha256 = '72ac22ef56c20f9d9ca8467ca9bdcc5e06e5fba5270812a9ff1494b00ae6d02a';
const synthesis = { engineVersion: '1.2.0', voice: 'aida-shigeru-normal', modelSha256,
  speedScale: 1, intonationScale: 1, tempoDynamicsScale: 1, pitchScale: 0 };

function privatePath(directory) {
  assert.equal(path.relative(directory, realpathSync(directory)), '', 'Linked private path refused');
  return directory;
}

function revisionSet(review) {
  const entries = review.proposal.blocks.flatMap(block => [...block.phrases, ...block.prompts]);
  return {
    entries,
    directory: path.join(privateAudio, review.proposal.island.id, review.sha256),
    set: entries.map(item => ({ id: item.id, revision: item.contentRevision ?? item.revision })),
  };
}

export function isApproved(receipt, review) {
  if (!receipt || receipt.schemaVersion !== 1 || receipt.approval !== 'explicit-owner-confirmation' ||
      receipt.draftSha256 !== review.sha256 || !Number.isFinite(Date.parse(receipt.at))) return false;
  return JSON.stringify(receipt.entries) === JSON.stringify(revisionSet(review).set);
}

function recordApproval(review, expectedHash) {
  assert.equal(expectedHash, review.sha256, 'Use the hash of the proposal you explicitly approved');
  const { directory, set } = revisionSet(review);
  mkdirSync(directory, { recursive: true });
  save(path.join(privatePath(directory), 'text-approval.json'), {
    schemaVersion: 1, approval: 'explicit-owner-confirmation', draftSha256: review.sha256,
    entries: set, at: new Date().toISOString(),
  });
}

function inputFingerprint(item) {
  return hash(JSON.stringify({ japanese: item.japanese, reading: item.reading, synthesis }));
}

export function validateAttempt(folder, item, pendingCandidate) {
  const audit = json(path.join(folder, 'result.json'));
  const review = pendingCandidate ?? json(path.join(folder, 'candidate.json'));
  const { reference: ref } = audit;
  assert.equal(review.id, item.id);
  assert.equal(review.contentRevision, item.contentRevision ?? item.revision);
  assert.equal(audit.synthesisFingerprint, inputFingerprint(item));
  assert.equal(audit.expectedReading, item.reading);
  assert.equal(ref.engineVersion, synthesis.engineVersion);
  assert.equal(ref.voice, synthesis.voice);
  assert.equal(ref.modelSha256, modelSha256);
  assert.equal(audit.provenance.style.name, 'ノーマル');
  assert.equal(audit.provenance.licenseSha256, licenseSha256);
  assert.equal(fileHash(path.join(folder, 'ACML-1.0.md')), licenseSha256);
  const mp3 = path.join(folder, 'audio.mp3');
  for (const [file, digest] of [
    [mp3, ref.sha256], [path.join(folder, 'original.wav'), audit.wavSha256],
    [path.join(folder, 'query.json'), audit.querySha256],
  ]) {
    assert(lstatSync(file).isFile(), 'Media must be a regular file');
    assert.equal(fileHash(file), digest, 'Candidate checksum mismatch');
  }
  assert.equal(ref.bytes, lstatSync(mp3).size);
  assert.equal(ref.revision, path.basename(folder).split('.')[0].slice(1));
  assert.equal(ref.mime, 'audio/mpeg');
  assert.equal(ref.sampleRate, 44100);
  assert(ref.durationSeconds > 0.2 && ref.durationSeconds <= 120);
  assert(audit.metrics.decodedPeak < 1 && audit.metrics.longestFullScaleRun < 3);
  assert(audit.metrics.comparisonSnrDb > 10 && Math.abs(audit.metrics.durationDifferenceSeconds) < 0.08);
  const query = json(path.join(folder, 'query.json'));
  for (const key of ['speedScale', 'intonationScale', 'tempoDynamicsScale', 'pitchScale']) {
    assert.equal(query[key], synthesis[key]);
  }
  assert.equal(query.outputSamplingRate, 44100);
  assert.equal(query.outputStereo, false);
  assert.equal(query.prePhonemeLength, 0.1);
  assert.equal(query.postPhonemeLength, 0.1);
  return { file: mp3, hash: ref.sha256, revision: ref.revision, duration: ref.durationSeconds, bytes: ref.bytes,
    reading: audit.analyzedReading, metrics: audit.metrics, review: review.technical };
}

function attempts(directory, id) {
  const folder = path.join(directory, id);
  if (!existsSync(folder)) return [];
  return readdirSync(privatePath(folder))
    .filter(name => /^r\d+\.[0-9a-f-]+$/.test(name))
    .map(name => ({ folder: path.join(folder, name), revision: Number(name.slice(1).split('.')[0]) }))
    .sort((a, b) => b.revision - a.revision);
}

export function getAudio(review) {
  const { directory, entries } = revisionSet(review);
  const receipt = path.join(directory, 'text-approval.json');
  const approved = existsSync(receipt) && isApproved(json(path.join(privatePath(directory), 'text-approval.json')), review);
  const clips = new Map();
  if (approved) {
    for (const item of entries) {
      const latest = attempts(directory, item.id).find(attempt => existsSync(path.join(attempt.folder, 'candidate.json')));
      if (latest) clips.set(item.id, validateAttempt(privatePath(latest.folder), item));
    }
  }
  return { approved, clips };
}

function decisionDirectory(review, id) {
  return path.join(revisionSet(review).directory, id, 'decisions');
}

export function getDecision(review, id, clip) {
  const directory = decisionDirectory(review, id);
  if (!existsSync(directory)) return null;
  const decisions = readdirSync(privatePath(directory)).filter(name => /^\d{13}-[0-9a-f-]+\.json$/.test(name)).sort().reverse();
  for (const file of decisions) {
    const event = json(path.join(directory, file));
    if (event.revision === clip.revision && event.sha256 === clip.hash) return event;
  }
  return null;
}

export function recordDecision(review, id, revision, digest, decision, note) {
  const clip = getAudio(review).clips.get(id);
  if (!clip || clip.revision !== revision || clip.hash !== digest) return false;
  if (!['accepted', 'needs-correction'].includes(decision) || note.length > 500) return false;
  const directory = decisionDirectory(review, id);
  mkdirSync(directory, { recursive: true });
  save(path.join(privatePath(directory), Date.now() + '-' + randomUUID() + '.json'), {
    decision, note, revision, sha256: digest, at: new Date().toISOString(), origin: 'explicit-local-ui-action',
  });
  return true;
}

function run(command, args, capture = false) {
  const result = spawnSync(command, args, { encoding: 'utf8', stdio: capture ? 'pipe' : 'inherit',
    env: { ...process.env, HF_HUB_OFFLINE: '1', TRANSFORMERS_OFFLINE: '1' } });
  assert.equal(result.status, 0, `${command} failed`);
  return result.stdout;
}

function preflight() {
  const engine = path.join(i2, 'engines/aivis/Windows-x64/run.exe');
  const model = path.join(i2, 'downloads/aida-1.0.0.aivmx');
  assert.equal(fileHash(engine), json(path.join(i2, 'aivis-installed.json')).exeSha256);
  assert.equal(fileHash(model), modelSha256);
  assert.equal(fileHash(path.join(i2, 'licenses/ACML-1.0.md')), licenseSha256);
  run('ffmpeg', ['-version'], true);
  run('ffprobe', ['-version'], true);
  run('python', ['--version'], true);
}

function generate(review, labels, newRevision) {
  assert(getAudio(review).approved, 'Pending explicit approval of this exact text revision');
  const { directory, entries } = revisionSet(review);
  assert(labels.every(label => entries.some(item => item.sourceLabel === label)), 'Unknown entry label');
  assert(!newRevision || labels.length === 1, 'A correction must select one entry');
  preflight();
  const lock = path.join(privatePath(directory), 'generation.lock');
  const handle = openSync(lock, 'wx');
  try {
    const previous = getAudio(review).clips;
    for (const item of entries) {
      if (labels.length && !labels.includes(item.sourceLabel)) continue;
      if (previous.has(item.id) && !newRevision) {
        console.log(`${item.sourceLabel}: verified existing revision`);
        continue;
      }
      const revision = String((attempts(directory, item.id)[0]?.revision ?? 0) + 1);
      const folder = path.join(directory, item.id, `r${revision}.${randomUUID()}`);
      mkdirSync(folder, { recursive: true });
      const job = path.join(privatePath(folder), 'job.json');
      save(job, {
        phrase: { id: item.id, japanese: item.japanese, reading: item.reading }, synthesis,
        synthesisFingerprint: inputFingerprint(item), revision, outputDir: folder, ffmpeg: 'ffmpeg',
      });
      run('python', ['-X', 'utf8', path.join(root, 'scripts/phrase-islands-authoring-audio.py'), '--job', job]);
      const technical = JSON.parse(run('python', ['-X', 'utf8', fileURLToPath(new URL('./inspect-audio.py', import.meta.url)), folder], true));
      const candidate = { id: item.id, contentRevision: item.contentRevision ?? item.revision, technical };
      validateAttempt(folder, item, candidate);
      save(path.join(folder, 'candidate.json'), candidate);
      console.log(`${item.sourceLabel}: candidate r${revision}\n`);
    }
  } finally {
    closeSync(handle);
    unlinkSync(lock);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const reviewFlag = args.indexOf('--review');
  const reviewFile = reviewFlag === -1 ? 'grappling-p21.json' : args.splice(reviewFlag, 2)[1];
  assert(reviewFile, 'Expected the approved review filename');
  const command = args.shift() ?? 'status';
  const review = loadReview(reviewFile, 'grappling-draft.json');
  if (command === 'approve') recordApproval(review, args[0]);
  else if (command === 'generate') generate(review, args.filter(arg => arg !== '--new-revision'), args.includes('--new-revision'));
  else if (command === 'preflight') {
    preflight();
    console.log('Aivis executable, model, license, Python and FFmpeg verified. Engine not started.');
  } else assert(['status', 'verify'].includes(command), 'Expected status, preflight, approve, generate or verify');
  const { clips, approved } = getAudio(review);
  const { entries, directory } = revisionSet(review);
  const report = {
    draftSha256: review.sha256, approved, expected: entries.length, candidates: clips.size,
    entries: entries.map(item => {
      const clip = clips.get(item.id);
      return { label: item.sourceLabel, id: item.id, editorialReading: item.reading, pronunciationNote: item.audio.note,
        ...(clip && { ...clip, decision: getDecision(review, item.id, clip)?.decision ?? 'pending-listening' }) };
    }),
  };
  if (command === 'verify') {
    assert.equal(clips.size, entries.length, 'Expected one verified candidate per phrase or question');
    save(path.join(directory, `audio-validation-${randomUUID()}.json`), report);
  }
  console.log(JSON.stringify(report, null, 2));
}
