import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {applySpanishEditorial, catalogPath, editorial, nonSpanishDigest, parseCatalog} from './vocabulary-spanish-editorial.mjs';
import {applyLinguisticEditorial, catalogDigest, linguisticEditorial, originalLinguisticRows} from './vocabulary-linguistic-editorial.mjs';

const rows = parseCatalog(await readFile(catalogPath, 'utf8'));
const original = originalLinguisticRows(rows);
const word = written => rows.find(row => row.primaryWrittenForm === written);

test('all 662 identities, order, EN/CA and every field outside the explicit review are preserved', () => {
  assert.equal(rows.length, 662);
  assert.equal(new Set(rows.map(row => row.id)).size, 662);
  assert.deepEqual(rows.map(row => row.id), original.map(row => row.id));
  assert.equal(catalogDigest(original), 'e15ae45ce7585c3ac5ef5e1c405c233c5dc936db5b3a96b0383c187ab1a15b67');
  assert.equal(nonSpanishDigest(original), 'b18057f0fed8d0c9a736b1a3091c4a3bfce8174400d39649f8db23234ef47833');
  for (let i = 0; i < rows.length; i++) {
    for (const language of ['en', 'ca']) {
      assert.deepEqual(rows[i].meanings[language], original[i].meanings[language]);
      assert.equal(rows[i].quizMeaning[language], original[i].quizMeaning[language]);
    }
  }
});

test('all 82 previous Spanish corrections survive unchanged, and both layers are idempotent', () => {
  assert.equal(editorial.patches.length, 82);
  for (const patch of editorial.patches) {
    const row = rows.find(row => row.id === patch.id);
    assert.equal(row.quizMeaning.es, patch.final);
    assert.deepEqual(row.meanings.es, [patch.final]);
  }
  assert.deepEqual(applyLinguisticEditorial(applySpanishEditorial(original)), rows);
  assert.deepEqual(applyLinguisticEditorial(applySpanishEditorial(rows)), rows);
});

test('suru compounds are complete irregular verbs; good is an i-adjective, not an adverb', () => {
  for (const form of ['コピーする', '散歩する', '掃除する', '勉強する', '練習する']) {
    const row = word(form);
    assert(row.primaryReading.endsWith('する'));
    assert.deepEqual(row.partOfSpeech, ['irregular-verb']);
    assert.equal(row.studyCategory, 'verbs');
    assert(!row.writtenForms.some(form => !form.endsWith('する')));
  }
  assert.deepEqual(word('いい').partOfSpeech, ['i-adjective']);
  assert.equal(word('いい').quizMeaning.es, 'bueno');
  assert(word('いい').writtenForms.includes('よい'));
  assert.deepEqual(word('好き').partOfSpeech, ['noun', 'na-adjective']);
  assert.equal(word('好き').quizMeaning.es, 'gustar');
});

test('demonstratives, ability, frequency and bags do not inherit unrelated grammatical classes', () => {
  for (const form of ['この', 'どの']) assert.deepEqual(word(form).partOfSpeech, ['determiner']);
  assert.deepEqual(word('できる').partOfSpeech, ['ichidan-verb']);
  for (const form of ['よく', 'たぶん', 'どう']) assert.deepEqual(word(form).partOfSpeech, ['adverb']);
  assert.deepEqual(word('かばん').partOfSpeech, ['noun']);
  assert(!word('この').writtenForms.includes('九'));
  assert(!word('はし').writtenForms.includes('橋'));
  assert(!word('はく').writtenForms.includes('掃く'));
});

test('normalization preserves both valid readings and both equivalent spellings', () => {
  for (const [form, readings] of [['何', ['なん', 'なに']], ['九', ['きゅう', 'く']], ['四', ['し', 'よん']],
    ['七', ['しち', 'なな']], ['十', ['じゅう', 'とお']], ['毎月', ['まいげつ', 'まいつき']], ['毎年', ['まいねん', 'まいとし']]]) {
    assert.deepEqual(word(form).readings, readings);
    assert(!/[\/、\s]/u.test(word(form).primaryReading));
  }
  assert.deepEqual(word('川').writtenForms, ['川', '河']);
  assert.deepEqual(word('じゃ').writtenForms, ['じゃ', 'じゃあ']);
  assert.deepEqual(word('そうして').writtenForms, ['そうして', 'そして']);
  for (const form of ['キログラム', 'キロメートル']) assert(word(form).writtenForms.includes('キロ'));
});

test('normalization does not change the reading of any existing approved Listening recording', async () => {
  const manifest = JSON.parse(await readFile(new URL('../public/audio/vocabulary/n5/manifest.json', import.meta.url), 'utf8'));
  for (const [index, row] of rows.entries()) {
    if (Object.hasOwn(manifest, row.id)) assert.equal(row.primaryReading, original[index].primaryReading, row.id);
  }
  const eligibility = JSON.parse(await readFile(new URL('../public/audio/vocabulary/n5/eligibility.json', import.meta.url), 'utf8'));
  assert.equal(eligibility.excluded.length, 14);
  assert.equal(eligibility.approved.length, 0); // Normalizing a label is not approval of an audio file.
});

test('ambiguous semantic identities are unchanged, not selected by a majority or by N5 frequency', () => {
  for (const index of [83, 155, 172, 176, 337, 558]) assert.deepEqual(rows[index - 1], original[index - 1]);
  assert.equal(word('せっけん').quizMeaning.es, 'economía');
  assert.equal(word('伯父/叔父').primaryReading, 'おじいさん');
  for (const index of [6, 10, 318, 569, 643]) {
    assert.equal(linguisticEditorial.reviews.find(review => review.index === index).status, 'blocked');
  }
});

test('the pipeline rejects drift, partial patches and changes to protected text instead of overwriting them', () => {
  for (const mutate of [
    rows => { rows[0].id = 'new-id'; },
    rows => { rows.reverse(); },
    rows => { rows[0].meanings.ca = ['changed']; },
    rows => { rows[11].primaryReading = 'unreviewed'; },
    rows => { rows[11].furigana = [{text: 'wrong'}]; },
    rows => { rows[62].partOfSpeech = ['noun']; },
  ]) {
    const clone = structuredClone(rows); mutate(clone);
    assert.throws(() => applyLinguisticEditorial(clone), /drift|Missing reviewed ID/);
  }
});
