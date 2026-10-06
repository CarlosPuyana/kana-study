import ts from 'typescript';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {ZipReader,Uint8ArrayReader,TextWriter,Uint8ArrayWriter} from '@zip.js/zip.js';

test('included archive contains valid Mokuro metadata and exactly 20 mapped WebP pages',async()=>{
  const bytes=await readFile(new URL('../public/manga/default/hajimete-no-irai.zip',import.meta.url));
  const reader=new ZipReader(new Uint8ArrayReader(bytes),{useWebWorkers:false});
  try{
    const entries=(await reader.getEntries()).filter(entry=>!entry.directory);
    const documents=entries.filter(entry=>entry.filename.endsWith('.mokuro'));
    assert.equal(documents.length,1);assert.equal(documents[0].filename,'ja.mokuro');
    // Compile the pure existing parser for this Node check, without modifying app configuration.
    const source=await readFile(new URL('../src/app/core/services/mokuro-parser.ts',import.meta.url),'utf8');
    const javascript=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
    const {parseMokuro,mapMokuroImages}=await import('data:text/javascript;base64,'+Buffer.from(javascript).toString('base64'));
    const doc=parseMokuro(await documents[0].getData(new TextWriter(),{checkSignature:true}));
    assert.deepEqual(mapMokuroImages(doc,entries.map(entry=>entry.filename),'ja.mokuro'),doc.pages.map(page=>page.img_path));
    assert.equal(doc.version,'0.2.0');assert.equal(doc.title,'はじめての依頼');assert.equal(doc.volume,'1');assert.equal(doc.pages.length,20);
    assert.equal(new Set(doc.pages.map(page=>page.img_path)).size,20);
    assert.equal(entries.filter(entry=>entry.filename.endsWith('.webp')).length,20);
    for(const page of doc.pages){
      assert.match(page.img_path,/^pages\/jp\/[^/]+\.webp$/);assert.ok(page.img_width>0 && page.img_height>0);assert.ok(Array.isArray(page.blocks));
      const entry=entries.find(entry=>entry.filename===page.img_path);assert.ok(entry);
      const image=await entry.getData(new Uint8ArrayWriter(),{checkSignature:true});
      assert.ok(image.length>16);assert.equal(Buffer.from(image.subarray(0,4)).toString(),'RIFF');assert.equal(Buffer.from(image.subarray(8,12)).toString(),'WEBP');
    }
  }finally{await reader.close();}
});
