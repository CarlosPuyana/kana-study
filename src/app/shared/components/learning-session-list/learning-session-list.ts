import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import type { Kanji } from '../../../core/models/kanji.model';
import type { VocabularyEntry } from '../../../core/models/vocabulary.model';
import { TranslationService } from '../../../core/services/translation.service';
import { kanjiMeaning } from '../../../core/services/kanji-options';
import { FuriganaText } from '../furigana-text/furigana-text';

export type StudiedSessionContent = {readonly kind:'kanji';readonly entries:readonly Kanji[]} |
  {readonly kind:'vocabulary';readonly entries:readonly VocabularyEntry[]};

/** Read-only reference for the two Learn result screens; no catalog or session services. */
@Component({selector:'app-learning-session-list',imports:[FuriganaText],templateUrl:'./learning-session-list.html',
  styleUrl:'./learning-session-list.scss',changeDetection:ChangeDetectionStrategy.OnPush})
export class LearningSessionList {
  readonly content=input.required<StudiedSessionContent>();
  readonly i18n=inject(TranslationService);
  readonly meaning=kanjiMeaning;
}
