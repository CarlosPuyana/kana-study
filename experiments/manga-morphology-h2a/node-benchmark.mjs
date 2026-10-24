import fs from 'node:fs/promises';import{loadEngine,normalizeWithOffsets}from'./engines.mjs';import{readCorpus}from'./evaluation.mjs';
const name=process.argv[2];global.gc?.();const before=process.memoryUsage(),start=performance.now(),engine=await loadEngine(name),initMs=performance.now()-start;const corpus=await readCorpus(),times=[];let tokens=0;
for(let n=0;n<30;n++){const at=performance.now();for(const c of corpus.cases)tokens+=engine.tokenize(normalizeWithOffsets(c.text).text).length;times.push(performance.now()-at);}
global.gc?.();const after=process.memoryUsage();console.log(JSON.stringify({name,initMs,before,after,peakProcessRssKiB:process.resourceUsage().maxRSS,wasmMemory:engine.wasmMemory?.()??null,corpusTimesMs:times,tokens}));engine.dispose?.();
