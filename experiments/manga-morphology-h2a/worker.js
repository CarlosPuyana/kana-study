/* Classic worker so the published Kuromoji UMD loader can use importScripts. */
let engine,cancelled=new Set();
self.onmessage=async({data})=>{
 if(data.type==='cancel'){cancelled.add(data.jobId);return;}
 try{
  const {loadEngine}=await import('./engines.mjs');
  if(data.type==='init'){const start=performance.now();engine=await loadEngine(data.engine);self.postMessage({type:'ready',ms:performance.now()-start,wasmBytes:engine.wasmMemory?.()??null,heapBytes:performance.memory?.usedJSHeapSize??null});return;}
  if(data.type==='run'){
   const start=performance.now(),times=[];let count=0;
   for(let index=0;index<data.pages.length;index++){
    if(cancelled.has(data.jobId)){cancelled.delete(data.jobId);self.postMessage({type:'cancelled',jobId:data.jobId,completedPages:index,ms:performance.now()-start});return;}
    const at=performance.now();count+=engine.tokenize(data.pages[index]).filter(t=>t.surface.trim()).length;times.push(performance.now()-at);
    self.postMessage({type:'progress',jobId:data.jobId,completedPages:index+1});
    await new Promise(resolve=>setTimeout(resolve,0));
   }
   times.sort((a,b)=>a-b);self.postMessage({type:'done',jobId:data.jobId,pages:data.pages.length,tokens:count,ms:performance.now()-start,pageMs:{min:times[0],median:times[Math.floor(times.length/2)],p95:times[Math.floor(times.length*.95)],max:times.at(-1)},wasmBytes:engine.wasmMemory?.()??null,heapBytes:performance.memory?.usedJSHeapSize??null});
  }
 }catch(error){self.postMessage({type:'error',message:String(error),stack:error.stack});}
};
