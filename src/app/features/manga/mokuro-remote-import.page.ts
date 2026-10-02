import { Component, effect, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslationService } from '../../core/services/translation.service';
import { WorkspaceService } from '../../core/services/workspace.service';
import { MokuroRemoteImportService, parseRemoteLink, RemoteDownloadProgress, RemoteImportError, RemotePreview } from '../../core/services/mokuro-remote-import.service';
import { MangaError } from '../../core/services/mokuro-parser';
@Component({selector:'app-mokuro-remote-import',imports:[RouterLink],styleUrl:'./mokuro-remote-import.scss',template:`<main>
  <h1>{{i18n.t('manga.remote.title')}}</h1>
  @if(errorKey()){<p role="alert">{{i18n.t(errorKey())}}</p>}
  @if(volumeId()){
    <p role="status">{{i18n.t('manga.remote.success')}}</p><div class="actions"><a [routerLink]="['/manga/read',volumeId()]">{{i18n.t('manga.remote.readNow')}}</a><a routerLink="/manga">{{i18n.t('manga.library')}}</a></div>
  } @else if(preview();as data){
    @if(data.manifest.coverUrl&&!coverFailed()){<img class="cover" [src]="data.manifest.coverUrl" [alt]="data.manifest.volume" referrerpolicy="no-referrer" (error)="coverFailed.set(true)"/>}
    <p class="series">{{data.manifest.series}}</p><h2>{{data.manifest.volume}}</h2>
    <dl><div><dt>{{i18n.t('manga.remote.source')}}</dt><dd>{{i18n.t('manga.remote.compatible')}}</dd></div><div><dt>OCR</dt><dd>{{i18n.t('manga.remote.ocrAvailable')}}</dd></div>@if(data.manifest.size!==undefined){<div><dt>{{i18n.t('manga.remote.size')}}</dt><dd>{{mb(data.manifest.size!)}} MB</dd></div>}</dl>
    @if(data.existing){<p>{{i18n.t('manga.remote.exists')}}</p><div class="actions"><a [routerLink]="['/manga/read',data.existing.id]">{{i18n.t('manga.read')}}</a><a routerLink="/manga">{{i18n.t('manga.remote.back')}}</a></div>}
    @else{
      @if(phase()==='archive'||phase()==='ocr'){<p role="status">{{i18n.t(phase()==='ocr'?'manga.remote.downloadingOcr':'manga.remote.downloading')}} {{mb(downloadProgress().received)}} MB @if(downloadProgress().total;as total){/ {{mb(total)}} MB · {{percent()}} %}</p><progress [attr.value]="downloadProgress().total?percent():null" max="100"></progress>}
      @if(phase()==='processing'){<p role="status">{{i18n.t('manga.processing')}} {{processed()}} / {{totalPages()}}</p>}
      <div class="actions"><button [disabled]="busy()" (click)="confirm()">{{i18n.t('manga.remote.add')}}</button><button (click)="cancel()">{{i18n.t('common.cancel')}}</button></div>
    }
  } @else { @if(phase()==='preview'){<p role="status">{{i18n.t('common.loading')}}</p>}<a routerLink="/manga">{{i18n.t('manga.remote.back')}}</a> }
</main>`})
export class MokuroRemoteImportPage implements OnInit,OnDestroy {
  readonly i18n=inject(TranslationService);private readonly remote=inject(MokuroRemoteImportService);private readonly route=inject(ActivatedRoute);private readonly router=inject(Router);private readonly workspaceService=inject(WorkspaceService);private readonly workspace=this.workspaceService.active();
  readonly preview=signal<RemotePreview|null>(null);readonly phase=signal<'preview'|'ready'|'archive'|'ocr'|'processing'|'done'>('preview');readonly errorKey=signal('');readonly volumeId=signal('');readonly coverFailed=signal(false);
  readonly downloadProgress=signal<RemoteDownloadProgress>({received:0,total:null});readonly processed=signal(0);readonly totalPages=signal(0);
  private readonly controller=new AbortController();private destroyed=false;
  constructor(){effect(()=>{if(this.workspaceService.active()!==this.workspace){this.controller.abort();void this.router.navigateByUrl('/manga');}});}
  async ngOnInit():Promise<void>{try{const link=parseRemoteLink(this.route.snapshot.queryParamMap);const preview=await this.remote.preview(link,this.controller.signal,this.workspace);if(!this.destroyed)this.preview.set(preview);}catch(error){if(!this.destroyed)this.showError(error);}finally{if(!this.destroyed)this.phase.set('ready');}}
  busy():boolean{return ['preview','archive','ocr','processing'].includes(this.phase());}
  async confirm():Promise<void>{const preview=this.preview();if(!preview||preview.existing||this.busy()||this.destroyed)return;this.errorKey.set('');this.phase.set('archive');
    try{const id=await this.remote.import(preview.manifest,this.controller.signal,(phase,progress)=>{if(!this.destroyed){this.phase.set(phase);this.downloadProgress.set(progress);}},(current,total)=>{if(!this.destroyed){this.phase.set('processing');this.processed.set(current);this.totalPages.set(total);}},this.workspace);if(!this.destroyed){this.volumeId.set(id);this.phase.set('done');}}
    catch(error){if(!this.destroyed){this.showError(error);this.phase.set('ready');}}
  }
  private showError(error:unknown):void{this.errorKey.set(this.controller.signal.aborted?'manga.remote.cancelled':error instanceof RemoteImportError?'manga.remote.'+error.code:error instanceof MangaError?(error.code==='cancelled'?'manga.remote.cancelled':'manga.error.'+error.code):'manga.remote.network');}
  percent():number{const progress=this.downloadProgress();return progress.total?Math.min(100,Math.floor(progress.received/progress.total*100)):0;}
  mb(bytes:number):string{return (bytes/1024/1024).toFixed(1);}
  cancel():void{this.controller.abort();void this.router.navigateByUrl('/manga');}
  ngOnDestroy():void{this.destroyed=true;this.controller.abort();}
}
