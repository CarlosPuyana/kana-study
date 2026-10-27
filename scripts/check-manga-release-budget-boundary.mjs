// Synthetic metafiles test the real build guard boundary; they are not artifact measurements.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
const audit=path.resolve('scripts/audit-manga-candidate-bundle.mjs'),results=[];
fs.mkdirSync('.cache',{recursive:true});
for(const bytes of [749999,750000,750001]){
 const cwd=fs.mkdtempSync(path.resolve('.cache/release3-budget-fixture-'));fs.mkdirSync(path.join(cwd,'dist/kana-study-candidate'),{recursive:true});
 const outputs={'main-fixture.js':{bytes,entryPoint:'src/main.manga-candidate.ts',imports:[],inputs:{'src/app/release/manga-candidate.providers.ts':{}}},
 'lazy-fixture.js':{bytes:1,imports:[],inputs:Object.fromEntries(['deck-backup.service.ts','deck-backup-contract.ts','local-decks.generated.ts','custom-deck.repository.ts','manga-deck-assisted.service.ts'].map(p=>['src/'+p,{}]))}};
 fs.writeFileSync(path.join(cwd,'dist/kana-study-candidate/browser-stats.json'),JSON.stringify({outputs}));fs.writeFileSync(path.join(cwd,'angular.json'),JSON.stringify({projects:{'kana-study':{architect:{build:{options:{browser:'src/main.ts'}}}}}}));
 const result=spawnSync(process.execPath,[audit],{cwd,encoding:'utf8'}),accepted=result.status===0;assert.equal(accepted,bytes<750000);
 if(!accepted)assert.match(result.stderr,/must be strictly below 750000/);
 results.push({syntheticBytes:bytes,accepted});
}
fs.writeFileSync('.cache/release3-budget-boundary.json',JSON.stringify({syntheticOnly:true,results},null,2));console.log(JSON.stringify(results,null,2));
