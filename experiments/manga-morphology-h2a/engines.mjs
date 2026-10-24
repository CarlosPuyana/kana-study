/** Experimental adapters only. Never imported from src/ or application assets. */
export function hiragana(value){return value.replace(/[ァ-ヶ]/gu,c=>String.fromCharCode(c.charCodeAt(0)-0x60));}
export function normalizeWithOffsets(original){
 const map=[],parts=[];let cursor=0;
 for(const {segment,index} of new Intl.Segmenter('ja',{granularity:'grapheme'}).segment(original)){
  const normalized=segment.normalize('NFC');parts.push(normalized);
  for(let n=0;n<normalized.length;n++)map.push([index,index+segment.length]);cursor+=normalized.length;
 }
 return {original,text:parts.join(''),map,originalRange(start,end){if(start<0||end>map.length||end<=start)throw Error('Invalid normalized range');return [map[start][0],map[end-1][1]];}};
}
export function byteToUtf16(text,byte){const bytes=new TextEncoder().encode(text);if(byte<0||byte>bytes.length)throw Error('Invalid byte offset');return new TextDecoder('utf-8',{fatal:true}).decode(bytes.slice(0,byte)).length;}
export function codepointToUtf16(text,offset){return Array.from(text).slice(0,offset).join('').length;}
const optional=value=>value&&value!=='*'?value:null;
export function normalizeKuromoji(text,raw){const positions=[0];let offset=0;for(const char of text){offset+=char.length;positions.push(offset);}return raw.map(t=>{const start=positions[t.word_position-1];return {surface:t.surface_form,start,end:start+t.surface_form.length,lemma:optional(t.basic_form),reading:optional(t.reading)?hiragana(t.reading):null,pos:t.pos,subpos:t.pos_detail_1,unknown:t.word_type==='UNKNOWN',rawOffset:t.word_position};});}
export function normalizeLindera(text,raw){const positions=new Map([[0,0]]);let byte=0,offset=0;for(const char of text){byte+=new TextEncoder().encode(char).length;offset+=char.length;positions.set(byte,offset);}return raw.map(t=>({surface:t.surface,start:positions.get(t.byteStart),end:positions.get(t.byteEnd),lemma:optional(t.details?.[6]),reading:optional(t.details?.[7])?hiragana(t.details[7]):null,pos:t.details?.[0]??null,subpos:t.details?.[1]??null,unknown:t.isUnknown,rawOffset:[t.byteStart,t.byteEnd]}));}
export async function loadEngine(name){
 if(name==='intl'){
  const segmenter=new Intl.Segmenter('ja',{granularity:'word'});
  return {tokenize:text=>Array.from(segmenter.segment(text),t=>({surface:t.segment,start:t.index,end:t.index+t.segment.length,lemma:null,reading:null,pos:null,subpos:null,unknown:null,rawOffset:t.index}))};
 }
 const node=typeof process!=='undefined'&&!!process.versions?.node;
 if(name==='kuromoji'){
  let kuromoji;
  if(node){const mod=await import('kuromoji');kuromoji=mod.default;}else{importScripts('node_modules/kuromoji/build/kuromoji.js');kuromoji=self.kuromoji;}
  const dicPath=node?new URL('./node_modules/kuromoji/dict/',import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1'):'node_modules/kuromoji/dict/';
  const tokenizer=await new Promise((resolve,reject)=>kuromoji.builder({dicPath}).build((err,t)=>err?reject(err):resolve(t)));
  return {tokenize:text=>normalizeKuromoji(text,tokenizer.tokenize(text))};
 }
 if(name!=='lindera')throw Error('Unknown engine');
 const module=await import('./node_modules/lindera-wasm/lindera_wasm.js');
 const names=['metadata.json','dict.trie','dict.valsidx','dict.vals','dict.wordsidx','dict.words','matrix.mtx','char_def.bin','unk.bin'];
 let arrays,wasm;
 if(node){const fs=await import('node:fs/promises');wasm=await fs.readFile(new URL('./node_modules/lindera-wasm/lindera_wasm_bg.wasm',import.meta.url));arrays=await Promise.all(names.map(n=>fs.readFile(new URL('./resources/ipadic/lindera-ipadic/'+n,import.meta.url))));}
 else{wasm=await fetch(new URL('./node_modules/lindera-wasm/lindera_wasm_bg.wasm',import.meta.url));arrays=await Promise.all(names.map(async n=>new Uint8Array(await(await fetch(new URL('./resources/ipadic/lindera-ipadic/'+n,import.meta.url))).arrayBuffer())));}
 const exports=await module.default({module_or_path:wasm});const dictionary=module.loadDictionaryFromBytes(...arrays);const tokenizer=new module.Tokenizer(dictionary,'normal');
 return {tokenize:text=>normalizeLindera(text,tokenizer.tokenize(text)),wasmMemory:()=>exports.memory.buffer.byteLength,dispose:()=>{tokenizer.free();}};
}
