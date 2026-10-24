import type { LexicalIdentity } from '../../src/app/core/models/deck-catalog.model';

export interface MorphologicalRecognition {
  readonly surface: string;
  readonly original: string;
  readonly candidateLemma: string | null;
  readonly surfaceReading: string | null;
  readonly pos: string | null;
  readonly normalizedRange: readonly [number, number];
  readonly originalRange: readonly [number, number];
  readonly status: 'recognized' | 'partial' | 'unknown';
  readonly evidence: { readonly engine: string; readonly version: string; readonly dictionary: string; readonly resourceDigests: readonly string[] };
}
export type LexicalReference = {
  readonly kind: 'provisional';
  readonly authority: 'jmdict';
  readonly entryId: string;
  readonly canonicalReading: string;
  readonly sourceDigest: string;
  readonly scope: 'source-revision-only';
  readonly synchronizable: false;
  readonly homographGroup: null;
} | { readonly kind: 'permanent'; readonly identity: LexicalIdentity };

export interface LexicalResolution {
  readonly state: 'identified' | 'ambiguous' | 'unresolved' | 'excluded';
  readonly evidenceScope: 'token-form-under-morphological-hypothesis';
  readonly occurrenceStatus: 'proposed' | 'unconfirmed-fragment';
  readonly candidateEntries: readonly string[];
  readonly alternatives: readonly {
    readonly entryId: string;
    readonly canonicalReading: string;
    readonly rawReadings: readonly string[];
    readonly compatibleSpellings: readonly string[];
    readonly senseReferences: readonly string[];
    readonly sourceDigest: string;
    readonly entryDigest: string;
    readonly proofs: readonly string[];
  }[];
  readonly reference: LexicalReference | null;
  readonly identity: LexicalIdentity | null;
  readonly remainingAmbiguities: readonly string[];
}

export interface SenseResolution {
  readonly state: 'source-single' | 'unresolved' | 'unavailable';
  readonly selectedSense: null;
  readonly contextualInterpretationCertified: false;
  readonly documented: readonly {
    readonly entryId: string;
    readonly reference: string;
    readonly stableAcrossRevisions: false;
    readonly restrictions: { readonly spellings: readonly string[]; readonly readings: readonly string[] };
    readonly pos: readonly string[];
    readonly glosses: readonly { readonly text: string; readonly language: string; readonly provenance: string }[];
    readonly contextEvidence: readonly string[];
  }[];
}
export interface CardEligibility {
  readonly policy: 'contextual-single-meaning' | 'documented-multiple-senses' | 'manual-confirmation';
  readonly state: 'eligible' | 'requires-review' | 'ineligible';
  readonly reasons: readonly string[];
  readonly automaticAcceptance: false;
  readonly productionApproved: false;
  readonly confirmation: null;
}

/** Future design only: no receipt of this kind has been issued in this experiment. */
export interface ProposedHumanConfirmationReceipt {
  readonly origin: 'explicit-human-confirmation';
  readonly actorReference: string;
  readonly timestamp: string;
  readonly sourceDigest: string;
  readonly contextDigest: string;
  readonly entryId: string;
  readonly reading: string;
  readonly selectedSourceSenseReferences: readonly string[];
  readonly glossLanguage: string;
  readonly confirmedGloss: string;
  readonly previousAlternativesDigest: string;
  readonly lexicalIdentityProofRequired: true;
}

/** Design granularity for future frequency analysis, not a public stats implementation. */
export type OccurrenceReference = {
  readonly documentHash: string;
  readonly page: number;
  readonly block: number;
  readonly line: number;
  readonly utf16Range: readonly [number, number];
  readonly analysisVersion: string;
  readonly class: 'permanent-identity' | 'provisional-identity' | 'ambiguous-identity' | 'excluded' | 'unresolved';
  readonly lexicalReference: LexicalReference | null;
};
