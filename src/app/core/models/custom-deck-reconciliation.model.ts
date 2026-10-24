import { CustomCatalogOperation } from './deck-catalog.model';
import { CustomRemoteEntity, CustomRemoteOperation, CustomRemoteReceipt } from './custom-deck-sync.model';
import { MangaConfirmedCardOperation } from './manga-deck-confirmation.model';
import { CustomConsent, CustomGuestImport, CustomConflictDetail, CustomResolution } from './custom-guest-import.model';
import type {CustomTransferCheckpointV2} from './custom-transfer-v2.model';

export interface CustomPreparedOperation {
  source: CustomCatalogOperation;
  operation: CustomRemoteOperation;
  receipt?: CustomRemoteReceipt;
}
/** Separate from both the immutable local journal and the permanent identity registry. */
export interface CustomReconciliationState {
  version: number;
  entities: CustomRemoteEntity[];
  prepared: Record<string, CustomPreparedOperation>;
  conflicts: Record<string, CustomPreparedOperation>;
  stage: { cursor: string; generation: string | null; entities: CustomRemoteEntity[] } | null;
  consent?:CustomConsent;
  consentHistory?:CustomConsent[];
  guestChoice?:'account'|'merge';
  imports?:Record<string,CustomGuestImport>;
  conflictDetails?:Record<string,CustomConflictDetail>;
  resolutions?:Record<string,CustomResolution>;
  closedConflicts?:Record<string,{evidence:CustomPreparedOperation;detail?:CustomConflictDetail;resolutionId:string}>;
  suppressed?:Record<string,{source:CustomPreparedOperation['source'];resolutionId:string}>;
  transfers?:Record<string,CustomTransferCheckpointV2>;
}
export const emptyCustomReconciliation = (): CustomReconciliationState => ({version:0,entities:[],prepared:{},conflicts:{},stage:null});
export interface CustomPublication {
  entities: CustomRemoteEntity[];
  confirmations: MangaConfirmedCardOperation[];
  serverRevision?:string;
}
