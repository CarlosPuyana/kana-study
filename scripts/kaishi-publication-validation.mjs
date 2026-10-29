import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

export function validatePublication(root) {
  const rights = JSON.parse(fs.readFileSync('release/kaishi-media-rights.json', 'utf8'));
  const model = fs.readFileSync('src/app/core/models/kaishi-static-media.model.ts', 'utf8');
  const version = model.match(/KAISHI_STATIC_VERSION='([^']+)'/)[1];
  assert.equal(rights.status, 'approved', 'Media publication needs recorded authorization');
  assert.equal(rights.version, version);
  assert.equal(rights.packageSha256, '3fdaef081150b09e1f58be4637d261903b95a9e7d60374467d5facee5b0387df');
  assert(rights.authorization?.grantor && rights.authorization?.scope && rights.authorization?.evidenceType);
  const catalog = JSON.parse(fs.readFileSync(path.join(root, 'catalog.json'), 'utf8'));
  assert.deepEqual(catalog, {schemaVersion:1, version, publication:'ready', dataset:'kaishi'});
  assert.deepEqual(fs.readdirSync(root).sort(), ['CREDITS.txt', 'cards', 'catalog.json', 'resources']);
  assert(fs.readFileSync(path.join(root, 'CREDITS.txt'), 'utf8').includes('Donkuri'));
  const source = fs.readFileSync('src/app/data/kaishi-media.manifest.ts', 'utf8');
  const entries = JSON.parse(source.slice(source.indexOf(' = ')+3, source.lastIndexOf(' as const;')));
  const extensions = {'audio/mpeg':'mp3','image/webp':'webp','image/jpeg':'jpg','image/png':'png'};
  const resources = new Map();
  const cards = [];
  for (const entry of entries) {
    const filename = crypto.createHash('sha256').update(entry.id).digest('hex')+'.json';
    cards.push(filename);
    const card = JSON.parse(fs.readFileSync(path.join(root, 'cards', filename), 'utf8'));
    const expected = {};
    for (const kind of ['wordAudio','sentenceAudio','picture']) {
      const ref = entry[kind];
      if (!ref) continue;
      assert(extensions[ref[3]], 'Original media only; no demo tones');
      const resource = {path:'resources/'+ref[2]+'.'+extensions[ref[3]], bytes:ref[1], type:ref[3]};
      expected[kind] = resource;
      resources.set(resource.path, {...resource, sha1:ref[2]});
    }
    assert.deepEqual(card, {schemaVersion:1, version, entryId:entry.id, resources:expected});
  }
  assert.equal(entries.length, 1500);
  assert.deepEqual(fs.readdirSync(path.join(root,'cards')).sort(), cards.sort());
  assert.deepEqual(fs.readdirSync(path.join(root,'resources')).sort(), [...resources.keys()].map(r=>r.slice(10)).sort());
  assert.deepEqual([...rights.approvedResources].sort((a,b)=>a.path.localeCompare(b.path)), [...resources.values()].sort((a,b)=>a.path.localeCompare(b.path)));
  let mediaBytes = 0;
  for (const ref of resources.values()) {
    const bytes = fs.readFileSync(path.join(root, ref.path));
    assert.equal(bytes.length, ref.bytes, ref.path+' size');
    assert.equal(crypto.createHash('sha1').update(bytes).digest('hex'), ref.sha1, ref.path+' hash');
    mediaBytes += bytes.length;
  }
  assert.equal(resources.size, 4344);
  assert.equal(mediaBytes, 109382203);
  return {version, cards:entries.length, resources:resources.size, mediaBytes};
}
