import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { TranslationService } from '../../core/services/translation.service';
import { DictionaryRepository } from '../../core/services/dictionary.repository';
import { YomitanDictionaryImporter } from '../../core/services/yomitan-dictionary-importer';
import { DictionaryMetadata } from '../../core/models/dictionary.model';
export const JMDICT_DOWNLOAD_URL = 'dictionaries/JMdict_spanish.zip';
@Component({selector:'app-dictionary-install',template:`<section class="dictionary-card">
  <h2>{{i18n.t('dictionary.title')}}</h2>
  @if(ready();as metadata){<p>{{i18n.t('dictionary.installed')}}</p><p>{{metadata.count.toLocaleString(i18n.language())}} {{i18n.t('dictionary.entries')}}</p>}
  @else{<p>{{i18n.t('dictionary.installHelp')}}</p>}
  <div class="install-actions">
    <button [disabled]="busy()" (click)="download()">{{i18n.t(ready()?'dictionary.update':'dictionary.downloadInstall')}}</button>
    <label [class.disabled]="busy()"><span>{{i18n.t('dictionary.manualImport')}}</span><input type="file" accept=".zip" [disabled]="busy()" (change)="install($event)"/></label>
  </div>
  @if(phase()==='download'){<p role="status">{{i18n.t('dictionary.downloading')}} @if(percent()!==null){<span>{{percent()}} %</span>}</p>}
  @else if(busy()){<p role="status">{{i18n.t('dictionary.importing')}} {{count().toLocaleString(i18n.language())}} {{i18n.t('dictionary.entries')}}</p>}
  @if(error()){<p role="alert">{{i18n.t(error()==='download'?'dictionary.downloadError':'dictionary.importError')}}</p>}
  <small>{{i18n.t('dictionary.attribution')}}</small>
</section>`,styles:[`.dictionary-card{margin-block:1.5rem;padding:1rem;border:1px solid var(--border);border-radius:1rem;background:var(--surface);color:var(--text-primary);}h2{font-size:1.1rem;}p,small{color:var(--text-secondary);}small{display:block;margin-top:1rem;}.install-actions{display:flex;flex-wrap:wrap;gap:.75rem;}button,label{position:relative;display:inline-block;padding:.65rem 1rem;border:1px solid var(--border);border-radius:.7rem;background:var(--surface-raised);color:var(--text-primary);font:inherit;cursor:pointer;}button{background:var(--primary);color:var(--background);}input{position:absolute;inset:0;width:100%;opacity:0;cursor:pointer;}label:focus-within{outline:2px solid var(--focus-ring);outline-offset:3px;}button:disabled,.disabled{opacity:.5;cursor:default;}`]})
export class DictionaryInstallComponent implements OnInit, OnDestroy {
  readonly i18n=inject(TranslationService);private readonly repository=inject(DictionaryRepository);private readonly importer=inject(YomitanDictionaryImporter);
  readonly ready=signal<DictionaryMetadata|undefined>(undefined);readonly busy=signal(false);readonly count=signal(0);readonly error=signal<'download'|'import'|null>(null);
  readonly phase=signal<'download'|'import'|null>(null);readonly percent=signal<number|null>(null);
  private controller:AbortController|null=null;private destroyed=false;
  async ngOnInit():Promise<void>{try{await this.repository.cleanup();const ready=await this.repository.ready();if(!this.destroyed)this.ready.set(ready);}catch{if(!this.destroyed)this.error.set('import');}}
  private begin(phase:'download'|'import'):void{this.busy.set(true);this.phase.set(phase);this.count.set(0);this.percent.set(null);this.error.set(null);}
  private async prepare(blob:Blob):Promise<void>{
    this.phase.set('import');
    const ready=await this.importer.import(blob,count=>{if(!this.destroyed)this.count.set(count);});
    if(!this.destroyed)this.ready.set(ready);
  }
  async download():Promise<void>{
    if(this.busy()||this.destroyed)return;this.begin('download');const controller=new AbortController();this.controller=controller;
    try{
      const response=await fetch(new URL(JMDICT_DOWNLOAD_URL,document.baseURI).href,{signal:controller.signal});
      if(!response.ok)throw new Error(`HTTP ${response.status}`);
      const length=Number(response.headers.get('Content-Length'));const total=Number.isFinite(length)&&length>0?length:null;
      let blob:Blob;
      if(response.body){
        const reader=response.body.getReader();const chunks:ArrayBuffer[]=[];let received=0;
        try{while(true){const {done,value}=await reader.read();if(done)break;controller.signal.throwIfAborted();chunks.push(value.slice().buffer);received+=value.byteLength;if(total)this.percent.set(Math.min(100,Math.floor(received/total*100)));}}
        finally{reader.releaseLock();}
        blob=new Blob(chunks,{type:'application/zip'});
      }else{blob=await response.blob();}
      controller.signal.throwIfAborted();if(this.destroyed)return;
      await this.prepare(blob);
    }catch{if(!this.destroyed)this.error.set(this.phase()==='download'?'download':'import');}
    finally{this.controller=null;if(!this.destroyed){this.busy.set(false);this.phase.set(null);}}
  }
  async install(event:Event):Promise<void>{const input=event.target as HTMLInputElement;const file=input.files?.[0];if(!file||this.busy()||this.destroyed)return;this.begin('import');
    try{await this.prepare(file);}catch{if(!this.destroyed)this.error.set('import');}finally{if(!this.destroyed){this.busy.set(false);this.phase.set(null);}input.value='';}
  }
  ngOnDestroy():void{this.destroyed=true;this.controller?.abort();}
}
