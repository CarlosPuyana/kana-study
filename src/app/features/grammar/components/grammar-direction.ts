import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { TranslationService } from '../../../core/services/translation.service';
import { GrammarDirection } from '../models/grammar.model';

@Component({selector:'app-grammar-direction',changeDetection:ChangeDetectionStrategy.OnPush,template:`
  <figure class="grammar-direction" [attr.aria-label]="i18n.t(direction().captionKey)">
    <div class="direction-line"><span [class.focus]="direction().focus==='from'">{{i18n.t(direction().fromKey)}}</span><strong aria-hidden="true">{{direction().arrow}}</strong><span [class.focus]="direction().focus==='to'">{{i18n.t(direction().toKey)}}</span></div>
    <figcaption><strong>{{i18n.t(direction().actionKey)}}</strong> · {{i18n.t(direction().captionKey)}}</figcaption>
  </figure>
`})
export class GrammarDirectionComponent {
  readonly direction=input.required<GrammarDirection>(); readonly i18n=inject(TranslationService);
}
