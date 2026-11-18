import fs from 'node:fs';import assert from 'node:assert/strict';import crypto from 'node:crypto';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const base='src/app/data/phrase-islands/',source=read(base+'phrases.v1.json'),media=read(base+'audio.v1.json'),reviews=read(base+'editorial.v1.json').records;
const topics=['everyday','conversation','work','shopping','travel','hobbies'];const total=source.phrases.length;
assert(total>0);assert.equal(new Set(source.phrases.map(p=>p.id)).size,total);assert.equal(Object.keys(media).length,total);
for(const topic of topics)assert.equal(source.phrases.filter(p=>p.topicId===topic&&reviews[p.id].status==='approved'&&media[p.id]).length,source.phrases.filter(p=>p.topicId===topic).length);
const dictionaries=Object.fromEntries(['es','en','ca'].map(lang=>[lang,read(`src/assets/i18n/${lang}.json`)]));
for(const p of source.phrases){
 assert(topics.includes(p.topicId));assert.equal(p.segments.map(s=>s.text).join(''),p.japanese);assert.equal(p.segments.map(s=>s.reading??s.text).join(''),p.reading);
 assert(p.segments.every(s=>!/[\p{Script=Han}]/u.test(s.text)||s.reading));assert(['N5','N4'].includes(p.level));assert(['polite','informal','neutral'].includes(p.register));
 assert.equal(reviews[p.id].text,p.japanese);assert.equal(reviews[p.id].status,'approved');
 for(const lang of ['es','en','ca'])for(const field of ['natural','structural','explanation']){assert(p.localizations[lang][field].trim());assert.equal(dictionaries[lang][`phraseIslands.content.${p.id}.${field}`],p.localizations[lang][field]);}
 const audio=media[p.id];assert.match(audio.path,/^audio\/phrase-islands\/v1\/[a-z0-9-]+\.mp3$/);const data=fs.readFileSync('public/'+audio.path);assert.equal(data.length,audio.bytes);assert.equal(crypto.createHash('sha256').update(data).digest('hex'),audio.sha256);assert(audio.durationSeconds>0);
}
const published=fs.readdirSync('public/audio/phrase-islands/v1');assert(published.filter(p=>p.endsWith('.mp3')).length>=total);assert(!published.some(p=>/\.(wav|onnx|aivmx|exe)$/.test(p)));
if(fs.existsSync('dist/kana-study-candidate/browser-stats.json')){
 const outputs=read('dist/kana-study-candidate/browser-stats.json').outputs;const initial=new Set();
 function visit(k){if(initial.has(k))return;initial.add(k);for(const ref of outputs[k]?.imports??[])if(ref.kind!=='dynamic-import')visit(ref.path);}
 const main=Object.keys(outputs).find(k=>outputs[k].entryPoint==='src/main.manga-candidate.ts');assert(main,'Candidate entry point missing');visit(main);
 assert(Object.values(outputs).some(o=>Object.keys(o.inputs??{}).some(p=>p.includes('/data/phrase-islands/'))),'Catalog missing from candidate build');
 for(const k of initial)assert(!Object.keys(outputs[k]?.inputs??{}).some(p=>p.includes('/data/phrase-islands/')),'Catalog leaked into initial graph');
}
console.log(`Islands catalog: ${total} unique approved phrases, derived topic counts, ES/EN/CA, hashes and lazy boundary OK`);
