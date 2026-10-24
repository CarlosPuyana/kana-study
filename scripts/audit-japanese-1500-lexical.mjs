// Structural provenance audit only; never infers lexical equivalence from a translation/form.
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const path=new URL('../src/app/data/japanese-1500.generated.ts',import.meta.url);
const source=readFileSync(path),text=source.toString('utf8');
const marker='= [',start=text.indexOf(marker);
if(start<0)throw Error('Editorial format changed: inspect before auditing');
const entries=JSON.parse(text.slice(start+2).trim().replace(/;$/u,''));
const pairs=new Map();
for(const e of entries){const key=JSON.stringify([e.word,e.reading]);pairs.set(key,(pairs.get(key)??0)+1);}
console.log(JSON.stringify({source:'src/app/data/japanese-1500.generated.ts',
  sha256:createHash('sha256').update(source).digest('hex'),structurallyExamined:entries.length,
  uniqueIds:new Set(entries.map(e=>e.id)).size,
  identityFields:[...new Set(entries.flatMap(e=>Object.keys(e).filter(k=>/jmdict|ent_seq|lexical|restriction/iu.test(k))))],
  repeatedForms:[...pairs].filter(([,n])=>n>1).map(([key,count])=>({form:JSON.parse(key),count})),
  linguisticallyVerified:0,verifiedMappings:0,pending:entries.length,
  evidence:'Editorial snapshot only. No verified ent_seq, lexical group, restrictions or reviewed links. Repeated forms are not certified homographs/equivalences.'},null,2));
