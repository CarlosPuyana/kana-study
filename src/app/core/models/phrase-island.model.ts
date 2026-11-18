import { FuriganaSegment } from './vocabulary.model';
import { AppLanguage } from './settings.model';

export type PhraseTopicId = 'everyday' | 'conversation' | 'work' | 'shopping' | 'travel' | 'hobbies';
export interface PhraseLocalization { readonly natural: string; readonly structural: string; readonly explanation: string; }
export interface PhraseContent {
  /** Immutable editorial ID, independent of any study progress or FSRS card. */
  readonly id: string;
  readonly topicId: PhraseTopicId;
  readonly japanese: string;
  readonly segments: readonly FuriganaSegment[];
  readonly reading: string;
  readonly level: 'N5' | 'N4';
  readonly register: 'informal' | 'polite' | 'neutral';
  readonly localizations: Readonly<Record<AppLanguage, PhraseLocalization>>;
}
export interface PhraseAudioReference {
  readonly revision: string;
  readonly path: string;
  readonly sha256: string;
  readonly bytes: number;
  readonly durationSeconds: number;
  readonly sampleRate: number;
  readonly mime: string;
  readonly voice: string;
  readonly engineVersion: string;
  readonly modelSha256: string;
}
export interface PhraseEditorialRecord {
  readonly status: 'draft' | 'pending' | 'approved';
  readonly contentRevision: string;
  readonly text: string;
  readonly analyzedReading: string;
  readonly reviewType: string;
  readonly nativeListening: string;
}
export interface CatalogPhrase extends PhraseContent {
  readonly audio: PhraseAudioReference;
  readonly editorial: PhraseEditorialRecord;
}
