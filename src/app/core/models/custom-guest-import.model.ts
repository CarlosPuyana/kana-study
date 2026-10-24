import { CustomRemoteEntity, CustomRemoteOperation, CustomRemoteReceipt } from './custom-deck-sync.model';
import { CustomPreparedOperation } from './custom-deck-reconciliation.model';
export interface CustomImportLimit {step:number;kind:CustomImportStep['kind'];changes:number;bytes:number;reason:'changes'|'bytes'|'cards';}

export interface CustomInventoryRow { key:string; value:unknown; head?:string|null; voidedBy?:string; count?:number; }
export interface CustomGuestInventory { source:'guest'; records:Record<string,CustomInventoryRow[]>; }
export type CustomConflictKind='content'|'duplicate'|'identity'|'review'|'undo'|'delete-edit'|'restore'|'guest-progress'|'dependency';
export interface CustomConsent { version:1; revision:number; accepted:boolean; changedAt:string; }
export interface CustomImportStep { kind:'content'|'history'|'lifecycle'|'equivalence'|'daily'|'deck'; id:string; cardId?:string; done?:boolean; matched?:boolean; operation?:CustomRemoteOperation; receipt?:CustomRemoteReceipt; conflictId?:string; }
export interface CustomGuestImport {
  id:string; source:'guest'; destination:string; fingerprint:string; inventory:CustomGuestInventory;
  status:'pending'|'running'|'blocked'|'complete'; steps:CustomImportStep[]; createdCards:string[];
  blocked:string[]; sourceChanged:boolean; supersededBy?:string; published?:boolean;
  limit?:CustomImportLimit;
  protocolVersion?:2;transferId?:string;
}
export interface CustomConflictDetail { kind:CustomConflictKind; origin:'guest'|'local'; importId?:string; canonical:CustomRemoteEntity[]; }
export interface CustomResolution {
  id:string; conflictId:string; mode:'keep'|'rebase'|'restore'; operation:CustomRemoteOperation;
  suppressed:Record<string,CustomPreparedOperation['source']>; receipt?:CustomRemoteReceipt;
}
