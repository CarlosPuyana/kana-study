import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
const report=[];
for(const root of ['dist/kana-study','dist/kana-study-candidate']){
 const outputs=JSON.parse(fs.readFileSync(root+'/browser-stats.json','utf8')).outputs;
 const main=Object.keys(outputs).find(key=>/src\/main(?:\.manga-candidate)?\.ts$/.test(outputs[key].entryPoint??''));assert(main);
 const initial=new Set();function visit(key){if(initial.has(key))return;initial.add(key);for(const edge of outputs[key]?.imports??[])if(edge.kind!=='dynamic-import'){const next=outputs[edge.path]?edge.path:path.posix.join(path.posix.dirname(key),edge.path);if(outputs[next])visit(next);}}
 visit(main);for(const [key,value]of Object.entries(outputs))if(value.entryPoint?.startsWith('angular:styles/'))visit(key);
 const feature=['/features/conjugations/','/data/conjugation','/services/conjugation','/models/conjugation','/i18n/conjugations.generated.ts'];
 const isFeature=input=>feature.some(fragment=>input.includes(fragment));
 const initialInputs=[...initial].flatMap(key=>Object.keys(outputs[key].inputs??{}));assert(!initialInputs.some(isFeature),'Conjugations reached initial graph');
 const chunks=Object.entries(outputs).filter(([,value])=>Object.keys(value.inputs??{}).some(isFeature)).map(([key])=>key);assert(chunks.length>0,'Missing lazy Conjugations code');
 const initialBytes=[...initial].reduce((total,key)=>total+outputs[key].bytes,0);assert(initialBytes<750000,'Initial budget exceeded');
 report.push({root,initialBytes,lazyConjugationChunks:chunks,featureInInitial:false});
}
console.log(JSON.stringify(report,null,2));
