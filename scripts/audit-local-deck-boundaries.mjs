// Audit the exact optimized Pages artifact; no runtime configuration is read.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {compiledDomain} from './compile-i18n.mjs';
const outputs=JSON.parse(fs.readFileSync('dist/kana-study/browser-stats.json','utf8')).outputs;
const main=Object.keys(outputs).find(k=>outputs[k].entryPoint==='src/main.ts');assert(main);
const initial=new Set();
function visit(file){if(initial.has(file))return;initial.add(file);for(const edge of outputs[file]?.imports??[])if(edge.kind!=='dynamic-import'){
 const next=outputs[edge.path]?edge.path:path.posix.join(path.posix.dirname(file),edge.path);if(outputs[next])visit(next);
}}
visit(main);
for(const [file,output]of Object.entries(outputs))if(output.entryPoint?.startsWith('angular:styles/'))visit(file);
const bytes=[...initial].reduce((n,k)=>n+outputs[k].bytes,0);assert(bytes<=750000,`Initial bundle ${bytes} exceeds 750000 bytes`);
const lazy={};
for(const source of ['custom-local-presence.ts','workspace-legacy-copy.ts','local-deck-notice.ts','local-decks.generated.ts','deck-backup.service.ts','deck-backup-contract.ts']){
 const files=Object.keys(outputs).filter(k=>Object.keys(outputs[k].inputs??{}).some(i=>i.endsWith('/'+source)));
 assert(files.length,`Missing ${source}`);assert(files.every(k=>!initial.has(k)),`${source} reached the initial bundle`);lazy[source]=files;
}
assert(![...initial].some(k=>Object.keys(outputs[k].inputs??{}).some(i=>/development\/manga-manual|dictionaries\.generated/.test(i))));
for(const [name,domain]of [['core',false],['grammar',true],['deck-backup','backup'],['local-decks','local']])assert.equal(fs.readFileSync(`src/assets/i18n/${name}.generated.ts`,'utf8'),compiledDomain(domain));
const result={initialBytes:bytes,maximumBytes:750000,lazy,manualProvidersInInitial:false};
fs.writeFileSync('.cache/release2b-graph.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
