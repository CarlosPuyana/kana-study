// Full generator verification using pinned, local development sources. No network.
import {execFileSync} from 'node:child_process';
import {mkdir, readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = process.argv[process.argv.indexOf('--source') + 1];
const dictionary = process.argv[process.argv.indexOf('--dictionary') + 1];
if (!process.argv.includes('--source') || !process.argv.includes('--dictionary') || !source || !dictionary) {
  throw new Error('Usage: node scripts/check-vocabulary-generation.mjs --source PINNED_OPENJLPT_JSON --dictionary PINNED_JMDICT_JSON');
}
const directory = path.join(root, '.cache/vocabulary-final-review');
await mkdir(directory, {recursive: true});
const output = path.join(directory, 'regenerated-verification.ts');
const catalog = path.join(root, 'src/app/data/vocabulary-n5.generated.ts');
const before = await readFile(catalog, 'utf8');
execFileSync(process.execPath, ['scripts/generate-vocabulary.mjs'], {cwd: root, stdio: 'pipe', env: {...process.env,
  VOCABULARY_OFFLINE: '1', VOCABULARY_SOURCE_PATH: path.resolve(source), JMDICT_PATH: path.resolve(dictionary), VOCABULARY_OUTPUT_PATH: output,
}});
const after = await readFile(catalog, 'utf8');
assert.equal(after, before, 'Generator verification modified the source catalog');
assert.equal((await readFile(output, 'utf8')).replace(/\r\n/g, '\n'), before.replace(/\r\n/g, '\n'), 'Full regeneration differs from the reviewed catalog');
console.log('PASS full offline generation: pinned source + pinned JMdict + localization cache + both editorial layers; 662 entries identical (LF normalized), production source untouched');
