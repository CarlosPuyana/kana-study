import fs from 'node:fs/promises';

const directory = new URL('corpus-independent/', import.meta.url);
await fs.mkdir(directory, { recursive: true });
const slots = Array.from({ length: 100 }, (_, i) => ({
  slotId: 'eval-' + String(i + 1).padStart(3, '0'), role: 'independent-holdout',
  text: null, source: { documentHash: null, page: null, block: null, line: null,
    permissionReference: null, rightsStatus: 'pending' },
  leakageFamily: null, originalUtf16Range: null, normalization: 'NFC-v1',
  annotation: null, reviewers: [], disagreements: [], status: 'empty-not-a-case'
}));
const target = new URL('slots.jsonl', directory);
try { await fs.writeFile(target, slots.map(s => JSON.stringify(s)).join('\n') + '\n', { flag: 'wx' }); }
catch (error) { if (error.code !== 'EEXIST') throw error; }
console.log('100 reserved slots, not 100 references. Never overwrite annotations.');
