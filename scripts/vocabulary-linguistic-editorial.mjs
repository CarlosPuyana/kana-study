// Development-only, reviewed Vocabulary maintenance. Never imported by Angular.
import {readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {generateFuriganaSegments} from './furigana.mjs';
import {applySpanishEditorial, catalogPath, parseCatalog} from './vocabulary-spanish-editorial.mjs';

export const linguisticEditorial = JSON.parse(await readFile(new URL('./vocabulary-linguistic-editorial.json', import.meta.url), 'utf8'));
const allowed = new Set(['primaryWrittenForm', 'primaryReading', 'writtenForms', 'readings', 'formReadings', 'partOfSpeech', 'studyCategory', 'spanish']);
export const catalogDigest = rows => createHash('sha256').update(JSON.stringify(rows)).digest('hex');

function project(row, fields) {
  return Object.fromEntries(Object.keys(fields).map(key => {
    if (key === 'spanish') {
      if (JSON.stringify(row.meanings.es) !== JSON.stringify([row.quizMeaning.es])) throw new Error('Inconsistent Spanish fields: ' + row.id);
      return [key, row.quizMeaning.es];
    }
    return [key, row[key] ?? null];
  }));
}

function replace(row, fields) {
  const result = {...row};
  for (const [key, value] of Object.entries(fields)) {
    if (!allowed.has(key)) throw new Error('Unauthorized editorial field: ' + key);
    if (key === 'spanish') {
      result.meanings = {...row.meanings, es: [value]};
      result.quizMeaning = {...row.quizMeaning, es: value};
    } else if (key === 'formReadings' && value === null) delete result.formReadings;
    else result[key] = value;
  }
  if ('primaryWrittenForm' in fields || 'primaryReading' in fields) {
    result.furigana = generateFuriganaSegments(result.primaryWrittenForm, result.primaryReading).segments;
    result.kanjiCharacters = [...new Set([...result.primaryWrittenForm].filter(character => /\p{Script=Han}/u.test(character)))];
  }
  return result;
}

// Used only to verify the exact pre-review baseline, never to roll back user data.
export function originalLinguisticRows(rows) {
  const patches = new Map(linguisticEditorial.patches.map(patch => [patch.id, patch]));
  return rows.map(row => patches.has(row.id) ? replace(row, patches.get(row.id).before) : row);
}

export function applyLinguisticEditorial(rows) {
  const byId = new Map(rows.map(row => [row.id, row]));
  if (byId.size !== rows.length || rows.length !== 662) throw new Error('Expected 662 unique Vocabulary IDs');
  const seen = new Set();
  for (const patch of linguisticEditorial.patches) {
    if (seen.has(patch.id)) throw new Error('Duplicate linguistic editorial ID');
    seen.add(patch.id);
    const row = byId.get(patch.id);
    if (!row) throw new Error('Missing reviewed ID: ' + patch.id);
    const review = linguisticEditorial.reviews.find(review => review.id === patch.id);
    const beforePair = [review.originalWritten, review.originalReading];
    const afterPair = [patch.after.primaryWrittenForm ?? beforePair[0], patch.after.primaryReading ?? beforePair[1]];
    const pair = JSON.stringify([row.primaryWrittenForm, row.primaryReading]);
    if (pair !== JSON.stringify(beforePair) && pair !== JSON.stringify(afterPair)) throw new Error('Linguistic identity drift: ' + patch.id);
    if ('primaryWrittenForm' in patch.before || 'primaryReading' in patch.before) {
      const furigana = generateFuriganaSegments(row.primaryWrittenForm, row.primaryReading).segments;
      const kanji = [...new Set([...row.primaryWrittenForm].filter(character => /\p{Script=Han}/u.test(character)))];
      if (JSON.stringify(row.furigana) !== JSON.stringify(furigana) || JSON.stringify(row.kanjiCharacters) !== JSON.stringify(kanji)) {
        throw new Error('Derived Japanese metadata drift: ' + patch.id);
      }
    }
    if (Object.keys(patch.before).join() !== Object.keys(patch.after).join()) throw new Error('Editorial field mismatch');
    for (const key of Object.keys(patch.before)) if (!allowed.has(key)) throw new Error('Unauthorized editorial field: ' + key);
    const value = JSON.stringify(project(row, patch.before));
    if (value !== JSON.stringify(patch.before) && value !== JSON.stringify(patch.after)) throw new Error('Unreviewed field drift: ' + patch.id);
  }
  if (catalogDigest(originalLinguisticRows(rows)) !== linguisticEditorial.baselineDigest) throw new Error('Protected Vocabulary baseline drift');
  const patches = new Map(linguisticEditorial.patches.map(patch => [patch.id, patch]));
  return rows.map(row => patches.has(row.id) ? replace(row, patches.get(row.id).after) : row);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const text = await readFile(catalogPath, 'utf8');
  const rows = parseCatalog(text);
  const result = applyLinguisticEditorial(applySpanishEditorial(rows));
  if (process.argv.includes('--write')) await writeFile(catalogPath, text.slice(0, text.indexOf('=[') + 1).replace(/\r\n/g, '\n') + JSON.stringify(result, null, 2) + ';\n');
  else if (JSON.stringify(result) !== JSON.stringify(rows)) throw new Error('Reviewed linguistic layer not applied');
  console.log(JSON.stringify({entries: rows.length, reviewed: linguisticEditorial.reviews.length, patches: linguisticEditorial.patches.length, digest: catalogDigest(result)}));
}
