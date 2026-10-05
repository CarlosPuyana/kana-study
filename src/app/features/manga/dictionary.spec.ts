import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { ZipWriter, Uint8ArrayWriter, TextReader } from '@zip.js/zip.js';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DictionaryRepository } from '../../core/services/dictionary.repository';
import { YomitanDictionaryImporter } from '../../core/services/yomitan-dictionary-importer';
import { glossaryText, parseDictionaryTerm } from '../../core/services/yomitan-dictionary-parser';
import { JapaneseLookupService, japaneseCandidates } from '../../core/services/japanese-lookup.service';
import { DictionaryPopup } from '../../shared/components/dictionary-popup/dictionary-popup';
import { WorkspaceService } from '../../core/services/workspace.service';
import { TranslationService } from '../../core/services/translation.service';
// jsdom lacks the standard Blob methods used by zip.js TextReader/TextWriter.
Object.defineProperty(Blob.prototype,'arrayBuffer',{configurable:true,value:function(this:Blob):Promise<ArrayBuffer>{return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result as ArrayBuffer);reader.onerror=()=>reject(reader.error);reader.readAsArrayBuffer(this);});}});
const rows=[['学校','がっこう','n','','0', ['escuela','colegio'],1,''],['魔法','まほう',null,'',0,[{type:'structured-content',content:{tag:'div',content:['magia',{tag:'img',path:'ignored.png'}]}}],2,'']].map(row=>{row[4]=0;return row;});
async function archive(banks:unknown=rows,withIndex=true):Promise<Blob>{
  const zip=new ZipWriter(new Uint8ArrayWriter(),{useWebWorkers:false,level:0});
  if(withIndex)await zip.add('index.json',new TextReader(JSON.stringify({title:'JMdict (Spanish)',revision:'fixture',format:3,targetLanguage:'es'})));
  await zip.add('term_bank_1.json',new TextReader(JSON.stringify(banks)));
  const bytes=await zip.close();
  // Minimal Blob read interface for deterministic ZIP fixtures in jsdom.
  return {size:bytes.length,arrayBuffer:async()=>bytes.buffer,slice:(start:number,end:number)=>({arrayBuffer:async()=>bytes.slice(start,end).buffer})} as unknown as Blob;
}
describe('Dictionary V1',()=>{
  let repository:DictionaryRepository,importer:YomitanDictionaryImporter;
  beforeEach(()=>{vi.stubGlobal('indexedDB',new IDBFactory());localStorage.clear();TestBed.configureTestingModule({providers:[provideRouter([]),{provide:TranslationService,useValue:{t:(key:string)=>key,language:()=>'es'}}]});repository=TestBed.inject(DictionaryRepository);importer=TestBed.inject(YomitanDictionaryImporter);});
  it('parses the standard eight-field term bank entry',()=>{expect(parseDictionaryTerm(rows[0],'fixture',0)).toMatchObject({expression:'学校',reading:'がっこう',glossaries:['escuela','colegio'],sequence:1});});
  it('extracts safe text from modern structured glossaries, dropping media and duplicates',()=>{expect(glossaryText(['escuela',{type:'structured-content',content:[{text:'colegio'},{tag:'img',text:'omit'},{content:['escuela',' ']}]}])).toEqual(['escuela','colegio']);});
  it('imports two fixture entries and looks up an expression locally',async()=>{
    const counts:number[]=[];const metadata=await importer.import(await archive(),count=>counts.push(count));
    expect(metadata.count).toBe(2);expect(counts).toEqual([0,2]);expect((await repository.find(metadata.dictionaryId,'学校','expression'))[0].glossaries).toEqual(['escuela','colegio']);
    expect((await TestBed.inject(JapaneseLookupService).lookup('学校',0)).terms[0].expression).toBe('学校');
  });
  it('looks up by reading',async()=>{await importer.import(await archive(),()=>{});expect((await TestBed.inject(JapaneseLookupService).lookup('がっこう',0)).terms[0].expression).toBe('学校');});
  it('finds 学校 around the clicked offset and caps fallback candidates',async()=>{
    await importer.import(await archive(),()=>{});const text='今日は学校に行く';expect(japaneseCandidates(text,3)).toContain('学校');expect(japaneseCandidates(text,4)).toContain('学校');
    expect((await TestBed.inject(JapaneseLookupService).lookup(text,3)).terms[0].expression).toBe('学校');expect(japaneseCandidates('あ'.repeat(80),40).length).toBeLessThanOrEqual(32);
  });
  it('cleans interrupted staging without marking it ready',async()=>{
    const metadata={id:'partial',dictionaryId:'partial',title:'JMdict (Spanish)',revision:'fixture',count:1,status:'installing' as const,updatedAt:'1970-01-01'};
    await repository.stage(metadata);await repository.add([parseDictionaryTerm(rows[0],'partial',0)]);expect(await repository.ready()).toBeUndefined();await repository.cleanup();expect(await repository.find('partial','学校','expression')).toEqual([]);
  });
  it('keeps a valid dictionary after a malformed reinstall and rejects missing index',async()=>{
    const installed=await importer.import(await archive(),()=>{});
    await expect(importer.import(await archive([rows[0],['broken']]),()=>{})).rejects.toThrow();expect((await repository.ready())?.dictionaryId).toBe(installed.dictionaryId);
    await expect(importer.import(await archive(rows,false),()=>{})).rejects.toThrow();expect((await repository.find(installed.dictionaryId,'学校','expression')).length).toBe(1);
  });
  it('shares one dictionary between Guest and user workspaces and fresh repository instances',async()=>{
    const installed=await importer.import(await archive(),()=>{});TestBed.inject(WorkspaceService).activateUser('carlos');TestBed.resetTestingModule();
    expect((await TestBed.inject(DictionaryRepository).ready())?.dictionaryId).toBe(installed.dictionaryId);
  });
  it('renders expression, reading and glossary as DOM text',()=>{
    const fixture=TestBed.createComponent(DictionaryPopup);fixture.componentRef.setInput('result',{installed:true,query:'学校',terms:[parseDictionaryTerm(rows[0],'fixture',0)]});fixture.detectChanges();
    const element=fixture.nativeElement as HTMLElement;expect(element.querySelector('h2')?.textContent).toBe('学校');expect(element.querySelector('.reading')?.textContent).toBe('がっこう');expect([...element.querySelectorAll('li')].map(li=>li.textContent)).toEqual(['escuela','colegio']);fixture.destroy();
  });
});
