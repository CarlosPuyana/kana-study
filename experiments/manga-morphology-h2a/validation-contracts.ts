import type { LexicalIdentity } from '../../src/app/core/models/deck-catalog.model';
import type { EnrichedJmdictEntry, LexiconSense } from './contracts';

export interface ExperimentalToken {
  readonly surface: string;
  readonly start: number;
  readonly end: number;
  readonly lemma: string | null;
  readonly reading: string | null;
  readonly pos: string | null;
  readonly subpos: string | null;
  readonly unknown: boolean | null;
}

export interface IndexedEntry extends Omit<EnrichedJmdictEntry, 'originalEntryDigest' | 'senses'> {
  readonly canonicalEntryDigest: string;
  readonly senses: readonly (LexiconSense & {
    readonly effectivePOS: readonly string[];
    readonly misc: readonly string[];
  })[];
}

/** Experimental contract: the actual H1 identity, never a new competing identity schema. */
export interface LexicalValidationInput {
  readonly token: ExperimentalToken;
  readonly tokens: readonly ExperimentalToken[];
  readonly normalized: string;
  readonly original: string;
  readonly sourceRange: readonly [number, number];
  readonly context?: {
    readonly integrity: 'unassessed' | 'complete' | 'corrupt' | 'truncated';
  };
  readonly candidates: readonly IndexedEntry[];
}

export type LexicalValidationResult = {
  readonly classification: 'ambiguous' | 'unknown' | 'excluded';
  readonly identity: null;
  readonly reasons: readonly string[];
  readonly alternatives: readonly { readonly entryId: string; readonly reading: string; readonly senseReferences: readonly string[] }[];
} | {
  readonly classification: 'verified';
  readonly identity: LexicalIdentity;
  readonly reasons: readonly string[];
  readonly evidence: {
    readonly sourceDigest: string;
    readonly entryDigest: string;
    readonly restrictionProofDigest: string;
    readonly sourceSenseReference: string;
    readonly senseReferenceStable: false;
    readonly cardCreationAllowed: false;
  };
};

export interface LexicalValidationPort {
  validate(input: LexicalValidationInput): Promise<LexicalValidationResult>;
}
