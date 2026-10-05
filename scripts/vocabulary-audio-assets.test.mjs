import {readFileSync,readdirSync,statSync} from 'node:fs';
import {join} from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
const base='public/audio/vocabulary/n5';
const manifest=JSON.parse(readFileSync(join(base,'manifest.json'),'utf8'));
const policy=JSON.parse(readFileSync(join(base,'eligibility.json'),'utf8'));
const source=readFileSync('src/app/data/vocabulary-n5.generated.ts','utf8');
const vocabulary=JSON.parse('['+source.split('=[')[1].trim().replace(/;$/,''));
test('all manifest assets exist and are nonempty MP3s identified by stable Vocabulary ID',()=>{
  const ids=new Set(vocabulary.map(e=>e.id));
  for(const [id,path] of Object.entries(manifest)){
    assert.ok(ids.has(id));assert.equal(path,`${base.replace('public/','')}/${id}.mp3`);
    assert.ok(statSync(join('public',path)).size>0);
  }
});
test('no orphan MP3s, duplicate assets or WAVs in the production catalog',()=>{
  const names=readdirSync(base);assert.deepEqual(names.filter(n=>n.endsWith('.mp3')).sort(),Object.keys(manifest).map(id=>id+'.mp3').sort());
  assert.equal(new Set(Object.values(manifest)).size,Object.keys(manifest).length);
  assert.ok(!names.some(n=>/\.(wav|webm)$/i.test(n)));
});
test('all ambiguous and pending-review IDs are excluded; only explicit approvals can return',()=>{
  assert.equal(policy.excluded.length,14);
  for(const id of [...policy.excluded,...policy.pendingReview])assert.ok(!Object.hasOwn(manifest,id));
  for(const id of policy.approved){assert.ok(!policy.excluded.includes(id));assert.ok(Object.hasOwn(manifest,id));}
  assert.equal(Object.keys(manifest).length,662-policy.excluded.length-policy.pendingReview.length);
});
test('runtime TypeScript manifest matches the static catalog exactly',()=>{
  const ts=readFileSync('src/app/data/vocabulary-audio-manifest.generated.ts','utf8');
  assert.deepEqual(JSON.parse(ts.slice(ts.indexOf('=')+1).trim().replace(/;$/,'')),manifest);
});
