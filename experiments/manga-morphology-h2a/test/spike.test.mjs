import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';
import{normalizeWithOffsets,byteToUtf16,codepointToUtf16,normalizeLindera,normalizeKuromoji,hiragana,loadEngine}from'../engines.mjs';
import{readCorpus,makeLexicalScreen,wilson,metrics}from'../evaluation.mjs';import{automaticSelectionGate}from'../gate.mjs';
const corpus=await readCorpus();
test('reference cases are unique, explicitly justified and cover mandatory examples without being called human gold',()=>{
 assert.equal(corpus.cases.length,100);assert.equal(new Set(corpus.cases.map(c=>c.id)).size,100);assert.ok(corpus.cases.filter(c=>c.difficulty==='hard').length>=50);assert.ok(corpus.cases.every(c=>c.rationale.length>15));
 for(const [text,lemma]of [['食べなかった','食べる'],['負けぬ','負ける'],['来ました','来る']])assert.equal(corpus.cases.find(c=>c.text===text).lemma,lemma);
 for(const text of ['橋','箸','生','ここ','此処','そういう','百合姫谷も'])assert.ok(corpus.cases.some(c=>c.text===text));
});
test('NFC preserves exact original UTF-16 spans, supplementary code points and halfwidth distinctions',()=>{
 const n=normalizeWithOffsets('😀か\u3099猫ｶ');assert.equal(n.text,'😀が猫ｶ');assert.deepEqual(n.originalRange(2,3),[2,4]);assert.deepEqual(n.originalRange(3,4),[4,5]);assert.equal(hiragana('カー'), 'かー');assert.notEqual(hiragana('ｶ'),'か');assert.throws(()=>n.originalRange(-1,3));
});
test('engine byte/codepoint offsets map to UTF-16 without an O(tokens*text) conversion',()=>{
 const text='😀猫';assert.equal(byteToUtf16(text,4),2);assert.equal(codepointToUtf16(text,1),2);assert.throws(()=>byteToUtf16(text,1));
 const l=normalizeLindera(text,[{surface:'猫',byteStart:4,byteEnd:7,details:['名詞','一般','*','*','*','*','猫','ネコ'],isUnknown:false}]);assert.deepEqual([l[0].start,l[0].end],[2,3]);
 const k=normalizeKuromoji(text,[{surface_form:'猫',word_position:2,basic_form:'猫',reading:'ネコ',pos:'名詞',word_type:'KNOWN'}]);assert.deepEqual([k[0].start,k[0].end],[2,3]);
});
test('the screening prototype never manufactures a final identity or merges equal readings',()=>{
 const rows=[['橋','はし','n','',0,['puente'],1237410,''],['箸','はし','n','',0,['palillos'],1476410,'']];const screen=makeLexicalScreen(rows);
 const token={surface:'橋',lemma:'橋',reading:'はし',pos:'名詞',subpos:'一般',unknown:false};const bridge=screen(token),chopsticks=screen({...token,surface:'箸',lemma:'箸'});
 assert.equal(bridge.identity,null);assert.notEqual(bridge.provisionalEntry.entryId,chopsticks.provisionalEntry.entryId);
 assert.equal(makeLexicalScreen([...rows,rows[0]])(token).classification,'ambiguous');
 assert.equal(screen({...token,pos:null,reading:null}).classification,'ambiguous');
});
test('zero acceptance is not 100% precision; precision/recall and Wilson use explicit denominators',()=>{
 assert.equal(wilson(0,0),null);assert.ok(wilson(28,42)[0]<.67);assert.ok(wilson(28,42)[1]>.67);
 const c={id:'one',text:'猫',span:[0,1],tokens:['猫'],lemma:'猫',lemmaReading:'ねこ',reading:'ねこ',pos:'名詞',classification:'verified',rationale:'test'};
 const r=metrics([c],[[{surface:'猫',start:0,end:1}]],t=>({classification:'unknown',token:t}));assert.equal(r.pipeline.precision,null);assert.equal(r.pipeline.recall,0);
});
test('current real measurements fail the release gate, not a silently accepted empty pipeline',async()=>{
 const report=JSON.parse(await fs.readFile(new URL('../reports/linguistic.json',import.meta.url)));const gate=automaticSelectionGate(report);assert.equal(gate.allowed,false);assert.ok(gate.reasons.includes('kuromoji:unsafe-fixtures-accepted'));assert.ok(gate.reasons.includes('lindera:precision-below-98'));assert.ok(report.engines.lindera.counts.acceptedTP>0);
});
for(const engineName of ['intl','kuromoji','lindera'])test(engineName+': real local engine returns exact source offsets and can be disposed safely',async()=>{
 const engine=await loadEngine(engineName);try{const text='😀猫が来ました。';const tokens=engine.tokenize(text);assert.ok(tokens.length>0);for(const t of tokens)assert.equal(text.slice(t.start,t.end),t.surface);if(engineName!=='intl'){const token=tokens.find(t=>t.surface==='来');assert.equal(token.lemma,'来る');assert.equal(token.reading,'き');}}finally{engine.dispose?.();}
});

test('recorded Worker benchmarks exercise cancellation, UI input, offline initialization and only loopback requests',async()=>{
 const report=JSON.parse(await fs.readFile(new URL('../reports/browser.json',import.meta.url)));
 assert.equal(report.prefix,'/kana-study/spike/');
 for(const result of Object.values(report.engines)){
  assert.equal(result.hundred.pages,100);assert.equal(result.fiveHundred.pages,500);
  assert.ok(result.cancel.completedPages<500);assert.ok(result.cancel.observedLatencyMs>=0);
  assert.equal(result.uiClick.clicks,1);assert.equal(result.offline.success,true);assert.deepEqual(result.externalRequests,[]);
 }
});
