import { VocabularyLearningSession } from './vocabulary-session.model';
export type VocabularyLessonKind='review'|'new'|'direction';
export interface VocabularyDailyLesson {
  readonly version:1|2;
  /** V2 FIFO of unresolved words. Updated in the same receipt as each answer. */
  readonly pendingKeys?:readonly string[];
  /** V1 completions are grandfathered, never represented as invented successes. */
  readonly legacyResolvedKeys?:readonly string[];
  readonly day:string;
  readonly size:10|15;
  readonly kinds:Readonly<Record<string,VocabularyLessonKind>>;
  readonly session:VocabularyLearningSession;
  readonly durationSeconds:number;
}
export const VOCABULARY_LESSONS_KEY='kana-study.vocabulary-daily-lessons.v1';
