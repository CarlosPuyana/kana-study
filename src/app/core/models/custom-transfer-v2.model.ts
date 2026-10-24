import type {CustomRemoteChange,CustomRemoteOperation} from './custom-deck-sync.model';
import type {DeckCardProgress} from './deck-study.model';

/** Prepared remote contract only. D1 deliberately does not connect Angular/Guest to V2. */
export interface CustomTransferChunkDescriptorV2 {index:number;sha256:string;bytes:number;}
export type CustomTransferRecordV2 = {type:'operation';value:CustomRemoteOperation} |
 {type:'ancestor';value:CustomRemoteChange & {parentHead:string|null;voidedBy:string|null}};
export interface CustomGuestManifestV2 {
 schemaVersion:2;source:'guest';namespace:string;baseServerRevision:string;
 chunks:CustomTransferChunkDescriptorV2[];
 entities:{kind:CustomRemoteChange['kind'];id:string}[];
 cards:{id:string;deckId:string;identityKey:string;contentVersion:number;confirmationId:string;
  history:'new'|'history';snapshot:DeckCardProgress|null;head:string|null;eventIds:string[]}[];
}
export interface CustomBranchManifestV2 {
 schemaVersion:2;cardId:string;identityKey:string;baseHead:string|null;head:string|null;
 conflictOperationId:string;operationIds:string[];ancestorIds:string[];resolutionIds:string[];
 chunks:CustomTransferChunkDescriptorV2[];
}
interface CustomTransferRequestBaseV2 {
 schemaVersion:2;operationId:string;transferId:string;expectedRevision:string;
}
export type CustomTransferRequestV2 = CustomTransferRequestBaseV2 & (
 {action:'begin';kind:'guest-import';manifest:CustomGuestManifestV2} |
 {action:'begin';kind:'branch-archive';manifest:CustomBranchManifestV2} |
 {action:'chunk';index:number;body:string} |
 {action:'validate'|'publish'|'complete'|'cancel'});
export interface CustomTransferReceiptV2 {
 schemaVersion:2;operationId:string;transferId:string;kind:'guest-import'|'branch-archive';revision:string;
 state:'staging'|'ready-to-publish'|'published'|'complete'|'blocked'|'cancelled';reason:string|null;
}
export interface CustomTransferViewV2 extends Omit<CustomTransferReceiptV2,'operationId'> {
 manifest:CustomGuestManifestV2|CustomBranchManifestV2;
 chunk:{index:number;body:string;sha256:string}|null;
}
export interface CustomTransferStoredReceiptV2 {user_id:string;operation_id:string;request_hash:string;result:CustomTransferReceiptV2;}
export interface CustomTransferCheckpointV2 {
 protocolVersion:2;id:string;owner:string;workspace:string;kind:'guest-import'|'branch-archive';
 manifest:CustomGuestManifestV2|CustomBranchManifestV2;bodies:string[];
 requests:CustomTransferRequestV2[];receipts:Record<string,CustomTransferReceiptV2>;
 revision:string;state:CustomTransferReceiptV2['state'];localPublished:boolean;failure?:string;
}
