import {ChangeDetectionStrategy, Component, computed, inject} from '@angular/core';
import {RouterLink} from '@angular/router';
import {TranslationService} from '../../core/services/translation.service';
import {WeaknessService} from '../../core/services/weakness.service';
import {JapaneseAudioService} from '../../core/services/japanese-audio.service';
import {ALL_KANA} from '../../data/kana';
import {VOCABULARY_N5} from '../../data/vocabulary-n5.generated';
import {KANJI_N5} from '../../data/kanji-n5.generated';

@Component({selector:'app-weaknesses-page', imports:[RouterLink], templateUrl:'./weaknesses.page.html',
  styleUrl:'./weaknesses.page.scss', changeDetection:ChangeDetectionStrategy.OnPush})
export class WeaknessesPage {
  readonly i18n = inject(TranslationService);
  private readonly weaknesses = inject(WeaknessService);
  private readonly audio = inject(JapaneseAudioService);
  readonly kana = computed(() => this.weaknesses.items('kana',ALL_KANA,5));
  readonly vocabulary = computed(() => this.weaknesses.items('vocabulary',VOCABULARY_N5.filter(e=>e.enabled),5));
  readonly vocabularyListening = computed(() => this.weaknesses.items('vocabulary',VOCABULARY_N5.filter(e=>e.enabled&&this.audio.hasAudio(e.id)),5,'listening'));
  readonly kanji = computed(() => this.weaknesses.items('kanji',KANJI_N5.filter(k=>k.enabled),5));
  readonly empty = computed(() => !this.kana().length && !this.vocabulary().length && !this.vocabularyListening().length && !this.kanji().length);
}
