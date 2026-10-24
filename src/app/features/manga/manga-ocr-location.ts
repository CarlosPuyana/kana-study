import { Component, DestroyRef, effect, inject, input, output, signal, untracked } from '@angular/core';
import { MangaPage } from '../../core/models/manga.model';
import { MangaOcrSourceService } from '../../core/services/manga-ocr-source.service';
import { locateOcrOccurrence, OcrLocationResult, parseOcrOccurrence } from '../../core/services/manga-ocr-location';
import { WorkspaceService } from '../../core/services/workspace.service';
import { TranslationService } from '../../core/services/translation.service';
import { CUSTOM_DECKS_ENABLED } from '../../core/services/custom-deck-gates';
import { MANGA_DECK_ASSISTED_ENABLED } from '../../core/services/manga-deck-gate';

export interface LocatedOcrLine {readonly page:MangaPage;readonly blockIndex:number;readonly lineIndex:number;}
@Component({selector:'app-manga-ocr-location',templateUrl:'./manga-ocr-location.html',styleUrl:'./manga-ocr-location.scss'})
export class MangaOcrLocation {
  readonly reference=input.required<unknown>();readonly volumeId=input.required<string>();readonly page=input<MangaPage>();
  readonly unavailable=input(false);
  readonly located=output<LocatedOcrLine|null>();readonly dismissed=output<void>();
  readonly i18n=inject(TranslationService);
  private readonly source=inject(MangaOcrSourceService);private readonly workspace=inject(WorkspaceService);
  private readonly custom=inject(CUSTOM_DECKS_ENABLED);private readonly assisted=inject(MANGA_DECK_ASSISTED_ENABLED);
  readonly result=signal<OcrLocationResult|{status:'pending'}>({status:'pending'});
  constructor(){
    let alive=true;inject(DestroyRef).onDestroy(()=>alive=false);
    effect(onCleanup=>{
      const value=this.reference(),id=this.volumeId(),page=this.page(),owner=this.workspace.active(),epoch=this.workspace.activationRevision();
      const allowed=this.custom()&&this.assisted(),unavailable=this.unavailable(),controller=new AbortController();let current=true;
      onCleanup(()=>{current=false;controller.abort();});
      const guard=()=>{if(!alive||!current||controller.signal.aborted||owner!==this.workspace.active()||epoch!==this.workspace.activationRevision())throw Error('obsolete-location');};
      untracked(()=>{this.result.set({status:'pending'});this.located.emit(null);});
      if(!allowed||unavailable){untracked(()=>this.result.set({status:'unavailable'}));return;}
      if(!page)return;
      const ref=parseOcrOccurrence(value);
      if(!ref||ref.volumeId!==id||ref.pageIndex!==page.pageIndex||ref.workspace!==owner||ref.activationRevision!==epoch||page.volumeId!==id){untracked(()=>this.result.set({status:'unavailable'}));return;}
      void (async()=>{
        try{
          const source=await this.source.open(id,owner,controller.signal);guard();
          if(!source||page.pageIndex>=source.pageCount){this.result.set({status:'unavailable'});return;}
          const fresh=await source.read(page.pageIndex);guard();
          const result=await locateOcrOccurrence(ref,id,page.pageIndex,owner,epoch,fresh?.ocr??null,page.ocr,guard);guard();this.result.set(result);
          this.located.emit(result.status==='line'?{page,blockIndex:result.reference.blockIndex,lineIndex:result.reference.lineIndex}:null);
        }catch{if(alive&&current&&owner===this.workspace.active()&&epoch===this.workspace.activationRevision())this.result.set({status:'unavailable'});}
      })();
    });
  }
  verified(){const result=this.result();return result.status==='line'||result.status==='text'?result:null;}
}
