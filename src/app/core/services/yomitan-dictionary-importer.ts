import { Injectable, inject } from '@angular/core';
import { DictionaryMetadata } from '../models/dictionary.model';
import { dictionaryLock, DictionaryRepository } from './dictionary.repository';
import { DictionaryImportError, parseDictionaryIndex, parseDictionaryTerm } from './yomitan-dictionary-parser';
@Injectable({providedIn:'root'})
export class YomitanDictionaryImporter {
  private readonly repository=inject(DictionaryRepository);
  async import(file:Blob, progress:(count:number)=>void):Promise<DictionaryMetadata> {
    return dictionaryLock(async()=>{
      const {ZipReader,BlobReader,TextWriter}=await import('@zip.js/zip.js');
      const zip=new ZipReader(new BlobReader(file),{useWebWorkers:false});const id=crypto.randomUUID();let published=false;
      this.repository.activeImports.add(id);
      try {
        const entries=(await zip.getEntries()).filter(entry=>!entry.directory);
        const indexes=entries.filter(entry=>entry.filename==='index.json');
        const banks=entries.filter(entry=>/^term_bank_\d+\.json$/.test(entry.filename)).sort((a,b)=>a.filename.localeCompare(b.filename,undefined,{numeric:true}));
        if(indexes.length!==1 || !banks.length || new Set(banks.map(b=>b.filename)).size!==banks.length || !indexes[0].getData)throw new DictionaryImportError('Invalid archive');
        const index=parseDictionaryIndex(JSON.parse(await indexes[0].getData(new TextWriter(),{checkSignature:true})));
        const metadata:DictionaryMetadata={id,dictionaryId:id,...index,count:0,status:'installing',updatedAt:new Date().toISOString()};
        await this.repository.stage(metadata);progress(0);
        for(const bank of banks) {
          if(!bank.getData)throw new DictionaryImportError('Invalid bank');
          const rows:unknown=JSON.parse(await bank.getData(new TextWriter(),{checkSignature:true}));
          if(!Array.isArray(rows))throw new DictionaryImportError('Invalid bank');
          for(let offset=0;offset<rows.length;offset+=500) {
            const terms=rows.slice(offset,offset+500).map((row,i)=>parseDictionaryTerm(row,id,metadata.count+i));
            await this.repository.add(terms);metadata.count+=terms.length;metadata.updatedAt=new Date().toISOString();await this.repository.stage(metadata);progress(metadata.count);
            await new Promise<void>(resolve=>setTimeout(resolve,0));
          }
        }
        if(!metadata.count)throw new DictionaryImportError('Empty dictionary');
        // Publication happens only after all banks have been validated and committed.
        await this.repository.publish(metadata);published=true;return {...metadata,id:'active',status:'ready'};
      } catch(error) {
        if(!published)await this.repository.discard(id).catch(()=>undefined);
        throw error;
      } finally { this.repository.activeImports.delete(id);await zip.close().catch(()=>undefined); }
    });
  }
}
