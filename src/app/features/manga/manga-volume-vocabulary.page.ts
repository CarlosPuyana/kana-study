import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslationService } from '../../core/services/translation.service';
import { WorkspaceService } from '../../core/services/workspace.service';
import { CustomDeckRepository } from '../../core/services/custom-deck.repository';
import { MangaVolumeVocabularyService } from '../../core/services/manga-volume-vocabulary.service';
import { filterVolumeVocabulary, VolumeVocabulary, VolumeVocabularySort, VolumeVocabularyState } from '../../core/services/manga-volume-vocabulary';
import { CUSTOM_DECKS_ENABLED } from '../../core/services/custom-deck-gates';
import { MANGA_DECK_ASSISTED_ENABLED } from '../../core/services/manga-deck-gate';
import { MangaOcrExplorer } from './manga-ocr-explorer';

@Component({selector:'app-manga-volume-vocabulary',imports:[FormsModule,RouterLink,MangaOcrExplorer],
  templateUrl:'./manga-volume-vocabulary.page.html',styleUrl:'./manga-volume-vocabulary.page.scss'})
export class MangaVolumeVocabularyPage {
  readonly i18n=inject(TranslationService);
  readonly customEnabled=inject(CUSTOM_DECKS_ENABLED);
  readonly assistedEnabled=inject(MANGA_DECK_ASSISTED_ENABLED);
  private readonly workspace=inject(WorkspaceService);
  private readonly repository=inject(CustomDeckRepository);
  private readonly service=inject(MangaVolumeVocabularyService);
  private readonly params=toSignal(inject(ActivatedRoute).paramMap);
  readonly allowed=computed(()=>this.customEnabled()&&this.assistedEnabled());
  readonly result=signal<VolumeVocabulary|null>(null);
  readonly failed=signal(false);
  readonly search=signal('');
  readonly state=signal<VolumeVocabularyState|'all'>('all');
  readonly sort=signal<VolumeVocabularySort>('page');
  readonly states:readonly VolumeVocabularyState[]=['known','learning','pending','indeterminate'];
  readonly entries=computed(()=>filterVolumeVocabulary(this.result()?.entries??[],this.search(),this.state(),this.sort()));
  readonly counts=computed(()=>Object.fromEntries(this.states.map(s=>[s,this.result()?.entries.filter(e=>e.classification.state===s).length??0])));
  readonly decks=computed(()=>[...new Map((this.result()?.entries??[]).map(e=>[e.deck.id,e.deck])).values()]);
  readonly title=computed(()=>this.result()?.entries[0]?.confirmations[0]?.source.volumeTitle??'');
  readonly volumeId=computed(()=>this.params()?.get('volumeId')??'');
  readonly ocrQuery=signal('');
  constructor(){
    effect(()=>{this.volumeId();this.workspace.active();this.workspace.activationRevision();untracked(()=>this.ocrQuery.set(''));});
    effect(onCleanup=>{
      const volumeId=this.params()?.get('volumeId'),owner=this.workspace.active(),epoch=this.workspace.activationRevision();
      this.workspace.dataRevision();this.repository.catalogRevision();this.repository.progressRevision();
      const allowed=this.allowed();let alive=true;onCleanup(()=>alive=false);
      untracked(()=>{this.result.set(null);this.failed.set(false);});
      if(!allowed||!volumeId)return;
      void this.service.load(volumeId).then(result=>{
        if(alive&&owner===this.workspace.active()&&epoch===this.workspace.activationRevision())this.result.set(result);
      }).catch(()=>{if(alive)this.failed.set(true);});
    });
  }
  explore(word:string):void{if(this.allowed()&&this.result()?.entries.some(e=>e.card.word===word))this.ocrQuery.set(word);}
}
