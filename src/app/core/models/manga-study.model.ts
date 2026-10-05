import {Kanji} from './kanji.model';
import {VocabularyEntry} from './vocabulary.model';

export interface MangaStudyMatch {
  readonly vocabulary?: VocabularyEntry;
  readonly kanji: readonly Kanji[];
  readonly audioAvailable: boolean;
  readonly writingAvailable: boolean;
}
