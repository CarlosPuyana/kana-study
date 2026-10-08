import {Component, computed, effect, inject, OnDestroy, signal} from '@angular/core';
import {RouterLink} from '@angular/router';
import {PageHeader} from '../../shared/components/page-header/page-header';
import {TranslationService} from '../../core/services/translation.service';
import {WorkspaceService} from '../../core/services/workspace.service';
import {MangaStudySavedRepository} from '../../core/services/manga-study-saved.repository';
import {MangaStudyIntegrationService} from '../../core/services/manga-study-integration.service';
import {MangaSourceService} from '../../core/services/manga-source.service';
import {JapaneseAudioService} from '../../core/services/japanese-audio.service';

@Component({selector:'app-manga-study-page',imports:[RouterLink,PageHeader],styleUrl:'./manga-study.scss',template:`
  <main><app-page-header titleKey="manga.saved.title" backRoute="/manga" />
    <p><a class="review" routerLink="/manga/study/fsrs">{{i18n.t('manga.fsrs.title')}}</a></p>
    @if(saved.loading()){<p role="status">{{i18n.t('common.loading')}}</p>}
    @if(saved.failed()){<p role="alert">{{i18n.t('manga.saved.error')}}</p><button (click)="saved.reload()">{{i18n.t('manga.catalog.retry')}}</button>}
    @if(!saved.loading() && !saved.failed() && !rows().length){<section class="empty"><h2>{{i18n.t('manga.saved.empty')}}</h2><p>{{i18n.t('manga.saved.emptyHelp')}}</p><a routerLink="/manga">{{i18n.t('manga.saved.back')}}</a></section>}
    @if(removeError()){<p role="alert">{{i18n.t('manga.saved.error')}}</p>}
    @if(rows().length && !saved.loading() && !saved.failed()){<p><a class="review" routerLink="/manga/study/review">{{i18n.t('manga.review.title')}}</a></p>}
    <section class="saved-grid">
    @for(row of rows();track row.item.id){
      <article><h2 lang="ja">{{row.item.expression}}</h2>
        @if(row.item.reading){<p lang="ja">{{row.item.reading}}</p>}
        <p>{{row.match.vocabulary?.quizMeaning?.[i18n.language()] || row.item.meaning}}</p>
        @if(row.match.vocabulary;as entry){<small>{{i18n.t('manga.study.vocabularyLevel',{level:entry.jlptApproxLevel})}}</small>}
        @else{<small>{{i18n.t('manga.saved.external')}}</small>}
        <p class="source">📖 {{row.item.source.volumeTitle || row.item.source.volumeId}} · {{i18n.t('manga.saved.page',{page:row.item.source.pageNumber})}}</p>
        @if(row.item.context){<blockquote lang="ja">「{{row.item.context}}」</blockquote>}
        @else if(row.item.surface && row.item.surface!==row.item.expression){<blockquote lang="ja">{{row.item.surface}}</blockquote>}
        <div class="actions">
          @if(row.match.vocabulary;as entry){
            <a routerLink="/vocabulary/all" [queryParams]="{entry:entry.id,return:'/manga/study'}">{{i18n.t('manga.study.viewVocabulary')}}</a>
            @if(row.match.writingAvailable){<a routerLink="/vocabulary/writing" [queryParams]="{entry:entry.id,return:'/manga/study'}">✍ {{i18n.t('vocabularyWriting.practice')}}</a>}
            @if(row.match.audioAvailable){<button [disabled]="audio.state()==='loading'" (click)="listen(row.item.id,entry.id)">🎧 {{i18n.t('manga.study.listen')}}</button>}
          }
        </div>
        @if(playing()===row.item.id && audio.state()==='error'){<p role="alert">{{i18n.t('manga.study.audioError')}}</p>}
        @if(playing()===row.item.id && audio.state()==='blocked'){<p role="status">{{i18n.t('manga.study.audioBlocked')}}</p>}
        @if(row.match.kanji.length){<h3>{{i18n.t('kanji.title')}}</h3><div class="actions">
          @for(entry of row.match.kanji;track entry.id){
            <a routerLink="/kanji/all" [queryParams]="{selected:entry.character,return:'/manga/study'}" [attr.aria-label]="i18n.t('manga.study.viewKanjiNamed',{kanji:entry.character})">{{entry.character}} · {{i18n.t('manga.study.viewKanji')}}</a>
            <a routerLink="/kanji/writing" [queryParams]="{entry:entry.id,return:'/manga/study'}">✍ {{i18n.t('manga.study.writeKanji',{kanji:entry.character})}}</a>
          }
        </div>}
        <div class="actions footer">
          @if(available()[row.item.id]){<a [routerLink]="['/manga/read',row.item.source.volumeId]" [queryParams]="{page:row.item.source.pageNumber}">{{i18n.t('manga.saved.back')}}</a>}
          <button [disabled]="removing()!==null" (click)="confirm.set(row.item.id)">{{i18n.t('manga.saved.remove')}}</button>
        </div>
        @if(confirm()===row.item.id){<div role="group" [attr.aria-label]="i18n.t('manga.saved.confirm')"><p>{{i18n.t('manga.saved.confirm')}}</p><div class="actions"><button [disabled]="removing()!==null" (click)="remove(row.item.id)">{{i18n.t('manga.saved.remove')}}</button><button (click)="confirm.set(null)">{{i18n.t('common.cancel')}}</button></div></div>}
      </article>
    }
    </section>
  </main>`})
export class MangaStudyPage implements OnDestroy {
  readonly i18n=inject(TranslationService);
  readonly saved=inject(MangaStudySavedRepository);
  readonly audio=inject(JapaneseAudioService);
  private readonly integration=inject(MangaStudyIntegrationService);
  private readonly source=inject(MangaSourceService);
  private readonly workspace=inject(WorkspaceService);
  readonly rows=computed(()=>this.saved.items().map(item=>({item,match:this.integration.matchSaved(item)})));
  readonly available=signal<Record<string,boolean>>({});
  readonly playing=signal<string|null>(null);
  readonly confirm=signal<string|null>(null);
  readonly removing=signal<string|null>(null);
  readonly removeError=signal(false);
  private generation=0;
  constructor(){
    effect(()=>{
      const workspace=this.workspace.active(),items=this.saved.items(),generation=++this.generation;
      this.available.set({});this.confirm.set(null);this.removeError.set(false);
      if(this.playing() && !items.some(item=>item.id===this.playing())){this.audio.stop();this.playing.set(null);}
      // Check metadata once per distinct volume, without loading page blobs.
      const ids=[...new Set(items.map(item=>item.source.volumeId))];
      void Promise.all(ids.map(async id=>{try{return [id,await this.source.volume(id,workspace)] as const;}catch{return [id,undefined] as const;}})).then(volumes=>{
        if(generation!==this.generation||workspace!==this.workspace.active())return;
        const metadata=new Map(volumes);
        this.available.set(Object.fromEntries(items.map(item=>{const volume=metadata.get(item.source.volumeId);return [item.id,!!volume?.complete && item.source.pageNumber<=volume.pageCount];})));
      });
    });
  }
  async listen(itemId:string,vocabularyId:string):Promise<void>{this.playing.set(itemId);await this.audio.play(vocabularyId);}
  async remove(id:string):Promise<void>{
    if(this.removing())return;
    this.removing.set(id);this.removeError.set(false);
    try{await this.saved.remove(id);this.confirm.set(null);queueMicrotask(()=>document.querySelector<HTMLElement>('app-manga-study-page button,app-manga-study-page a')?.focus());}
    catch{this.removeError.set(true);}finally{this.removing.set(null);}
  }
  ngOnDestroy():void{++this.generation;if(this.playing())this.audio.stop();}
}
