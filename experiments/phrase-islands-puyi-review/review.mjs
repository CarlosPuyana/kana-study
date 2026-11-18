import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, realpathSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = path.dirname(fileURLToPath(import.meta.url));
export const root = path.resolve(directory, '../..');
const privateRoot = path.join(root, '.phrase-islands-authoring/puyi');
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const kana = /^[\p{Script=Hiragana}\p{Script=Katakana}ー、。！？・]+$/u;
const kanji = /\p{Script=Han}/u;
const pending = 'editorial-proposal-awaiting-user-review';

export function readPrivate(folder, name) {
  assert(/^[a-z0-9][a-z0-9-]*\.json$/.test(name), 'Expected a private JSON filename');
  assert(['reference', 'review'].includes(folder), 'Unknown private folder');
  const expected = path.join(privateRoot, folder, name);
  const actual = realpathSync(expected);
  assert.equal(path.relative(expected, actual), '', 'Private file must be in its expected location');
  const bytes = readFileSync(actual);
  return { data: JSON.parse(bytes.toString('utf8')), sha256: createHash('sha256').update(bytes).digest('hex') };
}

function required(value, field) {
  assert(typeof value === 'string' && value.trim(), `Missing ${field}`);
}

function localized(value, field, natural = false) {
  assert.deepEqual(Object.keys(value).sort(), ['ca', 'en', 'es'], `Languages for ${field}`);
  required(value.es, field);
  for (const lang of ['en', 'ca']) {
    if (natural) required(value[lang], field);
    else assert.equal(value[lang], null, `Editorial field pending in ${lang}`);
  }
}

export function validateReview(review, baseline) {
  assert.equal(review.schemaVersion, 1);
  assert.equal(review.private, true);
  assert.equal(review.status, pending);
  assert.equal(review.editorialLanguage, 'es');
  assert.deepEqual(review.localizationStatus, {
    es: 'editorial-reference-awaiting-user-review',
    en: 'natural-translation-draft',
    ca: 'natural-translation-draft',
  });
  assert.deepEqual(review.review, {
    method: 'textual-editorial-review', userApproval: 'pending', nativeListening: 'pending',
  });
  assert.equal(review.source.draftSha256, baseline.sha256, 'Source hash changed');
  assert(!Object.hasOwn(review, 'memberships') && !Object.hasOwn(review, 'originalContext'), 'Minimize private data');
  const ids = new Set();
  function stableId(id) {
    assert(uuid.test(id) && !ids.has(id), 'Invalid or duplicate ID');
    ids.add(id);
  }
  const { island, blocks } = review;
  stableId(island.id);
  assert.equal(island.id, baseline.data.island.id);
  assert.equal(island.titleJa, baseline.data.island.titleJa);
  required(island.titleJa, 'island title');
  localized(island.title, 'island title', true);
  localized(island.description, 'island description', true);
  assert.equal(island.revision, baseline.data.island.revision + 1);
  assert.equal(island.position, baseline.data.island.position);
  assert(blocks.length > 0);
  assert.equal(blocks.length, baseline.data.blocks.length);
  const labels = new Set();
  const changes = [];
  let phrases = 0;
  let prompts = 0;

  function validateItem(entry, old, kind, blockId, position) {
    stableId(entry.id);
    assert.equal(entry.id, old.id, 'Stable item ID');
    assert.equal(entry.position, position, 'Narrative position');
    assert.equal(entry.blockId, blockId, 'Item belongs to its block');
    assert.equal(entry.kind, kind);
    required(entry.sourceLabel, 'source label');
    assert(!labels.has(entry.sourceLabel), 'Unique editorial label');
    labels.add(entry.sourceLabel);
    if (kind === 'phrase') assert.equal(entry.sourceLabel, old.sourceLabel);
    const revision = kind === 'phrase' ? 'contentRevision' : 'revision';
    assert.equal(entry[revision], (old[revision] ?? 0) + 1);
    assert.equal(entry.register, 'informal');
    assert.equal(entry.status, pending);
    assert.equal(entry.audioAssetId, null);
    assert.equal(entry.audio.status, 'pending-user-approval');
    required(entry.audio.note, 'audio review note');
    required(entry.editorialNote, 'editorial note');
    required(entry.original.context, 'original context');
    const translation = kind === 'phrase' ? 'natural' : 'translation';
    assert.equal(entry.original.japanese, old.japanese);
    assert.equal(entry.original.es, old[translation].es);
    localized(entry[translation], 'natural translation', true);
    localized(entry.structural, 'structural translation');
    localized(entry.explanation, 'explanation');
    assert(entry.vocabulary.length > 0, 'Vocabulary required');
    for (const word of entry.vocabulary) {
      required(word.japanese, 'vocabulary');
      assert(kana.test(word.reading), 'Vocabulary reading must be kana');
      localized(word.meaning, 'vocabulary meaning');
    }
    required(entry.japanese, 'Japanese text');
    assert(kana.test(entry.reading), 'Full reading must be kana');
    assert(entry.segments.length > 0);
    for (const segment of entry.segments) {
      required(segment.text, 'furigana base');
      if (kanji.test(segment.text)) assert(kana.test(segment.reading ?? ''), 'Missing kanji reading');
      else assert.equal(segment.reading, undefined, 'Only kanji segments carry furigana');
    }
    assert.equal(entry.segments.map(s => s.text).join(''), entry.japanese, 'Furigana reconstructs text');
    assert.equal(entry.segments.map(s => s.reading ?? s.text).join(''), entry.reading, 'Furigana reconstructs reading');
    const changed = old.japanese !== entry.japanese;
    assert.equal(entry.editorialDecision, changed ? 'propose-change' : 'retain');
    if (changed) changes.push(entry.sourceLabel);
  }

  for (const [i, block] of blocks.entries()) {
    const original = baseline.data.blocks[i];
    stableId(block.id);
    assert.equal(block.id, original.id);
    assert.equal(block.position, i);
    assert.equal(block.islandId, island.id);
    assert.equal(block.revision, original.revision + 1);
    localized(block.name, 'block name', true);
    assert(block.phrases.length > 0);
    assert.equal(block.phrases.length, original.phrases.length);
    assert.equal(block.prompts.length, original.prompts.length);
    block.phrases.forEach((entry, n) => validateItem(entry, original.phrases[n], 'phrase', block.id, n));
    block.prompts.forEach((entry, n) => {
      const old = original.prompts[n];
      validateItem(entry, old, 'prompt', block.id, n);
      assert.deepEqual(entry.answerPhraseIds, old.answerPhraseIds, 'Original answer links and order');
      const replies = new Set(entry.answerPhraseIds);
      assert(replies.size > 0 && replies.size === entry.answerPhraseIds.length, 'Unique answer IDs');
      assert(entry.answerPhraseIds.every(id => block.phrases.some(phrase => phrase.id === id)), 'Answer belongs to block');
    });
    phrases += block.phrases.length;
    prompts += block.prompts.length;
  }
  assert(review.pending.length > 0);
  for (const question of review.pending) {
    assert(question.items.length > 0 && question.items.every(item => labels.has(item)), 'Pending question references');
    required(question.question, 'pending question');
  }
  return { islands: 1, blocks: blocks.length, phrases, prompts, ids: ids.size, changes };
}

export function loadReview(name, sourceName) {
  const baseline = readPrivate('reference', sourceName);
  const { data: proposal, sha256 } = readPrivate('review', name);
  return { proposal, sha256, summary: validateReview(proposal, baseline) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [name = 'grappling-p21.json', sourceName = 'grappling-draft.json'] = process.argv.slice(2);
  const { summary } = loadReview(name, sourceName);
  console.log(JSON.stringify(summary, null, 2));
}
