import { Component, computed, DestroyRef, effect, inject, input, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslationService } from '../../core/services/translation.service';
import { WorkspaceService } from '../../core/services/workspace.service';
import { MangaOcrExplorerService } from '../../core/services/manga-ocr-explorer.service';
import { explorationCounts, OcrExploration, OcrTextMatch } from '../../core/services/manga-ocr-text';
import { MangaOcrOccurrence } from '../../core/models/manga-ocr-occurrence.model';
import { CUSTOM_DECKS_ENABLED } from '../../core/services/custom-deck-gates';
import { MANGA_DECK_ASSISTED_ENABLED } from '../../core/services/manga-deck-gate';

@Component({selector:'app-manga-ocr-explorer',imports:[RouterLink],templateUrl:'./manga-ocr-explorer.html',
  styleUrl:'./manga-ocr-explorer.scss',host:{'(window:focus)':'markStale()'}})
export class MangaOcrExplorer {
  readonly volumeId=input.required<string>();readonly query=input.required<string>();
  readonly i18n=inject(TranslationService);
  private readonly workspace=inject(WorkspaceService);
  private readonly service=inject(MangaOcrExplorerService);
  private readonly custom=inject(CUSTOM_DECKS_ENABLED);private readonly assisted=inject(MANGA_DECK_ASSISTED_ENABLED);
  readonly result=signal<OcrExploration|null>(null);readonly busy=signal(false);readonly shown=signal(20);
  readonly counts=computed(()=>this.result()?explorationCounts(this.result()!):null);
  readonly visible=computed(()=>this.result()?.matches.slice(0,this.shown())??[]);
  private controller?:AbortController;private generation=0;private alive=true;
  private readonly initialOwner=this.workspace.active();private readonly initialEpoch=this.workspace.activationRevision();
  constructor(){
    inject(DestroyRef).onDestroy(()=>{this.alive=false;this.generation++;this.controller?.abort();});
    effect(onCleanup=>{
      const id=this.volumeId(),query=this.query(),allowed=this.custom()&&this.assisted();this.workspace.active();this.workspace.activationRevision();
      onCleanup(()=>{this.controller?.abort();this.generation++;});
      untracked(()=>{this.result.set(null);this.busy.set(false);if(allowed&&id&&query&&this.workspace.active()===this.initialOwner&&this.workspace.activationRevision()===this.initialEpoch)void this.scan();});
    });
  }
  async scan(verify=false):Promise<void>{
    if(!this.custom()||!this.assisted())return;
    this.controller?.abort();const controller=new AbortController();this.controller=controller;
    const generation=++this.generation,owner=this.workspace.active(),epoch=this.workspace.activationRevision();
    const guard=()=>this.alive&&generation===this.generation&&owner===this.workspace.active()&&epoch===this.workspace.activationRevision();
    const previous=verify?this.result()?.fingerprint??undefined:undefined;
    this.busy.set(true);this.shown.set(20);
    try{
      const result=await this.service.scan(this.volumeId(),this.query(),controller.signal,r=>{if(guard())this.result.set(r);},previous);
      if(guard())this.result.set(result);
    }catch{if(guard())this.result.set(null);}
    finally{if(guard())this.busy.set(false);}
  }
  cancel():void{this.controller?.abort();}
  more():void{this.shown.update(n=>n+20);}
  navigation(match:OcrTextMatch):{mangaOcrOccurrence:MangaOcrOccurrence}{
    return {mangaOcrOccurrence:{schemaVersion:1,volumeId:this.volumeId(),pageIndex:match.pageIndex,blockIndex:match.blockIndex,lineIndex:match.lineIndex,
      start:match.start,end:match.end,found:match.found,pageFingerprint:match.pageFingerprint,
      ...(this.result()?.fingerprint?{captureFingerprint:this.result()!.fingerprint!}:{}),workspace:this.workspace.active(),activationRevision:this.workspace.activationRevision()}};
  }
  markStale():void{const result=this.result();if(result&&!this.busy()&&!['deleted','failed','cancelled','changed'].includes(result.status))this.result.set({...result,status:'stale'});}
}
