import { LocalWorkspaceId } from './account.model';
import { LexicalIdentity } from './deck-catalog.model';
import { DeckCardProgress, DeckReviewEvent } from './deck-study.model';

/** A trusted, reviewed manifest is evidence; matching text is never evidence. */
export interface LexicalVerification {
  readonly source: string;
  readonly version: string;
  readonly sha256: string;
  readonly reference: string;
  readonly restrictions: string;
  readonly review: string;
}
export interface VerifiedLexicalIdentity {
  readonly identity: LexicalIdentity;
  readonly evidence: LexicalVerification;
}
export interface VerifiedDeckMapping {
  readonly deckId: string;
  readonly entryId: string;
  readonly identityKey: string;
  /** Hash of the complete editorial entry; no rewriting the dataset. */
  readonly contentDigest: string;
  readonly evidence: LexicalVerification;
  readonly revoked: boolean;
}
export interface VerifiedLexicalEquivalence {
  readonly id: string;
  readonly left: string;
  readonly right: string;
  readonly evidence: LexicalVerification;
  readonly revoked: boolean;
}
export interface LexicalEvidenceManifest {
  readonly schemaVersion: 1;
  readonly revision: string;
  readonly identities: readonly VerifiedLexicalIdentity[];
  readonly mappings: readonly VerifiedDeckMapping[];
  readonly equivalences: readonly VerifiedLexicalEquivalence[];
}
export type LexicalProof =
  | { readonly kind: 'verified'; readonly evidence: LexicalVerification }
  | { readonly kind: 'local-confirmation'; readonly workspace: LocalWorkspaceId;
      readonly namespace: string; readonly receiptId: string };
export interface ProvenLexicalIdentity {
  readonly identity: LexicalIdentity;
  readonly proof: LexicalProof;
}
export interface LexicalCardEvidence {
  readonly deckId: string;
  readonly cardId: string;
  readonly identityKey: string;
  readonly archived: boolean;
  readonly progress: DeckCardProgress | null;
  /** Effective events only: custom voided events and builtin undone events are omitted. */
  readonly events: readonly DeckReviewEvent[];
  readonly readable: boolean;
}
export type LexicalKnowledgeState = 'known' | 'learning' | 'pending' | 'unknown' | 'unlinked' | 'indeterminate';
export interface LexicalCardClassification {
  readonly deckId: string;
  readonly cardId: string;
  readonly archived: boolean;
  readonly state: 'known' | 'learning' | 'pending' | 'indeterminate';
  readonly eventIds: readonly string[];
  readonly stability: number | null;
  readonly reasons: readonly string[];
}
export interface LexicalKnowledge {
  readonly state: LexicalKnowledgeState;
  readonly identityKey: string | null;
  readonly groupKey: string | null;
  readonly identities: readonly ProvenLexicalIdentity[];
  readonly equivalenceIds: readonly string[];
  readonly cards: readonly LexicalCardClassification[];
  /** False does not invalidate positive evidence, but forbids claiming unknown. */
  readonly inventoryComplete: boolean;
  readonly reasons: readonly string[];
}
export interface LexicalKnowledgeSnapshot {
  readonly workspace: LocalWorkspaceId;
  readonly cacheKey: string;
  readonly manifestRevision: string;
  readonly inventoryComplete: boolean;
  readonly unmappedCards: number;
  readonly issues: readonly string[];
  readonly units: readonly LexicalKnowledge[];
}
export type LexicalQuery =
  | { readonly kind: 'identity'; readonly identity: LexicalIdentity }
  | { readonly kind: 'proposal'; readonly surface: string; readonly reading?: string; readonly possibleKeys?: readonly string[] };

/** Upstream analysis must resolve segmentation before coverage. No OCR parser here. */
export interface LexicalCoverageAnalysis {
  readonly version: string;
  readonly completeVolume: boolean;
  readonly segmentation: 'non-overlapping-verified' | 'unresolved';
  readonly occurrences: readonly { readonly id: string; readonly page: number; readonly block: number;
    readonly start: number; readonly end: number; readonly identityKey: string | null }[];
  readonly unresolvedSpans: number;
  readonly excludedSpans: number;
}
export interface LexicalCoverageCounts {
  readonly resolved: number;
  readonly known: number;
  readonly learning: number;
  readonly pending: number;
  readonly unknown: number;
  /** null for types whose lexical identity cannot be deduplicated. */
  readonly unlinked: number | null;
  readonly indeterminate: number;
  readonly strict: number | null;
  readonly familiarity: number | null;
  readonly hypotheticalStrict: number | null;
}
export interface LexicalCoverage {
  readonly status: 'resolved-subset' | 'invalid-segmentation';
  readonly fullVolumeCalculable: boolean;
  readonly knowledgeComplete: boolean;
  readonly types: LexicalCoverageCounts;
  readonly occurrences: LexicalCoverageCounts;
  readonly unlinkedOccurrences: number;
  readonly unresolvedSpans: number;
  readonly excludedSpans: number;
}
