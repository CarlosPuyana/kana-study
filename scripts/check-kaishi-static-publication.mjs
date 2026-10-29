import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {validatePublication} from './kaishi-publication-validation.mjs';
const rights=JSON.parse(fs.readFileSync('release/kaishi-media-rights.json','utf8'));
const root=path.join('public/assets/kaishi',rights.version);
const result=validatePublication(root);
// Keep the previous blocked version immutable; no stale media or fixtures may hide beside it.
assert.deepEqual(fs.readdirSync('public/assets/kaishi').sort(),['esp-v1-3fdaef081150-r1',rights.version].sort());
const legacy='public/assets/kaishi/esp-v1-3fdaef081150-r1';
assert.deepEqual(fs.readdirSync(legacy),['catalog.json']);
assert.equal(JSON.parse(fs.readFileSync(legacy+'/catalog.json','utf8')).publication,'blocked');
console.log('Kaishi publication validated: '+JSON.stringify(result));
