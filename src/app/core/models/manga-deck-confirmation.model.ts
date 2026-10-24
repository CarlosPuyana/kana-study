import { LocalWorkspaceId } from './account.model';
import { CustomDeck, CustomDeckCard, LexicalIdentity } from './deck-catalog.model';

export interface MangaCardSource {
  readonly volumeId: string;
  readonly volumeTitle: string;
  readonly pageNumber: number;
  readonly blockIndex: number;
  readonly lineIndex: number;
  readonly range: readonly [number, number];
  readonly fragment: string;
  readonly surface: string;
  readonly savedItemId?: string;
}
/** Dictionary IDs/sequences are evidence of a local proposal, never global authority. */
export interface MangaDictionaryProposal {
  readonly localId: string;
  readonly dictionaryId: string;
  readonly expression: string;
  readonly reading: string;
  readonly sequence: number;
  readonly glosses: readonly string[];
  readonly glossLanguage: 'es';
  readonly totalGlosses: number;
}
export interface MangaCuratedEntity {
  readonly schemaVersion: 1;
  readonly id: string;
  readonly identity: LexicalIdentity;
  readonly word: string;
  readonly reading: string;
  readonly origin: 'explicit-user-confirmation';
  readonly expertCertified: false;
  readonly originReference: string;
  readonly registryNamespace: string;
  readonly branch: string;
}
export interface MangaCardConfirmation {
  readonly schemaVersion: 1;
  readonly id: string;
  readonly workspace: LocalWorkspaceId;
  readonly actor: { readonly kind: 'local-workspace-user'; readonly workspace: LocalWorkspaceId };
  readonly confirmedAt: string;
  readonly source: MangaCardSource;
  readonly entity: MangaCuratedEntity;
  readonly selectedProposal: MangaDictionaryProposal | null;
  readonly alternatives: readonly MangaDictionaryProposal[];
  readonly totalAlternatives: number;
  readonly confirmedMeaning: string;
  readonly meaningLanguage: 'es' | 'en' | 'ca';
  readonly reusedEntity: boolean;
  readonly expertCertified: false;
}
export interface MangaConfirmedCardOperation {
  readonly schemaVersion: 1;
  readonly deck: CustomDeck;
  readonly card: CustomDeckCard;
  readonly expectedContentVersion: number | null;
  readonly confirmation: MangaCardConfirmation;
}
