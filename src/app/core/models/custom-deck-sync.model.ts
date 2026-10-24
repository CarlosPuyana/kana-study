import { LocalWorkspaceId } from './account.model';
import { CustomCatalogOperation, CustomDeck, CustomDeckCard } from './deck-catalog.model';
import { DeckCardProgress, DeckDailyState, DeckReviewEvent, SerializedFsrsCard } from './deck-study.model';
import { MangaCardConfirmation, MangaConfirmedCardOperation, MangaCuratedEntity } from './manga-deck-confirmation.model';

export type CustomRemoteKind='deck'|'card'|'identity'|'volume-link'|'confirmation'|'equivalence'|'progress'|'review-event'|'daily'|'manifest';
export interface CustomLocalEquivalence {
  readonly schemaVersion:1;readonly id:string;readonly left:string;readonly right:string;
  readonly scope:'owner-local';readonly evidence:string;readonly revoked:boolean;readonly expertCertified:false;
}
export interface CustomPublicationManifest {
  readonly schemaVersion:1;readonly deckId:string;readonly cardIds:readonly string[];
  readonly references?:readonly {readonly kind:CustomRemoteKind;readonly id:string;readonly revision:string}[];
}
export type CustomRemotePayload=CustomDeck|CustomDeckCard|MangaCuratedEntity|MangaCardConfirmation|CustomLocalEquivalence|
  DeckCardProgress|DeckReviewEvent|DeckDailyState|CustomPublicationManifest|
  {readonly schemaVersion:1;readonly volumeId:string;readonly deckId:string};
export interface CustomRemoteChange {
  readonly kind:CustomRemoteKind;readonly id:string;readonly baseRevision:string;readonly payload:CustomRemotePayload|null;
  /** Guest history only. Preserves lineage and voided evidence, never rebases FSRS. */
  readonly parentHead?:string|null;readonly voidedBy?:string|null;
}
export interface CustomRemoteOperation {
  readonly schemaVersion:1;readonly operationId:string;
  readonly action:'stage'|'publish'|'edit'|'daily'|'review'|'undo'|'import-history'|'archive'|'delete'|'restore'|'revoke';
  readonly changes:readonly CustomRemoteChange[];
  readonly expectedHead?:string|null;readonly before?:SerializedFsrsCard|null;
  readonly intent?:MangaConfirmedCardOperation;readonly resolvesOperationId?:string;
}
export interface CustomRemoteEntity {
  readonly kind:CustomRemoteKind;readonly id:string;readonly revision:string;readonly payload:CustomRemotePayload|null;
  readonly deleted:boolean;readonly archived:boolean;readonly head:string|null;readonly voidedBy:string|null;
}
export interface CustomRemoteReceipt {
  readonly schemaVersion:1;readonly operationId:string;readonly status:'accepted'|'conflict';
  readonly serverRevision:string;readonly reason:string|null;readonly entities:readonly CustomRemoteEntity[];
}
export interface CustomRemoteConflict {
  readonly schemaVersion:1;readonly operationId:string;readonly reason:string;readonly evidence:CustomRemoteOperation;
  /** Resolution is a new operation; original evidence and receipt are retained. */
  readonly resolvesOperationId?:string;
}
export interface CustomRemoteBundle {
  readonly schemaVersion:1;readonly status:'complete'|'paged-required';
  readonly manifest:CustomRemoteEntity;readonly entities:readonly CustomRemoteEntity[];
}
export interface CustomRemoteChangesPage {
  readonly schemaVersion:1;readonly serverRevision:string;readonly entities:readonly CustomRemoteEntity[];
}
export interface CustomSyncJournalRecord {
  readonly schemaVersion:1;readonly workspace:LocalWorkspaceId;readonly source:CustomCatalogOperation;
  readonly operation:CustomRemoteOperation;readonly state:'pending'|'accepted'|'conflict';
  readonly receipt?:CustomRemoteReceipt;
}
export interface CustomGuestImportPlan {
  readonly schemaVersion:1;readonly importId:string;readonly sourceWorkspace:'guest';
  readonly capturedTarget:`user:${string}`;readonly decision:'import'|'account-without-import';
  readonly steps:readonly CustomRemoteOperation[];
  readonly policy:'preserve-ids-and-source;conflict-on-divergent-destination';
}
/** A deleted row retains its revision forever; absence is never interpreted as deletion. */
export type CustomRemoteTombstone=CustomRemoteEntity&{readonly deleted:true};

export interface CustomRemoteStoredReceipt {user_id:string;request:CustomRemoteOperation;result:CustomRemoteReceipt;}
