import { Rating } from 'ts-fsrs';
import { DeckRating, SerializedFsrsCard } from './deck-study.model';
import { MangaReviewEvent, MangaReviewQuestion } from './manga-review.model';
import { MangaStudySavedItem } from './manga-study-saved.model';

export const MANGA_FSRS_SETTINGS_KEY = 'kana-study.manga-fsrs-settings.v1';
/** The same recall choices as Anki; card progress and review IDs stay separate. */
export type MangaFsrsRating = DeckRating;
export type MangaFsrsGrade = Rating.Again | Rating.Good;
export function mangaFsrsGrade(rating: MangaFsrsRating): MangaFsrsGrade {
  if (rating === 'again') return Rating.Again;
  if (rating === 'good') return Rating.Good;
  throw new Error('Invalid Manga FSRS rating');
}
export interface MangaFsrsEvent extends MangaReviewEvent {
  readonly reviewKind: 'fsrs';
  readonly fsrsVersion: 1;
  readonly fsrsGrade: MangaFsrsGrade;
  readonly answerMode: 'self-assessment';
  readonly repetition: false;
}
export interface MangaFsrsCard {
  readonly item: MangaStudySavedItem;
  readonly card: SerializedFsrsCard;
  readonly meaning: string;
  readonly reading: string;
  readonly context?: MangaReviewQuestion['context'];
}
export function isMangaFsrsEvent(input: unknown): input is MangaFsrsEvent {
  if (!input || typeof input !== 'object') return false;
  const value = input as MangaReviewEvent;
  return value.reviewKind === 'fsrs' && value.fsrsVersion === 1
    && (value.fsrsGrade === Rating.Again || value.fsrsGrade === Rating.Good)
    && value.rating === (value.fsrsGrade === Rating.Again ? 'again' : 'good')
    && value.correct === (value.fsrsGrade === Rating.Good)
    && value.repetition === false && value.answerMode === 'self-assessment'
    && typeof value.id === 'string' && !!value.id && typeof value.sessionId === 'string' && !!value.sessionId
    && typeof value.savedItemId === 'string' && !!value.savedItemId && value.key === value.savedItemId
    && Number.isFinite(Date.parse(value.reviewedAt));
}
