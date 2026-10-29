// Derive only the approved resource crosswalk; the external research JSON/APKG stays outside this repository.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const input=process.argv[2];assert(input,'Usage: node scripts/generate-kaishi-media-manifest.mjs EXTERNAL_CROSSWALK.json [--write]');
const source=JSON.parse(fs.readFileSync(input,'utf8'));
assert.equal(source.schemaVersion,1);assert.equal(source.deckId,'japanese-1500');
assert.equal(source.package.bytes,102049547);assert.equal(source.package.sha256,'3fdaef081150b09e1f58be4637d261903b95a9e7d60374467d5facee5b0387df');
const types={mp3:'audio/mpeg',webp:'image/webp',png:'image/png',jpg:'image/jpeg'};
const resources=new Map();
const entries=source.entries.map(entry=>{
 const out={id:entry.entryId};assert.equal(typeof out.id,'string');
 for(const kind of ['wordAudio','sentenceAudio','picture']){const r=entry[kind];if(!r)continue;
  assert(/^(?:0|[1-9]\d{0,3})$/.test(r.zipEntry)&&Number(r.zipEntry)<=4353);assert(Number.isSafeInteger(r.bytes)&&r.bytes>0&&r.bytes<=524288);assert(/^[a-f0-9]{40}$/.test(r.sha1));
  const type=types[r.sourceName.split('.').at(-1)];assert(type&&(kind==='picture'?type.startsWith('image/'):type==='audio/mpeg'));
  out[kind]=[r.zipEntry,r.bytes,r.sha1,type];const previous=resources.get(r.zipEntry);if(previous)assert.deepEqual(previous,out[kind]);resources.set(r.zipEntry,out[kind]);
 }assert(out.picture);return out;
});
assert.equal(entries.length,1500);assert.equal(new Set(entries.map(e=>e.id)).size,1500);
assert.equal(entries.filter(e=>e.wordAudio).length,1499);assert.equal(entries.filter(e=>e.sentenceAudio).length,1499);
assert.equal(entries.find(e=>e.id==='n-jp1500-en-CGA2j9S)g.').sentenceAudio,undefined);
assert.equal(resources.size,4353);assert.equal([...resources.values()].reduce((n,r)=>n+r[1],0),109484291);
const output='// Audited Kaishi ESP v1.0.1 resource links only; see docs/features/decks/KAISHI_MEDIA_1.md.\nexport const KAISHI_MEDIA_MANIFEST = '+JSON.stringify(entries)+' as const;\n';
const target='src/app/data/kaishi-media.manifest.ts';if(process.argv.includes('--write'))fs.writeFileSync(target,output);else assert.equal(fs.readFileSync(target,'utf8').replaceAll('\r\n','\n'),output);
console.log('Verified 1500 stable links, 4353 unique resources; no pending sentence reference or media payload copied.');
