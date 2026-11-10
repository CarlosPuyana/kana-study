import {ChangeDetectionStrategy, Component, inject, input} from '@angular/core';
import {Kanji} from '../../../core/models/kanji.model';
import {TranslationService} from '../../../core/services/translation.service';

/** Read-only teaching support; examples are never study units. */
@Component({
  selector: 'app-kanji-answer',
  template: `
    <section class="answer">
      <div class="answer-heading">
        <strong class="character" lang="ja">{{kanji().character}}</strong>
        <h2>{{kanji().meanings[i18n.language()].join(' · ')}}</h2>
      </div>
      @if(kanji().examples[0]; as example){
        <article class="example" [attr.aria-label]="i18n.t('kanji.examples')">
          <strong class="word" lang="ja">{{example.word}}</strong>
          <span class="reading" lang="ja">{{example.reading}}</span>
          <p>{{example.translations[i18n.language()]}}</p>
        </article>
      }
      <details>
        <summary>{{i18n.t('kanji.onyomi')}} · {{i18n.t('kanji.kunyomi')}}</summary>
        <dl>
          <div><dt>{{i18n.t('kanji.onyomi')}}</dt><dd lang="ja">{{kanji().onyomi.join(' · ') || '—'}}</dd></div>
          <div><dt>{{i18n.t('kanji.kunyomi')}}</dt><dd lang="ja">{{kanji().kunyomi.join(' · ') || '—'}}</dd></div>
        </dl>
      </details>
    </section>`,
  styleUrl: './kanji-answer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KanjiAnswer {
  readonly kanji = input.required<Kanji>();
  readonly i18n = inject(TranslationService);
}
