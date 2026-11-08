// Development-only editorial layer. Nothing in this file or its JSON enters Angular.
import {readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';

export const editorial = JSON.parse(await readFile(new URL('./vocabulary-spanish-editorial.json', import.meta.url), 'utf8'));
export const catalogPath = new URL('../src/app/data/vocabulary-n5.generated.ts', import.meta.url);

export function parseCatalog(text) {
  const start = text.indexOf('=[') + 1;
  if (start === 0) throw new Error('Unrecognized Vocabulary catalog');
  return JSON.parse(text.slice(start).trim().replace(/;$/, ''));
}

export function nonSpanishDigest(rows) {
  const protectedRows = rows.map(({meanings, quizMeaning, ...rest}) => ({
    ...rest, meanings: {en: meanings.en, ca: meanings.ca}, quizMeaning: {en: quizMeaning.en, ca: quizMeaning.ca},
  }));
  return createHash('sha256').update(JSON.stringify(protectedRows)).digest('hex');
}

export function applySpanishEditorial(rows, patches = editorial.patches) {
  const byId = new Map(rows.map(row => [row.id, row]));
  if (byId.size !== rows.length) throw new Error('Duplicate catalog ID');
  const seen = new Set();
  for (const patch of patches) {
    if (seen.has(patch.id)) throw new Error('Duplicate editorial ID: ' + patch.id);
    seen.add(patch.id);
    const row = byId.get(patch.id);
    if (!row || row.primaryWrittenForm !== patch.written || row.primaryReading !== patch.reading) {
      throw new Error('Editorial identity mismatch: ' + patch.id);
    }
    const current = JSON.stringify([row.meanings.es, row.quizMeaning.es]);
    const before = JSON.stringify([patch.originalMeanings, patch.originalQuizMeaning]);
    const after = JSON.stringify([[patch.final], patch.final]);
    if (current !== before && current !== after) throw new Error('Unexpected Spanish source: ' + patch.id);
  }
  const patchMap = new Map(patches.map(patch => [patch.id, patch]));
  return rows.map(row => {
    const patch = patchMap.get(row.id);
    return patch ? {...row, meanings: {...row.meanings, es: [patch.final]}, quizMeaning: {...row.quizMeaning, es: patch.final}} : row;
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const text = await readFile(catalogPath, 'utf8');
  const rows = parseCatalog(text);
  const updated = applySpanishEditorial(rows);
  if (nonSpanishDigest(rows) !== nonSpanishDigest(updated)) throw new Error('Protected catalog fields changed');
  if (process.argv.includes('--write')) {
    const start = text.indexOf('=[') + 1;
    await writeFile(catalogPath, text.slice(0, start) + JSON.stringify(updated, null, 2) + ';\n');
  } else if (JSON.stringify(rows) !== JSON.stringify(updated)) {
    throw new Error('Spanish editorial layer not applied; run with --write');
  }
  console.log(JSON.stringify({entries: rows.length, reviewedPatches: editorial.patches.length, protectedDigest: nonSpanishDigest(rows), mode: process.argv.includes('--write') ? 'write' : 'check'}));
}
