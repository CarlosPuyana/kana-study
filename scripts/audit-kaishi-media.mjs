// Inspect optimized build graphs; never loads the APKG or changes feature gates.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {validatePublication} from './kaishi-publication-validation.mjs';
const report=[];
for(const root of ['dist/kana-study','dist/kana-study-candidate']){
 const outputs=JSON.parse(fs.readFileSync(root+'/browser-stats.json','utf8')).outputs;
 const main=Object.keys(outputs).find(k=>/src\/main(?:\.manga-candidate)?\.ts$/.test(outputs[k].entryPoint??''));assert(main);
 const initial=new Set();function visit(k){if(initial.has(k))return;initial.add(k);for(const edge of outputs[k]?.imports??[])if(edge.kind!=='dynamic-import'){const next=outputs[edge.path]?edge.path:path.posix.join(path.posix.dirname(k),edge.path);if(outputs[next])visit(next);}}
 visit(main);for(const [k,v]of Object.entries(outputs))if(v.entryPoint?.startsWith('angular:styles/'))visit(k);
 const inputs=[...initial].flatMap(k=>Object.keys(outputs[k].inputs??{}));assert(!inputs.some(k=>k.includes('kaishi-')||k.includes('/fzstd/')),'Kaishi code/manifest/decoder reached initial graph');
 assert(!inputs.some(k=>['deck-day-presentation.ts','deck-intensive-session.ts','deck-intensive-practice.ts','deck-study.generated.ts'].some(name=>k.endsWith(name))),'Deck study feature reached initial graph');
 const worker=Object.entries(outputs).find(([,v])=>v.entryPoint==='src/app/core/services/kaishi-media.worker.ts');assert(worker,'Missing media worker');
 for(const source of ['kaishi-media.manifest.ts','fzstd/esm/index.mjs','kaishi-media-parser.ts'])assert(Object.keys(worker[1].inputs).some(k=>k.endsWith(source)),source+' missing in worker');
 const bytes=[...initial].reduce((n,k)=>n+outputs[k].bytes,0);assert(bytes<750000,'Strict initial budget exceeded');
 assert(!Object.keys(outputs).some(k=>k.endsWith('.apkg')));
 report.push({root,initialBytes:bytes,workerFile:worker[0],workerBytes:worker[1].bytes,kaishiInitial:false,mediaPayloadBundled:false});
}
const files=execFileSync('git',['ls-files','-c','--others','--exclude-standard','-z'],{encoding:'utf8'}).split('\0');assert(!files.some(f=>/\.apkg$/i.test(f)),'APKG in repository');
execFileSync('git',['diff','--exit-code','HEAD','--','src/app/data/japanese-1500.generated.ts','src/app/core/services/deck-scheduler.service.ts','src/app/core/services/deck-study.service.ts','src/app/core/services/custom-deck-gates.ts','src/app/core/services/manga-deck-gate.ts','src/app/core/services/custom-deck-access.ts','src/app/release/manga-candidate.providers.ts','.github','supabase'],{encoding:'utf8'});

const rights=JSON.parse(fs.readFileSync('release/kaishi-media-rights.json','utf8'));
function filesBelow(root){return fs.readdirSync(root,{withFileTypes:true}).flatMap(e=>{const file=path.join(root,e.name);return e.isDirectory()?filesBelow(file):[file];});}
validatePublication(path.join('public/assets/kaishi',rights.version));
for(const row of report){
 const browser=path.join(row.root,'browser');
 row.staticMedia=validatePublication(path.join(browser,'assets/kaishi',rights.version));
 row.deployTotalBytes=filesBelow(browser).reduce((n,f)=>n+fs.statSync(f).size,0);
}
console.log(JSON.stringify(report,null,2));
