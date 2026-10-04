import { ChangeDetectionStrategy, Component, ElementRef, afterNextRender, inject, input, output, viewChild } from '@angular/core';
import { Kana } from '../../core/models/kana.model';
import { TranslationService } from '../../core/services/translation.service';
import { KanaWritingCanvas } from '../../shared/components/kana-writing-canvas/kana-writing-canvas';

@Component({selector:'app-kana-writing-dialog', imports:[KanaWritingCanvas], template: `
  <dialog #dialog (cancel)="closed.emit()" (click)="backdrop($event)">
    <header><div><h2 lang="ja">{{kana().character}}</h2><p>{{kana().romaji}}</p></div><button type="button" (click)="closed.emit()" [attr.aria-label]="i18n.t('common.close')">×</button></header>
    <app-kana-writing-canvas [character]="kana().character"/>
    <p class="attribution">{{i18n.t('writing.attribution')}} <a href="https://github.com/parsimonhi/animCJK" target="_blank" rel="noopener">AnimCJK</a> · LGPL</p>
  </dialog>`, styleUrl:'./kana-writing-dialog.scss', changeDetection:ChangeDetectionStrategy.OnPush})
export class KanaWritingDialog {
  readonly kana=input.required<Kana>(); readonly closed=output<void>(); readonly i18n=inject(TranslationService);
  private readonly dialog=viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  constructor(){afterNextRender(()=>this.dialog().nativeElement.showModal());}
  backdrop(event:MouseEvent):void{if(event.target===this.dialog().nativeElement)this.closed.emit();}
}
