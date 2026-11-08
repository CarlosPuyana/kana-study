import {applyLinguisticEditorial,originalLinguisticRows} from './vocabulary-linguistic-editorial.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {applySpanishEditorial, catalogPath, editorial, nonSpanishDigest, parseCatalog} from './vocabulary-spanish-editorial.mjs';

const rows = parseCatalog(await readFile(catalogPath, 'utf8'));
const initialReviewRows = originalLinguisticRows(rows);
const inventory = JSON.parse(await readFile(new URL('../docs/features/vocabulary/VOCABULARY_SPANISH_LINGUISTIC_INVENTORY.json', import.meta.url), 'utf8'));

test('the first Spanish audit retains 662 traceable IDs and exactly its 82 high-confidence patches', () => {
  assert.equal(inventory.entries.length, 662);
  assert.deepEqual(inventory.entries.map(entry => entry.id), rows.map(row => row.id));
  const applied = inventory.entries.filter(entry => entry.initialAudit.status === 'correction_applied');
  assert.equal(applied.length, 82);
  assert.deepEqual(applied.map(entry => entry.id), editorial.patches.map(patch => patch.id));
  for (const [i, entry] of inventory.entries.entries()) {
    assert.equal(entry.reviewer, 'agent-linguistic-review');
    assert.equal(entry.independentHumanReview, false);
    assert.deepEqual(rows[i].meanings.es, entry.finalMeanings);
    assert.equal(rows[i].quizMeaning.es, entry.finalQuizMeaning);
    if (entry.initialAudit.status === 'correction_applied') {
      assert.equal(entry.initialAudit.matchConfidence, 'high');
      assert.equal(entry.initialAudit.translationConfidence, 'high');
      assert(entry.dictionaryId && entry.senses.length);
    } else {
      assert.deepEqual(initialReviewRows[i].meanings.es, entry.originalMeanings);
      assert.equal(initialReviewRows[i].quizMeaning.es, entry.originalQuizMeaning);
    }
  }
});

test('the first Spanish layer remains exact before the separately authorized Japanese review', () => {
  assert.equal(nonSpanishDigest(initialReviewRows), 'b18057f0fed8d0c9a736b1a3091c4a3bfce8174400d39649f8db23234ef47833');
  const original = initialReviewRows.map((row, index) => ({...row,
    meanings: {...row.meanings, es: inventory.entries[index].originalMeanings},
    quizMeaning: {...row.quizMeaning, es: inventory.entries[index].originalQuizMeaning},
  }));
  assert.deepEqual(applySpanishEditorial(original), initialReviewRows);
  assert.deepEqual(applyLinguisticEditorial(applySpanishEditorial(original)), rows);
  assert.deepEqual(applySpanishEditorial(rows), rows); // Regeneration is idempotent.
});

test('regeneration refuses drift in identity or an unreviewed Spanish source', () => {
  const patch = editorial.patches[0];
  const row = rows.find(candidate => candidate.id === patch.id);
  for (const changed of [{...row, id: 'another-id'}, {...row, primaryReading: 'different'}, {...row, primaryWrittenForm: 'different'}]) {
    assert.throws(() => applySpanishEditorial([changed], [patch]), /identity mismatch/);
  }
  assert.throws(() => applySpanishEditorial([{...row, quizMeaning: {...row.quizMeaning, es: 'unreviewed'}}], [patch]), /Unexpected Spanish source/);
  assert.throws(() => applySpanishEditorial([row], [patch, patch]), /Duplicate editorial/);
});

test('original audit evidence remains visible and blocked identities are not silently reassigned', () => {
  for (const index of [12, 63, 83, 138, 218, 354, 457, 462, 558, 597, 656]) {
    const entry = inventory.entries[index - 1];
    assert.notEqual(entry.initialAudit.status, 'correction_applied');
    assert(entry.issues.length);
  }
  assert.equal(inventory.entries[557].written, '伯父/叔父');
  assert.equal(inventory.entries[557].reading, 'おじいさん');
  assert.equal(inventory.entries[557].finalQuizMeaning, 'abuelo');
});
