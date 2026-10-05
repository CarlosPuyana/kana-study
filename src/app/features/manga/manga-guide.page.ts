import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslationService } from '../../core/services/translation.service';
import { MangaContextService } from '../../core/services/manga-context.service';
@Component({selector:'app-manga-guide',imports:[RouterLink],styleUrl:'./manga-library.scss',template:`<main class="guide-page">
  <a routerLink="/manga">← {{i18n.t('manga.library')}}</a><h1>{{i18n.t('manga.guide.title')}}</h1><p>{{i18n.t('manga.guide.intro')}}</p>
  @for(step of [1,2,3,4,5];track step){<section class="guide-section"><div class="step-art" aria-hidden="true">@switch(step){
    @case(1){<span class="file-art">ZIP / CBZ<br/>＋ Mokuro</span>}
    @case(2){<span class="bubble-art">何してるの？</span>}
    @case(3){<span class="word-art"><span>食べなかった</span><span>↓</span><strong>食べる</strong><span>{{i18n.t('manga.guide.eat')}}</span></span>}
    @case(4){<div class="mini-actions"><span>✨ {{i18n.t('manga.assist.translate')}}</span></div>}
    @case(5){<span class="bubble-art">日本語 →</span>}
  }</div><div><h2>{{step}} · {{i18n.t('manga.guide.step'+step)}}</h2><p>{{i18n.t('manga.guide.text'+step)}}</p>@if(step===4&&!assistant.available){<p>{{i18n.t('manga.assist.unavailable')}}</p>}</div></section>}
  <section class="guide-faq"><h2>{{i18n.t('manga.guide.faq')}}</h2>@for(item of [1,2,3,4,5];track item){<details><summary>{{i18n.t('manga.guide.q'+item)}}</summary><p>{{i18n.t('manga.guide.a'+item)}}</p></details>}</section>
  <p><a routerLink="/manga">{{i18n.t('manga.landing.add')}} →</a></p>
</main>`})
export class MangaGuidePage {readonly i18n=inject(TranslationService);readonly assistant=inject(MangaContextService);}
