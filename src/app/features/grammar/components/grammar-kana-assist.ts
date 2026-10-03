import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { TranslationService } from '../../../core/services/translation.service';

@Component({selector:'app-grammar-kana-assist',changeDetection:ChangeDetectionStrategy.OnPush,template:`
  <div class="kana-assist" role="group" [attr.aria-label]="i18n.t('grammar.kanaAssist')">
    <p>{{i18n.t('grammar.kanaAssist')}}</p>
    <div>@for(character of kana();track character){<button type="button" [disabled]="disabled()" (click)="inserted.emit(character)">{{character}}</button>}<button type="button" class="erase" [disabled]="disabled()||!canErase()" (click)="erased.emit()">{{i18n.t('grammar.eraseKana')}}</button></div>
  </div>
`,styles:`
  .kana-assist{margin-block:12px}.kana-assist p{font-size:.85rem;color:var(--text-secondary)}
  .kana-assist>div{display:flex;flex-wrap:wrap;gap:6px}.kana-assist button{min-width:44px;min-height:44px;border:1px solid var(--border);border-radius:10px;background:var(--surface);color:var(--text-primary);font:inherit;cursor:pointer}
  .kana-assist button:hover:enabled{border-color:var(--primary);background:var(--primary-soft)}.kana-assist button:disabled{opacity:.5;cursor:default}.erase{padding-inline:12px}
`})
export class GrammarKanaAssistComponent {
  readonly i18n=inject(TranslationService);readonly kana=input.required<readonly string[]>();readonly disabled=input(false);readonly canErase=input(false);
  readonly inserted=output<string>();readonly erased=output<void>();
}
