import {test} from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.ts';
import {DEFAULT_MODEL} from '../src/contract.ts';
import type {AiInput,Env} from '../src/contract.ts';

test('existing translate endpoint accepts the whole example without a page or new provider',async()=>{
  const text='大丈夫、大丈夫。一緒に行こう。',calls:{model:string;input:AiInput}[]=[];
  // Controlled suggestion from the request specification. Never contacts a paid AI endpoint.
  const expected={natural:'Tranquilo, tranquilo. Vamos juntos.',notes:['Depende del contexto.']};
  const env:Env={ALLOWED_ORIGINS:'http://127.0.0.1:4200',ASSIST_RATE_LIMITER:{async limit(){return {success:true};}},
    AI:{async run(model,input){calls.push({model,input});return {choices:[{message:{role:'assistant',content:JSON.stringify(expected)}}]};}}};
  const response=await worker.fetch(new Request('https://assistant.invalid/assist',{method:'POST',headers:{Origin:'http://127.0.0.1:4200','Content-Type':'application/json'},
    body:JSON.stringify({schemaVersion:1,mode:'translate',request:{selectedText:text,targetLanguage:'es'}})}),env);
  assert.equal(response.status,200);assert.deepEqual(await response.json(),expected);assert.equal(calls.length,1);assert.equal(calls[0].model,DEFAULT_MODEL);
  const payload=JSON.parse(calls[0].input.messages[1].content.split('\n')[1]);assert.deepEqual(payload,{selectedText:text,targetLanguage:'es'});
  assert.equal(calls[0].input.max_completion_tokens,512);assert.equal(calls[0].input.stream,false);
});
