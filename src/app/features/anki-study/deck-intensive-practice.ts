import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input, output, signal } from '@angular/core';
import { DeckStudyEntryView, isCustomEntry } from '../../core/models/deck-catalog.model';
import { DeckIntensiveSession } from '../../core/services/deck-intensive-session';
import { formatStudyTime } from '../../core/services/card-study-time';
import { entryMeaning } from '../../core/services/deck-route-resource';
import { deckContentLanguage } from '../../core/services/deck-content-language';
import { TranslationService } from '../../core/services/translation.service';
import { FuriganaText } from '../../shared/components/furigana-text/furigana-text';
import { DeckSentenceText } from '../anki-cards/components/deck-sentence-text/deck-sentence-text';
import { KaishiCardMedia } from '../../shared/components/kaishi-card-media/kaishi-card-media';

@Component({selector:'app-deck-intensive-practice',imports:[FuriganaText,DeckSentenceText,KaishiCardMedia],
 template:`
 <section class="practice" aria-labelledby="practice-title"><header><h1 id="practice-title">{{i18n.t('anki.rush.title')}}</h1><span role="timer">{{time()}}</span><p>{{i18n.t('anki.rush.independent')}}</p></header>
 @if(current();as card){
 <article class="practice-card">@if(!revealed()||isCustom(card)){<h2 lang="ja">{{card.word}}</h2>}
 @if(revealed()){
  @if(isCustom(card)){<p lang="ja">{{card.reading}}</p><p>{{meaning(card)}}</p>@if(card.context){<p lang="ja">{{card.context.text}}</p>}}
  @else{
   <app-furigana-text [segments]="card.wordSegments" />
   @if(builtinMedia()){
    <app-kaishi-card-media [entry]="card"><span kaishi-reading lang="ja">{{card.reading}}</span><p kaishi-meaning>{{meaning(card)}}</p><div kaishi-sentence><app-deck-sentence-text [segments]="card.sentenceSegments" /><details><summary>{{i18n.t('anki.studyPage.translation')}}</summary><p>{{sentenceMeaning(card)}}</p></details></div></app-kaishi-card-media>
   }@else{<p>{{card.reading}}</p><p>{{meaning(card)}}</p><app-deck-sentence-text [segments]="card.sentenceSegments" />}
  }
 }
 </article>
 <div class="practice-actions">
 @if(!revealed()){<button class="practice-reveal" type="button" (click)="revealed.set(true)">{{i18n.t('anki.studyPage.reveal')}}</button>}
 @else{<button class="practice-again" type="button" (click)="answer(false)">{{i18n.t('anki.rush.repeat')}}</button><button class="practice-good" type="button" (click)="answer(true)">{{i18n.t('anki.rush.correct')}}</button>}
 <button type="button" class="practice-finish" (click)="finish()">{{i18n.t('anki.rush.finish')}}</button></div>
 <p>{{i18n.t('anki.rush.block',{count:session().answers})}}</p>
 }@else{
 <h2>{{i18n.t('anki.rush.results')}}</h2><p>{{i18n.t('anki.rush.block',{count:session().answers})}}</p>
 <ul>@for(card of entries();track card.id){<li><span lang="ja">{{card.word}}</span> — {{i18n.t('anki.rush.correctCount',{count:session().correct.get(card.id)??0})}} · {{i18n.t('anki.results.failures',{count:session().failures.get(card.id)??0})}}</li>}</ul>
 @if(session().remaining){<button class="practice-continue" type="button" (click)="continueBlock()">{{i18n.t('anki.rush.continue')}}</button>}
 <button class="practice-close" type="button" (click)="closed.emit()">{{i18n.t('anki.rush.close')}}</button>
 }
 </section>`,
 styles:[`:host{display:block}.practice{padding:.7rem;border:1px solid var(--border);border-radius:1rem;background:var(--surface);padding-bottom:7rem}.practice header{display:flex;flex-wrap:wrap;justify-content:space-between;gap:.3rem}.practice h1{font-size:1.2rem;margin:.2rem 0}.practice header p{width:100%;font-size:.8rem;color:var(--text-secondary)}.practice-card{text-align:center}.practice-card h2{font-size:2rem;margin:.5rem 0}.practice-actions{position:fixed;z-index:6;bottom:0;left:50%;transform:translateX(-50%);width:min(calc(100% - 1.25rem),52rem);display:flex;flex-wrap:wrap;gap:.3rem;background:var(--background);padding:.4rem 0 calc(.4rem + env(safe-area-inset-bottom))}button{min-height:44px;padding:.5rem .7rem;color:var(--text-primary);background:var(--surface-raised);border:1px solid var(--border);border-radius:.6rem;font:inherit;cursor:pointer}.practice-actions button{flex:1}.practice-actions .practice-finish{flex-basis:100%;font-size:.8rem}summary{min-height:44px;align-content:center;cursor:pointer}li{padding:.4rem 0;overflow-wrap:anywhere}`],changeDetection:ChangeDetectionStrategy.OnPush})
export class DeckIntensivePractice {
 readonly entries=input.required<readonly DeckStudyEntryView[]>();readonly builtinMedia=input(false);readonly closed=output<void>();
 readonly i18n=inject(TranslationService);readonly isCustom=isCustomEntry;
 private sessionKey='';private engine?:DeckIntensiveSession;
 private readonly revision=signal(0);
 session():DeckIntensiveSession{const entries=this.entries(),key=entries.map(e=>e.id).join('\0');this.revision();if(!this.engine||this.sessionKey!==key){this.sessionKey=key;this.engine=new DeckIntensiveSession(entries.map(e=>e.id));}return this.engine;}
 readonly current=computed(()=>this.entries().find(e=>e.id===this.session().current)??null);
 readonly revealed=signal(false);readonly time=signal('00:00');
 private elapsed=0;private anchor=performance.now();private visible=!document.hidden;
 constructor(){
  const tick=()=>{const now=performance.now();if(this.visible&&this.session().current)this.elapsed+=Math.max(0,now-this.anchor);this.anchor=now;this.time.set(formatStudyTime(this.elapsed/1000));};
  const visibility=()=>{tick();this.visible=!document.hidden;};
  const timer=setInterval(tick,250);document.addEventListener('visibilitychange',visibility);
  inject(DestroyRef).onDestroy(()=>{clearInterval(timer);document.removeEventListener('visibilitychange',visibility);});
 }
 meaning(card:DeckStudyEntryView):string{return entryMeaning(card,this.i18n.language());}
 sentenceMeaning(card:DeckStudyEntryView):string{return isCustomEntry(card)?'':card.sentenceMeaning[deckContentLanguage(this.i18n.language())];}
 answer(good:boolean):void{if(!this.revealed())return;this.session().answer(good);this.revealed.set(false);this.revision.update(n=>n+1);}
 finish():void{this.session().finish();this.revealed.set(false);this.revision.update(n=>n+1);}
 continueBlock():void{this.session().continueBlock();this.elapsed=0;this.anchor=performance.now();this.time.set('00:00');this.revision.update(n=>n+1);}
}
