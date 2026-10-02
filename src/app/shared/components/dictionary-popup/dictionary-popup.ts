import { Component, HostListener, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslationService } from '../../../core/services/translation.service';
import { DictionaryLookup } from '../../../core/models/dictionary.model';
@Component({
  selector:'app-dictionary-popup',imports:[RouterLink],styleUrl:'./dictionary-popup.scss',
  template:`<div class="backdrop" (click)="closed.emit()"></div>
    <section role="dialog" aria-modal="true" [attr.aria-label]="i18n.t('dictionary.title')" [style.left.px]="left()" [style.top.px]="top()" (pointerdown)="$event.stopPropagation()" (click)="$event.stopPropagation()">
      <button class="close" autofocus [attr.aria-label]="i18n.t('common.close')" (click)="closed.emit()">×</button>
      @if (loading()) { <p role="status">{{i18n.t('common.loading')}}</p> }
      @else if (failed()) { <p role="alert">{{i18n.t('dictionary.lookupError')}}</p> }
      @else if (!result().installed) { <p>{{i18n.t('dictionary.missing')}}</p><a routerLink="/manga">{{i18n.t('dictionary.library')}}</a> }
      @else if (!result().terms.length) { <p>{{i18n.t('dictionary.noResults',{term:result().query})}}</p> }
      @else { @for(term of result().terms.slice(0,5);track term.id) { <article><h2>{{term.expression}}</h2>@if(term.reading!==term.expression){<p class="reading">{{term.reading}}</p>}<ul>@for(glossary of term.glossaries;track $index){<li>{{glossary}}</li>}</ul></article> } }
    </section>`,
})
export class DictionaryPopup {
  readonly i18n=inject(TranslationService);readonly result=input.required<DictionaryLookup>();readonly loading=input(false);readonly failed=input(false);readonly x=input(0);readonly y=input(0);readonly closed=output<void>();
  left():number{return Math.max(8,Math.min(this.x()+10,window.innerWidth-368));}
  top():number{return Math.max(8,Math.min(this.y()+12,window.innerHeight-Math.min(360,window.innerHeight*.6)-8));}
  @HostListener('document:keydown',['$event']) key(event:KeyboardEvent):void {if(event.key==='Escape'){event.preventDefault();event.stopPropagation();this.closed.emit();}}
}
