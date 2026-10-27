import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root='dist/kana-study-candidate',outputs=JSON.parse(fs.readFileSync(root+'/browser-stats.json','utf8')).outputs;
const main=Object.keys(outputs).find(k=>outputs[k].entryPoint==='src/main.manga-candidate.ts');assert(main,'Candidate entry missing');
const initial=new Set();function visit(k){if(initial.has(k))return;initial.add(k);for(const i of outputs[k]?.imports??[])if(i.kind!=='dynamic-import'){
 const next=outputs[i.path]?i.path:path.posix.join(path.posix.dirname(k),i.path);if(outputs[next])visit(next);
}}visit(main);
for(const [k,v]of Object.entries(outputs))if(v.entryPoint?.startsWith('angular:styles/'))visit(k);
const initialBytes=[...initial].reduce((n,k)=>n+outputs[k].bytes,0);assert(initialBytes<750000,`Candidate rejected: ${initialBytes} bytes must be strictly below 750000`);
const inputs=[...initial].flatMap(k=>Object.keys(outputs[k].inputs??{}));assert(inputs.some(k=>k.endsWith('/release/manga-candidate.providers.ts')));
assert(!Object.values(outputs).flatMap(v=>Object.keys(v.inputs??{})).some(k=>/manga-manual|custom-deck\.fixture|\.spec\.|\/e2e\//.test(k)),'Test/manual code in candidate');
const lazy={};for(const source of ['deck-backup.service.ts','deck-backup-contract.ts','local-decks.generated.ts','custom-deck.repository.ts','manga-deck-assisted.service.ts']){
 const files=Object.keys(outputs).filter(k=>Object.keys(outputs[k].inputs??{}).some(i=>i.endsWith('/'+source)));assert(files.length);assert(files.every(k=>!initial.has(k)),`${source} is initial`);lazy[source]=files;
}
assert.equal(JSON.parse(fs.readFileSync('angular.json')).projects['kana-study'].architect.build.options.browser,'src/main.ts');
const normalStats='dist/kana-study/browser-stats.json';
if(fs.existsSync(normalStats)){
 const normal=JSON.parse(fs.readFileSync(normalStats,'utf8')).outputs;
 assert(Object.values(normal).some(v=>v.entryPoint==='src/main.ts'));
 assert(!Object.values(normal).flatMap(v=>Object.keys(v.inputs??{})).some(k=>/manga-candidate\.providers|main\.manga-candidate/.test(k)),'Candidate leaked into normal deployment');
}
const result={initialBytes,maximumBytes:750000,exclusiveMaximum:true,entry:'src/main.manga-candidate.ts',optimized:true,lazy,manualOrTestCode:false};fs.mkdirSync('.cache',{recursive:true});fs.writeFileSync('.cache/release2c-bundle.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
