// Controlled measurement. Does not edit Grammar, expectations, timeouts or runner configuration.
import {spawn} from 'node:child_process';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {availableParallelism,platform,release} from 'node:os';
const root=process.cwd(),out=resolve(root,'.cache/h4bc-grammar');await mkdir(out,{recursive:true});
const label=process.argv[2]??'isolated',count=Number(process.argv[3]??3);if(!/^(isolated|loaded)(-after)?$/.test(label)||!Number.isInteger(count)||count<1||count>3)throw new Error('Bounded experiment: isolated/loaded, 1..3 runs');
const runs=[];for(let i=1;i<=count;i++){
 const report=resolve(out,`${label}-${i}.json`),start=Date.now();
 const args=[resolve(root,'node_modules/@angular/cli/bin/ng.js'),'test','--watch=false','--include=src/app/features/grammar/grammar.spec.ts','--reporters=json',`--output-file=${report}`];
 const process=spawn(globalThis.process.execPath,args,{cwd:root,windowsHide:true,stdio:['ignore','pipe','pipe']});let log='';process.stdout.on('data',b=>log+=b);process.stderr.on('data',b=>log+=b);
 const code=await new Promise((done,reject)=>{process.on('error',reject);process.on('exit',done);});await writeFile(resolve(out,`${label}-${i}.log`),log);
 let testReport;try{testReport=JSON.parse(await readFile(report,'utf8'));}catch{}
 const tests=(testReport?.testResults??[]).flatMap(s=>s.assertionResults??[]);const exact=tests.find(t=>t.title==='renders every topic overview and every micro-lesson from data');
 const topics=tests.filter(t=>/^renders topic .* overview and all its micro-lessons from data$/.test(t.title));
 const aggregate=exact?{status:exact.status,durationMs:exact.duration,failureMessages:exact.failureMessages}:topics.length?{status:topics.every(t=>t.status==='passed')?'passed':'failed',cases:topics.length,durationMs:Math.max(...topics.map(t=>t.duration)),totalMs:topics.reduce((n,t)=>n+t.duration,0),failureMessages:topics.flatMap(t=>t.failureMessages)}:null;
 const result={label,run:i,code,wallMs:Date.now()-start,tests:tests.length,passed:tests.filter(t=>t.status==='passed').length,exact:aggregate};runs.push(result);console.log(JSON.stringify(result));
}
await writeFile(resolve(out,`${label}-summary.json`),JSON.stringify({environment:{node:process.version,platform:platform(),release:release(),availableParallelism:availableParallelism()},runs},null,2));
if(runs.some(r=>r.exact===null||r.code!==0))process.exitCode=1;
